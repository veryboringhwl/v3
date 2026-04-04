use anyhow::{Context, Result, bail};

use crate::app::AppContext;
use crate::infrastructure::ports::{FileSystemPort, LoggingPort};

pub fn run_with(
    ctx: &AppContext,
    mode: &str,
    fs: &dyn FileSystemPort,
    logger: &dyn LoggingPort,
) -> Result<()> {
    let block_updates = match mode {
        "on" => false,
        "off" => true,
        _ => bail!("mode must be on|off"),
    };

    let app_data = ctx
        .spotify_exec_path
        .parent()
        .context("Invalid Spotify exec path")?;

    let dll_path = app_data.join("Spotify.dll");
    let exe_path = app_data.join("Spotify.exe");
    let elf_path = app_data.join("chrome_elf.dll");

    let dll_backup = app_data.join("Spotify.dll.backup");
    let exe_backup = app_data.join("Spotify.exe.backup");
    let elf_backup = app_data.join("chrome_elf.dll.backup");
    let backups_exist = fs.exists(&dll_backup) && fs.exists(&exe_backup) && fs.exists(&elf_backup);

    if !block_updates {
        if backups_exist {
            let _ = std::fs::remove_file(&dll_path);
            let _ = std::fs::remove_file(&exe_path);
            let _ = std::fs::remove_file(&elf_path);

            std::fs::rename(&dll_backup, &dll_path)?;
            std::fs::rename(&exe_backup, &exe_path)?;
            std::fs::rename(&elf_backup, &elf_path)?;
            logger.info("Updates unlocked (restored from backups).");
        } else {
            logger.info("Backups not found. Please reinstall Spotify manually to unlock updates.");
        }
        return Ok(());
    }

    if backups_exist {
        logger.info("Spotify updates are already blocked (backups exist).");
        return Ok(());
    }

    if !fs.exists(&dll_path) || !fs.exists(&exe_path) || !fs.exists(&elf_path) {
        bail!("Failed to find required Spotify files for patching.");
    }

    let mut dll_data = fs
        .read_bytes(&dll_path)
        .context("Failed to read Spotify.dll")?;
    let mut exe_data = fs
        .read_bytes(&exe_path)
        .context("Failed to read Spotify.exe")?;
    let mut elf_data = fs
        .read_bytes(&elf_path)
        .context("Failed to read chrome_elf.dll")?;

    remove_pe_signature(&mut dll_data).context("Failed to remove signature from Spotify.dll")?;
    remove_pe_signature(&mut exe_data).context("Failed to remove signature from Spotify.exe")?;
    remove_pe_signature(&mut elf_data).context("Failed to remove signature from chrome_elf.dll")?;

    patch_dll_signature_check(&mut dll_data)
        .context("Failed to patch signature check in Spotify.dll")?;

    if !patch_update_url(&mut dll_data) {
        bail!("Failed to find update URL pattern in Spotify.dll");
    }

    std::fs::copy(&dll_path, &dll_backup).context("Failed to create Spotify.dll.backup")?;
    std::fs::copy(&exe_path, &exe_backup).context("Failed to create Spotify.exe.backup")?;
    std::fs::copy(&elf_path, &elf_backup).context("Failed to create chrome_elf.dll.backup")?;

    fs.write_bytes(&dll_path, &dll_data)?;
    fs.write_bytes(&exe_path, &exe_data)?;
    fs.write_bytes(&elf_path, &elf_data)?;

    logger.info("Updates blocked successfully!");
    Ok(())
}

fn remove_pe_signature(data: &mut [u8]) -> Result<()> {
    if data.len() < 0x40 {
        return Ok(());
    }
    let pe_offset = u32::from_le_bytes(data[0x3C..0x40].try_into()?) as usize;

    if pe_offset + 24 > data.len() || &data[pe_offset..pe_offset + 2] != b"PE" {
        bail!("Not a valid PE file");
    }

    let machine_type = u16::from_le_bytes(data[pe_offset + 4..pe_offset + 6].try_into()?);
    let opt_header_offset = pe_offset + 24;

    let data_dir_offset = match machine_type {
        0x8664 | 0xAA64 => opt_header_offset + 112, // x64 or ARM64
        0x014C => opt_header_offset + 96,           // x86
        _ => bail!("Unsupported architecture"),
    };

    let cert_entry_offset = data_dir_offset + (4 * 8);

    if cert_entry_offset + 8 > data.len() {
        bail!("Data directory out of bounds");
    }

    data[cert_entry_offset..cert_entry_offset + 8].fill(0);
    Ok(())
}

fn patch_dll_signature_check(data: &mut [u8]) -> Result<()> {
    let target_str = b"Check failed: sep_pos != std::wstring::npos.";
    let str_offset = match data.windows(target_str.len()).position(|w| w == target_str) {
        Some(pos) => pos as u32,
        None => bail!("Signature check string not found in Spotify.dll"),
    };

    let pe_offset = u32::from_le_bytes(data[0x3C..0x40].try_into()?) as usize;
    let machine_type = u16::from_le_bytes(data[pe_offset + 4..pe_offset + 6].try_into()?);
    let is_arm = machine_type == 0xAA64;

    let sections = parse_sections(data, pe_offset)?;
    let str_rva = get_rva(str_offset, &sections);
    if str_rva == 0 {
        bail!("Could not calculate RVA for signature string");
    }

    let code_sec = sections
        .iter()
        .find(|s| s.is_code)
        .context("No executable section found")?;

    let mut patch_offset = 0;
    let start = code_sec.raw_ptr as usize;
    let end = (code_sec.raw_ptr + code_sec.raw_size) as usize;

    if !is_arm {
        for i in start..end {
            if i + 7 > data.len() {
                break;
            }
            if data[i] == 0x48 && data[i + 1] == 0x8D && data[i + 2] == 0x15 {
                let rel = i32::from_le_bytes(data[i + 3..i + 7].try_into()?);
                let target = (get_rva(i as u32, &sections) as i32 + 7 + rel) as u32;
                if target == str_rva {
                    patch_offset = find_function_start_x64(data, i);
                    if patch_offset > 0 {
                        break;
                    }
                }
            }
        }
    } else {
        for i in (start..end).step_by(4) {
            if i + 8 > data.len() {
                break;
            }
            let inst1 = u32::from_le_bytes(data[i..i + 4].try_into()?);
            if (inst1 & 0x9F000000) == 0x90000000 {
                let rd = inst1 & 0x1F;
                let imm_lo = (inst1 >> 29) & 3;
                let imm_hi = (inst1 >> 5) & 0x7FFFF;
                let mut imm = (imm_hi << 2) | imm_lo;
                if (imm & 0x100000) != 0 {
                    imm |= 0xFFE00000;
                }
                let imm = (imm as i32 as i64) << 12;

                let pc = get_rva(i as u32, &sections) as u64;
                let page = ((pc & 0xFFFFFFFFFFFFF000) as i64 + imm) as u64;

                let inst2 = u32::from_le_bytes(data[i + 4..i + 8].try_into()?);
                if (inst2 & 0xFF800000) == 0x91000000 {
                    let rn = (inst2 >> 5) & 0x1F;
                    if rn == rd {
                        let imm12 = (inst2 >> 10) & 0xFFF;
                        if page + imm12 as u64 == str_rva as u64 {
                            patch_offset = find_function_start_arm64(data, i);
                            if patch_offset > 0 {
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    if patch_offset == 0 {
        bail!("Could not find start of signature check function");
    }

    let patch_x64 = [0xB8, 0x01, 0x00, 0x00, 0x00, 0xC3];
    let patch_arm64 = [0x20, 0x00, 0x80, 0x52, 0xC0, 0x03, 0x5F, 0xD6];
    let patch: &[u8] = if is_arm { &patch_arm64 } else { &patch_x64 };

    data[patch_offset..patch_offset + patch.len()].copy_from_slice(patch);
    Ok(())
}

fn patch_update_url(data: &mut [u8]) -> bool {
    let prefix = b"desktop-update/";
    let suffix = b"/update";
    let mut patched = false;

    let mut start_idx = 0;
    while let Some(idx) = data[start_idx..]
        .windows(prefix.len())
        .position(|w| w == prefix)
    {
        let absolute_idx = start_idx + idx;
        let check_idx = absolute_idx + prefix.len() + 1;
        let suffix_idx = check_idx + 1;

        if suffix_idx + suffix.len() <= data.len() {
            if data[check_idx] == b'2' && &data[suffix_idx..suffix_idx + suffix.len()] == suffix {
                data[check_idx] = b'7';
                patched = true;
            }
        }
        start_idx = absolute_idx + 1;
    }

    patched
}

struct Section {
    va: u32,
    raw_ptr: u32,
    raw_size: u32,
    is_code: bool,
}

fn parse_sections(data: &[u8], pe_offset: usize) -> Result<Vec<Section>> {
    let num_sections = u16::from_le_bytes(data[pe_offset + 6..pe_offset + 8].try_into()?) as usize;
    let opt_header_size =
        u16::from_le_bytes(data[pe_offset + 20..pe_offset + 22].try_into()?) as usize;
    let section_table_start = pe_offset + 24 + opt_header_size;

    let mut sections = Vec::new();
    for i in 0..num_sections {
        let sec_entry = section_table_start + (i * 40);
        if sec_entry + 40 > data.len() {
            break;
        }

        let va = u32::from_le_bytes(data[sec_entry + 12..sec_entry + 16].try_into()?);
        let raw_size = u32::from_le_bytes(data[sec_entry + 16..sec_entry + 20].try_into()?);
        let raw_ptr = u32::from_le_bytes(data[sec_entry + 20..sec_entry + 24].try_into()?);
        let chars = u32::from_le_bytes(data[sec_entry + 36..sec_entry + 40].try_into()?);

        sections.push(Section {
            va,
            raw_ptr,
            raw_size,
            is_code: (chars & 0x20) != 0,
        });
    }
    Ok(sections)
}

fn get_rva(file_offset: u32, sections: &[Section]) -> u32 {
    for sec in sections {
        if file_offset >= sec.raw_ptr && file_offset < sec.raw_ptr + sec.raw_size {
            return (file_offset - sec.raw_ptr) + sec.va;
        }
    }
    0
}

fn find_function_start_x64(data: &[u8], start_offset: usize) -> usize {
    for i in (0..start_offset).rev() {
        if i >= 2 {
            let p1 = data[i - 1];
            let p2 = data[i - 2];
            if (p1 == 0xCC && p2 == 0xCC) || (p1 == 0x90 && p2 == 0x90) {
                let b = data[i];
                if b != 0xCC && b != 0x90 {
                    if b == 0x48 || b == 0x40 || b == 0x55 || (b >= 0x53 && b <= 0x57) {
                        return i;
                    }
                }
            }
        }
        if start_offset - i > 20000 {
            break;
        }
    }
    0
}

fn find_function_start_arm64(data: &[u8], mut start_offset: usize) -> usize {
    start_offset -= start_offset % 4;
    for i in (0..start_offset).rev().step_by(4) {
        let inst = u32::from_le_bytes(data[i..i + 4].try_into().unwrap());
        if (inst & 0xFF00FFFF) == 0xA9007BFD {
            return i;
        }
        if start_offset - i > 20000 {
            break;
        }
    }
    0
}
