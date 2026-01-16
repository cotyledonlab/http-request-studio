use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::Manager;

#[derive(Debug, Serialize)]
pub struct ProxyResponse {
    pub status: u16,
    pub headers: HashMap<String, String>,
    pub body: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct Header {
    key: String,
    value: String,
    enabled: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct RequestPayload {
    url: String,
    method: String,
    headers: Vec<Header>,
    body: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type", rename_all = "lowercase")]
enum CollectionItem {
    Folder {
        id: String,
        name: String,
        items: Vec<CollectionItem>,
        expanded: bool,
    },
    Request {
        id: String,
        name: String,
        request: RequestPayload,
        #[serde(rename = "createdAt")]
        created_at: u64,
        #[serde(rename = "updatedAt")]
        updated_at: u64,
    },
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct Collection {
    id: String,
    name: String,
    description: Option<String>,
    created_at: u64,
    updated_at: u64,
    items: Vec<CollectionItem>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct CollectionMeta {
    id: String,
    name: String,
    description: Option<String>,
    updated_at: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct EnvironmentVariable {
    key: String,
    value: String,
    enabled: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct Environment {
    id: String,
    name: String,
    variables: Vec<EnvironmentVariable>,
    created_at: u64,
    updated_at: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct EnvironmentState {
    environments: Vec<Environment>,
    active_environment_id: Option<String>,
}

fn app_data_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data directory: {e}"))
}

fn ensure_dir(path: &Path) -> Result<(), String> {
    fs::create_dir_all(path)
        .map_err(|e| format!("Failed to create directory {}: {e}", path.display()))
}

fn collections_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let base = app_data_dir(app)?;
    ensure_dir(&base)?;
    let collections = base.join("collections");
    ensure_dir(&collections)?;
    Ok(collections)
}

fn collection_path(app: &tauri::AppHandle, id: &str) -> Result<PathBuf, String> {
    Ok(collections_dir(app)?.join(format!("{id}.json")))
}

fn environments_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let base = app_data_dir(app)?;
    ensure_dir(&base)?;
    Ok(base.join("environments.json"))
}

fn read_collection(path: &Path) -> Result<Collection, String> {
    let raw = fs::read_to_string(path)
        .map_err(|e| format!("Failed to read collection file {}: {e}", path.display()))?;
    serde_json::from_str(&raw)
        .map_err(|e| format!("Failed to parse collection file {}: {e}", path.display()))
}

fn write_collection(path: &Path, collection: &Collection) -> Result<(), String> {
    let raw = serde_json::to_string_pretty(collection)
        .map_err(|e| format!("Failed to serialize collection: {e}"))?;
    fs::write(path, raw)
        .map_err(|e| format!("Failed to write collection file {}: {e}", path.display()))
}

#[tauri::command]
async fn proxy_request(
    url: String,
    method: String,
    headers: Option<HashMap<String, String>>,
    body: Option<String>,
) -> Result<ProxyResponse, String> {
    let client = reqwest::Client::new();

    // Uppercase method once to avoid redundant string allocation
    let method_upper = method.to_uppercase();

    let mut request = match method_upper.as_str() {
        "GET" => client.get(&url),
        "POST" => client.post(&url),
        "PUT" => client.put(&url),
        "DELETE" => client.delete(&url),
        "PATCH" => client.patch(&url),
        "HEAD" => client.head(&url),
        "OPTIONS" => client.request(reqwest::Method::OPTIONS, &url),
        _ => return Err(format!("Unsupported HTTP method: {method}")),
    };

    // Add custom headers
    if let Some(custom_headers) = headers {
        for (key, value) in custom_headers {
            request = request.header(&key, &value);
        }
    }

    // Add body for methods that support it (exclude GET and HEAD)
    if let Some(body_content) = body {
        if !["GET", "HEAD"].contains(&method_upper.as_str()) {
            request = request.body(body_content);
        }
    }

    // Send request
    let response = request
        .send()
        .await
        .map_err(|e| format!("Request failed: {e}"))?;

    // Extract response info
    let status = response.status().as_u16();

    let mut response_headers = HashMap::new();
    for (key, value) in response.headers().iter() {
        match value.to_str() {
            Ok(v) => {
                response_headers.insert(key.to_string(), v.to_string());
            }
            Err(_) => {
                eprintln!(
                    "Warning: failed to convert header '{}' value to UTF-8; skipping this header",
                    key
                );
            }
        }
    }

    let body = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response body: {e}"))?;

    Ok(ProxyResponse {
        status,
        headers: response_headers,
        body,
    })
}

#[tauri::command]
async fn list_collections(app: tauri::AppHandle) -> Result<Vec<CollectionMeta>, String> {
    let dir = collections_dir(&app)?;
    let mut metas = Vec::new();

    let entries = fs::read_dir(dir)
        .map_err(|e| format!("Failed to list collections directory: {e}"))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read collections entry: {e}"))?;
        let path = entry.path();
        if path.extension().and_then(|ext| ext.to_str()) != Some("json") {
            continue;
        }
        if let Ok(collection) = read_collection(&path) {
            metas.push(CollectionMeta {
                id: collection.id,
                name: collection.name,
                description: collection.description,
                updated_at: collection.updated_at,
            });
        }
    }

    metas.sort_by_key(|meta| meta.updated_at);
    metas.reverse();
    Ok(metas)
}

#[tauri::command]
async fn get_collection(app: tauri::AppHandle, id: String) -> Result<Collection, String> {
    let path = collection_path(&app, &id)?;
    if !path.exists() {
        return Err(format!("Collection not found: {id}"));
    }
    read_collection(&path)
}

#[tauri::command]
async fn save_collection(app: tauri::AppHandle, collection: Collection) -> Result<(), String> {
    let path = collection_path(&app, &collection.id)?;
    write_collection(&path, &collection)
}

#[tauri::command]
async fn delete_collection(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let path = collection_path(&app, &id)?;
    if path.exists() {
        fs::remove_file(&path)
            .map_err(|e| format!("Failed to delete collection {}: {e}", path.display()))?;
    }
    Ok(())
}

#[tauri::command]
async fn export_collection(
    app: tauri::AppHandle,
    id: String,
    path: String,
) -> Result<(), String> {
    let collection = get_collection(app, id).await?;
    let raw = serde_json::to_string_pretty(&collection)
        .map_err(|e| format!("Failed to serialize collection: {e}"))?;
    fs::write(&path, raw).map_err(|e| format!("Failed to export collection: {e}"))
}

#[tauri::command]
async fn import_collection(app: tauri::AppHandle, path: String) -> Result<Collection, String> {
    let raw = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read import file {path}: {e}"))?;
    let collection: Collection = serde_json::from_str(&raw)
        .map_err(|e| format!("Failed to parse collection import: {e}"))?;
    let target = collection_path(&app, &collection.id)?;
    write_collection(&target, &collection)?;
    Ok(collection)
}

#[tauri::command]
async fn load_environments(app: tauri::AppHandle) -> Result<EnvironmentState, String> {
    let path = environments_path(&app)?;
    if !path.exists() {
        return Ok(EnvironmentState {
            environments: Vec::new(),
            active_environment_id: None,
        });
    }
    let raw = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read environments file {}: {e}", path.display()))?;
    serde_json::from_str(&raw)
        .map_err(|e| format!("Failed to parse environments file {}: {e}", path.display()))
}

#[tauri::command]
async fn save_environments(
    app: tauri::AppHandle,
    state: EnvironmentState,
) -> Result<(), String> {
    let path = environments_path(&app)?;
    let raw = serde_json::to_string_pretty(&state)
        .map_err(|e| format!("Failed to serialize environments: {e}"))?;
    fs::write(&path, raw)
        .map_err(|e| format!("Failed to write environments file {}: {e}", path.display()))
}

#[tauri::command]
async fn export_environments(app: tauri::AppHandle, path: String) -> Result<(), String> {
    let state = load_environments(app).await?;
    let raw = serde_json::to_string_pretty(&state)
        .map_err(|e| format!("Failed to serialize environments: {e}"))?;
    fs::write(&path, raw).map_err(|e| format!("Failed to export environments: {e}"))
}

#[tauri::command]
async fn import_environments(app: tauri::AppHandle, path: String) -> Result<EnvironmentState, String> {
    let raw = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read environments import {path}: {e}"))?;
    let state: EnvironmentState = serde_json::from_str(&raw)
        .map_err(|e| format!("Failed to parse environments import: {e}"))?;
    save_environments(app, state.clone()).await?;
    Ok(state)
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}! You've been greeted from Rust!")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            proxy_request,
            list_collections,
            get_collection,
            save_collection,
            delete_collection,
            export_collection,
            import_collection,
            load_environments,
            save_environments,
            export_environments,
            import_environments
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
