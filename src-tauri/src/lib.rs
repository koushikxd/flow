use std::collections::HashMap;
use std::sync::Arc;
use chrono::Local;
use serde::{Deserialize, Serialize};
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, CheckMenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, State, AppHandle, Emitter,
};
use tauri_plugin_store::StoreExt;
use tokio::sync::RwLock;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackingSpace {
    pub id: String,
    pub name: String,
    pub apps: Vec<String>,
    #[serde(rename = "isActive")]
    pub is_active: bool,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeEntry {
    #[serde(rename = "spaceId")]
    pub space_id: String,
    #[serde(rename = "appName")]
    pub app_name: String,
    pub date: String,
    pub duration: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    #[serde(rename = "enableDND")]
    pub enable_dnd: bool,
    #[serde(rename = "mutedApps")]
    pub muted_apps: Vec<String>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            enable_dnd: false,
            muted_apps: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppState {
    pub spaces: Vec<TrackingSpace>,
    pub entries: Vec<TimeEntry>,
    pub settings: AppSettings,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            spaces: Vec::new(),
            entries: Vec::new(),
            settings: AppSettings::default(),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct RunningApp {
    pub name: String,
    #[serde(rename = "processId")]
    pub process_id: u64,
}

pub struct TrackingState {
    pub active_space_id: Option<String>,
    pub last_app: Option<String>,
    pub last_check: Option<std::time::Instant>,
}

impl Default for TrackingState {
    fn default() -> Self {
        Self {
            active_space_id: None,
            last_app: None,
            last_check: None,
        }
    }
}

type SharedTrackingState = Arc<RwLock<TrackingState>>;

fn load_state(app: &AppHandle) -> AppState {
    let store = app.store("store.json").unwrap();
    store.get("app_state")
        .and_then(|v| serde_json::from_value(v.clone()).ok())
        .unwrap_or_default()
}

fn save_state(app: &AppHandle, state: &AppState) {
    let store = app.store("store.json").unwrap();
    store.set("app_state", serde_json::to_value(state).unwrap());
    let _ = store.save();
}

#[tauri::command]
fn get_running_apps() -> Vec<RunningApp> {
    use std::collections::HashSet;
    let mut apps: Vec<RunningApp> = Vec::new();
    let mut seen: HashSet<String> = HashSet::new();
    
    if let Ok(active) = active_win_pos_rs::get_active_window() {
        if !seen.contains(&active.app_name) {
            seen.insert(active.app_name.clone());
            apps.push(RunningApp {
                name: active.app_name,
                process_id: active.process_id,
            });
        }
    }
    
    apps
}

#[tauri::command]
fn get_active_window_info() -> Option<RunningApp> {
    active_win_pos_rs::get_active_window().ok().map(|w| RunningApp {
        name: w.app_name,
        process_id: w.process_id,
    })
}

#[tauri::command]
fn get_spaces(app: AppHandle) -> Vec<TrackingSpace> {
    load_state(&app).spaces
}

#[tauri::command]
fn save_space(app: AppHandle, space: TrackingSpace) -> Vec<TrackingSpace> {
    let mut state = load_state(&app);
    if let Some(existing) = state.spaces.iter_mut().find(|s| s.id == space.id) {
        *existing = space;
    } else {
        state.spaces.push(space);
    }
    save_state(&app, &state);
    update_tray_menu(&app, &state.spaces);
    state.spaces
}

#[tauri::command]
fn create_space(app: AppHandle, name: String, color: String) -> TrackingSpace {
    let space = TrackingSpace {
        id: Uuid::new_v4().to_string(),
        name,
        apps: Vec::new(),
        is_active: false,
        color,
    };
    let mut state = load_state(&app);
    state.spaces.push(space.clone());
    save_state(&app, &state);
    update_tray_menu(&app, &state.spaces);
    space
}

#[tauri::command]
fn delete_space(app: AppHandle, space_id: String) -> Vec<TrackingSpace> {
    let mut state = load_state(&app);
    state.spaces.retain(|s| s.id != space_id);
    state.entries.retain(|e| e.space_id != space_id);
    save_state(&app, &state);
    update_tray_menu(&app, &state.spaces);
    state.spaces
}

#[tauri::command]
async fn toggle_tracking(
    app: AppHandle,
    space_id: String,
    tracking_state: State<'_, SharedTrackingState>,
) -> Result<bool, String> {
    let mut state = load_state(&app);
    let mut is_now_active = false;
    
    for space in state.spaces.iter_mut() {
        if space.id == space_id {
            space.is_active = !space.is_active;
            is_now_active = space.is_active;
        } else {
            space.is_active = false;
        }
    }
    
    save_state(&app, &state);
    update_tray_menu(&app, &state.spaces);
    
    let mut ts = tracking_state.write().await;
    if is_now_active {
        ts.active_space_id = Some(space_id);
        ts.last_check = Some(std::time::Instant::now());
        ts.last_app = None;
    } else {
        ts.active_space_id = None;
        ts.last_check = None;
        ts.last_app = None;
    }
    
    let _ = app.emit("tracking-changed", is_now_active);
    
    Ok(is_now_active)
}

#[tauri::command]
async fn stop_all_tracking(
    app: AppHandle,
    tracking_state: State<'_, SharedTrackingState>,
) -> Result<(), String> {
    let mut state = load_state(&app);
    for space in state.spaces.iter_mut() {
        space.is_active = false;
    }
    save_state(&app, &state);
    update_tray_menu(&app, &state.spaces);
    
    let mut ts = tracking_state.write().await;
    ts.active_space_id = None;
    ts.last_check = None;
    ts.last_app = None;
    
    let _ = app.emit("tracking-changed", false);
    
    Ok(())
}

#[tauri::command]
fn get_time_entries(app: AppHandle, space_id: Option<String>, date_from: Option<String>, date_to: Option<String>) -> Vec<TimeEntry> {
    let state = load_state(&app);
    state.entries.into_iter().filter(|e| {
        let space_match = space_id.as_ref().map_or(true, |sid| &e.space_id == sid);
        let from_match = date_from.as_ref().map_or(true, |d| &e.date >= d);
        let to_match = date_to.as_ref().map_or(true, |d| &e.date <= d);
        space_match && from_match && to_match
    }).collect()
}

#[tauri::command]
fn get_settings(app: AppHandle) -> AppSettings {
    load_state(&app).settings
}

#[tauri::command]
fn save_settings(app: AppHandle, settings: AppSettings) -> AppSettings {
    let mut state = load_state(&app);
    state.settings = settings.clone();
    save_state(&app, &state);
    settings
}

#[tauri::command]
fn get_today_stats(app: AppHandle) -> HashMap<String, u64> {
    let today = Local::now().format("%Y-%m-%d").to_string();
    let state = load_state(&app);
    let mut stats: HashMap<String, u64> = HashMap::new();
    
    for entry in state.entries.iter().filter(|e| e.date == today) {
        *stats.entry(entry.app_name.clone()).or_insert(0) += entry.duration;
    }
    
    stats
}

fn update_tray_menu(app: &AppHandle, spaces: &[TrackingSpace]) {
    let tray = match app.tray_by_id("main") {
        Some(t) => t,
        None => return,
    };
    
    let mut menu_builder = MenuBuilder::new(app);
    
    for space in spaces {
        let item = CheckMenuItemBuilder::with_id(
            format!("space_{}", space.id),
            &space.name,
        )
        .checked(space.is_active)
        .build(app)
        .unwrap();
        menu_builder = menu_builder.item(&item);
    }
    
    let separator = tauri::menu::PredefinedMenuItem::separator(app).unwrap();
    menu_builder = menu_builder.item(&separator);
    
    let open_item = MenuItemBuilder::with_id("open", "Open Flow").build(app).unwrap();
    let quit_item = MenuItemBuilder::with_id("quit", "Quit").build(app).unwrap();
    
    menu_builder = menu_builder.item(&open_item).item(&quit_item);
    
    let menu = menu_builder.build().unwrap();
    let _ = tray.set_menu(Some(menu));
}

fn record_time(app: &AppHandle, space_id: &str, app_name: &str, duration_secs: u64) {
    if duration_secs == 0 {
        return;
    }
    
    let today = Local::now().format("%Y-%m-%d").to_string();
    let mut state = load_state(app);
    
    if let Some(entry) = state.entries.iter_mut().find(|e| {
        e.space_id == space_id && e.app_name == app_name && e.date == today
    }) {
        entry.duration += duration_secs;
    } else {
        state.entries.push(TimeEntry {
            space_id: space_id.to_string(),
            app_name: app_name.to_string(),
            date: today,
            duration: duration_secs,
        });
    }
    
    save_state(app, &state);
}

async fn tracking_loop(app: AppHandle, tracking_state: SharedTrackingState) {
    loop {
        tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
        
        let ts = tracking_state.read().await;
        let Some(ref space_id) = ts.active_space_id else {
            continue;
        };
        let space_id = space_id.clone();
        drop(ts);
        
        let state = load_state(&app);
        let space = match state.spaces.iter().find(|s| s.id == space_id) {
            Some(s) => s.clone(),
            None => continue,
        };
        
        let current_app = match active_win_pos_rs::get_active_window() {
            Ok(w) => w.app_name,
            Err(_) => continue,
        };
        
        let is_tracked = space.apps.iter().any(|a| {
            current_app.to_lowercase().contains(&a.to_lowercase()) ||
            a.to_lowercase().contains(&current_app.to_lowercase())
        });
        
        if is_tracked {
            let mut ts = tracking_state.write().await;
            if let Some(last_check) = ts.last_check {
                let elapsed = last_check.elapsed().as_secs();
                if ts.last_app.as_ref() == Some(&current_app) && elapsed > 0 {
                    record_time(&app, &space_id, &current_app, elapsed);
                }
            }
            ts.last_app = Some(current_app);
            ts.last_check = Some(std::time::Instant::now());
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let tracking_state: SharedTrackingState = Arc::new(RwLock::new(TrackingState::default()));
    let tracking_state_clone = tracking_state.clone();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .manage(tracking_state)
        .setup(move |app| {
            let state = load_state(app.handle());
            
            let toggle = MenuItemBuilder::with_id("open", "Open Flow").build(app)?;
            let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;
            let separator = tauri::menu::PredefinedMenuItem::separator(app)?;
            let menu = MenuBuilder::new(app)
                .item(&toggle)
                .item(&separator)
                .item(&quit)
                .build()?;
            
            let _tray = TrayIconBuilder::with_id("main")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(true)
                .tooltip("Flow - Time Tracker")
                .on_menu_event(|app, event| {
                    let id = event.id().as_ref();
                    if id == "open" {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.unminimize();
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    } else if id == "quit" {
                        app.exit(0);
                    } else if id.starts_with("space_") {
                        let space_id = id.strip_prefix("space_").unwrap().to_string();
                        let app_handle = app.clone();
                        let ts = app.state::<SharedTrackingState>().inner().clone();
                        tauri::async_runtime::spawn(async move {
                            let mut state = load_state(&app_handle);
                            let mut is_now_active = false;
                            
                            for space in state.spaces.iter_mut() {
                                if space.id == space_id {
                                    space.is_active = !space.is_active;
                                    is_now_active = space.is_active;
                                } else {
                                    space.is_active = false;
                                }
                            }
                            
                            save_state(&app_handle, &state);
                            update_tray_menu(&app_handle, &state.spaces);
                            
                            let mut ts_guard = ts.write().await;
                            if is_now_active {
                                ts_guard.active_space_id = Some(space_id);
                                ts_guard.last_check = Some(std::time::Instant::now());
                                ts_guard.last_app = None;
                            } else {
                                ts_guard.active_space_id = None;
                                ts_guard.last_check = None;
                                ts_guard.last_app = None;
                            }
                            
                            let _ = app_handle.emit("tracking-changed", is_now_active);
                        });
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.unminimize();
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;
            
            update_tray_menu(app.handle(), &state.spaces);
            
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(tracking_loop(app_handle, tracking_state_clone));
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_running_apps,
            get_active_window_info,
            get_spaces,
            save_space,
            create_space,
            delete_space,
            toggle_tracking,
            stop_all_tracking,
            get_time_entries,
            get_settings,
            save_settings,
            get_today_stats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
