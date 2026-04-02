import numpy as np
import tensorflow as tf
import cv2


def _get_head_layers(model: tf.keras.Model):
    """Find head layers by type so it works even if names change."""
    gap = None
    dropout = None
    dense = None

    for layer in model.layers:
        if isinstance(layer, tf.keras.layers.GlobalAveragePooling2D):
            gap = layer
        elif isinstance(layer, tf.keras.layers.Dropout):
            dropout = layer
        elif isinstance(layer, tf.keras.layers.Dense):
            dense = layer

    if gap is None or dense is None:
        raise ValueError("Could not find head layers (GAP/Dense) in the model.")
    return gap, dropout, dense


def make_gradcam_heatmap(
    img_tensor_4d,
    model: tf.keras.Model,
    container_name="resnet50",
    last_conv_layer_name="conv5_block3_out",
    pred_index=None
):
    """
    Robust Grad-CAM for your architecture:
    Input -> resnet50 -> GAP -> Dropout -> Dense

    img_tensor_4d: (1, 224, 224, 3) preprocessed tensor/array
    """

    # Ensure correct tensor type
    x = tf.convert_to_tensor(img_tensor_4d)

    # Some Keras models expect list structure for inputs
    model_input = [x] if isinstance(model.inputs, (list, tuple)) and len(model.inputs) == 1 else x

    backbone = model.get_layer(container_name)

    # Build model that outputs BOTH:
    # - chosen conv layer output
    # - backbone final output
    backbone_multi = tf.keras.Model(
        inputs=backbone.input,
        outputs=[backbone.get_layer(last_conv_layer_name).output, backbone.output]
    )

    gap, dropout, dense = _get_head_layers(model)

    with tf.GradientTape() as tape:
        # Forward through backbone once (connected graph)
        conv_out, backbone_out = backbone_multi(model_input, training=False)

        # Forward through head using backbone_out (still connected)
        x_head = gap(backbone_out)
        if dropout is not None:
            x_head = dropout(x_head, training=False)
        preds = dense(x_head)

        if pred_index is None:
            pred_index = tf.argmax(preds[0])

        class_score = preds[:, pred_index]

    grads = tape.gradient(class_score, conv_out)

    if grads is None:
        raise RuntimeError(
            "Gradients are None. This means the class score is not connected to conv_out. "
            "Double-check container_name/last_conv_layer_name."
        )

    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    conv_out = conv_out[0]  # (Hc, Wc, C)
    heatmap = conv_out @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)

    heatmap = tf.maximum(heatmap, 0) / (tf.reduce_max(heatmap) + 1e-9)
    return heatmap.numpy(), (container_name, last_conv_layer_name)


def overlay_heatmap_bgr(original_bgr, heatmap_01, alpha=0.35, colormap=cv2.COLORMAP_JET):
    h, w = original_bgr.shape[:2]
    heatmap_resized = cv2.resize(heatmap_01, (w, h))
    heatmap_gray = np.uint8(255 * heatmap_resized)

    heatmap_color = cv2.applyColorMap(heatmap_gray, colormap)
    overlay = cv2.addWeighted(heatmap_color, alpha, original_bgr, 1 - alpha, 0)

    return overlay, heatmap_color, heatmap_gray

def overlay_red_only(original_bgr, heatmap_01, alpha=0.45, percentile=85):
    """
    Show only the hottest regions (top percentile) as RED overlay.
    Much cleaner for hackathon demos.
    """
    h, w = original_bgr.shape[:2]
    hm = cv2.resize(heatmap_01, (w, h))

    # keep only top activations
    thresh = np.percentile(hm, percentile)
    mask = (hm >= thresh).astype(np.float32)

    red = np.zeros_like(original_bgr, dtype=np.float32)
    red[:, :, 2] = 255.0  # pure red channel

    out = original_bgr.astype(np.float32) * (1 - alpha * mask[..., None]) + red * (alpha * mask[..., None])
    return out.astype(np.uint8), (mask * 255).astype(np.uint8)