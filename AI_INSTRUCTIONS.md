# AI Instructions for Project Setup

This document provides the current setup and run instructions for the Pneumonia Severity Assessment project.

## Step 1: Prepare Dataset

If `data.zip` is present, extract it into the project root so the resulting structure includes `data/raw/...`.

## Step 2: Set Up Backend (Python/FastAPI)

1. Create a Python virtual environment.
2. Activate it.
3. Install dependencies:

```bash
pip install -r requirements.txt
```

## Step 3: Set Up Frontend (React + Vite)

The frontend app lives in `app/dashboard`.

1. Navigate to the frontend folder.
2. Install dependencies:

```bash
cd app/dashboard
npm install
```

### Frontend Dependency Notes (already tracked in package.json)

Recent UI/interaction work uses:

- GSAP (`gsap`)
- Shadcn ecosystem (`shadcn`, `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`)
- 3D rendering/effects (`three`, `@react-three/fiber`, `@react-three/postprocessing`, `postprocessing`)
- charting (`recharts`)
- typography (`@fontsource-variable/geist`)

No extra manual installs are required beyond `npm install` unless package.json is changed.

## Step 4: Run the Application

Run backend and frontend in separate terminals.

### Backend

From project root:

```bash
uvicorn src.api.main:app --reload
```

Backend URL: `http://127.0.0.1:8000`

### Frontend

From `app/dashboard`:

```bash
npm run dev
```

Frontend URL: `http://localhost:3000`

## Step 5: Build Check (Recommended)

Before merging or handing off, validate production build:

```bash
cd app/dashboard
npm run build
```

## Optional: Regenerate Shadcn/React-Bits Components

Only needed if component source files were removed or intentionally refreshed.

```bash
cd app/dashboard
npx shadcn@latest add alert -y
npx shadcn@latest add @react-bits/BorderGlow-JS-TW -y
npx shadcn@latest add @react-bits/MagicBento-TS-TW -y
```

After regeneration, run `npm run build` to verify compatibility.
