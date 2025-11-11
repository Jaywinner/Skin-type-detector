# Build frontend and run Flask app (Windows PowerShell)
cd $PSScriptRoot\frontend
npm install
npm run build

cd $PSScriptRoot
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
