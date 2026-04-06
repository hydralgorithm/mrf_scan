# MRF Scan: Pneumonia X-ray Analysis Dashboard

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-API-green)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-purple)](https://vitejs.dev/)

MRF Scan is an open-source project for chest X-ray classification with a clinical dashboard.
It combines:

- FastAPI + TensorFlow backend for inference
- React + TypeScript frontend for analysis and triage workflow
- GradCAM overlay generation for model explainability
- CURB-65 based severity support and triage queue UI

This repository is intended for research, experimentation, and educational use.

## What The App Does

- Upload a chest X-ray and classify into:
  - NORMAL
  - BACTERIAL_PNEUMONIA
  - VIRAL_PNEUMONIA
- Return confidence and class probabilities from the model
- Generate and display a blended GradCAM overlay for each uploaded image
- Collect CURB-65 inputs and compute a combined severity score
- Add analyzed cases into a browser-based triage queue

## Tech Stack

### Backend

- Python
- FastAPI
- Uvicorn
- TensorFlow / Keras
- OpenCV

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Axios

## Repository Layout

```text
pneumonia_ai/
  app/dashboard/               # React frontend
  src/api/main.py             # FastAPI entrypoint
  src/data/                   # Data loaders and preprocessing
  src/explainability/         # GradCAM utilities
  src/inference/              # Inference and severity helpers
  src/models/                 # Training/eval scripts
  models/                     # Model files and metadata
  docs/                       # Additional docs
```

## Local Setup

### 1. Clone

```bash
git clone https://github.com/hydralgorithm/mrf_scan.git
cd mrf_scan
```

### 2. Python environment

```bash
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Linux/macOS:

```bash
source .venv/bin/activate
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

### 3. Frontend dependencies

```bash
cd app/dashboard
npm install
cd ../..
```

### 4. Dataset and model files

- This repo intentionally does not track full training data in Git.
- If `data.zip` is present, extract it at repository root.
- Ensure model artifacts are available under `models/final/`.

## Running The App

Run backend and frontend in separate terminals.

### Terminal A: Backend

```powershell
Set-Location "C:\path\to\pneumonia_ai"
.\.venv\Scripts\Activate.ps1
python src/api/main.py
```

Alternative backend command:

```powershell
python -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal B: Frontend

```powershell
Set-Location "C:\path\to\pneumonia_ai\app\dashboard"
npm run dev
```

Open:

- Frontend: `http://localhost:5173`
- API docs: `http://localhost:8000/docs`
- Health endpoint: `http://localhost:8000/health`

## API Summary

### `POST /predict`

Multipart form upload with key `file`.

Returns JSON including:

- `classification`
- `confidence`
- `probabilities`
- `base_severity`
- `class_index`
- `gradcam_overlay` (base64 data URL, when available)
- `gradcam_error` (null or error message)

### `GET /health`

Returns server/model status and active profile info.

## Frontend Configuration

The frontend API base URL is controlled via `VITE_API_URL`.

- If `VITE_API_URL` is not set, it defaults to `http://localhost:8000`.
- File reference: [app/dashboard/src/services/api.ts](app/dashboard/src/services/api.ts)

## Deploying Frontend To Vercel (While Backend Is Local)

If you want to deploy only frontend and keep backend on your PC:

1. Run backend locally on port `8000`
2. Expose backend with a tunnel (for example Cloudflare Tunnel)
3. Set Vercel environment variable:
   - `VITE_API_URL=https://your-tunnel-url`

Important: if backend or tunnel stops, deployed frontend API requests will fail until restarted.

## Current Notes / Limitations

- Triage queue data is stored in browser localStorage (client-side only).
- CURB-65 support is decision-aid style and not a replacement for clinical judgment.
- Model and thresholds are under active iteration.

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Make changes with tests/build checks where possible
4. Open a PR with a clear summary

## License

No license file is currently included in this repository.
If you plan to open-source publicly, add a `LICENSE` file (MIT is a common choice).

## Medical Disclaimer

This project is for research and educational use only.
It is not a medical device and must not be used as a sole basis for diagnosis or treatment decisions.
