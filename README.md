# ohmyfs

A modern, fast, and powerful file manager for Windows, macOS, and Linux with an optional **declarative filesystem management** feature (define your filesystem structures as code and apply them safely).

## Powerful Features

### Performance & Scalability

- **Virtual Scrolling**: Handle directories with 1000+ files without performance degradation
- **Lazy Loading**: Intelligent loading patterns for thumbnails and previews
- **Background Operations**: Non-blocking file operations with progress tracking
- **Memory Optimization**: Efficient resource management for large file sets
- **Performance Monitoring**: Built-in metrics for development and debugging

### Advanced Search & Discovery

- **Fuzzy Search**: Intelligent file finding with fuzzy matching algorithms
- **Advanced Filters**: Filter by file type, size ranges, modification dates, and paths
- **Regex Support**: Powerful pattern matching for complex searches
- **Deep Search**: Recursively search through subdirectories and archives
- **Search History**: Persistent search queries with quick access

### Archive & Compression

- **ZIP Compression**: Full ZIP archive creation with configurable compression levels (0-9)
- **Archive Extraction**: Extract ZIP files with progress tracking and error handling
- **Archive Preview**: View archive contents before extraction
- **Batch Compression**: Compress multiple files and directories into single archives
- **Compression Analytics**: Size reduction metrics and compression ratios

### Batch Operations Engine

- **Bulk Rename**: Advanced find-and-replace with regex pattern matching
- **Batch Copy/Move**: Process multiple files with destination validation
- **Mass Delete**: Safe bulk deletion with confirmation dialogs
- **Pattern-Based Operations**: Apply transformations to file names and properties
- **Operation Preview**: See changes before execution with live preview

### Intelligent File Preview

- **Image Previews**: High-quality image display with lazy loading
- **Text File Viewer**: Syntax-aware preview for code and documents (10KB limit)
- **Archive Contents**: Browse ZIP file contents without extraction
- **Format Detection**: Automatic file type recognition and appropriate viewers
- **Quick Preview**: Instant file information on hover and selection

### Professional Keyboard Interface

- **Complete Shortcuts**: Full keyboard navigation matching professional file managers
- **Customizable Hotkeys**: User-configurable keyboard shortcuts
- **Multi-Selection**: Advanced selection with Ctrl, Shift, and range selection
- **Context-Aware**: Smart shortcuts that adapt to current context
- **Accessibility**: Screen reader support and keyboard-only operation

### Smart Organization

- **Favorites System**: Bookmark frequently accessed directories
- **Recent Files**: Automatic tracking of recently opened locations
- **Quick Access Sidebar**: Instant navigation to system folders and favorites
- **Breadcrumb Navigation**: Visual path representation with clickable segments
- **Directory Tree**: Expandable folder hierarchy with lazy loading

### Modern User Interface

- **Cross-Platform Design**: Consistent experience across Windows, macOS, and Linux
- **Dark/Light Themes**: Multiple theme options with system preference detection
- **Responsive Layout**: Adapts to different window sizes and screen resolutions
- **Context Menus**: Right-click menus with context-aware options
- **Drag & Drop Ready**: Infrastructure prepared for drag-and-drop operations

### Advanced File Operations

- **Clipboard Management**: Persistent clipboard with cut/copy/paste operations
- **Undo/Redo System**: Operation history with selective undo capabilities
- **Progress Tracking**: Real-time progress for all file operations
- **Error Recovery**: Graceful error handling with detailed error messages
- **Operation Queue**: Manage multiple concurrent file operations

### Declarative Filesystem Engine

- **Infrastructure as Code**: Define filesystem structures declaratively with JSON/TypeScript configs
- **Variable Substitution**: Dynamic content generation with `{{variableName}}` templating
- **Plan & Apply Pattern**: Preview changes before execution with full transparency
- **Safety First**: Built-in protections against destructive operations and system file modifications
- **Ignore Rules**: .gitignore-style pattern matching for flexible exclusions
- **Cross-Platform**: Consistent behavior across Windows, macOS, and Linux
- **Rollback Support**: Framework for undoing applied changes
- **Visual Editor**: Interactive tree editor for creating and modifying structures
- **Type Safety**: Full TypeScript support with Zod validation schemas
- **Execution Monitoring**: Real-time progress tracking with detailed logging

## Installation

### Download

Download the latest release for your platform from the [Releases](https://github.com/blefnk/ohmyfs/releases) page.

### System Requirements

- Windows 10+ (64-bit) / macOS 10.15+ / Ubuntu 18.04+
- 4GB RAM minimum, 8GB recommended
- 500MB free disk space

## Usage

### Getting Started

1. Launch ohmyfs
2. The app opens in your home directory by default
3. Use the sidebar to navigate between locations or access the **Filesystem Engine** for declarative management
4. Double-click folders to open them, or define entire project structures as code

### File Operations

- **Copy**: Select files and press `Ctrl+C`, then `Ctrl+V` to paste
- **Move**: Select files and press `Ctrl+X`, then `Ctrl+V` to move
- **Delete**: Select files and press `Delete` key
- **Rename**: Select a file and press `F2`

### Search

1. Click the search button in the toolbar
2. Enter your search terms
3. Use filters to narrow results by file type, size, or date
4. Double-click results to navigate to files

### Compression

- Right-click files and select "Compress" to create ZIP archives
- Right-click ZIP files and select "Extract Here" to unzip
- Configure compression level and options in the dialog

### Batch Operations

1. Select multiple files (hold `Ctrl` to select individual files)
2. Click the batch operations button in the toolbar
3. Choose operation type (rename, copy, move, delete)
4. Configure options and preview changes
5. Execute the operation

### Filesystem Engine

The Filesystem Engine allows you to define, preview, and apply filesystem structures declaratively:

1. **Access the Engine**: Click "Filesystem Engine" in the sidebar
2. **Create Structure**: Use the visual editor to define directories, files, and variables
3. **Generate Plan**: Click "Generate Diff" to compare desired vs actual filesystem state
4. **Review Changes**: Examine the detailed change list with safety assessments and warnings
5. **Apply Changes**: Execute the plan with real-time progress tracking and rollback support

**Example Structure Definition:**

```json
{
  "name": "Node.js Project",
  "basePath": "/projects/my-app",
  "variables": [
    { "name": "projectName", "type": "string", "defaultValue": "my-app" }
  ],
  "structure": [
    {
      "type": "file",
      "name": "package.json",
      "content": {
        "content": "{ \"name\": \"{{projectName}}\", \"version\": \"1.0.0\" }"
      }
    },
    {
      "type": "directory",
      "name": "src",
      "children": [
        { "type": "file", "name": "index.js" }
      ]
    }
  ],
  "ignorePatterns": ["node_modules/", "*.log"]
}
```

### Keyboard Shortcuts

| Shortcut    | Action                    |
|-------------|---------------------------|
| `Ctrl+A`    | Select all files          |
| `Ctrl+C`    | Copy selected files       |
| `Ctrl+X`    | Cut selected files        |
| `Ctrl+V`    | Paste files               |
| `Delete`    | Delete selected files     |
| `F2`        | Rename selected file      |
| `Enter`     | Open selected file/folder |
| `Backspace` | Go to parent directory    |
| `Escape`    | Clear selection           |

## Settings

Access settings through the gear icon to customize:

- **View Options**: File display mode, hidden files, thumbnails
- **Behavior**: Confirm delete, auto-refresh, keyboard shortcuts
- **Appearance**: Theme selection, language preferences
- **Performance**: Thumbnail size, refresh intervals

## Development

### Technology Stack

#### Frontend

- **React 19** - Modern React with concurrent features
- **TypeScript** - Type-safe development
- **TanStack Router** - Type-safe routing with file-based routing
- **TanStack Query** - Powerful data fetching and caching
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Beautiful, accessible UI components
- **Biome** - Fast linter and formatter (Ultracite preset)
- **Vite** - Fast build tool and dev server

#### Backend

- **Tauri 2** - Cross-platform desktop app framework
- **Rust** - High-performance systems programming
- **ORPC** - Type-safe API communication layer

#### Key Libraries

- **@tauri-apps/api** - Tauri API bindings
- **@tanstack/react-virtual** - Virtual scrolling for performance
- **fuse.js** - Fuzzy search implementation
- **jszip** - Archive compression/decompression
- **lucide-react** - Beautiful icons
- **zod** - Runtime type validation

### API Architecture

**ORPC (Object Remote Procedure Call)** provides type-safe communication between the React frontend and Rust backend:

- **Type Safety**: End-to-end type safety with automatic TypeScript generation
- **Schema Validation**: Runtime validation using Zod schemas
- **TanStack Query Integration**: Seamless data fetching with caching and optimistic updates
- **Error Handling**: Structured error types with detailed error messages

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

ohmyfs follows a modern full-stack architecture:

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

- **Infrastructure as Code**: Declarative filesystem definitions
- **Plan & Apply**: Preview-before-execute for safe operations
- **Type Safety**: End-to-end TypeScript/Rust type checking
- **Error Boundaries**: Graceful error handling at all levels

### Recommended Prerequisites

- **node 22+** - JavaScript runtime
- **bun 1.3.5+** - Package manager, tests, script runner, etc
- **rustup 1.28.2+ & rustc 1.92.0+** - Systems programming language for Tauri backend

### Development Environment

The project uses a modern development stack with hot reloading and optimized builds:

- **Vite** - Fast development server with HMR
- **Tauri CLI** - Desktop app development tools
- **TypeScript** - Type checking and IntelliSense
- **Biome** - Lightning-fast linter and formatter
- **Ultracite** - Zero-config Biome preset for strict code quality

### Setup

```bash
# Clone the repository
git clone https://github.com/blefnk/ohmyfs.git
cd ohmyfs

# Install deps
bun install

# Start development server (opens Tauri app)
bun start

# Build for production
bun run build

# Create distributable packages
bun release

# Run tests
bun tests

# Check code quality
bun check
```

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

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'add new amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Guidelines

- Follow the existing code style
- Add tests for complex features
- Update documentation as needed
- Ensure cross-platform compatibility

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Support

- [GitHub Issues](https://github.com/blefnk/ohmyfs/issues) for bug reports
- [Discussions](https://github.com/blefnk/ohmyfs/discussions) for questions

## Changelog

### v0.1.0

- **Initial Release** with modern React 19 and Tauri 2 architecture
- **File Management**: Complete file browser with navigation, operations, and search
- **Performance**: Virtual scrolling, lazy loading, and memory optimization
- **Compression**: ZIP archive creation/extraction with progress tracking
- **Batch Operations**: Bulk rename, copy, move with preview and validation
- **UI/UX**: Dark/light themes, responsive design, keyboard shortcuts
- **Cross-Platform**: Native Windows, macOS, and Linux applications
- **Declarative Filesystem Engine**:
  - Define filesystem structures as code with JSON/TypeScript configs
  - Plan & Apply pattern with full change preview and safety checks
  - Variable substitution with `{{variableName}}` templating
  - Visual structure editor with tree visualization
  - Safety validations and critical path protection
  - Ignore rules with .gitignore-style pattern matching
  - Execution monitoring with rollback framework
  - Type-safe API with ORPC and Zod validation
- **Development Experience**: Hot reloading, Biome linting, TypeScript support
