/**
 * Magic Link Utilities
 * Generate, validate, and manage client-facing magic links
 */

import { randomBytes } from "crypto";

/** Generate a URL-safe random token */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString("base64url");
}

/** Build the full magic link URL */
export function buildMagicUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || import.meta.env.PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || "https://capcofire.com";
  return `${base}/c/${token}`;
}

/** Default expiration: 7 days from now */
export function defaultExpiry(days: number = 7): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

/** Requirement keys and their human labels */
export const REQUIREMENT_TYPES: Record<string, { label: string; description: string; accept?: string }> = {
  floor_plans: {
    label: "Floor Plans",
    description: "PDF or DWG floor plans for all levels",
    accept: ".pdf,.dwg,.dxf",
  },
  occupancy_info: {
    label: "Occupancy Information",
    description: "Building use, occupancy type, number of units/occupants",
  },
  water_supply: {
    label: "Water Supply Data",
    description: "Municipal water flow test results or water supply info",
    accept: ".pdf,.jpg,.png",
  },
  building_info: {
    label: "Building Height & Stories",
    description: "Total building height and number of stories",
  },
  existing_system: {
    label: "Existing System Info",
    description: "Details on any existing fire protection systems (retrofit projects)",
    accept: ".pdf,.jpg,.png,.doc,.docx",
  },
  ahj_forms: {
    label: "AHJ Submission Forms",
    description: "Any required forms from the local Authority Having Jurisdiction",
    accept: ".pdf,.doc,.docx",
  },
  site_photos: {
    label: "Site Photos",
    description: "Photos of the building, mechanical rooms, existing equipment",
    accept: ".jpg,.jpeg,.png,.heic",
  },
  specs: {
    label: "Project Specifications",
    description: "Architectural or MEP specs if available",
    accept: ".pdf,.doc,.docx",
  },
};

/** Get requirements for a project type */
export function getDefaultRequirements(projectType?: string): string[] {
  // Base requirements for all projects
  const base = ["floor_plans", "occupancy_info", "building_info"];

  switch (projectType) {
    case "sprinkler_new":
      return [...base, "water_supply", "specs"];
    case "sprinkler_retrofit":
      return [...base, "water_supply", "existing_system", "site_photos"];
    case "fire_alarm":
      return [...base, "specs"];
    case "nfpa25":
      return ["existing_system", "site_photos"];
    case "plan_review":
      return ["floor_plans", "specs"];
    default:
      return base;
  }
}
