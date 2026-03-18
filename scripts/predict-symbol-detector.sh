#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
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

SOURCE="${SOURCE:-$ROOT_DIR/public/img/test-upload.png}"
MODEL="${MODEL:-$RUNS_DIR/drawing-symbols/weights/best.pt}"
CONF="${CONF:-0.25}"
IMGSZ="${IMGSZ:-1024}"
NAME="${NAME:-predict}"

if [ ! -f "$MODEL" ]; then
  echo "Model not found: $MODEL"
  echo "Train first with: npm run ml:train-symbol-detector"
  exit 1
fi

if [ ! -e "$SOURCE" ]; then
  echo "Source not found: $SOURCE"
  exit 1
fi

"$YOLO_BIN" detect predict \
  model="$MODEL" \
  source="$SOURCE" \
  conf="$CONF" \
  imgsz="$IMGSZ" \
  project="$RUNS_DIR" \
  name="$NAME" \
  save=True \
  save_txt=True

echo "Prediction complete. Output in: $RUNS_DIR/$NAME"
