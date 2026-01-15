use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
pub struct ProxyResponse {
    pub status: u16,
    pub headers: HashMap<String, String>,
    pub body: String,
}

#[tauri::command]
async fn proxy_request(
    url: String,
    method: String,
    headers: Option<HashMap<String, String>>,
    body: Option<String>,
) -> Result<ProxyResponse, String> {
    let client = reqwest::Client::new();
    
    let mut request = match method.to_uppercase().as_str() {
        "GET" => client.get(&url),
        "POST" => client.post(&url),
        "PUT" => client.put(&url),
        "DELETE" => client.delete(&url),
        "PATCH" => client.patch(&url),
        "HEAD" => client.head(&url),
        "OPTIONS" => client.request(reqwest::Method::OPTIONS, &url),
        _ => return Err(format!("Unsupported HTTP method: {}", method)),
    };
    
    // Add custom headers
    if let Some(custom_headers) = headers {
        for (key, value) in custom_headers {
            request = request.header(&key, &value);
        }
    }
    
    // Add body for methods that support it
    if let Some(body_content) = body {
        if !["GET", "HEAD"].contains(&method.to_uppercase().as_str()) {
            request = request.body(body_content);
        }
    }
    
    // Send request
    let response = request
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;
    
    // Extract response info
    let status = response.status().as_u16();
    
    let mut response_headers = HashMap::new();
    for (key, value) in response.headers().iter() {
        if let Ok(v) = value.to_str() {
            response_headers.insert(key.to_string(), v.to_string());
        }
    }
    
    let body = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?;
    
    Ok(ProxyResponse {
        status,
        headers: response_headers,
        body,
    })
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, proxy_request])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
