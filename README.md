# Simple Image Uploader

Small Vite + React app to upload an image and POST it to the provided Google Apps Script endpoint.

Quick start (Windows PowerShell):

```powershell
cd c:\Users\Jaywinner\Documents\apps\simple-image-app
npm install
npm run dev
```

Open the URL printed by Vite (usually http://localhost:5173) and use the UI to pick an image and send it to the model.

Important notes
- The endpoint URL must be configured to accept cross-origin requests (deployed as "Anyone, even anonymous") for browser fetch to work.
- The app first attempts to POST the file as multipart/form-data (field name `file`). If that fails it will try a JSON POST with a base64 data URL in the `image` field as a fallback.

If you prefer a server-side proxy to avoid CORS and hide the endpoint, create a tiny Express server that accepts uploads and forwards them.
