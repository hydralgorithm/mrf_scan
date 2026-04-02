import os
import numpy as np
import tensorflow as tf
import cv2

from tensorflow.keras.applications.resnet import preprocess_input
from src.explainability.gradcam import make_gradcam_heatmap, overlay_heatmap_bgr, overlay_red_only
from src.data.loader import CLASS_NAMES, IMG_SIZE

MODEL_PATH = "models/final/best_baseline.keras"
IMAGE_PATH = None  # auto-pick if None

PREFERRED_ORDER = ["VIRAL_PNEUMONIA", "BACTERIAL_PNEUMONIA", "NORMAL"]


def pick_any_image():
    """Pick a sample image, prioritizing pneumonia classes first."""
    test_root = "data/raw/test"
    for cls in PREFERRED_ORDER:
        d = os.path.join(test_root, cls)
        if os.path.isdir(d):
            for f in os.listdir(d):
                if f.lower().endswith(("jpg", "jpeg", "png")):
                    return os.path.join(d, f)
    raise FileNotFoundError("Couldn't find any images under data/raw/test/...")


def main():
    global IMAGE_PATH
    if IMAGE_PATH is None:
        IMAGE_PATH = pick_any_image()

    os.makedirs("outputs", exist_ok=True)

    print("Loading model:", MODEL_PATH)
    model = tf.keras.models.load_model(MODEL_PATH)

    print("Using image:", IMAGE_PATH)
    original_bgr = cv2.imread(IMAGE_PATH)
    if original_bgr is None:
        raise ValueError(f"Could not read image: {IMAGE_PATH}")

    # Resize to model input
    resized_bgr = cv2.resize(original_bgr, IMG_SIZE)

    # IMPORTANT: preprocess_input expects RGB input range [0..255] then applies ResNet preprocessing
    resized_rgb = cv2.cvtColor(resized_bgr, cv2.COLOR_BGR2RGB)  # correct for ResNet preprocess [1](https://data.mendeley.com/datasets/p5rm59k7ph/1)[2](https://github.com/drthzdr/Pneumonia-Classification-in-Chest-X-Ray-Images)

    x = resized_rgb.astype(np.float32)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)

    probs = model.predict(x, verbose=0)[0]
    pred_idx = int(np.argmax(probs))

    print("Prediction:", CLASS_NAMES[pred_idx])
    print("Probabilities:", probs)

    # Try a more spatial layer for better localization
    heatmap_01, (container, last_conv) = make_gradcam_heatmap(
        x, model,
        container_name="resnet50",
        last_conv_layer_name="conv4_block6_out",
        pred_index=pred_idx
    )
    print("Grad-CAM backbone:", container, "| last conv:", last_conv)

    # Standard overlay (JET)
    overlay, heatmap_color, heatmap_gray = overlay_heatmap_bgr(resized_bgr, heatmap_01, alpha=0.35)

    # Red-only top activation overlay (cleaner demo)
    red_overlay, mask_img = overlay_red_only(resized_bgr, heatmap_01, alpha=0.5, percentile=85)

    # Save outputs
    cv2.imwrite("outputs/xray_resized.png", resized_bgr)
    cv2.imwrite("outputs/gradcam_heatmap_gray.png", heatmap_gray)
    cv2.imwrite("outputs/gradcam_heatmap_color.png", heatmap_color)
    cv2.imwrite("outputs/gradcam_overlay.png", overlay)
    cv2.imwrite("outputs/gradcam_red_only.png", red_overlay)
    cv2.imwrite("outputs/gradcam_mask.png", mask_img)

    print("Saved:")
    print(" - outputs/xray_resized.png")
    print(" - outputs/gradcam_heatmap_gray.png")
    print(" - outputs/gradcam_heatmap_color.png")
    print(" - outputs/gradcam_overlay.png")
    print(" - outputs/gradcam_red_only.png")
    print(" - outputs/gradcam_mask.png")


if __name__ == "__main__":
    main()