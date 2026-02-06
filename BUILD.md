# Build Guide - ActionFlows Workspace

This guide covers building distributable versions of ActionFlows Workspace for Windows, macOS, and Linux.

## Prerequisites

### All Platforms

- Node.js 18+ ([Download](https://nodejs.org/))
- pnpm 8+ (`npm install -g pnpm`)
- Git
- Internet connection (for downloading dependencies)

### Platform-Specific Requirements

**Windows:**
- Windows 10/11
- Visual Studio Build Tools (for native modules)

**macOS:**
- macOS 10.14+ (Mojave or later)
- Xcode Command Line Tools: `xcode-select --install`
- For code signing: Apple Developer account

**Linux:**
- Ubuntu 20.04+ / Fedora 36+ / Arch Linux
- Standard build tools: `sudo apt-get install build-essential`

## Quick Build

### Build for Current Platform

```bash
# Install dependencies
pnpm install

# Build for your current OS
cd packages/app
pnpm run electron-build
```

Output location: `packages/app/dist/`

### Build for Specific Platform

```bash
cd packages/app

# Windows only
pnpm run electron-build:win

# macOS only
pnpm run electron-build:mac

# Linux only
pnpm run electron-build:linux

# All platforms (requires macOS for signing)
pnpm run electron-build:all
```

## Build Targets

### Windows

**Targets:**
- NSIS Installer (.exe) - Full installer with uninstaller
- Portable (.exe) - Standalone executable, no installation

**Output files:**
```
packages/app/dist/
├── ActionFlows Workspace-0.1.0-win-x64.exe          # NSIS installer
└── ActionFlows Workspace-0.1.0-win-x64-portable.exe # Portable
```

**Distribution:**
- Host `.exe` files on your server
- Users download and run installer
- Portable version requires no installation

### macOS

**Targets:**
- DMG Image (.dmg) - Drag-to-install disk image
- ZIP Archive (.zip) - Compressed application bundle

**Output files:**
```
packages/app/dist/
├── ActionFlows Workspace-0.1.0-mac-x64.dmg    # Intel Macs
├── ActionFlows Workspace-0.1.0-mac-arm64.dmg  # Apple Silicon Macs
├── ActionFlows Workspace-0.1.0-mac-x64.zip
└── ActionFlows Workspace-0.1.0-mac-arm64.zip
```

**Distribution:**
- Host `.dmg` files on your server
- Users download, open DMG, drag to Applications
- ZIP is alternative for automated deployments

**Note:** macOS builds require code signing for distribution outside of enterprise environments.

### Linux

**Targets:**
- AppImage (.AppImage) - Universal Linux binary
- Debian Package (.deb) - For Ubuntu/Debian-based distros
- RPM Package (.rpm) - For Fedora/RHEL-based distros

**Output files:**
```
packages/app/dist/
├── ActionFlows Workspace-0.1.0-linux-x64.AppImage
├── actionflows-workspace_0.1.0_amd64.deb
└── actionflows-workspace-0.1.0.x86_64.rpm
```

**Distribution:**
- **AppImage**: Universal, works on all distros
  ```bash
  chmod +x ActionFlows*.AppImage
  ./ActionFlows*.AppImage
  ```
- **DEB**: Ubuntu/Debian
  ```bash
  sudo dpkg -i actionflows-workspace_*.deb
  sudo apt-get install -f  # Fix dependencies
  ```
- **RPM**: Fedora/RHEL
  ```bash
  sudo rpm -i actionflows-workspace-*.rpm
  ```

## Advanced Configuration

### Code Signing

#### Windows

**Setup:**
1. Obtain a code signing certificate (.pfx file)
2. Set environment variables:
   ```bash
   export WIN_CSC_LINK=/path/to/certificate.pfx
   export WIN_CSC_KEY_PASSWORD=your-password
   ```
3. Build:
   ```bash
   pnpm run electron-build:win
   ```

#### macOS

**Setup:**
1. Join Apple Developer Program ($99/year)
2. Create Developer ID Application certificate in Xcode
3. Set environment variables:
   ```bash
   export CSC_LINK=/path/to/certificate.p12
   export CSC_KEY_PASSWORD=your-password
   export APPLE_ID=your-apple-id@example.com
   export APPLE_ID_PASSWORD=app-specific-password
   ```
4. Build:
   ```bash
   pnpm run electron-build:mac
   ```

**Notarization:**
```bash
# After build completes
xcrun notarytool submit \
  "packages/app/dist/ActionFlows Workspace-0.1.0-mac-x64.dmg" \
  --apple-id your-apple-id@example.com \
  --password app-specific-password \
  --team-id YOUR-TEAM-ID \
  --wait

# Staple notarization ticket
xcrun stapler staple "packages/app/dist/ActionFlows Workspace-0.1.0-mac-x64.dmg"
```

### Custom Icons

Replace default icons:

**Windows:**
- Icon: `packages/app/public/icon.ico` (256x256 or multi-size)

**macOS:**
- Icon: `packages/app/public/icon.icns` (1024x1024 source)
- Generate ICNS: Use [Image2Icon](https://img2icnsapp.com/)

**Linux:**
- Icon: `packages/app/public/icon.png` (512x512 PNG)

### Build Optimization

**Reduce Build Size:**

Edit `packages/app/package.json`:

```json
{
  "build": {
    "compression": "maximum",
    "files": [
      "dist/**/*",
      "dist-electron/**/*",
      "!node_modules/**/*",  // Exclude source files
      "!src/**/*",
      "!*.md"
    ]
  }
}
```

**Enable ASAR Archive:**

```json
{
  "build": {
    "asar": true  // Package files into single archive
  }
}
```

### Custom Installer Options

**Windows NSIS:**

```json
{
  "build": {
    "nsis": {
      "oneClick": false,              // Allow install directory choice
      "perMachine": true,             // Install for all users
      "allowToChangeInstallationDirectory": true,
      "runAfterFinish": true,         // Launch app after install
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "license": "LICENSE.txt"        // Show license during install
    }
  }
}
```

**macOS DMG:**

```json
{
  "build": {
    "dmg": {
      "background": "public/dmg-background.png",  // Custom DMG background
      "window": {
        "width": 600,
        "height": 400
      }
    }
  }
}
```

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/build.yml`:

```yaml
name: Build Distributables

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'

      - run: pnpm install

      - name: Build
        run: |
          cd packages/app
          pnpm run electron-build

      - uses: actions/upload-artifact@v3
        with:
          name: distributables-${{ matrix.os }}
          path: packages/app/dist/*
```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
stages:
  - build

build:windows:
  stage: build
  image: electronuserland/builder:wine
  script:
    - pnpm install
    - cd packages/app
    - pnpm run electron-build:win
  artifacts:
    paths:
      - packages/app/dist/*.exe

build:macos:
  stage: build
  tags:
    - macos
  script:
    - pnpm install
    - cd packages/app
    - pnpm run electron-build:mac
  artifacts:
    paths:
      - packages/app/dist/*.dmg
      - packages/app/dist/*.zip

build:linux:
  stage: build
  image: electronuserland/builder
  script:
    - pnpm install
    - cd packages/app
    - pnpm run electron-build:linux
  artifacts:
    paths:
      - packages/app/dist/*.AppImage
      - packages/app/dist/*.deb
      - packages/app/dist/*.rpm
```

## Troubleshooting

### "Cannot find module 'electron'"

**Solution:**
```bash
cd packages/app
pnpm install electron --save-dev
```

### "Build failed: ENOENT: no such file or directory"

**Solution:**
```bash
# Clean build artifacts
rm -rf packages/app/dist
rm -rf packages/app/dist-electron

# Rebuild
cd packages/app
pnpm run build
pnpm run electron-build
```

### macOS: "Code signing failed"

**Solution:**
1. Check certificate is installed: `security find-identity -v -p codesigning`
2. Verify environment variables are set
3. Try without signing: `CSC_IDENTITY_AUTO_DISCOVERY=false pnpm run electron-build:mac`

### Linux: "Cannot execute binary file"

**Solution:**
```bash
# Make AppImage executable
chmod +x "ActionFlows Workspace-0.1.0-linux-x64.AppImage"

# If still fails, check architecture
file "ActionFlows Workspace-0.1.0-linux-x64.AppImage"
```

### Windows: "App won't start after install"

**Solution:**
1. Check antivirus hasn't quarantined the app
2. Verify .NET Framework 4.5+ is installed
3. Run installer as Administrator

## Release Checklist

Before releasing a new version:

- [ ] Update version in `packages/app/package.json`
- [ ] Update CHANGELOG.md with release notes
- [ ] Test builds on all target platforms
- [ ] Sign builds (Windows: Authenticode, macOS: Developer ID)
- [ ] Notarize macOS builds
- [ ] Upload builds to distribution server
- [ ] Update download links in documentation
- [ ] Create GitHub release with changelogs
- [ ] Announce release to users

## Distribution

### Self-Hosted

Host builds on your own server:

```
https://your-domain.com/downloads/
├── windows/
│   ├── ActionFlows-Workspace-0.1.0-win-x64.exe
│   └── ActionFlows-Workspace-0.1.0-win-x64-portable.exe
├── mac/
│   ├── ActionFlows-Workspace-0.1.0-mac-x64.dmg
│   └── ActionFlows-Workspace-0.1.0-mac-arm64.dmg
└── linux/
    ├── ActionFlows-Workspace-0.1.0-linux-x64.AppImage
    ├── actionflows-workspace_0.1.0_amd64.deb
    └── actionflows-workspace-0.1.0.x86_64.rpm
```

### GitHub Releases

1. Create a GitHub release with tag `v0.1.0`
2. Upload build artifacts as release assets
3. Write release notes describing changes
4. Mark as pre-release if not stable

### Enterprise Distribution

For internal enterprise use:

- Use code signing certificates from your organization
- Deploy via MDM (Mobile Device Management)
- Host on internal file server or package repository
- Document internal installation procedures

## Support

For build issues:
- Check [electron-builder docs](https://www.electron.build/)
- Open issue on GitHub
- Email: support@actionflows.dev
