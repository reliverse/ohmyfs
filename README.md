# ohmyfs

[![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)](https://github.com/reliverse/ohmyfs/releases)
[![License](https://img.shields.io/badge/license-Apache%202.0-green.svg)](LICENSE)
[![Platforms](https://img.shields.io/badge/platforms-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/reliverse/ohmyfs/releases)
[![Rust](https://img.shields.io/badge/rust-1.92+-000000.svg)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/react-19-61dafb.svg)](https://reactjs.org/)
[![Tauri](https://img.shields.io/badge/tauri-2-24c8db.svg)](https://tauri.app/)

A file manager for Windows, macOS, and Linux with declarative filesystem management.

## Features

- Virtual scrolling for large directories
- Fuzzy search with regex support
- ZIP compression and extraction
- Batch file operations
- File preview system
- Keyboard shortcuts
- Declarative filesystem engine

## Installation

### Quick Start

Download the latest release for your platform from the [Releases](https://github.com/reliverse/ohmyfs/releases) page.

### Recommended System Requirements

**OS**: Windows 11+ / macOS 12+ / Ubuntu 20.04+ |
**RAM**: 8GB |
**Storage**: 1GB SSD
**Display**: 1920x1080

### Platform Downloads

- [Go to GitHub Releases Page](https://github.com/reliverse/ohmyfs/releases/latest)

> **Note**: You may see warnings from tools such as SmartScreen, as we do not yet have the financial means to sign the code.

## Usage Guide

### File Operations

#### Basic Operations

| Operation | Shortcut | Description |
|-----------|----------|-------------|
| **Copy** | `Ctrl+C` → `Ctrl+V` | Duplicate files to clipboard then paste |
| **Move** | `Ctrl+X` → `Ctrl+V` | Cut files to clipboard then paste |
| **Delete** | `Delete` or `Del` | Move to trash (with confirmation) |
| **Rename** | `F2` | Edit filename inline |

#### Advanced Operations

- **Right-click Context Menu**: Access all operations via context menus
- **Drag & Drop**: Drag files between directories for quick moves
- **Multi-Selection**: Hold `Ctrl` for individual selection, `Shift` for ranges

### Search & Discovery

#### Quick Search

1. Click the search icon in the toolbar
2. Enter search terms (supports fuzzy matching)
3. Results appear instantly with highlighting

#### Advanced Filters

- **File Type**: Filter by extension (.txt, .jpg, etc.)
- **Size Range**: Find files within size limits (e.g., >1MB, <100KB)
- **Date Range**: Filter by creation/modification dates
- **Path Pattern**: Search within specific directories
- **Regex Mode**: Toggle for advanced pattern matching

#### Search Tips

- Use `*` wildcard: `*.txt` finds all text files
- Search in archives: Toggle "Search in ZIP files"
- Deep search: Recursively search subdirectories
- Save searches: Access recent searches from history

### Archive Management

#### Creating Archives

1. Select files/folders (hold `Ctrl` for multiple)
2. Right-click → **"Compress"**
3. Choose compression level (0-9, where 9 is maximum compression)
4. Optional: Set password protection
5. **Batch Mode**: Compress multiple items into separate archives

#### Extracting Archives

1. Right-click ZIP file → **"Extract Here"**
2. Choose extraction location
3. Monitor progress with real-time feedback
4. **Preview Mode**: Browse archive contents before extraction

#### Archive Analytics

- **Compression Ratio**: View space savings
- **File Count**: Total files in archive
- **Total Size**: Original vs compressed size
- **Extraction Speed**: Performance metrics

### Batch Operations

#### Getting Started with Batch Ops

1. Select multiple files (use `Ctrl+A` for all)
2. Click the **Batch Operations** button
3. Choose operation type from the dialog

#### Operation Types

- **Bulk Rename**: Find-and-replace with regex patterns
- **Batch Copy**: Copy multiple files to destinations
- **Batch Move**: Move files with destination validation
- **Mass Delete**: Safe bulk deletion with confirmations

#### Preview & Safety

- **Live Preview**: See exact changes before execution
- **Conflict Detection**: Automatic handling of naming conflicts
- **Rollback Ready**: Changes can be undone if needed
- **Progress Tracking**: Real-time operation status

### Declarative Filesystem Engine

The **Filesystem Engine** brings infrastructure-as-code principles to file management. Define, preview, and apply filesystem structures declaratively with full safety guarantees.

#### How It Works

1. **Define Structure**: Create filesystem blueprints using JSON/TypeScript with variables and templates
2. **Generate Plan**: Compare desired state vs current filesystem state
3. **Safety Check**: Automatic validation prevents destructive operations
4. **Review Changes**: Detailed diff with impact assessment and warnings
5. **Apply Safely**: Execute with progress tracking and instant rollback capability

#### Quick Start with Filesystem Engine

1. **Access**: Click **"Filesystem Engine"** in the sidebar
2. **Create**: Use the visual editor or import JSON configurations
3. **Variables**: Define dynamic content with `{{variableName}}` templating
4. **Plan**: Click **"Generate Diff"** to preview changes
5. **Apply**: Execute with real-time monitoring and rollback support

#### Example: Node.js Project Scaffold

```json
{
  "name": "Node.js API Project",
  "description": "Full-stack Node.js application structure",
  "basePath": "/projects/{{projectName}}",
  "variables": [
    {
      "name": "projectName",
      "type": "string",
      "defaultValue": "my-awesome-api",
      "description": "Name of your project"
    },
    {
      "name": "author",
      "type": "string",
      "defaultValue": "Your Name",
      "description": "Project author"
    }
  ],
  "structure": [
    {
      "type": "file",
      "name": "package.json",
      "content": {
        "template": "json",
        "content": {
          "name": "{{projectName}}",
          "version": "1.0.0",
          "description": "A Node.js API application",
          "author": "{{author}}",
          "scripts": {
            "start": "node src/index.js",
            "dev": "nodemon src/index.js",
            "test": "jest"
          },
          "dependencies": {
            "express": "^4.18.0",
            "mongoose": "^7.0.0"
          }
        }
      }
    },
    {
      "type": "file",
      "name": "README.md",
      "content": {
        "template": "markdown",
        "content": "# {{projectName}}\n\nA Node.js API built with Express and MongoDB.\n\n## Getting Started\n\n```bash\nnpm install\nnpm start\n```"
      }
    },
    {
      "type": "directory",
      "name": "src",
      "children": [
        {
          "type": "file",
          "name": "index.js",
          "content": {
            "template": "javascript",
            "content": "const express = require('express');\nconst app = express();\n\nconst PORT = process.env.PORT || 3000;\n\napp.get('/', (req, res) => {\n  res.json({ message: 'Hello from {{projectName}}!' });\n});\n\napp.listen(PORT, () => {\n  console.log(`Server running on port ${PORT}`);\n});"
          }
        },
        {
          "type": "file",
          "name": "routes",
          "children": [
            {
              "type": "file",
              "name": "api.js",
              "content": {
                "template": "javascript",
                "content": "const express = require('express');\nconst router = express.Router();\n\n// API routes go here\n\nmodule.exports = router;"
              }
            }
          ]
        },
        {
          "type": "file",
          "name": "models",
          "children": [
            {
              "type": "file",
              "name": "User.js",
              "content": {
                "template": "javascript",
                "content": "const mongoose = require('mongoose');\n\nconst userSchema = new mongoose.Schema({\n  name: String,\n  email: String,\n  createdAt: { type: Date, default: Date.now }\n});\n\nmodule.exports = mongoose.model('User', userSchema);"
              }
            }
          ]
        }
      ]
    },
    {
      "type": "directory",
      "name": "tests",
      "children": [
        {
          "type": "file",
          "name": ".gitkeep"
        }
      ]
    },
    {
      "type": "file",
      "name": ".gitignore",
      "content": {
        "template": "text",
        "content": "node_modules/\n.env\n.DS_Store\n*.log\ncoverage/"
      }
    }
  ],
  "ignorePatterns": [
    "node_modules/",
    "*.log",
    ".DS_Store",
    "coverage/",
    ".env*"
  ],
  "safetyRules": {
    "preventSystemPaths": true,
    "requireConfirmation": true,
    "maxFileSize": "10MB"
  }
}
```

#### Advanced Features

- **Variable Types**: Support for string, number, boolean, and array variables
- **Content Templates**: JSON, Markdown, JavaScript, and plain text templates
- **Ignore Patterns**: .gitignore-style pattern matching
- **Safety Rules**: Configurable protection against dangerous operations
- **Rollback Support**: Complete undo capability for applied changes
- **Execution Monitoring**: Real-time progress with detailed logging

### Keyboard Shortcuts

Master ohmyfs with professional-grade keyboard shortcuts. All shortcuts are fully customizable in settings.

#### Essential Navigation

| Shortcut | Windows/Linux | macOS | Action |
|----------|---------------|-------|--------|
| `Ctrl+A` | `Ctrl+A` | `Cmd+A` | Select all files |
| `Ctrl+D` | `Ctrl+D` | `Cmd+D` | Deselect all files |
| `Escape` | `Escape` | `Escape` | Clear selection |
| `Enter` | `Enter` | `Enter` | Open selected file/folder |
| `Backspace` | `Backspace` | `Backspace` | Go to parent directory |
| `Alt+←` | `Alt+←` | `Option+←` | Go back in history |
| `Alt+→` | `Alt+→` | `Option+→` | Go forward in history |

#### File Operations

| Shortcut | Windows/Linux | macOS | Action |
|----------|---------------|-------|--------|
| `Ctrl+C` | `Ctrl+C` | `Cmd+C` | Copy selected files |
| `Ctrl+X` | `Ctrl+X` | `Cmd+X` | Cut selected files |
| `Ctrl+V` | `Ctrl+V` | `Cmd+V` | Paste files |
| `Delete` | `Delete` | `Delete` | Delete selected files |
| `Shift+Delete` | `Shift+Delete` | `Shift+Delete` | Delete permanently (skip trash) |
| `F2` | `F2` | `Enter` | Rename selected file |
| `Ctrl+R` | `Ctrl+R` | `Cmd+R` | Refresh current directory |

#### Search & Discovery

| Shortcut | Windows/Linux | macOS | Action |
|----------|---------------|-------|--------|
| `Ctrl+F` | `Ctrl+F` | `Cmd+F` | Focus search bar |
| `Ctrl+G` | `Ctrl+G` | `Cmd+G` | Find next in results |
| `Ctrl+Shift+G` | `Ctrl+Shift+G` | `Cmd+Shift+G` | Find previous in results |
| `F3` | `F3` | `Cmd+G` | Quick search |

#### Archive Operations

| Shortcut | Windows/Linux | macOS | Action |
|----------|---------------|-------|--------|
| `Ctrl+E` | `Ctrl+E` | `Cmd+E` | Extract selected archive |
| `Ctrl+P` | `Ctrl+P` | `Cmd+P` | Compress selected files |

#### View & Interface

| Shortcut | Windows/Linux | macOS | Action |
|----------|---------------|-------|--------|
| `Ctrl+H` | `Ctrl+H` | `Cmd+Shift+.` | Toggle hidden files |
| `F11` | `F11` | `Cmd+Ctrl+F` | Toggle fullscreen |
| `Ctrl+,` | `Ctrl+,` | `Cmd+,` | Open settings |
| `F1` | `F1` | `F1` | Show help |

#### Advanced Selection

| Shortcut | Windows/Linux | macOS | Action |
|----------|---------------|-------|--------|
| `Shift+Click` | `Shift+Click` | `Shift+Click` | Select range |
| `Ctrl+Click` | `Ctrl+Click` | `Cmd+Click` | Toggle selection |
| `Ctrl+Shift+Click` | `Ctrl+Shift+Click` | `Cmd+Shift+Click` | Extend selection |
| `Space` | `Space` | `Space` | Quick preview toggle |

> **Pro Tip**: Hold `Alt` while clicking to select multiple ranges. Use `Ctrl+Shift+N` to create new folders instantly.

## Settings & Customization

Access comprehensive settings through the gear icon to tailor ohmyfs to your workflow.

### Appearance

- **Theme Selection**: Light, dark, and system preference modes
- **Accent Colors**: Choose from predefined color schemes
- **Interface Scale**: Adjust UI size for different screen densities
- **Font Settings**: Choose from system fonts with size controls
- **Language**: Support for multiple languages (contributions welcome!)

### View Options

- **Display Mode**: List, grid, and detail view layouts
- **Hidden Files**: Toggle visibility of system and hidden files
- **Thumbnails**: Control thumbnail generation and size (32px - 256px)
- **File Details**: Customize which columns to show (size, date, permissions, etc.)
- **Sort Options**: Sort by name, size, date, type with ascending/descending

### Performance

- **Auto-refresh**: Set directory refresh intervals
- **Memory Usage**: Control thumbnail cache size and cleanup
- **Virtual Scrolling**: Adjust viewport buffer sizes
- **Performance Metrics**: Enable developer performance monitoring
- **Background Tasks**: Configure concurrent operation limits

### Keyboard & Shortcuts

- **Shortcut Profiles**: Choose from preset shortcut schemes
- **Custom Hotkeys**: Remap any keyboard shortcut
- **Context Awareness**: Smart shortcuts that adapt to current view
- **Accessibility**: Enhanced keyboard navigation for screen readers

### 🔒 Security & Safety

- **Delete Confirmation**: Configure confirmation dialogs
- **System Protection**: Prevent operations on critical system paths
- **Archive Passwords**: Remember/archive encryption settings
- **Clipboard Security**: Clear clipboard on exit option

### 🔧 Advanced

- **Developer Mode**: Enable debug logging and developer tools
- **Network Settings**: Configure proxy and network preferences
- **Storage Limits**: Set maximum cache and temporary file sizes
- **Auto-updates**: Configure automatic update checking and installation

## Development

### Technology Stack

#### Frontend

- React 19
- TypeScript
- TanStack Router
- TanStack Query
- Tailwind CSS
- Shadcn/ui
- Biome (Ultracite preset)
- Vite

#### Backend

- Tauri 2
- Rust
- ORPC

#### Key Libraries

- @tauri-apps/api
- @tanstack/react-virtual
- fuse.js
- jszip
- lucide-react
- zod

### API Architecture

ORPC provides type-safe communication between React frontend and Rust backend:

- End-to-end type safety
- Schema validation with Zod
- TanStack Query integration
- Structured error handling

Example API usage:

```typescript
// Client-side usage with full type safety
const { data: todos } = orpc.listTodos.useQuery();
const addTodoMutation = orpc.addTodo.useMutation();

// Server-side ORPC handler
export const listTodos = os.input(z.object({})).handler(() => {
  return todos;
});
```

### Architecture

#### Frontend Architecture (React + TypeScript)

- **Routing**: TanStack Router with file-based routing and type-safe navigation
- **State Management**: React Context + TanStack Query for server state
- **UI Components**: Shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **Forms**: React Hook Form with Zod validation
- **Performance**: Virtual scrolling, lazy loading, and code splitting

#### Backend Architecture (Rust + Tauri)

- **Framework**: Tauri 2 for cross-platform desktop applications
- **API Layer**: ORPC for type-safe client-server communication
- **File Operations**: Native filesystem access via Tauri's plugins
- **Security**: Sandboxed execution with permission-based access

#### Communication Flow

```bash
# React Component → ORPC Client → TanStack Query → HTTP → ORPC Server → Tauri Command → Rust Logic → Filesystem
```

#### Key Design Patterns

- Infrastructure as code
- Plan & apply pattern
- Type safety
- Error boundaries

### Prerequisites

ohmyfs requires a modern development environment. Here's what's needed:

#### Required Software

| Component | Version | Purpose | Download |
|-----------|---------|---------|----------|
| **Node.js** | 22.0+ | JavaScript runtime & tooling | [nodejs.org](https://nodejs.org/) |
| **Bun** | 1.3.5+ | Fast package manager & runtime | [bun.sh](https://bun.sh/) |
| **Rust** | 1.92.0+ | Systems programming backend | [rustup.rs](https://rustup.rs/) |
| **Git** | 2.30+ | Version control | [git-scm.com](https://git-scm.com/) |

#### Platform-Specific Requirements

**Windows:**

- Windows 10 version 1903+ (build 18362+)
- Microsoft Visual C++ Build Tools 2019+
- Windows SDK (recommended)

**macOS:**

- macOS 10.15+ (Catalina or later)
- Xcode Command Line Tools: `xcode-select --install`

**Linux:**

- Ubuntu 18.04+, CentOS 7+, or equivalent
- Development libraries: `libwebkit2gtk-4.0-dev`, `build-essential`, `curl`, `wget`, `libappindicator3-dev`, `librsvg2-dev`

### Development Environment

The project uses a modern development stack with hot reloading and optimized builds:

- **Vite** - Fast development server with HMR
- **Tauri CLI** - Desktop app development tools
- **TypeScript** - Type checking and IntelliSense
- **Biome** - Lightning-fast linter and formatter
- **Ultracite** - Zero-config Biome preset for strict code quality

### Development Setup

Get ohmyfs running on your machine in minutes:

```bash
# 1. Clone the repository
git clone https://github.com/reliverse/ohmyfs.git
cd ohmyfs

# 2. Install dependencies (Bun is ~3x faster than npm/yarn)
bun install

# 3. Start development server (opens Tauri app automatically)
bun start

# 4. Build for production
bun run build

# 5. Create distributable packages for all platforms
bun release
```

### Quality Assurance

```bash
# Run the complete test suite
bun test

# Run tests in watch mode during development
bun test --watch

# Check code quality and formatting (Biome + Ultracite)
bun check

# Auto-fix formatting and linting issues
bun format

# Type checking
bun type-check
```

### Development Scripts

| Command | Description |
|---------|-------------|
| `bun start` | Start development server with hot reload |
| `bun build` | Vite-only build (no tauri) |
| `bun app:build` | Build distributables |
| `bun app:pub` | Build distributables AND bump files |
| `bun test` | Run test suite |
| `bun check` | Lint and format check |
| `bun format` | Auto-fix formatting issues |
| `bun type-check` | TypeScript type checking |
| `bun clean` | Clean build artifacts |
| `bun dev:frontend` | Run frontend-only development server |
| `bun dev:backend` | Run backend-only development mode |

### Project Structure

```bash
src/
├── components/
│   ├── filesystem-engine/  # Declarative filesystem engine UI
│   │   ├── filesystem-engine-manager.tsx
│   │   ├── structure-editor.tsx
│   │   ├── diff-viewer.tsx
│   │   └── execution-monitor.tsx
│   └── ui/                 # Shadcn/ui components (50+ components)
├── contexts/               # React contexts for state management
│   ├── auth-context.tsx    # Authentication state
│   └── file-manager-context.tsx # File operations state
├── hooks/                  # Custom React hooks
├── integrations/           # Third-party integrations
│   └── tanstack-query/     # Query client setup
├── orpc/                   # Type-safe API layer
│   ├── client.ts          # ORPC client configuration
│   ├── router/            # API route definitions
│   └── schema.ts          # Shared validation schemas
├── routes/                 # TanStack Router file-based routes
│   ├── __root.tsx         # Root layout with providers
│   ├── index.tsx          # Main file browser
│   ├── filesystem-engine.tsx # Declarative engine page
│   ├── auth.tsx           # Authentication page
│   └── settings.tsx       # Settings page
├── types/                  # TypeScript type definitions
│   ├── filesystem-engine.ts # Filesystem engine types
│   ├── file.ts            # File management types
│   └── mod.ts             # Module exports
├── utils/
│   ├── filesystem-engine/  # Core filesystem engine logic
│   │   ├── engine.ts       # Main orchestration
│   │   ├── evaluator.ts    # Definition resolution
│   │   ├── diff-engine.ts   # Change calculation
│   │   ├── planner-executor.ts # Execution planning
│   │   ├── ignore-rules.ts # Pattern matching
│   │   ├── safety.ts       # Security validations
│   │   └── __tests__/      # Unit tests
│   ├── compression.ts      # Archive operations
│   ├── file-system.ts      # File system utilities
│   └── color-variants.ts   # UI theming utilities
├── env.ts                 # Environment configuration (T3Env)
├── main.tsx               # React application entry point
├── router.tsx             # TanStack Router configuration
└── global.css             # Global styles and Tailwind imports

src-tauri/                 # Tauri Rust backend
├── src/
│   ├── main.rs           # Application entry point
│   └── lib.rs            # Core logic and Tauri commands
├── Cargo.toml            # Rust dependencies
└── tauri.conf.json       # Tauri configuration
```

## Contributing

We welcome contributions from developers of all skill levels! ohmyfs is an open-source project that thrives on community involvement.

### Ways to Contribute

- **Bug Reports**: Found a bug? [Open an issue](https://github.com/reliverse/ohmyfs/issues/new?template=bug_report.md)
- **Feature Requests**: Have an idea? [Start a discussion](https://github.com/reliverse/ohmyfs/discussions/categories/ideas)
- **Documentation**: Help improve docs, tutorials, or translations
- **UI/UX**: Design improvements or accessibility enhancements
- **Code**: Fix bugs, add features, or improve performance
- **Testing**: Write tests or help with quality assurance

### Development Workflow

1. **Fork** the repository on GitHub
2. **Clone** your fork locally: `git clone https://github.com/your-username/ohmyfs.git`
3. **Create** a feature branch: `git checkout -b feature/your-feature-name`
4. **Set up** development environment: `bun install && bun start`
5. **Make** your changes following our guidelines
6. **Test** thoroughly: `bun test && bun check`
7. **Commit** with clear messages: `git commit -m "feat: add amazing new feature"`
8. **Push** to your branch: `git push origin feature/your-feature-name`
9. **Open** a Pull Request with detailed description

### Contribution Guidelines

#### Code Quality

- **Follow Ultracite Standards**: Zero-config linting and formatting with Biome
- **Type Safety**: Full TypeScript coverage with strict type checking
- **Test Coverage**: Add tests for new features and bug fixes
- **Documentation**: Update docs for API changes and new features

#### Commit Convention

We use [Conventional Commits](https://conventionalcommits.org/):

```bash
# Features
git commit -m "feat: add cloud storage integration"

# Bug fixes
git commit -m "fix: resolve memory leak in thumbnail cache"

# Documentation
git commit -m "docs: update installation guide"

# Performance
git commit -m "perf: optimize virtual scrolling performance"
```

#### Platform Compatibility

- **Windows**: Test on Windows 10/11 (x64 and ARM64)
- **macOS**: Test on Intel and Apple Silicon Macs
- **Linux**: Test on Ubuntu, Fedora, and Arch Linux distributions

### Development Priorities

Help us prioritize development by contributing to these areas:

1. **Internationalization**: Add language support and translations
2. **Plugin System**: Extend functionality through plugins
3. **Cloud Integration**: Support for additional cloud storage providers
4. **Mobile Support**: Responsive design and touch optimizations
5. **Accessibility**: Screen reader support and keyboard navigation
6. **Analytics**: File usage statistics and performance insights

### Community

- **[Discussions](https://github.com/reliverse/ohmyfs/discussions)**: Ask questions and share ideas
- **[Issues](https://github.com/reliverse/ohmyfs/issues)**: Report bugs and request features
- **[Discord](https://discord.gg/ohmyfs)**: Real-time chat with maintainers and contributors

### Recognition

Contributors are recognized in:

- **CHANGELOG.md**: All contributors mentioned in release notes
- **Contributors file**: Listed in repository contributors
- **Hall of Fame**: Featured contributors on our website

Thank you for making ohmyfs better!

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Support & Community

### Getting Help

| Type | Resource | Best For |
|------|----------|----------|
| **Bug Reports** | [GitHub Issues](https://github.com/reliverse/ohmyfs/issues) | Technical problems and crashes |
| **Questions** | [GitHub Discussions](https://github.com/reliverse/ohmyfs/discussions) | General questions and how-tos |
| **Real-time Chat** | [Discord Server](https://discord.gg/ohmyfs) | Community discussion and support |
| **Email** | [support@bleverse.com](mailto:support@bleverse.com) | Business inquiries and partnerships |

### Resources

- **[Documentation](https://docs.bleverse.com)**: Comprehensive user and developer guides
- **[Video Tutorials](https://youtube.com/@ohmyfs)**: Step-by-step video guides
- **[Blog](https://blog.bleverse.com)**: Tips, tricks, and feature announcements
- **[Developer API](https://api.bleverse.com)**: Plugin development documentation

### Troubleshooting

#### Common Issues

**Application won't start:**

- Ensure you have the latest version from [Releases](https://github.com/reliverse/ohmyfs/releases)
- Check system requirements and available disk space
- Try running as administrator/sudo if permission errors occur

**Slow performance:**

- Clear thumbnail cache in settings
- Disable heavy previews for large directories
- Check available RAM and close other applications

**Filesystem Engine issues:**

- Verify JSON syntax with a validator
- Check file permissions on target directories
- Ensure basePath exists and is writable

#### Debug Mode

Enable debug logging for troubleshooting:

```bash
# Windows
set OHMYFS_DEBUG=true && ohmyfs.exe

# macOS/Linux
OHMYFS_DEBUG=true ./ohmyfs
```

### Enterprise Support

Need enterprise-grade support, custom features, or professional services?

- **Custom Development**: Tailored features and integrations
- **On-Premise Deployment**: Self-hosted solutions
- **Priority Support**: 24/7 technical assistance
- **Training**: Team training and workshops

Contact [hello@bleverse.com](mailto:hello@bleverse.com) for enterprise inquiries.

### Roadmap

Stay updated with our development roadmap:

- [Public Roadmap](https://github.com/reliverse/ohmyfs/projects/1)
- [Feature Voting](https://features.bleverse.com)
- [Release Schedule](https://github.com/reliverse/ohmyfs/milestones)
