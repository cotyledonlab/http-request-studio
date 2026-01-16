<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://capsule-render.vercel.app/api?type=waving&color=0:020617,100:0f172a&height=200&section=header&text=HTTP%20Request%20Studio&fontSize=42&fontColor=f1f5f9&animation=fadeIn&fontAlignY=35&desc=A%20beautiful%20native%20API%20testing%20tool&descSize=18&descAlignY=55">
  <source media="(prefers-color-scheme: light)" srcset="https://capsule-render.vercel.app/api?type=waving&color=0:e0e5ec,100:a3b1c6&height=200&section=header&text=HTTP%20Request%20Studio&fontSize=42&fontColor=2d3436&animation=fadeIn&fontAlignY=35&desc=A%20beautiful%20native%20API%20testing%20tool&descSize=18&descAlignY=55">
  <img alt="HTTP Request Studio" src="https://capsule-render.vercel.app/api?type=waving&color=0:020617,100:0f172a&height=200&section=header&text=HTTP%20Request%20Studio&fontSize=42&fontColor=f1f5f9&animation=fadeIn&fontAlignY=35&desc=A%20beautiful%20native%20API%20testing%20tool&descSize=18&descAlignY=55" width="100%">
</picture>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/Svelte-5-FF3E00?style=flat-square&logo=svelte&logoColor=white" alt="Svelte 5">
  <img src="https://img.shields.io/badge/Tauri-2-FFC131?style=flat-square&logo=tauri&logoColor=white" alt="Tauri 2">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 5">
</p>

<p align="center">
  A lightweight, fast, and beautiful desktop application for testing HTTP APIs.<br>
  Built with <strong>Svelte 5</strong>, <strong>Tauri 2</strong>, and a stunning neumorphic design.
</p>

---

## ✨ Features

- 🚀 **Native Performance** — Built with Tauri for a fast, lightweight desktop experience
- 🎨 **Beautiful Neumorphic UI** — Modern soft-shadow design that's easy on the eyes
- 🌗 **Dark & Light Themes** — Toggle between themes with smooth transitions
- 📝 **Full HTTP Support** — GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS methods
- 📋 **Headers Editor** — Add, edit, enable/disable custom request headers with autocomplete
- 🔧 **JSON Body Editor** — Rich editor for composing request payloads
- 🌳 **JSON Tree Viewer** — Collapsible, syntax-highlighted response visualization
- 📊 **Response Details** — Status codes, timing metrics, and response headers at a glance
- 📁 **File Explorer** — Organize your requests into folders *(coming soon)*
- 📋 **Click-to-Copy** — Copy any JSON value with a single click

## 📸 Preview

The app features a clean, modern interface with neumorphic design elements:

- **Request Builder** — Configure URL, method, headers, and body
- **Response Viewer** — Interactive JSON tree with collapsible nodes
- **Status Bar** — Real-time status codes and request duration

## 🛠️ Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/)
- [Tauri CLI](https://tauri.app/v2/guides/prerequisites/)

### Build from Source

```bash
# Clone the repository
git clone https://github.com/cotyledonlab/http-request-studio.git
cd http-request-studio

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## 🚀 Usage

1. **Set the URL** — Enter your API endpoint
2. **Choose Method** — Select GET, POST, PUT, DELETE, etc.
3. **Add Headers** — Configure custom headers (Content-Type, Authorization, etc.)
4. **Write Body** — For POST/PUT/PATCH, compose your JSON payload
5. **Send Request** — Click "Send Request" and view the response
6. **Explore Response** — Navigate the JSON tree, copy values, inspect headers

## 🎯 Roadmap

- [ ] Save/load request collections
- [ ] Environment variables
- [ ] Request history
- [ ] Import from cURL/Postman
- [ ] GraphQL support
- [ ] WebSocket testing

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  <sub>Built with 💜 by <a href="https://github.com/cotyledonlab">Cotyledon Lab</a></sub>
</p>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:020617,100:0f172a&height=100&section=footer" width="100%">
