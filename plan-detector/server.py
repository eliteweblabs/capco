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
    """Step 2: Detect floor plan sections. Returns section coordinates."""
    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400

    pdf_bytes = request.files["file"].read()
    page_num = int(request.form.get("page", 0))
    scale = float(request.form.get("scale", 3))

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        pix = doc[page_num].get_pixmap(matrix=fitz.Matrix(scale, scale))
        img_data = pix.tobytes("png")
        doc.close()

        # Convert to opencv
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
        nrow, ncol = img.shape

        # Use vertical projection profiling on top portion
        _, bin_img = cv2.threshold(img, 200, 255, cv2.THRESH_BINARY_INV)

        # Try multiple heights to find best section split
        best = []
        for frac in [0.40, 0.45, 0.50, 0.55]:
            top_h = int(nrow * frac)
            top_bin = bin_img[50:top_h, :]
            col_density = np.mean(top_bin > 0, axis=0)
            col_smooth = uniform_filter1d(col_density, size=15)

            # Find gaps
            threshold = 0.03
            gaps = []
            start = None
            for i in range(len(col_smooth)):
                if col_smooth[i] < threshold and start is None:
                    start = i
                elif col_smooth[i] >= threshold and start is not None:
                    if i - start >= 20:
                        gaps.append((start, i))
                    start = None

            # Build sections from gaps
            bounds = [0]
            for s, e in gaps:
                bounds.append(s)
                bounds.append(e)
            bounds.append(ncol)

            sections = []
            for i in range(0, len(bounds) - 1, 2):
                x1, x2 = bounds[i], bounds[i + 1]
                if x2 - x1 > 150:
                    sections.append({
                        "x": int(x1),
                        "y": 0,
                        "width": int(x2 - x1),
                        "height": int(top_h + 50),
                        "label": f"Section {len(sections) + 1}"
                    })

            if len(sections) > len(best):
                best = sections

        # Convert coordinates from detection scale to display scale (scale=2)
        display_scale = 2.0
        ratio = display_scale / scale
        for s in best:
            s["x"] = int(s["x"] * ratio)
            s["y"] = int(s["y"] * ratio)
            s["width"] = int(s["width"] * ratio)
            s["height"] = int(s["height"] * ratio)

        return jsonify({"success": True, "sections": best})
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
            system="You MUST respond with ONLY valid JSON. No prose, no markdown fences, no explanation. Just the JSON object.",
            messages=[{"role": "user", "content": [
                {
                    "type": "image",
                    "source": {"type": "base64", "media_type": "image/png", "data": image_b64}
                },
                {
                    "type": "text",
                    "text": f"""Count every sprinkler head on this floor plan image ("{label}").
Also count tee junctions (pipe branches), elbow junctions (90° turns), and risers.
IGNORE any detail cutaway sections where symbols appear larger than on the floor plan.
Sprinkler heads in detail/zoom views are scaled up vectors — skip them.

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
