#!/usr/bin/env python3
import argparse
import json
import os
import sys


def parse_args():
    parser = argparse.ArgumentParser(description="Run YOLO symbol detection and print JSON.")
    parser.add_argument("--model", required=True, help="Path to YOLO .pt weights")
    parser.add_argument("--source", required=True, help="Path to source image")
    parser.add_argument("--conf", type=float, default=0.25, help="Confidence threshold")
    parser.add_argument("--imgsz", type=int, default=1024, help="Inference image size")
    return parser.parse_args()


def main():
    args = parse_args()
    os.environ.setdefault("YOLO_VERBOSE", "False")

    try:
        from ultralytics import YOLO
    except Exception as exc:  # pragma: no cover
        print(json.dumps({"success": False, "error": f"ultralytics import failed: {exc}"}))
        return 2

    if not os.path.isfile(args.model):
        print(json.dumps({"success": False, "error": f"Model not found: {args.model}"}))
        return 2
    if not os.path.isfile(args.source):
        print(json.dumps({"success": False, "error": f"Source not found: {args.source}"}))
        return 2

    try:
        model = YOLO(args.model)
        results = model.predict(
            source=args.source,
            conf=args.conf,
            imgsz=args.imgsz,
            verbose=False,
            save=False,
            save_txt=False,
        )
        detections = []
        if results:
            res = results[0]
            names = res.names if isinstance(res.names, dict) else {}
            boxes = res.boxes
            if boxes is not None:
                xyxy = boxes.xyxy.tolist()
                confs = boxes.conf.tolist()
                classes = boxes.cls.tolist()
                for idx in range(len(xyxy)):
                    x1, y1, x2, y2 = xyxy[idx]
                    cls_id = int(classes[idx])
                    detections.append(
                        {
                            "classId": cls_id,
                            "className": names.get(cls_id, str(cls_id)),
                            "confidence": float(confs[idx]),
                            "x": float(x1),
                            "y": float(y1),
                            "width": float(max(1.0, x2 - x1)),
                            "height": float(max(1.0, y2 - y1)),
                        }
                    )
        print(json.dumps({"success": True, "detections": detections}))
        return 0
    except Exception as exc:  # pragma: no cover
        print(json.dumps({"success": False, "error": str(exc)}))
        return 2


if __name__ == "__main__":
    sys.exit(main())
