import argparse
import random
import shutil
from pathlib import Path

VALID_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def collect_images(folder: Path):
    if not folder.exists():
        return []
    return [p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in VALID_EXTS]


def classify_pneumonia(file_name: str):
    lower = file_name.lower()
    if "bacteria" in lower:
        return "BACTERIAL_PNEUMONIA"
    if "virus" in lower:
        return "VIRAL_PNEUMONIA"
    return "UNKNOWN_PNEUMONIA"


def copy_with_indexed_names(files, target_dir: Path, prefix: str, rng: random.Random):
    target_dir.mkdir(parents=True, exist_ok=True)
    ordered = list(files)
    rng.shuffle(ordered)

    for idx, src in enumerate(ordered, start=1):
        ext = src.suffix.lower()
        dst = target_dir / f"{prefix}_{idx:06d}{ext}"
        shutil.copy2(src, dst)


def main():
    parser = argparse.ArgumentParser(
        description="Split mixed pneumonia files into bacterial/viral folders and anonymize filenames."
    )
    parser.add_argument(
        "--source",
        default="data/raw/test_data",
        help="Source dataset folder containing NORMAL and PNEUMONIA folders.",
    )
    parser.add_argument(
        "--output",
        default="data/raw/test_data_sanitized",
        help="Output folder with separated classes and anonymized filenames.",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for deterministic renaming order.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Delete existing output folder before writing.",
    )
    args = parser.parse_args()

    source = Path(args.source)
    output = Path(args.output)

    normal_dir = source / "NORMAL"
    mixed_dir = source / "PNEUMONIA"

    if not normal_dir.exists() or not mixed_dir.exists():
        raise FileNotFoundError(
            f"Expected folders not found under {source}. Need NORMAL and PNEUMONIA."
        )

    if output.exists():
        if not args.overwrite:
            raise FileExistsError(
                f"Output folder {output} already exists. Re-run with --overwrite to replace it."
            )
        shutil.rmtree(output)

    rng = random.Random(args.seed)

    normal_files = collect_images(normal_dir)
    mixed_files = collect_images(mixed_dir)

    bacterial_files = []
    viral_files = []
    unknown_files = []

    for file_path in mixed_files:
        cls = classify_pneumonia(file_path.name)
        if cls == "BACTERIAL_PNEUMONIA":
            bacterial_files.append(file_path)
        elif cls == "VIRAL_PNEUMONIA":
            viral_files.append(file_path)
        else:
            unknown_files.append(file_path)

    copy_with_indexed_names(normal_files, output / "NORMAL", "img", rng)
    copy_with_indexed_names(bacterial_files, output / "BACTERIAL_PNEUMONIA", "img", rng)
    copy_with_indexed_names(viral_files, output / "VIRAL_PNEUMONIA", "img", rng)

    if unknown_files:
        copy_with_indexed_names(unknown_files, output / "UNKNOWN_PNEUMONIA", "img", rng)

    print("Done: split + anonymize complete")
    print(f"Source: {source}")
    print(f"Output: {output}")
    print(f"NORMAL: {len(normal_files)}")
    print(f"BACTERIAL_PNEUMONIA: {len(bacterial_files)}")
    print(f"VIRAL_PNEUMONIA: {len(viral_files)}")
    print(f"UNKNOWN_PNEUMONIA: {len(unknown_files)}")


if __name__ == "__main__":
    main()
