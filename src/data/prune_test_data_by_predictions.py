import argparse
import json
import shutil
from collections import defaultdict
from datetime import datetime
from pathlib import Path

import cv2
import numpy as np
import tensorflow as tf

CANONICAL_CLASSES = ["NORMAL", "BACTERIAL_PNEUMONIA", "VIRAL_PNEUMONIA"]
VALID_EXTS = {".jpg", ".jpeg", ".png", ".webp"}

LABEL_ALIASES = {
    "NORMAL": "NORMAL",
    "BACTERIA": "BACTERIAL_PNEUMONIA",
    "BACTERIAL_PNEUMONIA": "BACTERIAL_PNEUMONIA",
    "VIRUS": "VIRAL_PNEUMONIA",
    "VIRAL_PNEUMONIA": "VIRAL_PNEUMONIA",
}

PROFILE_EFFICIENTNET_COLAB = "efficientnet_colab"
PROFILE_LEGACY_MOBILENET = "legacy_mobilenet"


def canonical_label(label: str) -> str:
    if label not in LABEL_ALIASES:
        raise ValueError(f"Unsupported label: {label}")
    return LABEL_ALIASES[label]


def extract_input_size(model) -> tuple[int, int]:
    input_shape = getattr(model, "input_shape", None)
    if input_shape and len(input_shape) == 4 and input_shape[1] and input_shape[2]:
        return int(input_shape[1]), int(input_shape[2])
    return 224, 224


def resolve_profile(model_path: str, input_size: tuple[int, int], profile_arg: str) -> tuple[str, list[str]]:
    if profile_arg == PROFILE_EFFICIENTNET_COLAB:
        return PROFILE_EFFICIENTNET_COLAB, ["BACTERIA", "NORMAL", "VIRUS"]
    if profile_arg == PROFILE_LEGACY_MOBILENET:
        return PROFILE_LEGACY_MOBILENET, list(CANONICAL_CLASSES)

    # auto mode
    if "best_model_final" in model_path.lower() or input_size == (260, 260):
        return PROFILE_EFFICIENTNET_COLAB, ["BACTERIA", "NORMAL", "VIRUS"]
    return PROFILE_LEGACY_MOBILENET, list(CANONICAL_CLASSES)


def preprocess_for_model(img_rgb: np.ndarray, target_size: tuple[int, int], profile: str) -> np.ndarray:
    resized = cv2.resize(img_rgb, target_size, interpolation=cv2.INTER_LANCZOS4)
    x = resized.astype(np.float32)
    x = np.expand_dims(x, axis=0)

    if profile == PROFILE_LEGACY_MOBILENET:
        # MobileNetV2 preprocessing to [-1, 1]
        x = (x / 127.5) - 1.0
    return x


def predict_label(model, img_path: Path, input_size: tuple[int, int], profile: str, output_labels: list[str]) -> str:
    img_bgr = cv2.imread(str(img_path))
    if img_bgr is None:
        raise ValueError(f"Could not read image: {img_path}")

    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    x = preprocess_for_model(img_rgb, input_size, profile)
    probs = model.predict(x, verbose=0)[0]
    raw_idx = int(np.argmax(probs))
    return canonical_label(output_labels[raw_idx])


def main():
    parser = argparse.ArgumentParser(
        description="Remove misclassified files from test_data based on model predictions and write a report."
    )
    parser.add_argument("--data-dir", default="data/raw/test_data")
    parser.add_argument("--model-path", default="models/final/best_model_final.keras")
    parser.add_argument(
        "--profile",
        default="auto",
        choices=["auto", PROFILE_EFFICIENTNET_COLAB, PROFILE_LEGACY_MOBILENET],
    )
    parser.add_argument(
        "--wrong-output-dir",
        default="data/raw/test_data_removed_wrong",
        help="Wrong files are moved here (outside test_data).",
    )
    parser.add_argument(
        "--report-path",
        default="outputs/test_data_prune_report.json",
        help="JSON report path",
    )
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    model_path = Path(args.model_path)
    wrong_output_dir = Path(args.wrong_output_dir)
    report_path = Path(args.report_path)

    if not data_dir.exists():
        raise FileNotFoundError(f"Data dir not found: {data_dir}")
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")

    model = tf.keras.models.load_model(str(model_path))
    input_size = extract_input_size(model)
    profile, output_labels = resolve_profile(str(model_path), input_size, args.profile)

    wrong_output_dir.mkdir(parents=True, exist_ok=True)
    report_path.parent.mkdir(parents=True, exist_ok=True)

    total_seen = 0
    total_removed = 0
    removed_by_expected = defaultdict(int)
    kept_by_expected = defaultdict(int)
    removed_details = []

    for expected in CANONICAL_CLASSES:
        class_dir = data_dir / expected
        if not class_dir.exists():
            continue

        files = sorted(
            p for p in class_dir.iterdir()
            if p.is_file() and p.suffix.lower() in VALID_EXTS
        )

        for file_path in files:
            total_seen += 1
            pred = predict_label(model, file_path, input_size, profile, output_labels)

            if pred != expected:
                dest_dir = wrong_output_dir / expected
                dest_dir.mkdir(parents=True, exist_ok=True)
                dest_path = dest_dir / file_path.name

                # Avoid collisions if same name appears again
                if dest_path.exists():
                    stem = dest_path.stem
                    suffix = dest_path.suffix
                    idx = 1
                    while True:
                        candidate = dest_dir / f"{stem}_{idx:03d}{suffix}"
                        if not candidate.exists():
                            dest_path = candidate
                            break
                        idx += 1

                shutil.move(str(file_path), str(dest_path))
                total_removed += 1
                removed_by_expected[expected] += 1
                removed_details.append(
                    {
                        "original_path": str(file_path).replace("\\", "/"),
                        "moved_to": str(dest_path).replace("\\", "/"),
                        "expected": expected,
                        "predicted": pred,
                    }
                )
            else:
                kept_by_expected[expected] += 1

    report = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "model_path": str(model_path).replace("\\", "/"),
        "profile": profile,
        "model_input_size": list(input_size),
        "model_output_labels": output_labels,
        "data_dir": str(data_dir).replace("\\", "/"),
        "removed_to": str(wrong_output_dir).replace("\\", "/"),
        "total_seen": total_seen,
        "total_removed": total_removed,
        "total_kept": total_seen - total_removed,
        "removed_by_expected_class": dict(removed_by_expected),
        "kept_by_expected_class": dict(kept_by_expected),
        "removed_files": removed_details,
    }

    with report_path.open("w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    print("Pruning complete")
    print(f"Model: {model_path}")
    print(f"Profile: {profile}")
    print(f"Input size: {input_size}")
    print(f"Total seen: {total_seen}")
    print(f"Total removed: {total_removed}")
    print(f"Total kept: {total_seen - total_removed}")
    for cls in CANONICAL_CLASSES:
        print(
            f"{cls}: removed={removed_by_expected.get(cls, 0)}, "
            f"kept={kept_by_expected.get(cls, 0)}"
        )
    print(f"Wrong files moved to: {wrong_output_dir}")
    print(f"Report saved: {report_path}")


if __name__ == "__main__":
    main()
