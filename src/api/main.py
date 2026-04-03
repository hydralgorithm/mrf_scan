import os
import sys
import base64
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


def _iter_conv2d_layers(layer):
    for sub_layer in getattr(layer, "layers", []):
        if isinstance(sub_layer, tf.keras.layers.Conv2D):
            yield sub_layer
        if hasattr(sub_layer, "layers"):
            yield from _iter_conv2d_layers(sub_layer)


def _find_preferred_conv_layer_name(loaded_model, preferred_name: str = "top_conv") -> str | None:
    conv_layers = list(_iter_conv2d_layers(loaded_model))
    if not conv_layers:
        return None

    # Prefer explicit top conv naming first for consistency with training-time GradCAM.
    for layer in conv_layers:
        if layer.name == preferred_name:
            return layer.name

    # Some exported graphs may namespace internal layer names.
    for layer in conv_layers:
        if layer.name.endswith(f"/{preferred_name}") or preferred_name in layer.name:
            return layer.name

    # Fallback for non-EfficientNet architectures.
    return conv_layers[-1].name


def _make_gradcam_heatmap_generic(img_batch: np.ndarray, loaded_model: tf.keras.Model) -> np.ndarray:
    last_conv_name = _find_preferred_conv_layer_name(loaded_model)
    if not last_conv_name:
        raise ValueError("No Conv2D layer found for GradCAM")

    last_conv_layer = loaded_model.get_layer(last_conv_name)
    grad_model = tf.keras.Model(
        inputs=loaded_model.inputs,
        outputs=[last_conv_layer.output, loaded_model.output]
    )

    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(img_batch, training=False)
        pred_index = tf.argmax(predictions[0])
        class_channel = predictions[:, pred_index]

    grads = tape.gradient(class_channel, conv_outputs)
    if grads is None:
        raise RuntimeError("GradCAM gradients are None")

    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
    heatmap = conv_outputs[0] @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)
    heatmap = tf.maximum(heatmap, 0) / (tf.math.reduce_max(heatmap) + 1e-8)
    return heatmap.numpy()


def _make_gradcam_heatmap_efficientnet_colab(img_batch: np.ndarray, loaded_model: tf.keras.Model) -> np.ndarray:
    base_model = loaded_model.get_layer("efficientnetb3")

    # Match the known-good notebook behavior by always using EfficientNet's top_conv.
    try:
        last_conv_layer = base_model.get_layer("top_conv")
    except ValueError as ex:
        raise ValueError("Expected top_conv layer inside efficientnetb3 backbone") from ex

    base_grad_model = tf.keras.Model(
        inputs=base_model.input,
        outputs=[last_conv_layer.output, base_model.output]
    )

    head_layers = [l for l in loaded_model.layers if l.name not in ["input_layer_4", "efficientnetb3"]]

    with tf.GradientTape() as tape:
        conv_outputs, base_out = base_grad_model(img_batch, training=False)

        x = base_out
        for layer in head_layers:
            x = layer(x, training=False)
        predictions = x

        pred_index = tf.argmax(predictions[0])
        class_channel = predictions[:, pred_index]

    grads = tape.gradient(class_channel, conv_outputs)
    if grads is None:
        raise RuntimeError("EfficientNet GradCAM gradients are None")

    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
    heatmap = conv_outputs[0] @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)
    heatmap = tf.maximum(heatmap, 0) / (tf.math.reduce_max(heatmap) + 1e-8)
    return heatmap.numpy()


def _generate_gradcam_overlay_base64(display_rgb: np.ndarray, x_batch: np.ndarray) -> str:
    if active_model_profile == PROFILE_EFFICIENTNET_COLAB:
        heatmap = _make_gradcam_heatmap_efficientnet_colab(x_batch, model)
    else:
        heatmap = _make_gradcam_heatmap_generic(x_batch, model)

    # Compose exactly like the notebook flow: resize heatmap to display size,
    # colorize with JET, convert to RGB, then blend with the same resized RGB image.
    h, w = display_rgb.shape[:2]
    heatmap_resized = cv2.resize(heatmap, (w, h))
    heatmap_colored_bgr = cv2.applyColorMap(np.uint8(255 * heatmap_resized), cv2.COLORMAP_JET)
    heatmap_colored_rgb = cv2.cvtColor(heatmap_colored_bgr, cv2.COLOR_BGR2RGB)
    overlay_rgb = (heatmap_colored_rgb * 0.4 + display_rgb * 0.6).astype(np.uint8)

    # Encode as JPEG via OpenCV (expects BGR input for consistent color output).
    overlay_bgr = cv2.cvtColor(overlay_rgb, cv2.COLOR_RGB2BGR)

    ok, encoded = cv2.imencode(".jpg", overlay_bgr)
    if not ok:
        raise ValueError("Failed to encode GradCAM overlay")

    return f"data:image/jpeg;base64,{base64.b64encode(encoded.tobytes()).decode('utf-8')}"


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
        display_rgb = cv2.resize(img_rgb, inference_img_size, interpolation=cv2.INTER_LANCZOS4)

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

        gradcam_overlay_base64 = None
        gradcam_error = None
        try:
            gradcam_overlay_base64 = _generate_gradcam_overlay_base64(display_rgb, x)
        except Exception as gradcam_ex:
            gradcam_error = str(gradcam_ex)

        return JSONResponse({
            "classification": pred_label,
            "confidence": confidence,
            "probabilities": probabilities,
            "base_severity": base_severity,
            "class_index": canonical_pred_idx,
            "gradcam_overlay": gradcam_overlay_base64,
            "gradcam_error": gradcam_error
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
