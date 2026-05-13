import { PDFDocument, PDFCheckBox, PDFTextField } from "pdf-lib";

import {
  buildDeliverableShortcodeValues,
  normalizeShortcodeKey,
  type DeliverableShortcodeExtras,
} from "./project-deliverables-shortcodes";

export interface FillDeliverablePdfParams {
  templateBytes: Uint8Array | ArrayBuffer;
  project: Record<string, unknown>;
  extras: DeliverableShortcodeExtras;
  /** When true, merges form fields into the page (recommended for finalized deliverables). */
  flatten: boolean;
}

export interface FillDeliverablePdfResult {
  pdfBytes: Uint8Array;
  fieldsFilled: number;
  fieldNamesInTemplate: string[];
  warnings: string[];
}

function coerceBool(v: string): boolean {
  const s = v.trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "y" || s === "on";
}

export async function fillDeliverablePdf(
  params: FillDeliverablePdfParams
): Promise<FillDeliverablePdfResult> {
  const warnings: string[] = [];
  const bytes =
    params.templateBytes instanceof Uint8Array
      ? params.templateBytes
      : new Uint8Array(params.templateBytes);

  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const valueMap = buildDeliverableShortcodeValues(params.project, params.extras);

  const resolveValue = (fieldName: string): string | undefined => {
    const n = normalizeShortcodeKey(fieldName);
    const direct =
      valueMap[n] ?? valueMap[fieldName.trim()] ?? valueMap[normalizeShortcodeKey(fieldName)];

    return direct ?? valueMap[fieldName.trim().replace(/^\[\[/, "").replace(/\]\]$/, "")];
  };

  let fieldsFilled = 0;
  const form = pdfDoc.getForm();

  try {
    form.updateFieldAppearances();
  } catch {
    warnings.push("Field appearance regeneration was skipped for this PDF");
  }

  const fieldNamesInTemplate = form.getFields().map((f) => f.getName());

  for (const field of form.getFields()) {
    const name = field.getName();
    const val = resolveValue(name);

    if (val === undefined || val === "") continue;

    try {
      if (field instanceof PDFTextField) {
        field.setText(val);
        fieldsFilled++;
        continue;
      }
      if (field instanceof PDFCheckBox) {
        if (coerceBool(val)) {
          field.check();
        } else {
          field.uncheck();
        }
        fieldsFilled++;
      }
      // Dropdown / radio: skip unless we later add curated option lists.
    } catch (e: unknown) {
      warnings.push(
        `could not fill field "${name}": ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  if (params.flatten) {
    try {
      form.flatten();
    } catch (e: unknown) {
      warnings.push(
        `flatten failed (returning editable form): ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  const pdfBytes = await pdfDoc.save();
  return { pdfBytes: new Uint8Array(pdfBytes), fieldsFilled, fieldNamesInTemplate, warnings };
}
