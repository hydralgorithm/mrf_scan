import os
import sys
from pathlib import Path

# Add project root to path
ROOT_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import tensorflow as tf
import numpy as np
import cv2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from src.data.loader import CLASS_NAMES, IMG_SIZE
from src.inference.severity import compute_severity_1_to_10
from src.data.xray_preprocess import apply_clahe

app = FastAPI(title="Pneumonia Classification API", version="1.0.0")

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model globally
MODEL_PATH = "models/final/best_model.keras"
PNEUMONIA_MIN_CONFIDENCE = float(os.getenv("PNEUMONIA_MIN_CONFIDENCE", "0.65"))
model = None


def smart_threshold(probs):
    """
    Reduce false VIRAL positives by adjusting probability distribution
    This fixes the 82.7% NORMAL→VIRAL misclassification problem
    """
    probs = np.array(probs, dtype=np.float32)
    
    # Reduce VIRAL bias (main problem)
    probs[2] *= 0.75
    
    # Boost NORMAL if it's competitive
    if probs[0] > 0.20:
        probs[0] *= 1.3
    
    # Re-normalize
    probs = probs / np.sum(probs)
    
    # Apply strict threshold for VIRAL
    pred_idx = int(np.argmax(probs))
    if pred_idx == 2 and probs[2] < 0.70:
        # Re-rank between NORMAL and BACTERIAL
        pred_idx = 0 if probs[0] > probs[1] else 1
    
    return pred_idx, probs


@app.on_event("startup")
async def load_model_on_startup():
    global model
    try:
        model = tf.keras.models.load_model(MODEL_PATH)
        print(f"✅ Model loaded successfully from {MODEL_PATH}")
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        raise


@app.get("/")
async def root():
    return {"message": "Pneumonia Classification API", "status": "healthy"}


@app.get("/health")
async def health():
    return {"status": "healthy", "model_loaded": model is not None}


@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    """
    Predict pneumonia classification from uploaded X-ray image.
    Returns: classification, confidence, probabilities, and base severity score.
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        contents = await file.read()
        file_bytes = np.asarray(bytearray(contents), dtype=np.uint8)
        img_bgr = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if img_bgr is None:
            raise HTTPException(status_code=400, detail="Could not decode image")

        # Convert BGR to RGB first
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        
        # Apply CLAHE enhancement (improves X-ray contrast)
        enhanced = apply_clahe(img_rgb)
        
        # Resize
        resized = cv2.resize(enhanced, IMG_SIZE, interpolation=cv2.INTER_LANCZOS4)

        # Prepare for model
        x = resized.astype(np.float32)
        x = np.expand_dims(x, axis=0)
        x = preprocess_input(x)

        probs = model.predict(x, verbose=0)[0]
        
        # Apply smart thresholding to reduce false VIRAL positives
        pred_idx, adjusted_probs = smart_threshold(probs)
        pred_label = CLASS_NAMES[pred_idx]
        confidence = float(adjusted_probs[pred_idx])

        # Legacy thresholding (now applied on adjusted probs)
        thresholded = False
        if pred_label in {"BACTERIAL_PNEUMONIA", "VIRAL_PNEUMONIA"}:
            if confidence < PNEUMONIA_MIN_CONFIDENCE:
                pred_idx = 0
                pred_label = CLASS_NAMES[pred_idx]
                confidence = float(adjusted_probs[pred_idx])
                thresholded = True

        base_severity = compute_severity_1_to_10(adjusted_probs, pred_idx)

        # Return both raw and adjusted probabilities
        probabilities = {
            CLASS_NAMES[i]: float(probs[i]) for i in range(len(CLASS_NAMES))
        }
        
        adjusted_probabilities = {
            CLASS_NAMES[i]: float(adjusted_probs[i]) for i in range(len(CLASS_NAMES))
        }

        return JSONResponse({
            "classification": pred_label,
            "confidence": confidence,
            "raw_probabilities": probabilities,
            "adjusted_probabilities": adjusted_probabilities,
            "base_severity": base_severity,
            "class_index": pred_idx,
            "thresholded": thresholded,
            "smart_thresholding_applied": True,
            "pneumonia_min_confidence": PNEUMONIA_MIN_CONFIDENCE
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
