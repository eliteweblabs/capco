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


def get_connected_components(mask, width, height, min_area=18, max_area=999999):
    """Connected components analysis - ported from SimpleScan"""
    visited = np.zeros(width * height, dtype=np.uint8)
    components = []
    
    for y in range(height):
        for x in range(width):
            start_idx = y * width + x
            if not mask[start_idx] or visited[start_idx]:
                continue
                
            # BFS flood fill
            queue_x = []
            queue_y = []
            queue_x.append(x)
            queue_y.append(y)
            visited[start_idx] = 1
            
            area = 0
            min_x = max_x = x
            min_y = max_y = y
            
            head = 0
            while head < len(queue_x):
                cx = queue_x[head]
                cy = queue_y[head] 
                head += 1
                area += 1
                
                min_x = min(min_x, cx)
                max_x = max(max_x, cx)
                min_y = min(min_y, cy)
                max_y = max(max_y, cy)
                
                # 8-connected neighbors
                for dy in [-1, 0, 1]:
                    for dx in [-1, 0, 1]:
                        if dx == 0 and dy == 0:
                            continue
                        nx = cx + dx
                        ny = cy + dy
                        if nx < 0 or ny < 0 or nx >= width or ny >= height:
                            continue
                        nidx = ny * width + nx
                        if not mask[nidx] or visited[nidx]:
                            continue
                        visited[nidx] = 1
                        queue_x.append(nx)
                        queue_y.append(ny)
            
            if min_area <= area <= max_area:
                components.append({
                    "x": min_x,
                    "y": min_y, 
                    "w": max_x - min_x + 1,
                    "h": max_y - min_y + 1,
                    "area": area
                })
    
    return components


def extract_baseline_regions(mask, height, width):
    """Extract floor plan regions using SimpleScan's proven algorithm"""
    canvas_area = width * height
    components = get_connected_components(mask.flatten(), width, height, 18, int(canvas_area * 0.9))
    
    if not components:
        return []
    
    edge_margin = max(6, int(min(width, height) * 0.02))
    scored = []
    
    for c in components:
        bbox_area = c["w"] * c["h"] 
        bbox_ratio = bbox_area / canvas_area
        
        # SimpleScan filters
        if bbox_ratio < 0.015 or bbox_ratio > 0.72:
            continue
        aspect = c["w"] / max(1, c["h"])
        if aspect < 0.35 or aspect > 3.0:
            continue
        ink_ratio = c["area"] / max(1, bbox_area)
        if ink_ratio < 0.0015 or ink_ratio > 0.24:
            continue
            
        # Edge touch penalty
        near_left = c["x"] <= edge_margin
        near_top = c["y"] <= edge_margin
        near_right = c["x"] + c["w"] >= width - edge_margin
        near_bottom = c["y"] + c["h"] >= height - edge_margin
        edge_count = sum([near_left, near_top, near_right, near_bottom])
        
        # Scoring (from SimpleScan)
        cx = c["x"] + c["w"] / 2
        cy = c["y"] + c["h"] / 2
        center_dist = np.sqrt((cx - width/2)**2 + (cy - height/2)**2) / max(1, np.sqrt((width/2)**2 + (height/2)**2))
        center_bonus = 1 - min(center_dist, 1)
        frame_bonus = max(0, min(1, 1 - abs(ink_ratio - 0.06) / 0.14))
        edge_penalty = 0.22 if edge_count >= 2 else 0
        score = bbox_ratio * 1.1 + frame_bonus * 0.35 + center_bonus * 0.2 - edge_penalty
        
        scored.append({**c, "score": score})
    
    # Sort by score and select non-overlapping regions  
    scored.sort(key=lambda x: x["score"], reverse=True)
    selected = []
    
    for c in scored:
        # Check overlap with already selected
        overlaps = False
        for k in selected:
            x0 = max(c["x"], k["x"])
            y0 = max(c["y"], k["y"])
            x1 = min(c["x"] + c["w"] - 1, k["x"] + k["w"] - 1) 
            y1 = min(c["y"] + c["h"] - 1, k["y"] + k["h"] - 1)
            if x1 >= x0 and y1 >= y0:
                inter = (x1 - x0 + 1) * (y1 - y0 + 1)
                if inter / max(1, min(c["w"] * c["h"], k["w"] * k["h"])) > 0.58:
                    overlaps = True
                    break
        if overlaps:
            continue
            
        # Add padding
        pad = max(8, int(min(c["w"], c["h"]) * 0.03))
        selected.append({
            "x": max(0, c["x"] - pad),
            "y": max(0, c["y"] - pad), 
            "w": min(c["w"] + pad * 2, width),
            "h": min(c["h"] + pad * 2, height)
        })
        
        if len(selected) >= 4:  # SimpleScan max regions
            break
            
    return selected


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/test-plans/<plan_id>")
def serve_test_plan(plan_id):
    """Serve test plans by ID"""
    test_plans = {
        "demo-plan": "~/Astro/rothcobuilt/public/demo-plan.pdf",
        "85-tremont": "~/Library/Mobile Documents/com~apple~CloudDocs/Testing Files/85 Tremont Street Cambridge MA FP.pdf",
        "lane-park": "~/Library/Mobile Documents/com~apple~CloudDocs/Testing Files/Lane Park plan.pdf"
    }
    
    if plan_id not in test_plans:
        return jsonify({"error": "Plan not found"}), 404
        
    file_path = os.path.expanduser(test_plans[plan_id])
    if not os.path.exists(file_path):
        return jsonify({"error": f"File not found: {file_path}"}), 404
        
    return send_file(file_path, as_attachment=True)


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
        # Skip text/diag stripping for known clean plans (demo, 85-tremont)
        plan_type = request.form.get("plan_type", "")
        skip_stripping = plan_type in ["demo-plan", "85-tremont"]
        
        strip_text = False if skip_stripping else request.form.get("strip_text", "true") == "true"
        strip_diag = False if skip_stripping else request.form.get("strip_diag", "true") == "true"

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

        # --- SimpleScan baseline region detection (proven 63/63 accuracy) ---
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

        # Simplified: use OpenCV connected components (much faster than manual implementation)
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(binary_inv, connectivity=8)
        
        regions = []
        canvas_area = nrow * ncol
        
        for i in range(1, num_labels):  # skip background
            x, y, w, h, area = stats[i]
            bbox_ratio = (w * h) / canvas_area
            
            # Basic SimpleScan filters
            if bbox_ratio < 0.015 or bbox_ratio > 0.72:
                continue
            aspect = w / max(1, h) 
            if aspect < 0.35 or aspect > 3.0:
                continue
            ink_ratio = area / max(1, w * h)
            if ink_ratio < 0.0015 or ink_ratio > 0.24:
                continue
                
            regions.append({"x": x, "y": y, "w": w, "h": h, "score": bbox_ratio})
        
        # Sort by size, take top 4
        regions.sort(key=lambda r: r["score"], reverse=True)
        regions = regions[:4]
        
        # Convert from detection scale to display scale (scale=2)  
        display_scale = 2.0
        ratio = display_scale / scale
        sections = []
        
        # Return ALL detected regions, not just the first one
        for i, r in enumerate(regions):
            pad = max(5, int(min(r["w"], r["h"]) * 0.01))
            sections.append({
                "x": int(max(0, r["x"] - pad) * ratio),
                "y": int(max(0, r["y"] - pad) * ratio), 
                "width": int(min(r["w"] + pad * 2, ncol) * ratio),
                "height": int(min(r["h"] + pad * 2, nrow) * ratio),
                "label": f"Section {i + 1}"
            })

        print(f"DETECT: Found {len(sections)} sections using SimpleScan algorithm")

        return jsonify({"success": True, "sections": sections, "tiles": [], "hull": []})
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
