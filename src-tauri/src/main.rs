// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::command;
use reqwest::Client;
use serde_json::{Value, json};

#[command]
async fn proxy_request(url: String, method: String, body: Option<Value>) -> Result<Value, String> {
    let client = Client::new();
    
    let request = match method.as_str() {
        "GET" => client.get(&url),
        "POST" => client.post(&url),
        "PUT" => client.put(&url),
        "DELETE" => client.delete(&url),
        "PATCH" => client.patch(&url),
        _ => return Err("Invalid HTTP method".into()),
    };

    let request = if let Some(body) = body {
        request.json(&body)
    } else {
        request
    };

    let response = request
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = response.status();
    let response_body = response
        .json::<Value>()
        .await
        .map_err(|e| e.to_string())?;

    Ok(json!({
        "status": status.as_u16(),
        "body": response_body
    }))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![proxy_request])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
