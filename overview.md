# Darc Browser - Developer Overview

## Quick Start

Want to jump right in? Here's the fastest way to get started:

```bash
# Clone and setup
git clone https://github.com/scottjenson/xe-darc.git
cd xe-darc

# Install dependencies (requires pnpm 10.13.1)
pnpm install

# Generate SSL certificates
cd certs && bash create.sh && cd ..

# Start dev server (opens https://localhost:5194)
pnpm run dev

# Optional: Start AI agent server in another terminal
pnpm run dev:agent
```

That's it! Read on for detailed documentation.

## Table of Contents

- [Quick Start](#quick-start)
- [Project Introduction](#project-introduction)
- [Key Features](#key-features)
- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
- [Key Development Concepts](#key-development-concepts)
- [Testing](#testing)
- [Security Features](#security-features)
- [AI Agent Integration](#ai-agent-integration)
- [Development Workflow](#development-workflow)
- [Configuration Files](#configuration-files)
- [Performance Considerations](#performance-considerations)
- [Browser Compatibility](#browser-compatibility)
- [Contributing Guidelines](#contributing-guidelines)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment)
- [Resources](#resources)
- [Project Status](#project-status)

## Project Introduction

Darc is an **experimental next-generation browser** built on Xenon and Svelte that combines cutting-edge browser UI concepts from Arc, stacked browsing, and agentic browsers. This project focuses purely on UI innovation and advanced browser features without compromise on resource usage.

**⚠️ Warning**: Do not use on origins you don't fully trust as the focus is purely on UI concepts until a v.1 release.

**Resource Expectations**: Darc is designed for maximum UX without resource constraints:
- 10s to 100s of MB per day of usage
- 2GB+ memory on fresh start
- Features like full-blown embedded Elasticsearch and screenshot-based browsing history

## Key Features

### Browser UI Innovations
- **Stacked Browsing**: Revolutionary tab stacking and organization
- **Pinned Frames**: Pin tabs to left or right sides with resizable panes
- **Grid/Tile View**: Zoom out to see all tabs in a grid layout
- **Canvas Mode**: Embedded Excalidraw for visual collaboration
- **Tab Sidebar**: Collapsible sidebar for tab management
- **Focus Mode**: Hide UI elements for immersive browsing

### Advanced Capabilities
- **AI Agent Integration**: Voice-activated agent with Anthropic Claude
- **User Mods**: Custom CSS/JavaScript injection per site
- **DevTools Integration**: Built-in developer tools sidebar
- **Resources Panel**: Track and monitor page resources
- **Activity Tracking**: Browse history and activity logs
- **Controlled Frame API**: Advanced iframe control and security

### Developer Features
- **Dev Mode**: Enable developer-specific features
- **Test Suite**: Built-in testing framework
- **Status Lights**: Visual indicators for network/permissions
- **Certificate Monitor**: Track SSL/TLS certificates
- **Screenshot History**: Navigate through browsing history visually

## Architecture Overview

### Frontend Stack
```
┌─────────────────────────────────────┐
│         Svelte 5 Application        │
├─────────────────────────────────────┤
│  Components (TabSidebar, Frame,     │
│   Settings, Agent, Excalidraw...)   │
├─────────────────────────────────────┤
│    Data Layer (PouchDB/IndexedDB)   │
├─────────────────────────────────────┤
│         Tailwind CSS 4.x            │
└─────────────────────────────────────┘
```

### Backend Services
```
┌─────────────────────────────────────┐
│    Cloudflare Workers (workerd/)    │
├─────────────────────────────────────┤
│  - AI Agent Runtime (agent.ts)      │
│  - Tool Handlers (tool-handlers.ts) │
│  - CDP Proxy (cdp-proxy.ts)         │
└─────────────────────────────────────┘
```

### Data Architecture
- **PouchDB**: Local-first database with IndexedDB adapter
- **Reactive State**: Svelte 5 runes for reactive data management
- **Document Model**: Tabs, spaces, and settings stored as documents
- **Sync Support**: Optional CouchDB sync server integration

## Technology Stack

### Core Dependencies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Svelte** | 5.34.8 | Reactive UI framework |
| **Vite** | 6.3.5 | Build tool and dev server |
| **Tailwind CSS** | 4.1.10 | Utility-first CSS framework |
| **PouchDB** | 9.0.0 | Local database with IndexedDB |
| **Excalidraw** | 0.18.0 | Embedded drawing tool |
| **Three.js** | 0.177.0 | 3D graphics library |
| **React** | 18.3.1 | For Excalidraw integration |

### AI & Backend
| Technology | Purpose |
|------------|---------|
| **@ai-sdk/anthropic** | Anthropic Claude integration |
| **ai** | Vercel AI SDK for streaming |
| **Wrangler** | Cloudflare Workers development |
| **@elevenlabs/client** | Voice synthesis |

### Build Tools
| Technology | Purpose |
|------------|---------|
| **@sveltejs/vite-plugin-svelte** | Svelte support in Vite |
| **@tailwindcss/vite** | Tailwind CSS integration |
| **@cloudflare/vite-plugin** | Cloudflare Workers integration |
| **rollup-plugin-webbundle** | Web Bundle support |

## Development Setup

### Prerequisites

- **Node.js**: >= 23.0.0 (v20+ may work with warnings)
- **pnpm**: 10.13.1
- **OpenSSL**: For generating development certificates

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/scottjenson/xe-darc.git
   cd xe-darc
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Generate SSL certificates** (required for HTTPS dev server)
   ```bash
   cd certs
   bash create.sh
   cd ..
   ```

4. **Start development server**
   ```bash
   pnpm run dev
   ```
   
   The dev server will start on `https://localhost:5194`

5. **Start AI agent server** (optional)
   ```bash
   pnpm run dev:agent
   ```
   
   The agent server runs on `http://localhost:8787`

### Shared Development Environment

The project supports a detached session for collaborative development:

```bash
# Check if dtach session exists
ls -la ./dtach/darc 2>/dev/null && echo "Session exists" || echo "No session found"

# Attach to existing session (Ctrl+\ to detach)
dtach -a ./dtach/darc

# Create new session
dtach -c ./dtach/darc npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start Vite dev server on port 5194 |
| `pnpm run dev:agent` | Start Cloudflare Workers agent server |
| `pnpm run build` | Build for production |
| `pnpm run preview` | Preview production build |
| `pnpm run bump-version` | Increment version number |

## Project Structure

```
xe-darc/
├── app/                      # Main Svelte application
│   ├── components/          # Svelte components
│   │   ├── Frame.svelte    # Main frame rendering
│   │   ├── TabSidebar.svelte  # Tab management UI
│   │   ├── Agent.svelte    # AI agent interface
│   │   ├── Settings.svelte # Settings panel
│   │   └── ...             # Other components
│   ├── lib/                 # Utility libraries
│   ├── App.svelte           # Root application component
│   ├── data.svelte.js      # Reactive data store
│   ├── main.js             # Application entry point
│   └── bootstrap.js        # Bootstrap logic
│
├── workerd/                 # Cloudflare Workers backend
│   ├── worker.ts           # Main worker entry
│   ├── agent.ts            # AI agent runtime
│   ├── tool-handlers.ts    # Agent tool implementations
│   ├── cdp-proxy.ts        # Chrome DevTools Protocol proxy
│   └── shared.ts           # Shared type definitions
│
├── public/                  # Static assets
│   ├── translations/       # i18n translation files
│   ├── icons/              # Application icons
│   └── manifest.webmanifest  # PWA manifest
│
├── tests/                   # Test files
│   ├── main.js             # Test runner
│   └── tab-sidebar.js      # Tab sidebar tests
│
├── functions/               # Edge functions
│   └── couchdb-proxy/      # CouchDB sync proxy
│
├── certs/                   # SSL certificates
│   └── create.sh           # Certificate generation script
│
├── vite.config.js          # Vite configuration
├── svelte.config.js        # Svelte configuration
├── wrangler.jsonc          # Cloudflare Workers config
├── package.json            # Dependencies and scripts
└── README.md               # Basic project info
```

## Core Components

### App.svelte
The root application component that orchestrates all UI elements:
- Tab management and navigation
- Sidebar state management
- Keyboard shortcuts
- Gesture handling
- Frame lifecycle management

### Frame.svelte / ControlledFrame.svelte
Renders individual browser frames (tabs):
- Implements Controlled Frame API when available
- Falls back to iframe when not available
- Handles user mods (CSS/JS injection)
- Manages frame lifecycle and visibility
- Integrates with CDP for debugging

### TabSidebar.svelte
Collapsible sidebar for tab management:
- Tab list with drag-and-drop reordering
- Tab preview on hover
- Quick navigation controls
- Apps launcher
- Space indicator

### data.svelte.js
Reactive data store using Svelte 5 runes:
- PouchDB integration for persistence
- Tab and space management
- Settings management
- Bootstrap data loading
- Conflict resolution

### Settings.svelte
Comprehensive settings panel:
- Search engine configuration
- New tab URL customization
- AI provider selection
- Sync server settings
- UI preferences

## Key Development Concepts

### Spaces
Spaces are isolated collections of tabs:
- Each space has its own tab set
- Switch between spaces with navigation
- Persist across sessions
- Support for active space tracking

### Pinned Tabs
Tabs can be pinned to left or right sides:
- Resizable pinned panes
- Independent of main tab scroll
- Persistent across sessions
- Toggleable visibility

### View Modes
Multiple view modes for different workflows:
- **Default**: Standard horizontal scrolling tabs
- **Tile**: Grid view of all tabs
- **Canvas**: Excalidraw drawing canvas

### User Mods
Custom modifications per site:
- CSS injection for styling
- JavaScript injection for functionality
- Site-specific matching patterns
- Enable/disable per mod
- SHA-256 hash tracking for changes

### Controlled Frame API
Advanced iframe capabilities:
- Tab isolation and sandboxing
- Custom navigation controls
- Keyboard event interception
- Audio muting controls
- Content security enhancements

## Testing

### In-Browser Testing
Located in `/app/lib/inBrowserTesting.js`:
- Test framework for browser environment
- Component-level tests
- Integration tests

### Test Suites
- **Main Test Runner**: `/tests/main.js`
- **Tab Sidebar Tests**: `/tests/tab-sidebar.js`

### Running Tests
Enable Dev Mode in the settings menu to access the test suite:
1. Click settings icon (top right)
2. Enable "Dev Mode"
3. Click dev menu icon
4. Select "Open Test Suite"

## Security Features

### Trusted Types
Full CSP compatibility with trusted types policy:
- XSS prevention
- Safe DOM manipulation
- Content security enforcement

### Isolated Web App
Implements IWA protocol:
- Enhanced isolation boundaries
- Controlled Frame API support
- Origin isolation
- Service worker integration

### Certificate Monitoring
Track SSL/TLS certificates:
- Certificate validation
- Expiration warnings
- Chain verification
- Per-tab certificate info

## AI Agent Integration

### Voice Agent
Voice-activated AI assistant:
- Anthropic Claude integration
- Streaming responses
- Tool calling support
- ElevenLabs voice synthesis

### Agent Tools
Available tools for the AI agent:
- Browser control
- Tab management
- Content extraction
- Navigation assistance

### Agent Configuration
Configure in Settings:
- AI provider selection
- API key management
- Model selection
- Tool permissions

## Development Workflow

### Hot Module Replacement
Vite provides fast HMR for rapid development:
- Component-level updates
- State preservation
- CSS updates without reload

### Browser Extension Development
Dev mode enables:
- Extension-like controlled frames
- Browser API testing
- CDP integration
- DevTools access

### Multi-Environment Support
The project supports multiple deployment targets:
- **Standard Web App**: Vite dev server
- **Cloudflare Workers**: Edge runtime
- **Isolated Web App**: Chrome IWA protocol
- **Service Worker**: Offline functionality

## Configuration Files

### vite.config.js
- Custom plugins for link color patching
- HTML injection plugin
- HTTPS dev server configuration
- Proxy configuration for agents and DevTools
- CORS and security headers
- Web bundle support (commented)

### svelte.config.js
- Svelte compiler options
- Preprocessor configuration

### wrangler.jsonc
- Cloudflare Workers configuration
- Agent runtime settings
- Environment variables

### tailwind.config.js
- Tailwind CSS customization
- Color scheme
- Typography settings

## Performance Considerations

### Resource Usage
Darc prioritizes UX over resource efficiency:
- Multiple iframe/controlled frames active simultaneously
- Screenshot storage for tab previews
- Full Excalidraw instance
- PouchDB indexes
- Real-time reactive updates

### Optimization Opportunities
While not the current focus, areas for future optimization:
- Tab hibernation (already implemented)
- Lazy loading of components
- Virtual scrolling for large tab lists
- Chunk size optimization
- Service worker caching

## Browser Compatibility

### Primary Target
Chrome/Chromium browsers with:
- Controlled Frame API support
- Isolated Web App support
- Modern JavaScript features
- WebAuthn support

### Fallback Support
Falls back gracefully when:
- Controlled Frame API unavailable (uses iframe)
- IWA not supported (standard web app mode)
- Older Chrome versions (with warnings)

## Contributing Guidelines

### Code Style
- Follow existing Svelte conventions
- Use Tailwind CSS for styling
- Prefer reactive statements over manual updates
- Comment complex logic
- Use TypeScript for backend code

### Making Changes
1. Create a feature branch
2. Make focused, incremental changes
3. Test in Dev Mode
4. Build production to verify
5. Submit pull request with clear description

### Areas for Contribution
- UI/UX improvements
- New user mods
- Agent tools
- Test coverage
- Documentation
- Bug fixes
- Performance optimizations

## Troubleshooting

### Common Issues

**Build fails with certificate error**
```bash
cd certs && bash create.sh
```

**Node version mismatch**
- Project requires Node 23+
- May work with 20+ but shows warnings
- Use nvm to switch versions: `nvm use 23`

**Port already in use**
- Dev server uses port 5194
- Agent server uses port 8787
- Change in `vite.config.js` or `wrangler.jsonc`

**Dependencies installation fails**
```bash
pnpm install --force
```

**Controlled Frame not available**
- Enable Chrome flag: `chrome://flags/#isolated-web-app-controlled-frame`
- Or run as Isolated Web App
- Falls back to iframe automatically

## Deployment

### Production Build
```bash
pnpm run build
```

Generates optimized bundles in `dist/`:
- `main.html` - Main application entry
- `agent_app.html` - Agent interface
- Chunked assets for optimal loading

### Isolated Web App
The project can be packaged as an IWA:
1. Build with web bundle support (uncomment in vite.config.js)
2. Sign with web bundle key
3. Install in Chrome as IWA

### Cloudflare Workers
Deploy agent runtime:
```bash
cd workerd
wrangler deploy
```

## Resources

### Project Documentation
- **permissions.md**: Browser permissions configuration reference
- **CLAUDE.md**: AI assistant guidance for code development
- **todo.md**: Roadmap and planned features
- **README.md**: Quick project introduction

### External Documentation
- **Controlled Frame API**: https://wicg.github.io/controlled-frame
- **Svelte 5**: https://svelte.dev/docs/svelte/overview
- **Vite**: https://vite.dev/
- **PouchDB**: https://pouchdb.com/
- **Tailwind CSS**: https://tailwindcss.com/

### Related Projects
- **Arc Browser**: Inspiration for UI concepts
- **Agregore**: P2P browser with overlapping features
- **Xenon**: Base technology for browser frame management

## Project Status

**Current Phase**: Experimental/Alpha
- Focus: UI innovation and feature exploration
- Not production-ready for untrusted origins
- Active development with frequent changes
- Resource usage not optimized

**Future Goals** (from todo.md):
- IWA followups and missing features
- Extension support
- uBlock Origin core integration
- Keyboard and media key support
- Build system for GitHub releases
- YouTube/social media embeds
- Link preview system

## License

This project is licensed under the Apache License, Version 2.0. See source files for copyright notices.

## Getting Help

- **Issues**: Check existing issues on GitHub
- **Dev Mode**: Enable for debugging features
- **Console**: Check browser console for errors
- **Status Lights**: Visual indicators for system status

---

**Last Updated**: November 2024

This overview is based on project version 0.1.0. As Darc is experimental and rapidly evolving, some details may change. Refer to the codebase and CLAUDE.md for the most current information.
