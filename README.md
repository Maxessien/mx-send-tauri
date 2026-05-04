# MxSend

A cross-platform, peer-to-peer file transfer application designed for local area networks (LAN). Built with Tauri to combine a high-performance Rust backend with a modern React frontend, providing seamless file sharing across Desktop (Windows, macOS, Linux) and Mobile (Android, iOS) platforms.

## Features

- **Cross-Platform Support**: Works on Windows, macOS, Linux, Android, and iOS
- **QR Code Pairing**: Easy device connection using QR codes for sharing connection details
- **Real-time Progress**: Live transfer progress updates via WebSocket connections
- **File Type Organization**: Automatic categorization into Audio, Video, Document, and Image folders
- **Secure Transfers**: Session-based authentication with unique UUID tokens
- **Duplicate Handling**: Smart file naming to prevent overwrites
- **No Internet Required**: Pure LAN-based transfers for privacy and speed

## Architecture

MxSend follows a decoupled architecture with three main layers:

### Frontend (React + TypeScript)
- Built with React 19, Vite, and TypeScript
- State management with Redux Toolkit and React Query
- UI components organized by file type tabs (Audio, Video, Document, Image, Transfers)

### Tauri IPC Bridge
- Commands for frontend-backend communication
- Event system for real-time updates
- Native plugins for storage access and safe area handling

### Rust Backend
- Axum web server for HTTP file transfers
- Socketioxide for WebSocket signaling 
- File system operations and network management

## Getting Started

### Prerequisites
- Node.js 20 or higher
- Rust stable toolchain
- For mobile: Android SDK/NDK or Xcode (iOS)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Maxessien/mx-send-tauri.git
   cd mx-send-tauri
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run tauri dev
   ```

### Building for Production

```bash
# Build for desktop
npm run tauri build

# Build for Android
npx tauri android build --apk

# Build for iOS (requires Apple Developer Account)
npx tauri ios build
```

## Usage

### As a Sender
1. Open MxSend and click "Send"
2. Select files from any category (Audio, Video, Documents, Images)
3. Click "Send" to start the server and display a QR code
4. The receiver scans the QR code to connect
5. Files transfer automatically with real-time progress updates

### As a Receiver
1. Open MxSend and click "Receive"
2. Scan the sender's QR code
3. Browse available files and select what to download
4. Files are organized by type in your downloads folder

## Development

### Project Structure
```
mx-send-tauri/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── hooks/             # Custom React hooks
│   ├── store-slices/      # Redux state management
│   └── types/             # TypeScript definitions
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── commands.rs    # Tauri command handlers
│   │   ├── axum.rs        # HTTP server setup
│   │   ├── handler.rs     # Request handlers
│   │   ├── websocket.rs   # WebSocket signaling
│   │   └── file_types.rs  # File utilities
│   └── Cargo.toml         # Rust dependencies
└── package.json           # Node.js dependencies
```

### Key Commands
- `npm run dev` - Start development server
- `npm run build` - Build frontend for production
- `npm run tauri dev` - Run Tauri in development mode
- `npm run tauri build` - Build Tauri application

## Technical Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Redux Toolkit** - State management
- **React Query** - Server state synchronization
- **Tailwind CSS** - Styling
- **Socket.io Client** - Real-time communication

### Backend
- **Rust** - Systems programming language
- **Tauri 2** - Cross-platform framework
- **Axum** - Web framework
- **Tokio** - Async runtime
- **Socketioxide** - WebSocket implementation
- **UUID** - Unique identifier generation

### Mobile Support
- **Android NDK** - Native Android development
- **iOS Support** - Requires Apple Developer Account

## Releases

Automated releases are handled via GitHub Actions:

- **Desktop**: Windows, macOS, Linux binaries
- **Android**: APK files for various architectures
- **iOS**: IPA files (with proper code signing setup)

## Security

- Session-based authentication using UUID tokens
- File access whitelisting via `AllowedFileList` 
- Path sanitization to prevent directory traversal
- CORS configuration for secure frontend-backend communication

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## Notes

The README is based on the current codebase structure and configuration files. The application uses a sender-receiver model where one device hosts a temporary server and others connect to it for file transfers. All communication happens within the local network, ensuring privacy and fast transfer speeds.
