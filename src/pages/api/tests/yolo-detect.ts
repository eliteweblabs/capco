import type { APIRoute } from "astro";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

export const prerender = false;

const execFileAsync = promisify(execFile);

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function firstExisting(paths: string[]): string | null {
  for (const p of paths) {
    if (existsSync(p)) return p;
  }
  return null;
}

function resolveModelPath(modelPathRaw: unknown): string | null {
  const root = process.cwd();
  const envModel = String(import.meta.env.SYMBOL_DETECTOR_MODEL || "").trim();
  const requested = String(modelPathRaw || "").trim();
  const candidates = [
    requested ? path.resolve(root, requested) : "",
    envModel ? path.resolve(root, envModel) : "",
    path.join(root, "ml/symbol-detector/runs/drawing-symbols-smoke2/weights/best.pt"),
    path.join(root, "ml/symbol-detector/runs/drawing-symbols/weights/best.pt"),
  ].filter(Boolean);
  return firstExisting(candidates);
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  const imageDataUrl = String(body.imageDataUrl || "");
  if (!imageDataUrl.startsWith("data:image/")) {
    return json({ success: false, error: "imageDataUrl (data URL) is required" }, 400);
  }

  const modelPath = resolveModelPath(body.modelPath);
  if (!modelPath) {
    return json({ success: false, error: "No YOLO model found", modelMissing: true }, 200);
  }

  const conf = Number.isFinite(Number(body.conf)) ? Number(body.conf) : 0.2;
  const imgsz = Number.isFinite(Number(body.imgsz)) ? Number(body.imgsz) : 1024;
  const root = process.cwd();
  const pythonPath = path.join(root, "ml/symbol-detector/.venv/bin/python");
  const scriptPath = path.join(root, "scripts/predict-symbol-detector-json.py");
  const tmpPath = path.join(os.tmpdir(), `symbol-detect-${randomUUID()}.png`);

  try {
    const commaIdx = imageDataUrl.indexOf(",");
    if (commaIdx < 0) return json({ success: false, error: "Invalid data URL" }, 400);
    const base64 = imageDataUrl.slice(commaIdx + 1);
    const bytes = Buffer.from(base64, "base64");
    await fs.writeFile(tmpPath, bytes);

    const { stdout } = await execFileAsync(pythonPath, [
      scriptPath,
      "--model",
      modelPath,
      "--source",
      tmpPath,
      "--conf",
      String(conf),
      "--imgsz",
      String(imgsz),
    ]);

    const parsed = JSON.parse(stdout || "{}");
    if (!parsed || parsed.success !== true) {
      return json(
        {
          success: false,
          error: parsed?.error || "YOLO inference failed",
          modelPath,
        },
        200
      );
    }
    return json({
      success: true,
      detections: Array.isArray(parsed.detections) ? parsed.detections : [],
      modelPath,
    });
  } catch (error) {
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "YOLO request failed",
        modelPath,
      },
      200
    );
  } finally {
    await fs.unlink(tmpPath).catch(() => {});
  }
};
