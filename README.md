# SiYuan Workspace Plugin

A powerful workspace management plugin for SiYuan that allows you to save and switch between different tab combinations, making it easy to organize your work across multiple documents.

## Features

### 🏷️ Simple Tab Interface
- **Horizontal Tab Layout**: All workspaces displayed as tabs for quick access
- **Current Workspace Highlight**: Active workspace clearly highlighted
- **Rich Information Display**: Shows tab count and last update time for each workspace
- **One-Click Switching**: Switch between workspaces with a single click

### ⚙️ Full Management Mode
- **Create Workspaces**: Create new workspaces with custom names and descriptions
- **Edit Workspace Names**: Inline editing of workspace names directly in the interface
- **Delete Workspaces**: Remove workspaces you no longer need
- **Save Current State**: Save current tab state to the active workspace

### 📑 Tab Management
- **Automatic Tab Tracking**: Automatically captures and saves your current tabs
- **Smart Tab Recovery**: Restores all tabs when switching workspaces
- **Cross-Document Support**: Works with all SiYuan document types
- **Persistent Storage**: Your workspace configurations are saved permanently

## Installation

1. Download the latest `package.zip` from the releases
2. Open SiYuan and go to Settings → Community Plugins
3. Click "Install from ZIP" and select the downloaded file
4. Enable the plugin in the plugin list

## Usage

### Quick Workspace Switching
1. Click the workspace management icon in the dock
2. See all your workspaces as horizontal tabs
3. Click any workspace tab to switch instantly
4. Current workspace is highlighted in blue

### Full Workspace Management
1. Click the "Settings" button in the workspace tabs
2. Create new workspaces with the "+" button
3. Edit workspace names by clicking the edit icon (✏️)
4. Delete workspaces you no longer need
5. Save current tab state to preserve your work

### Creating a New Workspace
1. Open multiple documents you want to group together
2. Click "Create Workspace" in the management interface
3. Enter a name and optional description
4. The current tabs will be cleared and saved as a new workspace

### Switching Between Workspaces
1. Click on any workspace tab to switch
2. Your current tabs will be automatically saved
3. The target workspace's tabs will be restored
4. Continue working in your new document set

## Interface Design

### Simple Mode (Default)
- Clean horizontal tab layout
- Rich workspace information display
- Fixed settings button on the right
- Responsive design for all screen sizes

### Management Mode
- Full workspace creation and editing
- Inline name editing with keyboard shortcuts
- Detailed workspace information
- Batch operations support

## Keyboard Shortcuts

- **Enter**: Save when editing workspace names
- **Escape**: Cancel editing
- **⌥⌘W**: Toggle workspace management dock (configurable)

## Technical Details

- **Framework**: Svelte + TypeScript
- **Build Tool**: Vite
- **Storage**: SiYuan's built-in data persistence
- **API Integration**: Full SiYuan plugin API support
- **Responsive**: Works on desktop, mobile, and browser

## Development

```bash
# Install dependencies
npm install

# Development build
npm run dev

# Production build
npm run build
```

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please visit the [GitHub repository](https://github.com/liuwenwu/siyuan-workspace-plugin).

---

**Transform your SiYuan workflow with organized workspaces!** 🚀