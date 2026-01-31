import os
import json
import tensorflow as tf
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
from tensorflow.keras.optimizers import Adam
from sklearn.utils.class_weight import compute_class_weight
import numpy as np
from src.models.metrics import evaluate_multiclass

from src.data.loader import build_dataset, CLASS_NAMES
from src.models.build import build_resnet50_classifier

TRAIN_DIR = "data/raw/train"
TEST_DIR  = "data/raw/test"
MODEL_DIR = "models/final"
os.makedirs(MODEL_DIR, exist_ok=True)

def get_all_labels_from_directory(root_dir):
    labels = []
    for idx, cls in enumerate(CLASS_NAMES):
        class_dir = os.path.join(root_dir, cls)
        for f in os.listdir(class_dir):
            if f.lower().endswith(("jpg", "jpeg", "png")):
                labels.append(idx)
    return np.array(labels)

def main():
    print("Loading datasets...")
    train_ds = build_dataset(TRAIN_DIR)
    test_ds  = build_dataset(TEST_DIR)

    print("Computing class weights...")
    y_train = get_all_labels_from_directory(TRAIN_DIR)
    class_weights = compute_class_weight(
        class_weight="balanced",
        classes=np.unique(y_train),
        y=y_train
    )
    class_weights = {i: w for i, w in enumerate(class_weights)}
    print("Class weights:", class_weights)

    print("Building model...")
    model = build_resnet50_classifier(num_classes=3)

    model.compile(
        optimizer=Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["sparse_categorical_accuracy"]
    )

    callbacks = [
        ModelCheckpoint(
            filepath=os.path.join(MODEL_DIR, "best.keras"),
            monitor="val_recall_macro",
            save_best_only=True,
            mode="max"
        ),
        ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=2),
        EarlyStopping(monitor="val_loss", patience=4, restore_best_weights=True),
    ]

    print("Training (baseline: frozen ResNet backbone)...")
    history = model.fit(
        train_ds,
        validation_data=test_ds,
        epochs=10,
        class_weight=class_weights,
        callbacks=callbacks
    )
    
    print("Evaluating on test set (macro recall + confusion matrix)...")
    cm, report, macro_recall = evaluate_multiclass(model, test_ds, CLASS_NAMES)
    print("Macro Recall:", macro_recall)
    print("Confusion Matrix:\n", cm)


    print("Saving final model...")
    model.save(os.path.join(MODEL_DIR, "final.keras"))

    metadata = {
        "classes": CLASS_NAMES,
        "img_size": [224, 224],
        "model": "ResNet50",
        "note": "Baseline: ResNet backbone frozen; head trained."
    }
    with open(os.path.join(MODEL_DIR, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print("Done ✅")

if __name__ == "__main__":
    main()
