import tensorflow as tf
import os
from tensorflow.keras.applications.resnet import preprocess_input

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
AUTOTUNE = tf.data.AUTOTUNE

CLASS_NAMES = ["NORMAL", "BACTERIAL_PNEUMONIA", "VIRAL_PNEUMONIA"]

def decode_and_resize(image_path, label):
    # Load file
    image = tf.io.read_file(image_path)
    image = tf.io.decode_jpeg(image, channels=3)

    # Resize
    image = tf.image.resize(image, IMG_SIZE)

    # Preprocessing for ResNet50 (RGB→BGR + zero‑center)
    image = preprocess_input(image)

    return image, label


def build_dataset(root_dir):
    image_paths = []
    labels = []

    for idx, cls in enumerate(CLASS_NAMES):
        class_dir = os.path.join(root_dir, cls)
        for file in os.listdir(class_dir):
            if file.lower().endswith(("jpg", "jpeg", "png")):
                image_paths.append(os.path.join(class_dir, file))
                labels.append(idx)

    # Convert to tensors
    image_paths = tf.constant(image_paths)
    labels = tf.constant(labels)

    ds = tf.data.Dataset.from_tensor_slices((image_paths, labels))
    ds = ds.shuffle(buffer_size=len(image_paths))
    ds = ds.map(decode_and_resize, num_parallel_calls=AUTOTUNE)
    ds = ds.batch(BATCH_SIZE).prefetch(AUTOTUNE)

    return ds