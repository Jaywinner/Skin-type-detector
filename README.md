# Techefiko Task — Packaged Skin Awareness App

This folder contains a small Flask app that serves the React + TFJS frontend. The front-end runs the Teachable Machine model locally in the browser (no server-side ML required).

Quick setup (Windows PowerShell):

1. Build the frontend:

```powershell
cd C:\Users\Jaywinner\Documents\apps\techefiko_task\frontend
npm install
npm run build
```

2. Create and activate a Python venv, install server deps, and run the Flask app:

```powershell
cd C:\Users\Jaywinner\Documents\apps\techefiko_task
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Open http://localhost:5000 in your browser. The site will serve the built frontend (`frontend/dist`) if present; otherwise it serves the development frontend source directly (useful for testing without a build).

Notes
- The TFJS model files are included in `frontend/tm-my-image-model` so the browser can load them directly.
- The Flask server acts only as a static file server in this packaging — the ML runs locally in the browser for privacy and ease of deployment.
