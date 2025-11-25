# Installation Guide

## Build & Install Argus

### 1. Build the Application

```bash
npm run tauri build
```

This will create:
- **RPM Package**: `src-tauri/target/release/bundle/rpm/argus-0.1.0-1.x86_64.rpm` (Fedora)
- **DEB Package**: `src-tauri/target/release/bundle/deb/argus_0.1.0_amd64.deb` (Debian/Ubuntu)
- **Binary**: `src-tauri/target/release/argus`

### 2. Install on Fedora

**First installation:**
```bash
sudo rpm -ivh src-tauri/target/release/bundle/rpm/argus-0.1.0-1.x86_64.rpm
```

**Reinstall/Update (replace existing version):**
```bash
sudo rpm -Uvh --replacepkgs src-tauri/target/release/bundle/rpm/argus-0.1.0-1.x86_64.rpm
```

Or simply:
```bash
sudo dnf reinstall src-tauri/target/release/bundle/rpm/argus-0.1.0-1.x86_64.rpm
```

### 3. Install on Debian/Ubuntu

```bash
sudo dpkg -i src-tauri/target/release/bundle/deb/argus_0.1.0_amd64.deb
```

### 4. Verify Installation

```bash
# Check if installed
rpm -qa | grep argus

# Run the application
argus

# Or launch from your application menu
```

### 5. Uninstall

```bash
# Fedora
sudo rpm -e argus

# Or with dnf
sudo dnf remove argus

# Debian/Ubuntu
sudo apt remove argus
```

## Desktop Entry

The package automatically installs a `.desktop` file, so Argus should appear in your application launcher after installation.

**Location**: `/usr/share/applications/argus.desktop`

## Quick Reinstall Script

Create a convenience script for development:

```bash
#!/bin/bash
# reinstall.sh

echo "Building Argus..."
npm run tauri build

if [ $? -eq 0 ]; then
    echo "Installing Argus..."
    sudo rpm -Uvh --replacepkgs src-tauri/target/release/bundle/rpm/argus-0.1.0-1.x86_64.rpm
    echo "Done! Launch with: argus"
else
    echo "Build failed!"
    exit 1
fi
```

Make it executable:
```bash
chmod +x reinstall.sh
./reinstall.sh
```

