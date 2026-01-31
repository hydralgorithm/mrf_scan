
from loader import build_dataset
import os

# Get absolute paths from project root
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
train_dir = os.path.join(PROJECT_ROOT, "data/raw/train")
test_dir  = os.path.join(PROJECT_ROOT, "data/raw/test")

train_ds = build_dataset(train_dir)

for batch_images, batch_labels in train_ds.take(1):
    print("Batch image shape:", batch_images.shape)
    print("Batch labels:", batch_labels.numpy())
