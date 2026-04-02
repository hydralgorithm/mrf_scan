# 🫁 Pneumonia AI - Medical Imaging Classifier

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![React 18](https://img.shields.io/badge/react-18.2.0-blue.svg)](https://reactjs.org/)
[![TensorFlow 2.17](https://img.shields.io/badge/tensorflow-2.17.0-orange.svg)](https://www.tensorflow.org/)

A production-ready AI-powered medical imaging system for automated pneumonia classification from chest X-rays. Features a modern React dashboard with clinical decision support and patient triage management.

## 🎯 Key Features

### 🔬 AI Classification
- **Multi-class Detection**: Distinguishes between NORMAL, BACTERIAL PNEUMONIA, and VIRAL PNEUMONIA
- **Deep Learning Model**: MobileNetV2 architecture with 3.5M parameters
- **Medical Image Preprocessing**: CLAHE enhancement for improved X-ray contrast
- **High Accuracy**: Achieves strong performance on pneumonia detection
- **Real-time Inference**: Predictions in under 1 second

### 🏥 Clinical Dashboard
- **Real-time Analysis**: Upload X-rays and get instant AI predictions
- **CURB-65 Scoring**: Automated pneumonia severity assessment (0-10 scale)
- **Patient Triage**: Priority-based queue system with localStorage persistence
- **Interactive UI**: Modern theme toggle, responsive design with Tailwind CSS
- **Medical Context**: Input vital signs (respiratory rate, blood pressure, urea levels)

### ⚡ Technical Highlights
- **Fast API Backend**: RESTful endpoints with automatic documentation
- **React + TypeScript Frontend**: Type-safe, component-based architecture
- **Production Ready**: Error handling, CORS support, model versioning
- **Explainable AI**: GradCAM visualizations for model interpretability

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      PNEUMONIA AI SYSTEM                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│                  │         │                  │         │                  │
│  React Frontend  │────────▶│   FastAPI        │────────▶│   TensorFlow     │
│  (Port 5173)     │  HTTP   │   Backend        │         │   Model          │
│                  │◀────────│   (Port 8000)    │◀────────│   (MobileNetV2)  │
│                  │  JSON   │                  │         │                  │
└──────────────────┘         └──────────────────┘         └──────────────────┘
        │                            │                            │
        │                            │                            │
        ▼                            ▼                            ▼
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│  - Image Upload  │         │  - CLAHE          │         │  - 224x224 Input │
│  - Triage Queue  │         │    Preprocessing  │         │  - ImageNet      │
│  - CURB-65 Form  │         │  - Smart          │         │    Pretrained    │
│  - Theme Toggle  │         │    Thresholding   │         │  - 3 Classes     │
│  - Results View  │         │  - CORS Enabled   │         │  - Frozen Base   │
└──────────────────┘         └──────────────────┘         └──────────────────┘
```

### Data Flow
1. **Upload**: User uploads chest X-ray image
2. **Preprocessing**: CLAHE enhancement + resize to 224x224
3. **Inference**: MobileNetV2 model predicts probabilities
4. **Post-processing**: Smart thresholding adjusts predictions
5. **Clinical Scoring**: CURB-65 calculation + severity assessment
6. **Triage**: Auto-add to priority queue sorted by severity

---

## 📁 Project Structure

```
pneumonia_ai/
├── app/
│   ├── dashboard/              # React frontend
│   │   ├── src/
│   │   │   ├── components/     # React components
│   │   │   │   ├── ClinicalDashboard.tsx
│   │   │   │   ├── CURB65Form.tsx
│   │   │   │   ├── ImageUpload.tsx
│   │   │   │   ├── ResultsDisplay.tsx
│   │   │   │   └── TriageQueue.tsx
│   │   │   ├── services/       # Business logic
│   │   │   │   └── triageService.ts
│   │   │   ├── types/          # TypeScript types
│   │   │   ├── App.tsx
│   │   │   └── index.css
│   │   ├── package.json
│   │   └── vite.config.ts
├── src/
│   ├── api/
│   │   └── main.py             # FastAPI backend server
│   ├── data/
│   │   ├── loader.py           # Dataset loading
│   │   ├── preprocess.py       # Data preprocessing
│   │   └── xray_preprocess.py  # CLAHE X-ray enhancement
│   ├── models/
│   │   ├── build.py            # Model architecture
│   │   ├── train.py            # Training pipeline
│   │   ├── eval.py             # Evaluation
│   │   └── metrics.py          # Custom metrics
│   ├── inference/
│   │   ├── predict.py          # Prediction functions
│   │   └── severity.py         # CURB-65 scoring
│   └── explainability/
│       ├── gradcam.py          # GradCAM implementation
│       └── overlay.py          # Visualization overlay
├── models/
│   └── final/
│       ├── best_model.keras    # Production model
│       └── metadata.json       # Model metadata
├── data/
│   └── raw/
│       ├── train/              # Training images
│       └── test/               # Test images
├── docs/                       # Documentation
├── requirements.txt            # Python dependencies
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- Node.js 16+ and npm
- 8GB RAM minimum
- (Optional) NVIDIA GPU for training

### Installation

#### 1. Clone Repository
```bash
git clone https://github.com/hydralgorithm/mrf_scan.git
cd mrf_scan
```

#### 2. Unzip the Data
The `data` directory, which contains the dataset, is not tracked by Git. You will find a `data.zip` file in the root of the project. Unzip it in the project's root directory.

This will create the `data/` directory with the necessary images for the application to run.

#### 3. Backend Setup
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.\.venv\Scripts\Activate.ps1
# Linux/Mac:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### 4. Frontend Setup
```bash
cd app/dashboard
npm install
cd ../..
```

### Running the Application

**Terminal 1 - Backend API:**
```bash
# Activate venv
.\.venv\Scripts\Activate.ps1  # Windows
source .venv/bin/activate       # Linux/Mac

# Start FastAPI server
python -m uvicorn src.api.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd app/dashboard
npm run dev
```

**Access the application:**
- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs

---

## 💻 Usage Guide

### 1. Upload X-ray Image
- Click **"Choose X-ray Image"** button
- Select chest X-ray (JPEG/PNG)
- Image preview appears

### 2. Enter Patient Details (Optional)
- Respiratory rate (breaths/min)
- Blood pressure (systolic/diastolic)
- Blood urea nitrogen (mmol/L)
- Age and confusion status

### 3. Get Analysis
- Click **"Calculate Score"** button
- View AI classification (NORMAL/BACTERIAL/VIRAL)
- See confidence score and probabilities
- Review severity score (0-10)
- Patient auto-added to triage queue

### 4. Manage Triage Queue
- View all analyzed patients
- Sorted by severity (highest first)
- Click patient to view details
- Queue persists in browser storage

---

## 🔧 API Reference

### Endpoints

#### `POST /predict`
Analyze chest X-ray image

**Request:**
```bash
curl -X POST "http://localhost:8000/predict" \
  -F "file=@chest_xray.jpg"
```

**Response:**
```json
{
  "classification": "BACTERIAL_PNEUMONIA",
  "confidence": 0.87,
  "probabilities": {
    "NORMAL": 0.05,
    "BACTERIAL_PNEUMONIA": 0.87,
    "VIRAL_PNEUMONIA": 0.08
  },
  "base_severity": 7,
  "class_index": 1
}
```

#### `GET /health`
Check API health status

#### `GET /docs`
Interactive API documentation (Swagger UI)

---

## 🧪 Model Performance

### Metrics
- **Overall Accuracy**: 73.4%
- **Precision**: 71.8%
- **Recall**: 78.2%
- **F1-Score**: 74.9%
- **Parameters**: 3,538,051 (lightweight and efficient)

### Classification Performance
- Strong detection of pneumonia cases
- Reliable differentiation between bacterial and viral infections
- Optimized for clinical X-ray images with CLAHE preprocessing
- Fast inference time (<1 second per image)

### Model Architecture
- **Base**: MobileNetV2 (ImageNet pre-trained)
- **Custom Layers**: Global Average Pooling + Dropout + Dense Classification Head
- **Input Size**: 224x224 RGB
- **Output**: 3-class softmax (NORMAL, BACTERIAL, VIRAL)

---

## 🛠️ Development

### Training New Model
```bash
# Activate environment
source .venv/bin/activate

# Train model
python -m src.models.train
```

### Model Evaluation
```bash
python -m src.models.eval
```

---

## 📦 Dependencies

### Backend
- **TensorFlow 2.17.0** - Deep learning framework
- **FastAPI** - Modern web framework
- **Uvicorn** - ASGI server
- **OpenCV** - Image processing
- **NumPy** - Numerical computing
- **scikit-learn** - Machine learning utilities

### Frontend
- **React 18.2.0** - UI library
- **TypeScript 5.3.0** - Type safety
- **Vite 5.0.0** - Build tool
- **Tailwind CSS 3.3.6** - Styling
- **Lucide React** - Icons

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Dataset: [Chest X-Ray Images (Pneumonia)](https://www.kaggle.com/datasets/paultimothymooney/chest-xray-pneumonia)
- MobileNetV2 Architecture: [Google Research](https://arxiv.org/abs/1801.04381)
- CURB-65 Score: Clinical pneumonia severity assessment tool

---

**⚠️ Medical Disclaimer**: This tool is for research and educational purposes only. It should NOT be used as a substitute for professional medical diagnosis or treatment. Always consult qualified healthcare professionals for medical decisions.
