use serde::{Deserialize, Serialize};

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetadataEntries {
    pub js: String,
    pub css: String,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Metadata {
    pub name: String,
    pub version: String,
    pub authors: Vec<String>,
    pub description: String,
    pub tags: Vec<String>,
    pub entries: MetadataEntries,
    #[serde(rename = "hasMixins")]
    pub has_mixins: bool,
    pub dependencies: std::collections::BTreeMap<String, String>,
}
