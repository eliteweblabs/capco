# Symbol Detector Training (YOLO)

This folder contains the training pipeline for a learned drawing symbol detector.

## Why this exists

Template matching + heuristic thresholds are not stable enough for production across many plan styles.  
This pipeline trains a detector model on labeled examples.

## Labels format

Create `fixtures/drawing-analyzer/training/annotations.json` from the example:

- `classes`: ordered class names (e.g. sprinkler, control_valve, smoke_detector)
- `items[]`: each image + split + absolute pixel boxes

Example source:

- `fixtures/drawing-analyzer/training/annotations.example.json`

## Prepare dataset

```bash
npm run ml:prepare-symbol-detector
```

This generates:

- `ml/symbol-detector/dataset/images/{train,val,test}`
- `ml/symbol-detector/dataset/labels/{train,val,test}` (YOLO txt)
- `ml/symbol-detector/data.yaml`

## Train

Set up local Python env (recommended):

```bash
npm run ml:setup-symbol-detector
```

Run training:

```bash
npm run ml:train-symbol-detector
```

Quick smoke run:

```bash
EPOCHS=1 BATCH=1 IMGSZ=640 npm run ml:train-symbol-detector
```

Optional env overrides:

- `MODEL` (default `yolov8n.pt`)
- `EPOCHS` (default `80`)
- `IMGSZ` (default `1024`)
- `BATCH` (default `8`)
- `DEVICE` (default `cpu`)
- `NAME` (default `drawing-symbols`)

## Predict

```bash
npm run ml:predict-symbol-detector
```

Optional env overrides:

- `MODEL` (weights path)
- `SOURCE` (image/pdf-render path)
- `CONF` (confidence threshold)
- `IMGSZ`
- `NAME`

## Next integration step

Use trained detections as primary source for the analyzer UI/API, and keep fixture validation as the pass/fail gate.
