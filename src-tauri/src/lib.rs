use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::{CommandChild, CommandEvent};

struct BackendProcess(Mutex<Option<CommandChild>>);

impl Drop for BackendProcess {
    fn drop(&mut self) {
        if let Some(child) = self.0.lock().unwrap().take() {
            let _ = child.kill();
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Spawn backend sidecar (in production builds the exe is bundled)
            match app.shell().sidecar("dropdetect-backend") {
                Ok(cmd) => match cmd.spawn() {
                    Ok((mut rx, child)) => {
                        app.manage(BackendProcess(Mutex::new(Some(child))));

                        // Log backend output in background
                        tauri::async_runtime::spawn(async move {
                            while let Some(event) = rx.recv().await {
                                match event {
                                    CommandEvent::Stdout(line) => {
                                        println!(
                                            "[backend] {}",
                                            String::from_utf8_lossy(&line)
                                        );
                                    }
                                    CommandEvent::Stderr(line) => {
                                        eprintln!(
                                            "[backend] {}",
                                            String::from_utf8_lossy(&line)
                                        );
                                    }
                                    CommandEvent::Terminated(status) => {
                                        println!("[backend] process exited: {:?}", status);
                                        break;
                                    }
                                    _ => {}
                                }
                            }
                        });

                        println!("[backend] sidecar started successfully");
                    }
                    Err(e) => {
                        eprintln!(
                            "[backend] sidecar not available (dev mode?): {}",
                            e
                        );
                    }
                },
                Err(e) => {
                    eprintln!("[backend] sidecar not configured: {}", e);
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
