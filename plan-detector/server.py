"""
Plan Detector API - Fire Protection Plan Analysis
Renders PDF → sends to Claude Vision → returns structured takeoff data.
Usage: python3 server.py
Endpoint: POST http://localhost:5555/analyze
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import fitz  # PyMuPDF
import base64
import anthropic
import json
import os
from dotenv import load_dotenv

# Load env from the rothco project
load_dotenv(os.path.expanduser("~/Astro/rothcobuilt/.env"))

app = Flask(__name__)
CORS(app)

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

ANALYSIS_PROMPT = """You are analyzing a fire protection plan (sprinkler system drawing). Your job is to produce an accurate material takeoff.

CRITICAL RULES:
- Count items ONLY on the floor plan layouts. Do NOT count items in detail cutaway/zoom sections — those are vector-scaled enlargements where symbols appear LARGER than on the floor plans.
- Pipes on fire protection plans are ALWAYS horizontal or vertical. Anything diagonal is architectural (walls, stairs, doors) — ignore it.
- Each engineering firm uses different symbol styles. Look at the legend if present.
- Be precise. Every single head matters for the estimate.

For EACH FLOOR PLAN visible, provide:
1. Floor name/label
2. Sprinkler head count (broken down by type if distinguishable: pendent, upright, sidewall, dry-sidewall)
3. Pipe runs: identify main lines and branches, estimate lengths if scale is readable
4. Fittings: count T-junctions (tees) and L-junctions (elbows) where pipes connect
5. Risers: note locations and sizes
6. Other devices: FDC, valves, flow switches, inspector test connections, etc.
7. Any notes about the system (NFPA standard, hazard class, design density, pump/tank info)

Return your analysis as JSON with this exact structure:
{
  "project": {
    "name": "...",
    "address": "...",
    "engineer": "...",
    "standard": "NFPA 13/13R/13D",
    "system_type": "wet/dry",
    "hazard_class": "..."
  },
  "floors": [
    {
      "name": "Basement Level",
      "sprinkler_heads": {
        "total": 14,
        "types": [
          {"type": "pendent", "count": 12, "k_factor": "4.9", "notes": ""},
          {"type": "upright", "count": 2, "k_factor": "5.6", "notes": ""}
        ]
      },
      "pipes": {
        "description": "Tree configuration, 1\" to 2\" branches",
        "estimated_fittings": {
          "tees": 8,
          "elbows": 4
        }
      },
      "risers": [{"size": "1.5 inch", "direction": "up", "location": "center"}],
      "devices": [
        {"type": "flow_switch", "count": 1},
        {"type": "control_valve", "count": 1}
      ],
      "notes": ""
    }
  ],
  "equipment": {
    "fdc": {"count": 1, "size": "2.5 inch", "type": "single inlet"},
    "fire_pump": {"count": 0, "model": "", "hp": ""},
    "tank": {"count": 0, "capacity_gallons": 0},
    "backflow_preventer": {"count": 0, "size": ""}
  },
  "totals": {
    "total_heads": 63,
    "total_risers": 1,
    "total_tees": 0,
    "total_elbows": 0,
    "head_types_summary": "52 pendent, 8 sidewall, 3 upright"
  },
  "markers": [
    {"type": "sprinkler_head", "x": 0.15, "y": 0.25, "floor": "Basement Level"},
    {"type": "tee", "x": 0.20, "y": 0.30, "floor": "Basement Level"},
    {"type": "elbow", "x": 0.18, "y": 0.35, "floor": "Basement Level"},
    {"type": "riser", "x": 0.12, "y": 0.40, "floor": "Basement Level"}
  ],
  "confidence": "high/medium/low",
  "notes": "Any additional observations"
}

IMPORTANT: The "markers" array must contain an entry for EVERY item you count. x and y are fractions of the image width and height (0.0 to 1.0) representing the approximate center of each item on the plan. Be as precise as possible with positions. Include markers for: sprinkler_head, tee, elbow, riser, valve, flow_switch, fdc. Every sprinkler head must have its own marker entry.

ONLY return valid JSON. No markdown, no code fences, no explanation outside the JSON."""


def render_pdf_to_images(pdf_bytes, scale=3):
    """Render all PDF pages as base64 PNG images."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    images = []
    for page_num in range(len(doc)):
        page = doc[page_num]
        mat = fitz.Matrix(scale, scale)
        pix = page.get_pixmap(matrix=mat)
        png_bytes = pix.tobytes("png")
        b64 = base64.b64encode(png_bytes).decode("utf-8")
        images.append({
            "page": page_num + 1,
            "base64": b64,
            "width": pix.width,
            "height": pix.height
        })
    doc.close()
    return images


def analyze_with_vision(images):
    """Send rendered plan images to Claude for analysis."""
    content = []
    
    for img in images:
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/png",
                "data": img["base64"]
            }
        })
    
    content.append({
        "type": "text",
        "text": ANALYSIS_PROMPT
    })
    
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=8000,
        messages=[{"role": "user", "content": content}]
    )
    
    # Parse the JSON response
    response_text = response.content[0].text.strip()
    # Remove any markdown code fences if present
    if response_text.startswith("```"):
        response_text = response_text.split("\n", 1)[1]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
    
    return json.loads(response_text)


@app.route('/analyze', methods=['POST'])
def analyze_plan():
    """Full pipeline: upload PDF → render → analyze → return takeoff data."""
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    pdf_bytes = file.read()
    scale = float(request.form.get('scale', 3))
    
    try:
        # Step 1: Render PDF pages
        images = render_pdf_to_images(pdf_bytes, scale)
        
        # Step 2: Analyze with vision AI
        analysis = analyze_with_vision(images)
        
        # Step 3: Return everything
        # Include lower-res images for display (scale=2 for browser)
        display_images = render_pdf_to_images(pdf_bytes, scale=2)
        
        return jsonify({
            "success": True,
            "analysis": analysis,
            "pages": [{
                "page": img["page"],
                "image": f"data:image/png;base64,{img['base64']}",
                "width": img["width"],
                "height": img["height"]
            } for img in display_images]
        })
    
    except json.JSONDecodeError as e:
        return jsonify({"error": f"Failed to parse AI response: {str(e)}"}), 500
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/render-page', methods=['POST'])
def render_page():
    """Just render a PDF page, no analysis."""
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    pdf_bytes = file.read()
    page_num = int(request.form.get('page', 0))
    scale = float(request.form.get('scale', 2))
    
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page = doc[page_num]
        mat = fitz.Matrix(scale, scale)
        pix = page.get_pixmap(matrix=mat)
        b64 = base64.b64encode(pix.tobytes("png")).decode("utf-8")
        doc.close()
        
        return jsonify({
            "success": True,
            "image": f"data:image/png;base64,{b64}",
            "width": pix.width,
            "height": pix.height
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    has_key = bool(os.environ.get("ANTHROPIC_API_KEY"))
    return jsonify({"status": "ok", "has_api_key": has_key})


if __name__ == '__main__':
    print("🔥 Plan Detector API running on http://localhost:5555")
    print(f"   Anthropic key: {'✅ configured' if os.environ.get('ANTHROPIC_API_KEY') else '❌ missing'}")
    app.run(host='0.0.0.0', port=5555, debug=True)
