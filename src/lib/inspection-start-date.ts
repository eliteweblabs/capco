/** `YYYY-MM-DD` for `<input type="date">` and date-only API payloads. */
export function todayDateInputValue(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function isInspectionEnabled(value: unknown): boolean {
  return value === true || value === "true" || value === "on" || value === 1 || value === "1";
}

function normalizeDateInputValue(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  return /^\d{4}-\d{2}-\d{2}/.test(trimmed) ? trimmed.slice(0, 10) : trimmed;
}

/**
 * When recurring inspection is enabled and no anchor date was provided, use today.
 */
export function resolveInspectionStartDate(
  isInspection: unknown,
  inspectionStartDate: unknown
): string | null {
  if (!isInspectionEnabled(isInspection)) return null;
  return normalizeDateInputValue(inspectionStartDate) ?? todayDateInputValue();
}

/** Default anchor date shown in the project form when the DB value is empty. */
export function inspectionStartDateForForm(project: {
  isInspection?: unknown;
  inspectionStartDate?: unknown;
  nextInspectionAt?: unknown;
}): string {
  const stored =
    normalizeDateInputValue(project.inspectionStartDate) ??
    normalizeDateInputValue(project.nextInspectionAt);
  if (stored) return stored;
  if (!isInspectionEnabled(project.isInspection)) return "";
  return todayDateInputValue();
}
