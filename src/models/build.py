import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import ResNet50, MobileNetV2

def build_resnet50_classifier(num_classes=3, input_shape=(224, 224, 3), dropout=0.3):
    base = ResNet50(
        include_top=False,
        weights="imagenet",
        input_shape=input_shape
    )
    base.trainable = False  # freeze backbone for baseline

    inputs = layers.Input(shape=input_shape)
    x = base(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(dropout)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)

    model = models.Model(inputs, outputs, name="pneumonia_resnet50")
    return model


def build_mobilenetv2_classifier(num_classes=3, input_shape=(224, 224, 3), dropout=0.2):
    base = MobileNetV2(
        include_top=False,
        weights="imagenet",
        input_shape=input_shape
    )
    base.trainable = False

    inputs = layers.Input(shape=input_shape)
    x = base(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(dropout)(x)
    outputs = layers.Dense(num_classes, activation="softmax", dtype="float32")(x)

    model = models.Model(inputs, outputs, name="pneumonia_mobilenetv2")
    return model