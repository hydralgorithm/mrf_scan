"""
Advanced X-ray preprocessing to improve model accuracy
These techniques enhance lung features in chest X-rays
"""

import cv2
import numpy as np
from PIL import Image


def apply_clahe(image_array):
    """
    CLAHE (Contrast Limited Adaptive Histogram Equalization)
    Enhances local contrast - critical for X-rays
    """
    # Convert to grayscale if needed
    if len(image_array.shape) == 3:
        gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
    else:
        gray = image_array
    
    # Apply CLAHE
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    
    # Convert back to RGB
    enhanced_rgb = cv2.cvtColor(enhanced, cv2.COLOR_GRAY2RGB)
    return enhanced_rgb


def denoise_xray(image_array):
    """
    Remove noise while preserving edges (lung boundaries)
    """
    denoised = cv2.fastNlMeansDenoisingColored(image_array, None, 10, 10, 7, 21)
    return denoised


def enhance_edges(image_array):
    """
    Enhance lung boundaries and infiltrates
    """
    # Convert to grayscale
    gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
    
    # Apply bilateral filter (smooths while keeping edges)
    bilateral = cv2.bilateralFilter(gray, 9, 75, 75)
    
    # Sharpen
    kernel = np.array([[-1,-1,-1],
                       [-1, 9,-1],
                       [-1,-1,-1]])
    sharpened = cv2.filter2D(bilateral, -1, kernel)
    
    # Convert back to RGB
    enhanced_rgb = cv2.cvtColor(sharpened, cv2.COLOR_GRAY2RGB)
    return enhanced_rgb


def preprocess_xray_advanced(image_path, target_size=(224, 224)):
    """
    Complete preprocessing pipeline for chest X-rays
    
    Steps:
    1. Load image
    2. CLAHE enhancement (improves contrast)
    3. Denoise (removes artifacts)
    4. Edge enhancement (highlights lung features)
    5. Resize
    6. Normalize
    
    Returns: Preprocessed image ready for model
    """
    # Load image
    img = Image.open(image_path).convert('RGB')
    img_array = np.array(img)
    
    # Apply CLAHE for contrast
    clahe_enhanced = apply_clahe(img_array)
    
    # Denoise
    denoised = denoise_xray(clahe_enhanced)
    
    # Enhance edges
    edge_enhanced = enhance_edges(denoised)
    
    # Resize to target size
    resized = cv2.resize(edge_enhanced, target_size, interpolation=cv2.INTER_LANCZOS4)
    
    # Normalize to [0, 1]
    normalized = resized.astype(np.float32) / 255.0
    
    return normalized


def preprocess_xray_simple(image_path, target_size=(224, 224)):
    """
    Simple but effective preprocessing
    Just CLAHE + resize (fastest option)
    """
    img = Image.open(image_path).convert('RGB')
    img_array = np.array(img)
    
    # Apply CLAHE
    clahe_enhanced = apply_clahe(img_array)
    
    # Resize
    resized = cv2.resize(clahe_enhanced, target_size, interpolation=cv2.INTER_LANCZOS4)
    
    # Normalize
    normalized = resized.astype(np.float32) / 255.0
    
    return normalized


if __name__ == "__main__":
    # Test the preprocessing
    import matplotlib.pyplot as plt
    
    test_image = "data/raw/test/NORMAL/NORMAL2-IM-1427-0001.jpeg"
    
    # Original
    original = np.array(Image.open(test_image).convert('RGB'))
    
    # With preprocessing
    preprocessed = preprocess_xray_advanced(test_image)
    
    # Compare
    fig, axes = plt.subplots(1, 2, figsize=(12, 6))
    axes[0].imshow(original)
    axes[0].set_title("Original X-ray")
    axes[0].axis('off')
    
    axes[1].imshow(preprocessed)
    axes[1].set_title("After Advanced Preprocessing")
    axes[1].axis('off')
    
    plt.tight_layout()
    plt.savefig("outputs/preprocessing_comparison.png", dpi=150, bbox_inches='tight')
    print("✓ Comparison saved to outputs/preprocessing_comparison.png")
