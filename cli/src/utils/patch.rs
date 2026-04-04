use anyhow::{Context, Result};

pub fn patch_index_html(input: &str) -> Result<String> {
    let target = "<script defer=\"defer\" src=\"/xpui-snapshot.js\"></script>";
    let replacement = "<script type=\"module\" src=\"./hooks/index.js\"></script>";

    let idx = input.find(target).context("index patch target not found")?;
    let mut out = String::with_capacity(input.len() + replacement.len());
    out.push_str(&input[..idx]);
    out.push_str(replacement);
    out.push_str(&input[idx + target.len()..]);
    Ok(out)
}

