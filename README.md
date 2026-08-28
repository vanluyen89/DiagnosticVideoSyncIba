# Diagnostic Video Sync Iba

Diagnostic Video Sync Iba is a browser-based diagnostic tool for viewing a video recording alongside an iba signal export on one synchronized timeline. It helps engineers correlate events in the recording with signal changes and find root causes faster.

## Features

- Load MP4 or MOV video recordings.
- Load iba signal exports in CSV or TXT format.
- Play video and signal data on a synchronized timeline.
- Inspect signal values and add diagnostic markers.
- Convert unsupported HEVC video to H.264 in the browser with FFmpeg WebAssembly.

## Privacy

Privacy is built into the application:

- All files are processed locally in your browser.
- Files are never uploaded to a server.
- The server does not store your video, signal data, or diagnostic results.
- The project is open source, so its behavior can be inspected and verified.

## Run locally

Requirements: Node.js and npm.

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

## Support

If this project saves you time, you can support its development on [Buy Me a Coffee](https://buymeacoffee.com/vanluyen89).

## License

This project is licensed under the [MIT License](LICENSE).
