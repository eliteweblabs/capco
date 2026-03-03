/**
 * Server/build-time helper to generate FormActionButton-equivalent HTML.
 * Use when building form HTML in JS (e.g. dynamic table rows) where Astro components can't run.
 */
import { getButtonClasses } from "./button-styles";
import { GLOBAL_BUTTON_DEFAULTS } from "./multi-step-form-config";

type FormActionType = "submit" | "cancel" | "new";

const ACTION_LABELS: Record<FormActionType, string> = {
  submit: "Submit",
  cancel: "Cancel",
  new: "New",
};

/** Icon SVGs (from icon-data) - inline for use in HTML strings */
const ICONS: Record<string, string> = {
  plus:
    '<svg class="mr-2 inline-block h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>',
  check:
    '<svg class="mr-2 inline-block h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>',
  x: '<svg class="mr-2 inline-block h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"></path><path d="M6 6l12 12"></path></svg>',
};

export function getFormActionButtonHTML(
  action: FormActionType,
  opts: {
    label?: string;
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    type?: "button" | "submit";
    className?: string;
    dataAttributes?: Record<string, string>;
    /** Use '__ID__' as placeholder; replace at runtime with actual id */
    dataIdPlaceholder?: string;
  } = {}
): string {
  const defaults = GLOBAL_BUTTON_DEFAULTS[action] as Record<string, unknown> | undefined;
  const variant = (opts as Record<string, unknown>).variant ?? defaults?.variant ?? (action === "submit" ? "primary" : "outline");
  const size = opts.size ?? (defaults?.size as string) ?? "md";
  const btnType = opts.type ?? (action === "submit" ? "submit" : "button");
  const label = opts.label ?? (defaults?.label as string) ?? ACTION_LABELS[action];
  const icon = (defaults?.icon as string) ?? (action === "submit" ? "check" : "x");
  const iconSvg = ICONS[icon] ?? "";
  const dataAttrsObj = opts.dataAttributes ?? {};
  if (opts.dataIdPlaceholder) dataAttrsObj.id = opts.dataIdPlaceholder;
  const dataAttrs = Object.entries(dataAttrsObj)
    .map(([k, v]) => `data-${k}="${String(v).replace(/"/g, "&quot;")}"`)
    .join(" ");
  const classes = getButtonClasses({
    variant: variant as any,
    size: size as any,
    className: opts.className ?? "",
  });
  return `<button type="${btnType}" class="${classes}" data-variant="${escapeHtml(variant as string)}" ${dataAttrs}>${iconSvg}${escapeHtml(label)}</button>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
