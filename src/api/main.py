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
model = None


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
        
        # Get prediction from raw probabilities
        pred_idx = int(np.argmax(probs))
        pred_label = CLASS_NAMES[pred_idx]
        confidence = float(probs[pred_idx])

        base_severity = compute_severity_1_to_10(probs, pred_idx)

        # Return probabilities
        probabilities = {
            CLASS_NAMES[i]: float(probs[i]) for i in range(len(CLASS_NAMES))
        }

        return JSONResponse({
            "classification": pred_label,
            "confidence": confidence,
            "probabilities": probabilities,
            "base_severity": base_severity,
            "class_index": pred_idx
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
