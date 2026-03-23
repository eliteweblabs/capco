"""
Plan Detector API — Step-by-step fire protection plan analysis
Each step is a separate endpoint. Nothing is hidden.

Endpoints:
  POST /render       → Render PDF page, return image
  POST /detect       → Detect floor plan sections, return coordinates
  POST /crop         → Crop a section, return image
  POST /count        → Count items on a single cropped floor plan
  GET  /health       → Health check
"""
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import fitz
import base64
import anthropic
import json
import os
import re
import cv2
import numpy as np
from scipy.ndimage import uniform_filter1d
from dotenv import load_dotenv

load_dotenv(os.path.expanduser("~/Astro/rothcobuilt/.env"))

app = Flask(__name__)
CORS(app)

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/render", methods=["POST"])
def render():
    """Step 1: Render a PDF page. Returns base64 PNG."""
    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400

    pdf_bytes = request.files["file"].read()
    page_num = int(request.form.get("page", 0))
    scale = float(request.form.get("scale", 2))

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        if page_num >= len(doc):
            return jsonify({"error": f"Page {page_num} not found, PDF has {len(doc)} pages"}), 400

        pix = doc[page_num].get_pixmap(matrix=fitz.Matrix(scale, scale))
        b64 = base64.b64encode(pix.tobytes("png")).decode()
        page_count = len(doc)
        doc.close()

        return jsonify({
            "success": True,
            "image": "data:image/png;base64," + b64,
            "width": pix.width,
            "height": pix.height,
            "page": page_num,
            "pageCount": page_count,
            "scale": scale
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/detect", methods=["POST"])
def detect():
    """Step 2: Detect floor plan sections via flood-fill from page corners."""
    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400

    pdf_bytes = request.files["file"].read()
    page_num = int(request.form.get("page", 0))
    scale = float(request.form.get("scale", 3))
    threshold = int(request.form.get("threshold", 200))
    close_size = float(request.form.get("close_size", 1))
    # Optional crop bounds for refinement (in detection-scale pixels)
    crop_x = request.form.get("crop_x")
    crop_y = request.form.get("crop_y")
    crop_w = request.form.get("crop_w")
    crop_h = request.form.get("crop_h")
    has_crop = crop_x is not None

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page = doc[page_num]

        # --- Pre-processing: strip text and diagonal lines from the PDF ---
        # Since these are CAD PDFs, text is vector objects we can remove directly
        strip_text = request.form.get("strip_text", "true") == "true"
        strip_diag = request.form.get("strip_diag", "true") == "true"

        if strip_text or strip_diag:
            if strip_text:
                # Remove all text blocks by redacting them with white
                text_dict = page.get_text("dict")
                for block in text_dict.get("blocks", []):
                    if block.get("type") == 0:  # text block
                        rect = fitz.Rect(block["bbox"])
                        page.add_redact_annot(rect, fill=[1, 1, 1])

            if strip_diag:
                # Remove diagonal line segments (not H/V)
                paths = page.get_drawings()
                for path in paths:
                    for item in path.get("items", []):
                        if item[0] == "l":  # line segment
                            p1, p2 = item[1], item[2]
                            dx = abs(p2.x - p1.x)
                            dy = abs(p2.y - p1.y)
                            # Diagonal = neither horizontal nor vertical
                            if dx > 2 and dy > 2:
                                rect = fitz.Rect(
                                    min(p1.x, p2.x) - 1, min(p1.y, p2.y) - 1,
                                    max(p1.x, p2.x) + 1, max(p1.y, p2.y) + 1
                                )
                                page.add_redact_annot(rect, fill=[1, 1, 1])

            page.apply_redactions()
            print(f"DETECT: stripped text={strip_text}, diag={strip_diag}")

        pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale))
        img_data = pix.tobytes("png")
        doc.close()

        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        nrow, ncol = img.shape

        # --- Tile-based flood fill approach ---
        _, binary_inv = cv2.threshold(img, threshold, 255, cv2.THRESH_BINARY_INV)

        if has_crop:
            print(f"DETECT: refining within crop ({crop_x},{crop_y},{crop_w},{crop_h})")
            cx = int(float(crop_x))
            cy = int(float(crop_y))
            cw = int(float(crop_w))
            ch = int(float(crop_h))
            mask = np.zeros_like(binary_inv)
            mask[cy:cy+ch, cx:cx+cw] = 1
            binary_inv = binary_inv * mask

        TILE = int(request.form.get("tile_size", 10))
        STEP = max(1, int(request.form.get("tile_step", TILE)))  # step < TILE = overlap
        tile_rows = (nrow - TILE) // STEP + 1
        tile_cols = (ncol - TILE) // STEP + 1

        # Build tile grid: 1 = empty tile, 0 = has significant ink
        # A tile is "empty" if ink fills less than close_size% of it
        ink_tolerance = close_size / 100.0  # reuse close_size slider as ink% tolerance
        tile_grid = np.zeros((tile_rows, tile_cols), dtype=np.uint8)

        for ty in range(tile_rows):
            for tx in range(tile_cols):
                y0 = ty * STEP
                x0 = tx * STEP
                tile = binary_inv[y0:y0+TILE, x0:x0+TILE]
                ink_ratio = np.count_nonzero(tile) / (TILE * TILE)
                if ink_ratio < ink_tolerance:
                    tile_grid[ty, tx] = 1

        # Connected components on the tile grid (4-connectivity)
        num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(
            tile_grid, connectivity=4
        )

        # Find the largest connected region of empty tiles — that's the main drawing area.
        # The margin strips are narrow, detail boxes are small — the floor plan area
        # has the most continuous white space and wins.
        #
        # If the largest region touches the edges (margin leaks into interior because
        # border has gaps), try the second largest. But prefer the absolute largest
        # as long as it's not >90% of all tiles (which would mean the whole page).
        regions = []
        for i in range(1, num_labels):
            area = stats[i, cv2.CC_STAT_AREA]
            touches_edge = False
            lx = stats[i, cv2.CC_STAT_LEFT]
            ly = stats[i, cv2.CC_STAT_TOP]
            lw = stats[i, cv2.CC_STAT_WIDTH]
            lh = stats[i, cv2.CC_STAT_HEIGHT]
            if lx == 0 or ly == 0 or lx + lw >= tile_cols or ly + lh >= tile_rows:
                touches_edge = True
            regions.append({"label": i, "area": area, "edge": touches_edge})

        regions.sort(key=lambda r: r["area"], reverse=True)

        best_label = -1
        total_tiles = tile_rows * tile_cols
        # When refining, the crop area is smaller — lower the "whole page" threshold
        max_ratio = 0.85 if not has_crop else 0.95
        for r in regions:
            if r["area"] / total_tiles > max_ratio:
                continue
            best_label = r["label"]
            break

        # If nothing found (everything was too big), just take the largest non-edge
        if best_label < 0:
            for r in regions:
                if not r["edge"]:
                    best_label = r["label"]
                    break

        # Last resort: largest period
        if best_label < 0 and regions:
            best_label = regions[0]["label"]

        best = None
        tile_pixels = []
        hull_points = []  # convex hull of the tile cluster in pixel coords
        if best_label >= 0:
            bx = int(stats[best_label, cv2.CC_STAT_LEFT]) * STEP
            by = int(stats[best_label, cv2.CC_STAT_TOP]) * STEP
            bw = int(stats[best_label, cv2.CC_STAT_WIDTH]) * STEP
            bh = int(stats[best_label, cv2.CC_STAT_HEIGHT]) * STEP

            if (bw * bh) / (nrow * ncol) > 0.03:
                # Build a binary mask of winning tiles at tile resolution
                tile_mask = np.zeros((tile_rows, tile_cols), dtype=np.uint8)
                for ty in range(tile_rows):
                    for tx in range(tile_cols):
                        if labels[ty, tx] == best_label:
                            tile_mask[ty, tx] = 255
                            tile_pixels.append({
                                "x": tx * STEP, "y": ty * STEP,
                                "w": STEP, "h": STEP
                            })

                # Find outer contour of tile mask — CHAIN_APPROX_NONE gives every pixel
                # on the boundary, so it's always 90° turns (no diagonals)
                contours, _ = cv2.findContours(tile_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
                if contours:
                    # Take the largest contour
                    largest = max(contours, key=cv2.contourArea)
                    # Convert tile-grid coords to pixel coords
                    # Simplify: only keep points where direction changes (corners)
                    prev_dx, prev_dy = 0, 0
                    for i in range(len(largest)):
                        curr = largest[i][0]
                        nxt = largest[(i + 1) % len(largest)][0]
                        dx = nxt[0] - curr[0]
                        dy = nxt[1] - curr[1]
                        if dx != prev_dx or dy != prev_dy:
                            hull_points.append([int(curr[0]) * STEP, int(curr[1]) * STEP])
                            prev_dx, prev_dy = dx, dy

                best = {"x": bx, "y": by, "w": bw, "h": bh}
                print(f"DETECT: tile flood-fill bbox=({bx},{by},{bw},{bh}), "
                      f"tiles={stats[best_label, cv2.CC_STAT_AREA]}/{tile_rows*tile_cols}, "
                      f"hull_pts={len(hull_points)}, "
                      f"page=({ncol}x{nrow}), ratio={bw*bh/(nrow*ncol):.2%}")

        # Fallback: bounding box of all ink
        if best is None:
            coords = cv2.findNonZero(binary_inv)
            if coords is not None:
                x, y, w, h = cv2.boundingRect(coords)
                best = {"x": x, "y": y, "w": w, "h": h}

        # Convert from detection scale to display scale (scale=2)
        display_scale = 2.0
        ratio = display_scale / scale
        sections = []
        display_tiles = []
        if best:
            pad = max(5, int(min(best["w"], best["h"]) * 0.01))
            sections.append({
                "x": int(max(0, best["x"] - pad) * ratio),
                "y": int(max(0, best["y"] - pad) * ratio),
                "width": int(min(best["w"] + pad * 2, ncol) * ratio),
                "height": int(min(best["h"] + pad * 2, nrow) * ratio),
                "label": "Floor Plans"
            })
            # Convert tiles to display scale
            for t in tile_pixels:
                display_tiles.append({
                    "x": int(t["x"] * ratio),
                    "y": int(t["y"] * ratio),
                    "w": max(1, int(t["w"] * ratio)),
                    "h": max(1, int(t["h"] * ratio)),
                })

        # Convert hull to display scale
        display_hull = []
        for pt in hull_points:
            display_hull.append([int(pt[0] * ratio), int(pt[1] * ratio)])

        return jsonify({"success": True, "sections": sections, "tiles": display_tiles, "hull": display_hull})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/crop", methods=["POST"])
def crop():
    """Step 3: Crop a section from the rendered image. Returns base64 PNG."""
    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400

    pdf_bytes = request.files["file"].read()
    page_num = int(request.form.get("page", 0))
    scale = float(request.form.get("scale", 3))
    x = int(float(request.form.get("x", 0)) * (scale / 2.0))  # Convert from display coords
    y = int(float(request.form.get("y", 0)) * (scale / 2.0))
    w = int(float(request.form.get("w", 100)) * (scale / 2.0))
    h = int(float(request.form.get("h", 100)) * (scale / 2.0))

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        pix = doc[page_num].get_pixmap(matrix=fitz.Matrix(scale, scale))

        # Crop using PIL
        from PIL import Image
        import io
        img = Image.open(io.BytesIO(pix.tobytes("png")))

        # Clamp
        x = max(0, min(x, img.width))
        y = max(0, min(y, img.height))
        x2 = min(x + w, img.width)
        y2 = min(y + h, img.height)

        cropped = img.crop((x, y, x2, y2))
        buf = io.BytesIO()
        cropped.save(buf, format="PNG")
        b64 = base64.b64encode(buf.getvalue()).decode()
        doc.close()

        return jsonify({
            "success": True,
            "image": "data:image/png;base64," + b64,
            "width": cropped.width,
            "height": cropped.height
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/count", methods=["POST"])
def count():
    """Step 4: Count items on a single floor plan image."""
    image_b64 = request.form.get("image")
    label = request.form.get("label", "Floor Plan")

    if not image_b64:
        return jsonify({"error": "No image provided"}), 400

    # Strip data URL prefix if present
    if "base64," in image_b64:
        image_b64 = image_b64.split("base64,")[1]

    try:
        resp = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            system="""You are a fire protection plan analyst. Respond with ONLY valid JSON — no prose, no markdown fences.

Key rules:
- Sprinkler heads are small uniform symbols on floor plans (circles with lines, dots). They are ALL the same pixel size because CAD generates them uniformly.
- IGNORE detail/cutaway sections where symbols appear LARGER than on the main floor plan — those are vector-scaled zooms and must not be double-counted.
- Pendent heads hang from ceiling (circle with dot or small circle). Sidewall heads mount on walls (half-circle or "D" shape near walls).
- Pipes are ALWAYS horizontal or vertical on plans. Diagonal lines are architectural, not piping.
- Tee junctions: where a pipe branches into two directions (T-shape intersection).
- Elbow junctions: where a pipe turns 90 degrees (L-shape).
- Risers: vertical pipe connections between floors (usually a circle with "R" or labeled).
- Count methodically: go room by room, floor by floor. Every head matters.""",
            messages=[{"role": "user", "content": [
                {
                    "type": "image",
                    "source": {"type": "base64", "media_type": "image/png", "data": image_b64}
                },
                {
                    "type": "text",
                    "text": f"""Count every fire protection item on this floor plan: "{label}"

Return JSON:
{{"label": "{label}", "heads": {{"total": N, "types": [{{"type": "pendent", "count": N}}, {{"type": "sidewall", "count": N}}]}}, "tees": N, "elbows": N, "risers": N, "notes": ""}}"""
                }
            ]}]
        )

        text = resp.content[0].text.strip()
        print(f"COUNT [{label}] raw: {text[:200]}")

        # Parse JSON robustly
        result = None
        try:
            result = json.loads(text)
        except json.JSONDecodeError:
            # Find JSON in response
            start = text.find("{")
            if start >= 0:
                depth = 0
                for i in range(start, len(text)):
                    if text[i] == "{": depth += 1
                    elif text[i] == "}": depth -= 1
                    if depth == 0:
                        try:
                            result = json.loads(text[start:i+1])
                        except:
                            pass
                        break

        if result is None:
            return jsonify({"error": "Could not parse response", "raw": text[:500]}), 500

        return jsonify({"success": True, "result": result})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("🔥 Plan Detector API on http://localhost:5555")
    print("   Endpoints: /render, /detect, /crop, /count, /health")
    app.run(host="0.0.0.0", port=5555, debug=True)
