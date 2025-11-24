# Argus 👁️

**Argus** is a custom "Control Center" and documentation hub for Linux "ricers" (specifically Hyprland/Fedora). It serves as an onboarding dashboard to help you remember keybindings, view cheat sheets, and manage your system configuration after time away.

Built with **Tauri v2**, **Angular 18+**, and **Angular Material**.

## Features

- **Documentation Hub**: Renders local Markdown files (`welcome.md`, `cheatsheet.md`) for easy editing.
- **Keybinding Visualizer**: Searchable table of your custom Hyprland shortcuts.
- **Extensible**: Ready to add system management scripts via Rust.

## Development

### Prerequisites

- Rust & Cargo (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- Node.js & npm
- Linux build tools:
  ```bash
  sudo dnf install glib2-devel gobject-introspection-devel pango-devel \
      gdk-pixbuf2-devel atk-devel gtk3-devel webkit2gtk4.1-devel \
      libappindicator-gtk3-devel librsvg2-devel openssl-devel cairo-devel \
      libsoup3-devel
  ```

### Running Locally

Start the development server (Angular + Rust):

```bash
npm run tauri dev
```

### Building for Release

Create an optimized release binary:

```bash
npm run tauri build
```

The output binary will be located at: `src-tauri/target/release/bundle/deb/` (or similar depending on packaging).

## Project Structure

- **`src/`**: Angular frontend code.
  - **`src/assets/`**: Location for your local `keybindings.json` and markdown docs.
- **`src-tauri/`**: Rust backend code.
  - **`src-tauri/src/lib.rs`**: Custom commands (e.g., file reading).
