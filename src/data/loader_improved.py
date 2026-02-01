"""
Improved data loader with proper train/val/test split and medical-specific augmentation
"""
import tensorflow as tf
import os
import numpy as np
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from sklearn.model_selection import train_test_split

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
AUTOTUNE = tf.data.AUTOTUNE

CLASS_NAMES = ["NORMAL", "BACTERIAL_PNEUMONIA", "VIRAL_PNEUMONIA"]


def medical_augmentation(image, label):
    """
    Medical-specific data augmentation for chest X-rays
    """
    # Random rotation (X-rays can be slightly rotated)
    image = tf.image.rot90(image, k=tf.random.uniform([], 0, 4, dtype=tf.int32))
    
    # Random flip (horizontal only - vertical flip not medically valid)
    image = tf.image.random_flip_left_right(image)
    
    # Random brightness (X-ray exposure variation)
    image = tf.image.random_brightness(image, max_delta=0.2)
    
    # Random contrast (film quality variation)
    image = tf.image.random_contrast(image, lower=0.8, upper=1.2)
    
    # Small zoom/crop (simulates different patient positioning)
    image = tf.image.resize_with_crop_or_pad(image, int(IMG_SIZE[0] * 1.1), int(IMG_SIZE[1] * 1.1))
    image = tf.image.random_crop(image, size=[IMG_SIZE[0], IMG_SIZE[1], 3])
    
    return image, label


def decode_and_resize(image_path, label):
    """Load and preprocess image"""
    image = tf.io.read_file(image_path)
    image = tf.io.decode_jpeg(image, channels=3)
    image = tf.image.resize(image, IMG_SIZE)
    image = preprocess_input(image)
    return image, label


def build_dataset_with_validation(root_dir, val_split=0.15, augment=False):
    """
    Build dataset with proper train/validation split
    
    Args:
        root_dir: Root directory with class folders
        val_split: Fraction for validation (default 15%)
        augment: Whether to apply data augmentation
    
    Returns:
        train_ds, val_ds (TensorFlow datasets)
    """
    image_paths = []
    labels = []

    # Collect all file paths and labels
    for idx, cls in enumerate(CLASS_NAMES):
        class_dir = os.path.join(root_dir, cls)
        for file in os.listdir(class_dir):
            if file.lower().endswith(("jpg", "jpeg", "png")):
                image_paths.append(os.path.join(class_dir, file))
                labels.append(idx)

    # Stratified split to maintain class distribution
    image_paths = np.array(image_paths)
    labels = np.array(labels)
    
    X_train, X_val, y_train, y_val = train_test_split(
        image_paths, labels,
        test_size=val_split,
        stratify=labels,
        random_state=42
    )
    
    print(f"Train samples: {len(X_train)}, Val samples: {len(X_val)}")
    print(f"Train class distribution: {np.bincount(y_train)}")
    print(f"Val class distribution: {np.bincount(y_val)}")
    
    # Build training dataset
    train_ds = tf.data.Dataset.from_tensor_slices((X_train, y_train))
    train_ds = train_ds.shuffle(buffer_size=len(X_train), seed=42)
    train_ds = train_ds.map(decode_and_resize, num_parallel_calls=AUTOTUNE)
    
    if augment:
        train_ds = train_ds.map(medical_augmentation, num_parallel_calls=AUTOTUNE)
    
    train_ds = train_ds.batch(BATCH_SIZE).cache().prefetch(AUTOTUNE)
    
    # Build validation dataset (no augmentation)
    val_ds = tf.data.Dataset.from_tensor_slices((X_val, y_val))
    val_ds = val_ds.map(decode_and_resize, num_parallel_calls=AUTOTUNE)
    val_ds = val_ds.batch(BATCH_SIZE).cache().prefetch(AUTOTUNE)
    
    return train_ds, val_ds


def build_dataset(root_dir):
    """Original loader for test set (no split needed)"""
    image_paths = []
    labels = []

    for idx, cls in enumerate(CLASS_NAMES):
        class_dir = os.path.join(root_dir, cls)
        for file in os.listdir(class_dir):
            if file.lower().endswith(("jpg", "jpeg", "png")):
                image_paths.append(os.path.join(class_dir, file))
                labels.append(idx)

    image_paths = tf.constant(image_paths)
    labels = tf.constant(labels)

    ds = tf.data.Dataset.from_tensor_slices((image_paths, labels))
    ds = ds.map(decode_and_resize, num_parallel_calls=AUTOTUNE)
    ds = ds.batch(BATCH_SIZE).cache().prefetch(AUTOTUNE)

    return ds


def get_all_labels_from_directory(root_dir):
    """Get labels for class weight computation"""
    labels = []
    for idx, cls in enumerate(CLASS_NAMES):
        class_dir = os.path.join(root_dir, cls)
        for f in os.listdir(class_dir):
            if f.lower().endswith(("jpg", "jpeg", "png")):
                labels.append(idx)
    return np.array(labels)
