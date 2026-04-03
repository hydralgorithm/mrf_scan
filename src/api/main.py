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
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input as mobilenet_preprocess_input
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
MODEL_PATH = os.getenv("MODEL_PATH", "models/final/best_model_final.keras")
MODEL_PROFILE = os.getenv("MODEL_PROFILE", "auto")

CANONICAL_CLASS_NAMES = list(CLASS_NAMES)
LABEL_ALIASES = {
    "NORMAL": "NORMAL",
    "BACTERIA": "BACTERIAL_PNEUMONIA",
    "BACTERIAL_PNEUMONIA": "BACTERIAL_PNEUMONIA",
    "VIRUS": "VIRAL_PNEUMONIA",
    "VIRAL_PNEUMONIA": "VIRAL_PNEUMONIA",
}

PROFILE_LEGACY_MOBILENET = "legacy_mobilenet"
PROFILE_EFFICIENTNET_COLAB = "efficientnet_colab"

model = None
active_model_path = MODEL_PATH
active_model_profile = PROFILE_LEGACY_MOBILENET
inference_img_size = IMG_SIZE
model_output_labels = list(CANONICAL_CLASS_NAMES)


def _canonical_label(label: str) -> str:
    if label not in LABEL_ALIASES:
        raise ValueError(f"Unsupported model label: {label}")
    return LABEL_ALIASES[label]


def _preprocess_for_model(img_rgb: np.ndarray, target_size: tuple[int, int], profile: str) -> np.ndarray:
    # The Colab EfficientNetB3 model was trained on raw RGB resized inputs.
    # The legacy MobileNet model was trained with CLAHE + MobileNet preprocessing.
    if profile == PROFILE_EFFICIENTNET_COLAB:
        resized = cv2.resize(img_rgb, target_size, interpolation=cv2.INTER_LANCZOS4)
        x = resized.astype(np.float32)
        x = np.expand_dims(x, axis=0)
        return x

    enhanced = apply_clahe(img_rgb)
    resized = cv2.resize(enhanced, target_size, interpolation=cv2.INTER_LANCZOS4)
    x = resized.astype(np.float32)
    x = np.expand_dims(x, axis=0)
    return mobilenet_preprocess_input(x)


def _extract_input_size(loaded_model) -> tuple[int, int]:
    input_shape = getattr(loaded_model, "input_shape", None)
    if input_shape and len(input_shape) == 4 and input_shape[1] and input_shape[2]:
        return (int(input_shape[1]), int(input_shape[2]))
    return IMG_SIZE


def _resolve_profile(model_path: str, input_size: tuple[int, int]) -> tuple[str, list[str]]:
    if MODEL_PROFILE == PROFILE_EFFICIENTNET_COLAB:
        return PROFILE_EFFICIENTNET_COLAB, ["BACTERIA", "NORMAL", "VIRUS"]
    if MODEL_PROFILE == PROFILE_LEGACY_MOBILENET:
        return PROFILE_LEGACY_MOBILENET, list(CANONICAL_CLASS_NAMES)

    # Auto-detect profile from known training/export characteristics.
    path_lower = model_path.lower()
    if "best_model_final" in path_lower or input_size == (260, 260):
        return PROFILE_EFFICIENTNET_COLAB, ["BACTERIA", "NORMAL", "VIRUS"]
    return PROFILE_LEGACY_MOBILENET, list(CANONICAL_CLASS_NAMES)


@app.on_event("startup")
async def load_model_on_startup():
    global model, active_model_path, active_model_profile, inference_img_size, model_output_labels
    try:
        model = tf.keras.models.load_model(MODEL_PATH)
        active_model_path = MODEL_PATH
        inference_img_size = _extract_input_size(model)
        active_model_profile, model_output_labels = _resolve_profile(MODEL_PATH, inference_img_size)

        print(f"✅ Model loaded successfully from {active_model_path}")
        print(f"✅ Inference image size: {inference_img_size}")
        print(f"✅ Active profile: {active_model_profile}")
        print(f"✅ Model output labels: {model_output_labels}")
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        raise


@app.get("/")
async def root():
    return {"message": "Pneumonia Classification API", "status": "healthy"}


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model_path": active_model_path,
        "model_profile": active_model_profile,
        "inference_img_size": inference_img_size,
        "model_output_labels": model_output_labels,
    }


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
        
        x = _preprocess_for_model(img_rgb, inference_img_size, active_model_profile)

        probs = model.predict(x, verbose=0)[0]

        raw_pred_idx = int(np.argmax(probs))
        raw_pred_label = model_output_labels[raw_pred_idx]
        pred_label = _canonical_label(raw_pred_label)
        confidence = float(probs[raw_pred_idx])

        # Convert model output probabilities to canonical API label keys expected by frontend.
        probabilities = {name: 0.0 for name in CANONICAL_CLASS_NAMES}
        for idx, raw_label in enumerate(model_output_labels):
            probabilities[_canonical_label(raw_label)] = float(probs[idx])

        canonical_probs = np.asarray([probabilities[name] for name in CANONICAL_CLASS_NAMES], dtype=np.float32)
        canonical_pred_idx = int(np.argmax(canonical_probs))
        base_severity = compute_severity_1_to_10(canonical_probs, canonical_pred_idx)

        return JSONResponse({
            "classification": pred_label,
            "confidence": confidence,
            "probabilities": probabilities,
            "base_severity": base_severity,
            "class_index": canonical_pred_idx
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
