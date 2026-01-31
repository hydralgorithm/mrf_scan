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

from tensorflow.keras.applications.resnet import preprocess_input
from src.data.loader import CLASS_NAMES, IMG_SIZE
from src.inference.severity import compute_severity_1_to_10, compute_severity_raw_components

MODEL_PATH = "models/final/best_baseline.keras"

st.set_page_config(page_title="Pneumonia Classifier", layout="centered")

st.title("🩻 Pneumonia Classification Demo")
st.write("Upload a Chest X-ray image for analysis.")

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
    pred_idx = int(np.argmax(probs))
    pred_label = CLASS_NAMES[pred_idx]

    st.subheader("🔍 Prediction")
    col1, col2 = st.columns(2)
    with col1:
        st.write(f"**Class: {pred_label}**")
    with col2:
        st.write(f"**Confidence: {probs[pred_idx]:.1%}**")

    # Severity
    severity = compute_severity_1_to_10(probs, pred_idx)
    st.subheader("🔥 Severity Score")
    
    col1, col2 = st.columns([2, 1])
    with col1:
        st.progress(severity / 10)
    with col2:
        # Color coding
        if severity == 0:
            severity_color = "🟢"
        elif severity <= 3:
            severity_color = "🟡"
        elif severity <= 6:
            severity_color = "🟠"
        else:
            severity_color = "🔴"
        st.write(f"{severity_color} **{severity}/10**")

    # Detailed breakdown
    if pred_idx != 0:  # Show details only for pneumonia
        with st.expander("📊 Severity Breakdown"):
            p_pneu, margin, ent_norm, confidence = compute_severity_raw_components(probs, pred_idx)
            
            col1, col2 = st.columns(2)
            with col1:
                st.metric("Pneumonia Prob", f"{p_pneu:.1%}")
                st.metric("Confidence Margin", f"{margin:.3f}")
            with col2:
                st.metric("Model Certainty", f"{(1.0 - ent_norm):.1%}")
                st.metric("Top Probability", f"{confidence:.1%}")

    # Class probabilities
    st.subheader("📈 Class Probabilities")
    prob_dict = {CLASS_NAMES[i]: float(probs[i]) for i in range(len(CLASS_NAMES))}
    st.bar_chart(prob_dict)