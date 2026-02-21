/**
 * NFPA 25 Wet Pipe Sprinkler Systems — Inspection, Testing, and Maintenance
 * Single form template from 2520FMPDF.pdf. Uses proper components:
 * - InlineAddressSearch (address), ToggleButton (frequency), UnitSlider/range (psi),
 * - button-group (Yes/No/N/A), stepper (progress bar).
 * Once this form is correct, replicate the pattern for the other ~19 forms in the PDF.
 */
import type { FormFieldConfig, FormStepConfig, MultiStepFormConfig } from "../multi-step-form-config";
import { normalizeFormConfig } from "../multi-step-form-config";

const YNA_BUTTONS = [
  { type: "choice" as const, label: "Yes", dataValue: "yes" },
  { type: "choice" as const, label: "No", dataValue: "no" },
  { type: "choice" as const, label: "N/A", dataValue: "na" },
];

/** One step = one Yes/No/N/A item. Hidden must be first so handler updates it. */
function ynaStep(
  name: string,
  label: string,
  prevStep: number,
  nextStep: number,
  isLast: boolean
): FormStepConfig {
  return {
    title: label,
    fields: [
      { id: `h_${name}`, name, type: "hidden", value: "" },
      { id: `bg_${name}`, name, type: "button-group", label, buttons: YNA_BUTTONS },
    ],
    buttons: [
      { type: "prev", label: "Back", dataPrev: prevStep },
      isLast
        ? { type: "submit", label: "Submit", variant: "primary" }
        : { type: "next", label: "Next", dataNext: nextStep },
    ],
  };
}

/** Address field using InlineAddressSearch (Google Places). */
function addressField(id: string, name: string, placeholder: string): FormFieldConfig {
  return {
    id,
    name,
    type: "component",
    component: "InlineAddressSearch",
    label: placeholder,
    componentProps: {
      placeholder: placeholder,
      fetchApiEndpoint: "/api/google/places-autocomplete",
      apiParams: { types: "address", components: "country:us" },
    },
  };
}

export const nfpa25WetPipeItmFormConfig: MultiStepFormConfig = normalizeFormConfig({
  formId: "nfpa25-wet-pipe-itm-form",
  formAction: "/api/nfpa25/wet-pipe-itm",
  formMethod: "post",
  totalSteps: 1,
  progressBar: true,
  registerUser: false,

  steps: [
    // Step 1: Property & inspector — text + address component
    {
      title: "Property & Inspector",
      subtitle: "Wet Pipe Sprinkler Systems — ITM",
      fieldLayout: "grid",
      fields: [
        { id: "propertyName", name: "propertyName", type: "text", placeholder: "Property Name", required: true },
        { id: "inspector", name: "inspector", type: "text", placeholder: "Inspector", required: true },
        addressField("propertyAddress", "propertyAddress", "Property Address"),
        { id: "contractNo", name: "contractNo", type: "text", placeholder: "Contract No." },
        { id: "propertyPhone", name: "propertyPhone", type: "tel", placeholder: "Property Phone Number" },
        { id: "date", name: "date", type: "date", label: "Date", required: true },
      ],
      buttons: [{ type: "next", label: "Next", dataNext: 2 }],
    },

    // Step 2: Inspection frequency — ToggleButton multi-select (Daily, Weekly, …)
    {
      title: "Inspection Frequency",
      subtitle: "Select all that apply",
      fields: [
        {
          id: "inspectionFrequency",
          name: "inspectionFrequency",
          type: "component",
          component: "ToggleButton",
          label: "Frequency",
          toggleType: "multi-select",
          options: [
            { value: "daily", label: "Daily" },
            { value: "weekly", label: "Weekly" },
            { value: "monthly", label: "Monthly" },
            { value: "quarterly", label: "Quarterly" },
            { value: "annually", label: "Annually" },
            { value: "five_years", label: "Five Years" },
          ],
        },
      ],
      buttons: [
        { type: "prev", label: "Back", dataPrev: 1 },
        { type: "next", label: "Next", dataNext: 3 },
      ],
    },

    // Step 3: Daily — Valve (cold weather)
    ynaStep(
      "daily_valve_enclosure",
      "Daily — Valve (Cold Weather): Enclosure inspected during cold weather to verify minimum 40°F (4°C)",
      2,
      4,
      false
    ),

    // Step 4: Weekly — Backflow
    ynaStep(
      "weekly_backflow_isolation",
      "Weekly — Backflow: Isolation valves in open position and locked or supervised",
      3,
      5,
      false
    ),

    // Step 5: Weekly — Master pressure (psi) — range / UnitSlider
    {
      title: "Weekly — Master Pressure-Regulating Device",
      subtitle: "Downstream pressure (psi)",
      fields: [
        {
          id: "weekly_mprd_downstream_psi",
          name: "weekly_mprd_downstream_psi",
          type: "range",
          label: "Downstream pressure (psi)",
          min: 0,
          max: 300,
          step: 5,
          value: 0,
        },
      ],
      buttons: [
        { type: "prev", label: "Back", dataPrev: 4 },
        { type: "next", label: "Next", dataNext: 6 },
      ],
    },

    // Step 6: Weekly — Control valves position
    ynaStep(
      "weekly_control_correct_position",
      "Weekly — Control Valves: In the correct (open or closed) position",
      5,
      7,
      false
    ),

    // Step 7: Monthly — Gauges
    ynaStep(
      "monthly_gauges_condition",
      "Monthly — Gauges are in good operating condition",
      6,
      8,
      false
    ),

    // Step 8: Quarterly — Main drain test static psi (number)
    {
      title: "Quarterly — Main Drain Test",
      subtitle: "Static and residual pressure (psi)",
      fieldLayout: "grid",
      fields: [
        {
          id: "quarterly_main_drain_static_psi",
          name: "quarterly_main_drain_static_psi",
          type: "number",
          placeholder: "Static psi",
          min: 0,
          max: 300,
        },
        {
          id: "quarterly_main_drain_residual_psi",
          name: "quarterly_main_drain_residual_psi",
          type: "number",
          placeholder: "Residual psi",
          min: 0,
          max: 300,
        },
      ],
      buttons: [
        { type: "prev", label: "Back", dataPrev: 7 },
        { type: "next", label: "Next", dataNext: 9 },
      ],
    },

    // Step 9: Annual — Sprinklers
    ynaStep(
      "annual_sprinklers_no_damage",
      "Annual — Sprinklers (visible): No damage or leaks",
      8,
      10,
      false
    ),

    // Step 10: Comments & signature — textarea, text, address component
    {
      title: "Comments & Signature",
      subtitle: "Contractor information",
      fieldLayout: "grid",
      fields: [
        { id: "comments", name: "comments", type: "textarea", placeholder: "Comments", rows: 4 },
        { id: "signature", name: "signature", type: "signature", label: "Signature", required: false },
        { id: "signatureDate", name: "signatureDate", type: "date", label: "Date" },
        { id: "contractorName", name: "contractorName", type: "text", placeholder: "Contractor Name" },
        addressField("contractorAddress", "contractorAddress", "Contractor Address"),
        { id: "licenseCertNo", name: "licenseCertNo", type: "text", placeholder: "License/Certification No." },
      ],
      buttons: [
        { type: "prev", label: "Back", dataPrev: 9 },
        { type: "submit", label: "Submit", variant: "primary" },
      ],
    },
  ],
});
