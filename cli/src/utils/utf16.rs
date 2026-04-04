use anyhow::{Result, bail};

pub fn encode_utf16le(input: &str) -> Vec<u8> {
    let mut out = Vec::with_capacity(input.len() * 2);
    for unit in input.encode_utf16() {
        out.extend_from_slice(&unit.to_le_bytes());
    }
    out
}

pub fn decode_utf16le(input: &[u8]) -> Result<String> {
    if input.len() % 2 != 0 {
        bail!("invalid UTF-16LE data")
    }

    let mut units = Vec::with_capacity(input.len() / 2);
    let mut i = 0usize;
    while i < input.len() {
        units.push(u16::from_le_bytes([input[i], input[i + 1]]));
        i += 2;
    }

    Ok(String::from_utf16(&units)?)
}

pub fn extract_between_markers(snapshot: &[u8], start: &str, end: &str) -> Result<String> {
    let start_b = encode_utf16le(start);
    let end_b = encode_utf16le(end);

    let start_pos = find_bytes(snapshot, &start_b).ok_or_else(|| anyhow::anyhow!("start marker not found"))?;
    let end_pos_rel = find_bytes(&snapshot[start_pos..], &end_b)
        .ok_or_else(|| anyhow::anyhow!("end marker not found"))?;

    let end_pos = start_pos + end_pos_rel + end_b.len();
    decode_utf16le(&snapshot[start_pos..end_pos])
}

fn find_bytes(haystack: &[u8], needle: &[u8]) -> Option<usize> {
    if needle.is_empty() || haystack.len() < needle.len() {
        return None;
    }
    haystack.windows(needle.len()).position(|w| w == needle)
}

