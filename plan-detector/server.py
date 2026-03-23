"""
Plan Detector API — Fire Protection Plan Analysis
Renders PDF → sends to Claude Vision → returns structured takeoff data.
Usage: python3 server.py
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import fitz
import base64
import anthropic
import json
import os
from dotenv import load_dotenv

load_dotenv(os.path.expanduser("~/Astro/rothcobuilt/.env"))

app = Flask(__name__)
CORS(app)

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

PROMPT = """You are analyzing a fire protection plan (sprinkler system drawing). Produce an accurate material takeoff.

RULES:
- Count items ONLY on floor plan layouts. IGNORE detail cutaway/zoom sections — symbols in those are scaled up (larger) and must not be double-counted.
- Pipes are ALWAYS horizontal or vertical. Diagonal lines are architectural — ignore them.
- Look at the legend/schedule if present for exact counts and head types.
- Be precise. Every head matters.

For each floor plan visible, count:
1. Sprinkler heads by type (pendent, upright, sidewall, dry-sidewall)
2. Tee junctions (where a pipe branches)
3. Elbow junctions (where a pipe turns 90°)
4. Risers (vertical pipe connections between floors)
5. Other devices (FDC, valves, flow switches, inspector test)

Return ONLY valid JSON:
{
  "project": {
    "name": "",
    "address": "",
    "engineer": "",
    "standard": "",
    "system_type": "",
    "hazard_class": ""
  },
  "floors": [
    {
      "name": "Basement Level",
      "sprinkler_heads": {
        "total": 14,
        "types": [
          {"type": "pendent", "count": 12, "k_factor": "4.9"},
          {"type": "sidewall", "count": 2, "k_factor": "5.6"}
        ]
      },
      "tees": 8,
      "elbows": 4,
      "risers": [{"size": "1.5 inch", "direction": "up"}],
      "devices": [{"type": "flow_switch", "count": 1}]
    }
  ],
  "equipment": {
    "fdc": {"count": 0, "size": "", "type": ""},
    "fire_pump": {"count": 0, "model": "", "hp": ""},
    "tank": {"count": 0, "capacity_gallons": 0},
    "backflow_preventer": {"count": 0, "size": ""}
  },
  "totals": {
    "total_heads": 63,
    "total_tees": 0,
    "total_elbows": 0,
    "total_risers": 1,
    "head_types_summary": "57 pendent, 6 sidewall"
  },
  "confidence": "high",
  "notes": ""
}"""


@app.route("/analyze", methods=["POST"])
def analyze():
    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400

    pdf_bytes = request.files["file"].read()
    scale = float(request.form.get("scale", 3))

    try:
        # Render pages
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        content = []
        display_pages = []

        for i in range(len(doc)):
            # High-res for AI
            pix = doc[i].get_pixmap(matrix=fitz.Matrix(scale, scale))
            b64 = base64.b64encode(pix.tobytes("png")).decode()
            content.append({"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": b64}})

            # Lower-res for browser display
            pix2 = doc[i].get_pixmap(matrix=fitz.Matrix(2, 2))
            b64_display = base64.b64encode(pix2.tobytes("png")).decode()
            display_pages.append({"page": i + 1, "image": "data:image/png;base64," + b64_display, "width": pix2.width, "height": pix2.height})

        doc.close()

        content.append({"type": "text", "text": PROMPT})

        # Call Claude
        resp = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            messages=[{"role": "user", "content": content}],
        )

        text = resp.content[0].text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
        if text.endswith("```"):
            text = text[:-3].strip()

        analysis = json.loads(text)

        return jsonify({"success": True, "analysis": analysis, "pages": display_pages})

    except json.JSONDecodeError as e:
        return jsonify({"error": "Bad AI response: " + str(e)}), 500
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/health")
def health():
    return jsonify({"status": "ok", "has_api_key": bool(os.environ.get("ANTHROPIC_API_KEY"))})


if __name__ == "__main__":
    print("🔥 Plan Detector API on http://localhost:5555")
    app.run(host="0.0.0.0", port=5555, debug=True)
