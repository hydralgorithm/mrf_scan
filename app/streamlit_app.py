import sys
from pathlib import Path

# Add project root (pneumonia_ai/) to Python path so `import src...` works
ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

import streamlit as st
import tensorflow as tf
import numpy as np
import cv2
import os

from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from src.data.loader import CLASS_NAMES, IMG_SIZE
from src.inference.severity import compute_severity_1_to_10

MODEL_PATH = "models/final/best_model.keras"
DEFAULT_PNEUMONIA_MIN_CONFIDENCE = 0.65

def smart_threshold(probs):
    """
    Reduce false VIRAL positives by adjusting probability distribution
    """
    probs = np.array(probs, dtype=np.float32)
    probs[2] *= 0.75  # Reduce VIRAL bias
    if probs[0] > 0.20:
        probs[0] *= 1.3  # Boost NORMAL
    probs = probs / np.sum(probs)
    pred_idx = int(np.argmax(probs))
    if pred_idx == 2 and probs[2] < 0.70:
        pred_idx = 0 if probs[0] > probs[1] else 1
    return pred_idx, probs

st.set_page_config(page_title="Pneumonia Classifier", layout="centered")

st.title("🩻 Pneumonia Classification Demo")
st.write("Upload a Chest X-ray image for analysis.")

pneumonia_min_conf = st.slider(
    "Pneumonia minimum confidence (reduce false positives)",
    min_value=0.50,
    max_value=0.95,
    value=DEFAULT_PNEUMONIA_MIN_CONFIDENCE,
    step=0.01
)

# Load model once
@st.cache_resource
def load_model():
    return tf.keras.models.load_model(MODEL_PATH)

model = load_model()

uploaded = st.file_uploader("Upload X-ray Image", type=["jpg","jpeg","png"])

if uploaded:
    bytes_data = uploaded.read()

    # OpenCV decode
    file_bytes = np.asarray(bytearray(bytes_data), dtype=np.uint8)
    img_bgr = cv2.imdecode(file_bytes, 1)

    st.image(img_bgr, channels="BGR", caption="Uploaded X-ray")

    # Preprocess
    resized_bgr = cv2.resize(img_bgr, IMG_SIZE)
    resized_rgb = cv2.cvtColor(resized_bgr, cv2.COLOR_BGR2RGB)

    x = resized_rgb.astype(np.float32)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)

    # Predict
    probs = model.predict(x, verbose=0)[0]
    
    # Apply smart thresholding
    pred_idx, adjusted_probs = smart_threshold(probs)
    pred_label = CLASS_NAMES[pred_idx]

    # Legacy confidence thresholding
    thresholded = False
    if pred_label in {"BACTERIAL_PNEUMONIA", "VIRAL_PNEUMONIA"}:
        if float(adjusted_probs[pred_idx]) < pneumonia_min_conf:
            pred_idx = 0
            pred_label = CLASS_NAMES[pred_idx]
            thresholded = True

    st.subheader("🔍 Prediction")
    st.write(f"**{pred_label}**")
    if thresholded:
        st.caption("Low-confidence pneumonia prediction; defaulted to NORMAL.")
    
    # Show probability comparison
    with st.expander("📊 Show Probability Details"):
        col1, col2 = st.columns(2)
        with col1:
            st.write("**Raw Model Output:**")
            for i, cls in enumerate(CLASS_NAMES):
                st.write(f"{cls}: {probs[i]:.2%}")
        with col2:
            st.write("**After Smart Thresholding:**")
            for i, cls in enumerate(CLASS_NAMES):
                st.write(f"{cls}: {adjusted_probs[i]:.2%}")

    # Severity
    severity = compute_severity_1_to_10(adjusted_probs, pred_idx)
    st.subheader("🔥 Severity Score")
    st.write(f"**{severity}/10**")

    st.progress(severity / 10)