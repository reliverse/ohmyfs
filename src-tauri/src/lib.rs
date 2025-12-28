// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use serde::{Deserialize, Serialize};
use thiserror::Error;
use std::fs;
use std::fs::read_dir;
// Cross-platform permission handling
fn get_permission_number(permissions: &fs::Permissions) -> u32 {
    #[cfg(windows)]
    {
        // Windows doesn't have Unix-style permissions, so we provide basic read/write info
        // Return a reasonable default that indicates the file is accessible
        0o644 // rw-r--r--
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        permissions.mode()
    }
    #[cfg(not(any(windows, unix)))]
    {
        // Fallback for other platforms
        0o644
    }
}

use std::path::Path;

// Structured error types for better error handling
#[derive(Debug, Error, Serialize, Deserialize)]
pub enum OhMyFSError {
    #[error("Failed to read file {path}: {details}")]
    FileReadFailed { path: String, details: String },

    #[error("Failed to write file {path}: {details}")]
    FileWriteFailed { path: String, details: String },

    #[error("Directory does not exist: {path}")]
    DirectoryNotFound { path: String },

    #[error("Path is not a directory: {path}")]
    PathNotDirectory { path: String },

    #[error("Failed to read directory {path}: {details}")]
    DirectoryReadFailed { path: String, details: String },

    #[error("Clipboard operation failed")]
    ClipboardFailed,
}

// File system entry models
#[derive(Serialize, Deserialize, Debug)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub is_file: bool,
    pub is_symlink: bool,
    pub size: Option<u64>,
    pub modified_at: Option<String>,
    pub created_at: Option<String>,
    pub permissions: Option<String>,
    pub extension: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DirectoryContents {
    pub directories: Vec<FileEntry>,
    pub files: Vec<FileEntry>,
}

impl From<std::io::Error> for OhMyFSError {
    fn from(err: std::io::Error) -> Self {
        match err.kind() {
            std::io::ErrorKind::NotFound => OhMyFSError::FileReadFailed {
                path: "unknown".to_string(),
                details: err.to_string(),
            },
            std::io::ErrorKind::PermissionDenied => OhMyFSError::FileReadFailed {
                path: "unknown".to_string(),
                details: format!("Permission denied: {}", err.to_string()),
            },
            _ => OhMyFSError::FileReadFailed {
                path: "unknown".to_string(),
                details: err.to_string(),
            },
        }
    }
}

// Logging helper
#[macro_export]
macro_rules! log_error {
    ($err:expr) => {
        eprintln!("[ERROR] {}", $err);
    };
    ($err:expr, $($arg:tt)*) => {
        eprintln!("[ERROR] {}", format!($err, $($arg)*));
    };
}

#[macro_export]
macro_rules! log_info {
    ($msg:expr) => {
        println!("[INFO] {}", $msg);
    };
    ($msg:expr, $($arg:tt)*) => {
        println!("[INFO] {}", format!($msg, $($arg)*));
    };
}

#[macro_export]
macro_rules! log_warn {
    ($msg:expr) => {
        println!("[WARN] {}", $msg);
    };
    ($msg:expr, $($arg:tt)*) => {
        println!("[WARN] {}", format!($msg, $($arg)*));
    };
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn copy_to_clipboard(text: String) -> Result<(), String> {
    log_info!("Copy to clipboard requested for text of length: {}", text.len());

    // Note: This requires tauri-plugin-clipboard-manager
    // For now, we'll use a simple approach - the frontend can use the Clipboard API
    // This command is a placeholder - implement with clipboard plugin if needed
    log_warn!("Clipboard functionality not implemented - frontend should handle this");
    Err(OhMyFSError::ClipboardFailed.to_string())
}

#[tauri::command]
async fn read_directory(path: String, show_hidden: bool) -> Result<DirectoryContents, String> {
    let path_obj = Path::new(&path);

    // Check if path exists
    if !path_obj.exists() {
        log_error!("Directory does not exist: {}", path);
        return Err(OhMyFSError::DirectoryNotFound { path }.to_string());
    }

    // Check if path is a directory
    if !path_obj.is_dir() {
        log_error!("Path is not a directory: {}", path);
        return Err(OhMyFSError::PathNotDirectory { path }.to_string());
    }

    let mut directories = Vec::new();
    let mut files = Vec::new();

    let entries = read_dir(path_obj).map_err(|err| {
        log_error!("Failed to read directory: {}", err);
        OhMyFSError::DirectoryReadFailed {
            path: path.clone(),
            details: err.to_string(),
        }
        .to_string()
    })?;

    for entry in entries {
        let entry = entry.map_err(|err| {
            log_error!("Failed to read entry: {}", err);
            OhMyFSError::DirectoryReadFailed {
                path: path.clone(),
                details: err.to_string(),
            }
            .to_string()
        })?;

        let file_name = entry.file_name().to_string_lossy().to_string();
        let entry_path = entry.path();
        let file_type = entry.file_type().map_err(|err| {
            log_error!("Failed to get file type: {}", err);
            OhMyFSError::DirectoryReadFailed {
                path: path.clone(),
                details: err.to_string(),
            }
            .to_string()
        })?;

        // Skip hidden files if not showing them
        if !show_hidden && file_name.starts_with('.') {
            continue;
        }

        let metadata = entry.metadata().map_err(|err| {
            log_error!("Failed to get metadata: {}", err);
            OhMyFSError::DirectoryReadFailed {
                path: path.clone(),
                details: err.to_string(),
            }
            .to_string()
        })?;

        let extension = entry_path
            .extension()
            .map(|ext| ext.to_string_lossy().to_string());

        let file_entry = FileEntry {
            name: file_name,
            path: entry_path.to_string_lossy().to_string(),
            is_directory: file_type.is_dir(),
            is_file: file_type.is_file(),
            is_symlink: file_type.is_symlink(),
            size: Some(metadata.len()),
            modified_at: metadata.modified().ok().map(|t| {
                let duration = t.duration_since(std::time::UNIX_EPOCH).unwrap_or_default();
                // Return as milliseconds since epoch for JavaScript compatibility
                format!("{}", duration.as_millis())
            }),
            created_at: metadata.created().ok().map(|t| {
                let duration = t.duration_since(std::time::UNIX_EPOCH).unwrap_or_default();
                // Return as milliseconds since epoch for JavaScript compatibility
                format!("{}", duration.as_millis())
            }),
            permissions: Some(format!("{:o}", get_permission_number(&metadata.permissions()))),
            extension,
        };

        if file_type.is_dir() {
            directories.push(file_entry);
        } else if file_type.is_file() {
            files.push(file_entry);
        }
    }

    Ok(DirectoryContents {
        directories,
        files,
    })
}

#[tauri::command]
async fn create_directory(path: String) -> Result<(), String> {
    let path_obj = Path::new(&path);

    fs::create_dir_all(path_obj).map_err(|err| {
        log_error!("Failed to create directory {}: {}", path, err);
        OhMyFSError::FileWriteFailed {
            path,
            details: err.to_string(),
        }
        .to_string()
    })?;

    Ok(())
}

#[tauri::command]
async fn create_file(path: String) -> Result<(), String> {
    let path_obj = Path::new(&path);

    // Create parent directories if they don't exist
    if let Some(parent) = path_obj.parent() {
        fs::create_dir_all(parent).map_err(|err| {
            log_error!("Failed to create parent directories for {}: {}", path, err);
            OhMyFSError::FileWriteFailed {
                path: path.clone(),
                details: err.to_string(),
            }
            .to_string()
        })?;
    }

    fs::File::create(path_obj).map_err(|err| {
        log_error!("Failed to create file {}: {}", path, err);
        OhMyFSError::FileWriteFailed {
            path,
            details: err.to_string(),
        }
        .to_string()
    })?;

    Ok(())
}

#[tauri::command]
async fn delete_file(path: String) -> Result<(), String> {
    let path_obj = Path::new(&path);

    if path_obj.is_dir() {
        fs::remove_dir_all(path_obj).map_err(|err| {
            log_error!("Failed to delete directory {}: {}", path, err);
            OhMyFSError::FileWriteFailed {
                path,
                details: err.to_string(),
            }
            .to_string()
        })?;
    } else {
        fs::remove_file(path_obj).map_err(|err| {
            log_error!("Failed to delete file {}: {}", path, err);
            OhMyFSError::FileWriteFailed {
                path,
                details: err.to_string(),
            }
            .to_string()
        })?;
    }

    Ok(())
}

#[tauri::command]
async fn rename_file(old_path: String, new_path: String) -> Result<(), String> {
    fs::rename(&old_path, &new_path).map_err(|err| {
        log_error!("Failed to rename {} to {}: {}", old_path, new_path, err);
        OhMyFSError::FileWriteFailed {
            path: format!("{} -> {}", old_path, new_path),
            details: err.to_string(),
        }
        .to_string()
    })?;

    Ok(())
}

#[tauri::command]
async fn copy_file(source_path: String, destination_path: String) -> Result<(), String> {
    fs::copy(&source_path, &destination_path).map_err(|err| {
        log_error!("Failed to copy {} to {}: {}", source_path, destination_path, err);
        OhMyFSError::FileWriteFailed {
            path: format!("{} -> {}", source_path, destination_path),
            details: err.to_string(),
        }
        .to_string()
    })?;

    Ok(())
}

#[tauri::command]
async fn write_file(file_path: String, content: String) -> Result<(), String> {
    fs::write(&file_path, &content).map_err(|err| {
        log_error!("Failed to write to file {}: {}", file_path, err);
        OhMyFSError::FileWriteFailed {
            path: file_path,
            details: err.to_string(),
        }
        .to_string()
    })?;

    Ok(())
}

#[tauri::command]
async fn read_file(file_path: String) -> Result<String, String> {
    fs::read_to_string(&file_path).map_err(|err| {
        log_error!("Failed to read file {}: {}", file_path, err);
        OhMyFSError::FileReadFailed {
            path: file_path,
            details: err.to_string(),
        }
        .to_string()
    })
}

#[tauri::command]
async fn write_log_file(content: String, path: String) -> Result<(), String> {
    use std::io::Write;

    let mut file = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
        .map_err(|err| {
            log_error!("Failed to open log file {}: {}", path, err);
            format!("Failed to open log file: {}", err)
        })?;

    file.write_all(content.as_bytes()).map_err(|err| {
        log_error!("Failed to write to log file {}: {}", path, err);
        format!("Failed to write to log file: {}", err)
    })?;

    file.flush().map_err(|err| {
        log_error!("Failed to flush log file {}: {}", path, err);
        format!("Failed to flush log file: {}", err)
    })?;

    Ok(())
}



#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            copy_to_clipboard,
            read_directory,
            create_directory,
            create_file,
            delete_file,
            rename_file,
            copy_file,
            write_file,
            read_file,
            write_log_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
