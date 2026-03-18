#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATA_YAML="$ROOT_DIR/ml/symbol-detector/data.yaml"
RUNS_DIR="$ROOT_DIR/ml/symbol-detector/runs"
VENV_PYTHON="$ROOT_DIR/ml/symbol-detector/.venv/bin/python"
VENV_YOLO="$ROOT_DIR/ml/symbol-detector/.venv/bin/yolo"
SETUP_SCRIPT="$ROOT_DIR/scripts/setup-symbol-detector-env.sh"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required."
  exit 1
fi

PYTHON_BIN="python3"
YOLO_BIN="yolo"
if [ -x "$VENV_PYTHON" ]; then
  PYTHON_BIN="$VENV_PYTHON"
fi
if [ -x "$VENV_YOLO" ]; then
  YOLO_BIN="$VENV_YOLO"
fi

if ! "$PYTHON_BIN" -c "import ultralytics" >/dev/null 2>&1; then
  echo "ultralytics is not installed for $PYTHON_BIN"
  echo "Running setup script..."
  bash "$SETUP_SCRIPT"
  PYTHON_BIN="$VENV_PYTHON"
  YOLO_BIN="$VENV_YOLO"
fi

if [ ! -f "$DATA_YAML" ]; then
  echo "Missing $DATA_YAML"
  echo "Run: npm run ml:prepare-symbol-detector"
  exit 1
fi

mkdir -p "$RUNS_DIR"

MODEL="${MODEL:-yolov8n.pt}"
EPOCHS="${EPOCHS:-80}"
IMGSZ="${IMGSZ:-1024}"
BATCH="${BATCH:-8}"
DEVICE="${DEVICE:-cpu}"
NAME="${NAME:-drawing-symbols}"

echo "Training symbol detector..."
echo "Model=$MODEL EPOCHS=$EPOCHS IMGSZ=$IMGSZ BATCH=$BATCH DEVICE=$DEVICE"
echo "Python=$PYTHON_BIN"
echo "YOLO=$YOLO_BIN"

"$YOLO_BIN" detect train \
  data="$DATA_YAML" \
  model="$MODEL" \
  epochs="$EPOCHS" \
  imgsz="$IMGSZ" \
  batch="$BATCH" \
  device="$DEVICE" \
  project="$RUNS_DIR" \
  name="$NAME"

echo "Training complete. Runs are in: $RUNS_DIR"
