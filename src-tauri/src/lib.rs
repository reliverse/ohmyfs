// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use serde::{Deserialize, Serialize};
use thiserror::Error;

// Structured error types for better error handling
#[derive(Debug, Error, Serialize, Deserialize)]
pub enum LauncherError {


    #[error("Failed to read file {path}: {details}")]
    FileReadFailed { path: String, details: String },

    #[error("Failed to write file {path}: {details}")]
    FileWriteFailed { path: String, details: String },


    #[error("Clipboard operation failed")]
    ClipboardFailed,
}

impl From<std::io::Error> for LauncherError {
    fn from(err: std::io::Error) -> Self {
        match err.kind() {
            std::io::ErrorKind::NotFound => LauncherError::FileReadFailed {
                path: "unknown".to_string(),
                details: err.to_string(),
            },
            std::io::ErrorKind::PermissionDenied => LauncherError::FileReadFailed {
                path: "unknown".to_string(),
                details: format!("Permission denied: {}", err.to_string()),
            },
            _ => LauncherError::FileReadFailed {
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
    Err(LauncherError::ClipboardFailed.to_string())
}



#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            copy_to_clipboard
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
