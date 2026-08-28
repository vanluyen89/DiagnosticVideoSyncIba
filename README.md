# Diagnostic Video Sync Iba

Diagnostic Video Sync Iba is a browser-based diagnostic tool for viewing a video recording alongside an iba signal export on one synchronized timeline. It helps engineers correlate events in the recording with signal changes and find root causes faster.

Diagnostic Video Sync Iba project is not intended to replace ibaCapture.

ibaCapture is a powerful solution, but for cases where synchronized video and process signals are only needed occasionally, investing in a dedicated system can be difficult to justify.

Diagnostic Video Sync Iba is designed to fill that gap: a simple and practical way to capture and synchronize video with process data when needed, without the cost of purchasing a full ibaCapture system for something that may only be used a few times a year.

## Use online

You can use the application directly at [vdi.stickylychee.com](https://vdi.stickylychee.com).

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

If this project saves you time, you can support its development on [Ko-fi](https://ko-fi.com/vanluyen89).

## License

This project is licensed under the [MIT License](LICENSE).
