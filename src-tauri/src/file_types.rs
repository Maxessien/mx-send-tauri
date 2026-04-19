use std::{
    path::{Path, PathBuf},
};

use walkdir::DirEntry;

use crate::handler::FileType;

pub const AUDIO_EXTS: &[&str] = &[
    "mp3", "wav", "flac", "aac", "ogg", "wma", "m4a", "aiff", "aif", "mid", "midi", "amr", "ape",
    "au", "mka", "opus", "ra", "wavpack", "wv", "pcm", "dsd", "dff", "dsf",
];

pub const VIDEO_EXTS: &[&str] = &[
    "mp4", "mkv", "avi", "mov", "wmv", "webm", "flv", "mpg", "mpeg", "m4v", "3gp", "3g2", "vob",
    "ogv", "asf", "rm", "rmvb", "ts", "m2ts", "mts", "divx", "f4v", "qt",
];

pub const IMAGE_EXTS: &[&str] = &["jpg", "jpeg", "png", "gif", "webp"];

pub const DOCUMENT_EXTS: &[&str] = &[
    "pdf", "doc", "docx", "txt", "rtf", "odt", "pages", "wpd", "tex", "epub", "mobi", "azw",
    "azw3", "csv", "xls", "xlsx", "ods", "ppt", "pptx", "odp",
];

pub fn folder_name(file_type: &FileType) -> &'static str {
    match file_type {
        FileType::Audio => "audio",
        FileType::Document => "document",
        FileType::Image => "image",
        FileType::Video => "video",
    }
}

pub fn extensions_for(file_type: &FileType) -> Option<&'static [&'static str]> {
    match file_type {
        FileType::Audio => Some(AUDIO_EXTS),
        FileType::Image => Some(IMAGE_EXTS),
        FileType::Video => Some(VIDEO_EXTS),
        FileType::Document => Some(DOCUMENT_EXTS),
    }
}

pub fn matches_file_type(file_type: &FileType, entry: &DirEntry) -> bool {
    let extensions = match extensions_for(file_type) {
        Some(extensions) => extensions,
        None => return false,
    };

    let entry_ext = match entry.path().extension() {
        Some(val) => match val.to_str() {
            Some(ext) => ext.to_lowercase(),
            None => return false,
        },
        None => return false,
    };

    entry.path().is_file() && extensions.contains(&entry_ext.as_str())
}

pub fn matches_path(file_type: &FileType, path: &Path) -> bool {
    let extensions = match extensions_for(file_type) {
        Some(extensions) => extensions,
        None => return false,
    };

    let entry_ext = match path.extension() {
        Some(val) => match val.to_str() {
            Some(ext) => ext.to_lowercase(),
            None => return false,
        },
        None => return false,
    };

    path.is_file() && extensions.contains(&entry_ext.as_str())
}

pub fn handle_duplicate_path(path: PathBuf) -> Result<PathBuf, String> {
    if !path.exists() {
        return Ok(path);
    };
    
    // Extract the file name (without extension), and the extension
    let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("file");
    let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
    let parent = path.parent().unwrap_or(Path::new(""));

    for i in 1..20 {
        let new_file_name = if ext.is_empty() {
            format!("{}({})", stem, i)
        } else {
            format!("{}({}).{}", stem, i, ext)
        };

        let new_path = parent.join(new_file_name);
        
        if !new_path.exists() {
            return Ok(new_path)
        };
    }
    
    Err("Path couldn't be allocated".to_string())
}
