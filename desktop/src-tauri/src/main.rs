#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use tauri::{
  CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, WindowBuilder, WindowUrl,
};

struct ControlPrefs {
  always_on_top: Mutex<bool>,
}

fn normalize_base_url(raw: String) -> String {
  let trimmed = raw.trim().trim_end_matches('/').to_string();
  if trimmed.is_empty() {
    "http://localhost:3000".to_string()
  } else {
    trimmed
  }
}

fn deeplink_to_http(base: &str, deeplink: &str) -> Option<String> {
  let dl = deeplink.trim();
  if !dl.starts_with("ess://") {
    return None;
  }

  // Example:
  // ess://c/<slug>/case/<id> -> <base>/c/<slug>/case/<id>
  // ess://c/<slug>/dispatch/call/<id> -> <base>/c/<slug>/dispatch/call/<id>
  let path = dl.strip_prefix("ess://").unwrap_or("");
  Some(format!("{}/{}", base, path.trim_start_matches('/')))
}

fn main() {
  let base_url = normalize_base_url(std::env::var("ESS_DESKTOP_BASE_URL").unwrap_or_else(|_| "http://localhost:3000".to_string()));

  // If launched via protocol handler, Windows/macOS typically pass the URL as argv.
  let deeplink_arg = std::env::args().find(|arg| arg.starts_with("ess://"));
  let start_url = deeplink_arg
    .as_deref()
    .and_then(|dl| deeplink_to_http(&base_url, dl))
    .unwrap_or_else(|| base_url.clone());

  let tray_menu = SystemTrayMenu::new()
    .add_item(CustomMenuItem::new("open_main".to_string(), "Open ESS"))
    .add_item(CustomMenuItem::new("open_control".to_string(), "Open Control Window"))
    .add_item(CustomMenuItem::new("control_aot".to_string(), "Control: Always On Top").selected(false))
    .add_item(CustomMenuItem::new("clear_session".to_string(), "Clear Session (Logout)"))
    .add_native_item(tauri::SystemTrayMenuItem::Separator)
    .add_item(CustomMenuItem::new("quit".to_string(), "Quit"));

  let tray = SystemTray::new().with_menu(tray_menu);

  tauri::Builder::default()
    .manage(ControlPrefs { always_on_top: Mutex::new(false) })
    .system_tray(tray)
    .setup(move |app| {
      let main = app.get_window("main").unwrap();
      main.navigate(start_url.parse().unwrap());
      Ok(())
    })
    .on_system_tray_event(move |app, event| match event {
      SystemTrayEvent::MenuItemClick { id, .. } => {
        match id.as_str() {
          "open_main" => {
            if let Some(w) = app.get_window("main") {
              let _ = w.show();
              let _ = w.set_focus();
            }
          }
          "open_control" => {
            let url = format!("{}/app/control", base_url);
            let existing = app.get_window("control");
            if let Some(w) = existing {
              let _ = w.show();
              let _ = w.set_focus();
            } else {
              let prefs = app.state::<ControlPrefs>();
              let always_on_top = prefs.always_on_top.lock().map(|v| *v).unwrap_or(false);
              let _ = WindowBuilder::new(app, "control", WindowUrl::External(url.parse().unwrap()))
                .title("ESS Control")
                .inner_size(520.0, 720.0)
                .resizable(true)
                .always_on_top(always_on_top)
                .build();
            }
          }
          "control_aot" => {
            let prefs = app.state::<ControlPrefs>();
            let next = {
              let mut guard = prefs.always_on_top.lock().unwrap();
              *guard = !*guard;
              *guard
            };

            // Update the tray checkmark.
            let _ = app.tray_handle().get_item("control_aot").set_selected(next);

            // Apply to the control window if it exists.
            if let Some(w) = app.get_window("control") {
              let _ = w.set_always_on_top(next);
            }
          }
          "clear_session" => {
            let url = format!("{}/api/auth/clear-session", base_url);
            if let Some(w) = app.get_window("main") {
              let _ = w.navigate(url.parse().unwrap());
              let _ = w.show();
              let _ = w.set_focus();
            }
            if let Some(w) = app.get_window("control") {
              let _ = w.navigate(url.parse().unwrap());
            }
          }
          "quit" => {
            std::process::exit(0);
          }
          _ => {}
        }
      }
      _ => {}
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
