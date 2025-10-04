/**
 * Simple placeholder replacement utility
 */

// 🔍 PLACEHOLDER DEBUG - Status Action Fields
// console.log("🔍 [PLACEHOLDER-DEBUG] placeholder-utils.ts - Checking for status action fields");

/**
 * Get the base URL from environment or current location
 */

import { globalCompanyData } from "../pages/api/global-company-data";

export interface PlaceholderData {
  project: {
    id: number;
    address: string;
    title?: string;
    description?: string;
    sq_ft?: string | number;
    new_construction?: boolean;
    created_at?: string;
    est_time?: string;
    building?: [];
    status_name?: string;
    // New project fields
    nfpa_version?: string;
    hazardous_material?: string;
    site_access?: string;
    exterior_beacon?: string;
    fire_sprinkler_installation?: string;
    commencement_of_construction?: string;
    suppression_detection_systems?: string;
    hps_commodities?: string;
    contact_data?: {
      signed_date?: string;
      ip_address?: string;
      image?: string;
      signed_time?: string;
    };
    contract_pdf_url?: string;
    authorProfile?:
      | {
          [key: number]: {
            company_name: string;
            email: string;
            phone?: string;
            first_name?: string;
            last_name?: string;
          };
        }
      | {
          company_name: string;
          email: string;
          phone?: string;
          first_name?: string;
          last_name?: string;
        };
    assignedToProfile?: {
      company_name: string;
      email: string;
      first_name?: string;
      last_name?: string;
    };
  };
  statusData?: {
    statuses: {
      [key: number]: {
        admin: any;
        client: any;
        current: any;
      };
    };
  };
}

/**
 * Replace placeholders in a message string
 */

export function replacePlaceholders(
  message: string,
  data?: PlaceholderData | null,
  addBoldTags: boolean = false
): string {
  if (!message) {
    console.log("🔄 [PLACEHOLDER-UTILS] No message or data, returning original");
    return message;
  }

  let result = message;
  let placeholderApplied = false;

  // Extract data from project object and additional data
  const projectId = data?.project?.id;
  const baseUrl = import.meta.env.SITE_URL || process.env.SITE_URL;
  const baseProjectLink = `${baseUrl}/project`;
  const projectLink = `${baseProjectLink}/${projectId}`;

  // console.log("🔄 [PLACEHOLDER-UTILS] Project link:", projectLink, projectId);
  // console.log("🔄 [PLACEHOLDER-UTILS] Base project link:", baseProjectLink);

  // Client/Author data (with array support)
  const authorProfile = data?.project?.authorProfile;
  const isArrayProfile = Array.isArray(authorProfile);

  const clientName =
    (isArrayProfile && (authorProfile as any)[0]?.company_name) ||
    (!isArrayProfile && (authorProfile as any)?.company_name) ||
    "Client Name Missing";
  const clientEmail =
    (isArrayProfile && (authorProfile as any)[0]?.email) ||
    (!isArrayProfile && (authorProfile as any)?.email) ||
    "Client Email Missing";
  const clientPhone =
    (isArrayProfile && (authorProfile as any)[0]?.phone) ||
    (!isArrayProfile && (authorProfile as any)?.phone) ||
    "N/A";
  const clientFirstName =
    (isArrayProfile && (authorProfile as any)[0]?.first_name) ||
    (!isArrayProfile && (authorProfile as any)?.first_name) ||
    " ";
  const clientLastName =
    (isArrayProfile && (authorProfile as any)[0]?.last_name) ||
    (!isArrayProfile && (authorProfile as any)?.last_name) ||
    " ";
  // Project data
  const projectAddress = data?.project?.address || "Project Address Missing";
  const projectTitle = data?.project?.title || data?.project?.address || "Untitled Project";
  const projectDescription = data?.project?.description || "No description provided";
  const projectSqFt = data?.project?.sq_ft || "N/A";
  const projectNewConstruction = data?.project?.new_construction ? "Yes" : "No";
  const projectCreatedDate = data?.project?.created_at
    ? new Date(data?.project?.created_at).toLocaleDateString()
    : "N/A";
  const projectBuildingType = JSON.stringify(data?.project?.building) || "N/A";

  // Staff/Assigned data
  const assignedStaffName = data?.project?.assignedToProfile?.company_name || "Unassigned";
  const assignedStaffEmail = data?.project?.assignedToProfile?.email || "N/A";
  const assignedStaffFirstName = data?.project?.assignedToProfile?.first_name || "N/A";
  const assignedStaffLastName = data?.project?.assignedToProfile?.last_name || "N/A";

  // Status data
  const currentStatusName = data?.project?.status_name || "Status Name Missing";

  const estTime = data?.project?.est_time || "Est Time Missing";

  // System data
  const year = new Date().getFullYear();
  const currentDate = new Date().toLocaleDateString();
  const documentId = `DOC-${Date.now()}`;
  const documentVersion = "1.0";

  // undone
  const registrationExpirationDate = "06/30/2026";
  const registrationNumber = "48388";
  const professionalName = "Jason Kahan";

  if (registrationExpirationDate) {
    const beforeReplace = result;
    result = result.replace(/\{\{REGISTRATION_EXPIRATION_DATE\}\}/g, registrationExpirationDate);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = false;
    }
  }

  if (registrationNumber) {
    const beforeReplace = result;
    result = result.replace(/\{\{REGISTRATION_NUMBER\}\}/g, registrationNumber);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = false;
    }
  }

  if (professionalName) {
    const beforeReplace = result;
    result = result.replace(/\{\{PROFESSIONAL_NAME\}\}/g, professionalName);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = false;
    }
  }

  // Replace BASE_URL placeholders
  if (baseUrl) {
    const beforeReplace = result;
    result = result.replace(/\{\{BASE_URL\}\}/g, baseUrl);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace PROJECT_ID placeholders
  if (projectId) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*PROJECT_ID\s*\}\}/g, projectId.toString());
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = false;
    }
  }

  // Replace COUNTDOWN placeholders (if countdown variable is defined)
  // if (countdown) {
  //   result = result.replace(/\{\{\s*COUNTDOWN\s*\}\}/g, "<b>" + countdown + "</b>");
  //   addBoldTags = true;
  // }

  // Replace GLOBAL_COLOR_PRIMARY placeholders
  if (globalCompanyData().primaryColor) {
    // Ensure primary color starts with # for hexadecimal format
    let hexColor = globalCompanyData().primaryColor;
    if (!hexColor.startsWith("#")) {
      hexColor = "#" + hexColor;
    }
    const beforeReplace = result;
    result = result.replace(/\{\{\s*GLOBAL_COLOR_PRIMARY\s*\}\}/g, hexColor);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = false;
    }
  }

  // Replace GLOBAL_COLOR_SECONDARY placeholders
  if (globalCompanyData().secondaryColor) {
    // Ensure primary color starts with # for hexadecimal format
    let hexColor = globalCompanyData().secondaryColor;
    if (!hexColor.startsWith("#")) {
      hexColor = "#" + hexColor;
    }
    const beforeReplace = result;
    result = result.replace(/\{\{\s*GLOBAL_COLOR_SECONDARY\s*\}\}/g, hexColor);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = false;
    }
  }

  // Replace FONT_FAMILY placeholders (use environment variables or defaults)
  const primaryFontFamily = process.env.FONT_FAMILY || '"Outfit Variable", sans-serif';

  const pdfFontFallback = process.env.FONT_FAMILY_FALLBACK || "Arial, sans-serif";

  const beforeReplaceFontFamily = result;
  result = result.replace(/\{\{\s*FONT_FAMILY\s*\}\}/g, `${primaryFontFamily}, ${pdfFontFallback}`);
  if (result !== beforeReplaceFontFamily) {
    placeholderApplied = true;
    addBoldTags = false;
  }

  const beforeReplaceFontPrimary = result;
  result = result.replace(/\{\{\s*FONT_FAMILY_PRIMARY\s*\}\}/g, primaryFontFamily);
  if (result !== beforeReplaceFontPrimary) {
    placeholderApplied = true;
    addBoldTags = false;
  }

  const beforeReplaceFontFallback = result;
  result = result.replace(/\{\{\s*FONT_FAMILY_FALLBACK\s*\}\}/g, pdfFontFallback);
  if (result !== beforeReplaceFontFallback) {
    placeholderApplied = true;
    addBoldTags = false;
  }

  // Replace FONT_WEIGHT placeholders
  const beforeReplaceWeightNormal = result;
  result = result.replace(/\{\{\s*FONT_WEIGHT_NORMAL\s*\}\}/g, "400");
  if (result !== beforeReplaceWeightNormal) {
    placeholderApplied = true;
    addBoldTags = false;
  }

  const beforeReplaceWeightBold = result;
  result = result.replace(/\{\{\s*FONT_WEIGHT_BOLD\s*\}\}/g, "600");
  if (result !== beforeReplaceWeightBold) {
    placeholderApplied = true;
    addBoldTags = false;
  }

  const beforeReplaceWeightHeading = result;
  result = result.replace(/\{\{\s*FONT_WEIGHT_HEADING\s*\}\}/g, "700");
  if (result !== beforeReplaceWeightHeading) {
    placeholderApplied = true;
    addBoldTags = false;
  }

  // Replace FONT_SIZE placeholders
  const beforeReplaceSizeBase = result;
  result = result.replace(/\{\{\s*FONT_SIZE_BASE\s*\}\}/g, "14px");
  if (result !== beforeReplaceSizeBase) {
    placeholderApplied = true;
    addBoldTags = false;
  }

  const beforeReplaceSizeHeading = result;
  result = result.replace(/\{\{\s*FONT_SIZE_HEADING\s*\}\}/g, "24px");
  if (result !== beforeReplaceSizeHeading) {
    placeholderApplied = true;
    addBoldTags = false;
  }

  const beforeReplaceSizeSmall = result;
  result = result.replace(/\{\{\s*FONT_SIZE_SMALL\s*\}\}/g, "12px");
  if (result !== beforeReplaceSizeSmall) {
    placeholderApplied = true;
    addBoldTags = false;
  }

  // Replace COMPANY_LOGO_LIGHT placeholders
  if (globalCompanyData().globalCompanyLogoLight) {
    const beforeReplace = result;
    result = result.replace(
      /\{\{\s*COMPANY_LOGO_LIGHT\s*\}\}/g,
      globalCompanyData().globalCompanyLogoLight
    );
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = false;
    }
  }

  // Replace COMPANY_LOGO_DARK placeholders
  if (globalCompanyData().globalCompanyLogoDark) {
    const beforeReplace = result;
    result = result.replace(
      /\{\{\s*COMPANY_LOGO_DARK\s*\}\}/g,
      globalCompanyData().globalCompanyLogoDark
    );
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = false;
    }
  }

  // Replace GLOBAL_COMPANY_NAME placeholders
  if (globalCompanyData().globalCompanyName) {
    const beforeReplace = result;
    result = result.replace(
      /\{\{\s*GLOBAL_COMPANY_NAME\s*\}\}/g,
      globalCompanyData().globalCompanyName
    );
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace GLOBAL_COMPANY_SLOGAN placeholders
  if (globalCompanyData().globalCompanySlogan) {
    const beforeReplace = result;
    result = result.replace(
      /\{\{\s*GLOBAL_COMPANY_SLOGAN\s*\}\}/g,
      globalCompanyData().globalCompanySlogan
    );
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace GLOBAL_COMPANY_PHONE placeholders
  if (globalCompanyData().globalCompanyPhone) {
    const beforeReplace = result;
    result = result.replace(
      /\{\{\s*GLOBAL_COMPANY_PHONE\s*\}\}/g,
      globalCompanyData().globalCompanyPhone
    );
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace GLOBAL_COMPANY_EMAIL placeholders
  if (globalCompanyData().globalCompanyEmail) {
    const beforeReplace = result;
    result = result.replace(
      /\{\{\s*GLOBAL_COMPANY_EMAIL\s*\}\}/g,
      globalCompanyData().globalCompanyEmail
    );
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace GLOBAL_COMPANY_WEBSITE placeholders
  if (globalCompanyData().globalCompanyWebsite) {
    const beforeReplace = result;
    result = result.replace(
      /\{\{\s*GLOBAL_COMPANY_WEBSITE\s*\}\}/g,
      globalCompanyData().globalCompanyWebsite
    );
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace FIRST_NAME placeholders
  if (clientFirstName) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*FIRST_NAME\s*\}\}/g, clientFirstName);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace LAST_NAME placeholders
  if (clientLastName) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*LAST_NAME\s*\}\}/g, clientLastName);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace GLOBAL_COMPANY_ADDRESS placeholders
  if (globalCompanyData().globalCompanyAddress) {
    const beforeReplace = result;
    result = result.replace(
      /\{\{\s*GLOBAL_COMPANY_ADDRESS\s*\}\}/g,
      globalCompanyData().globalCompanyAddress
    );
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace YEAR placeholders
  if (year) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*YEAR\s*\}\}/g, year.toString());
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // === PDF-SPECIFIC PLACEHOLDERS ===

  // Project placeholders
  if (projectTitle) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*PROJECT_TITLE\s*\}\}/g, projectTitle);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  if (projectDescription) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*PROJECT_DESCRIPTION\s*\}\}/g, projectDescription);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  if (projectSqFt) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*PROJECT_SQ_FT\s*\}\}/g, projectSqFt.toString());
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  if (projectNewConstruction) {
    const projectNewConstructionVal =
      projectNewConstruction === "Yes" ? "☑ New Construction" : "☑ Existing Construction";

    const beforeReplace = result;
    result = result.replace(/\{\{\s*PROJECT_NEW_CONSTRUCTION\s*\}\}/g, projectNewConstructionVal);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  if (projectCreatedDate) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*PROJECT_CREATED_DATE\s*\}\}/g, projectCreatedDate);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  if (estTime) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*PROJECT_EST_TIME\s*\}\}/g, estTime);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }
  if (estTime) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*EST_TIME\s*\}\}/g, estTime);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  if (projectBuildingType) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*PROJECT_BUILDING_TYPE\s*\}\}/g, projectBuildingType);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Client placeholders
  if (clientName) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*CLIENT_NAME\s*\}\}/g, clientName);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  if (clientPhone) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*CLIENT_PHONE\s*\}\}/g, clientPhone);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  if (clientFirstName) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*CLIENT_FIRST_NAME\s*\}\}/g, clientFirstName);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  if (clientLastName) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*CLIENT_LAST_NAME\s*\}\}/g, clientLastName);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }
  // Staff placeholders
  if (assignedStaffName) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*ASSIGNED_STAFF_NAME\s*\}\}/g, assignedStaffName);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  if (assignedStaffEmail) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*ASSIGNED_STAFF_EMAIL\s*\}\}/g, assignedStaffEmail);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Status placeholders

  // System placeholders
  if (currentDate) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*CURRENT_DATE\s*\}\}/g, currentDate);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  if (documentId) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*DOCUMENT_ID\s*\}\}/g, documentId);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  if (documentVersion) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*DOCUMENT_VERSION\s*\}\}/g, documentVersion);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Company placeholders
  if (globalCompanyData().globalCompanyAddress) {
    const beforeReplace = result;
    result = result.replace(
      /\{\{\s*COMPANY_ADDRESS\s*\}\}/g,
      globalCompanyData().globalCompanyAddress
    );
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  if (globalCompanyData().globalCompanyPhone) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*COMPANY_PHONE\s*\}\}/g, globalCompanyData().globalCompanyPhone);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  if (globalCompanyData().globalCompanyEmail) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*COMPANY_EMAIL\s*\}\}/g, globalCompanyData().globalCompanyEmail);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  if (globalCompanyData().globalCompanyWebsite) {
    const beforeReplace = result;
    result = result.replace(
      /\{\{\s*COMPANY_WEBSITE\s*\}\}/g,
      globalCompanyData().globalCompanyWebsite
    );
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = false;
    }
  }

  if (globalCompanyData().globalCompanyLogo) {
    const beforeReplace = result;
    result = result.replace(
      /\{\{\s*COMPANY_LOGO_URL\s*\}\}/g,
      globalCompanyData().globalCompanyLogo
    );
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = false;
    }
  }

  // project placeholders
  // project placeholders
  // project placeholders
  // project placeholders
  // project placeholders
  // project placeholders

  // Track if any placeholders were actually replaced

  // Replace PROJECT_ADDRESS placeholders
  if (projectAddress) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*PROJECT_ADDRESS\s*\}\}/g, projectAddress);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace PROJECT_COMPANY_NAME placeholders
  if (clientName) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*PROJECT_COMPANY_NAME\s*\}\}/g, clientName);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace PROJECT_CLIENT_NAME placeholders
  if (clientName) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*PROJECT_CLIENT_NAME\s*\}\}/g, clientName);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace PROJECT_SIGNATURE_IP placeholders
  // const signatureIP = data?.project?.ip_address || "Unknown";
  // if (signatureIP) {
  //   const beforeReplace = result;
  //   result = result.replace(/\{\{\s*PROJECT_SIGNATURE_IP\s*\}\}/g, signatureIP);
  //   if (result !== beforeReplace) {
  //     placeholderApplied = true;
  //     addBoldTags = true;
  //   }
  // }

  // Replace PROJECT_SIGNATURE_DATE placeholders
  const signatureDate = data?.project?.contact_data?.signed_date || "Unknown";
  if (signatureDate) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*PROJECT_SIGNATURE_DATE\s*\}\}/g, signatureDate);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace PROJECT_SIGNATURE_TIME placeholders
  const signatureTime = data?.project?.contact_data?.signed_time || "Unknown";
  if (signatureTime) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*PROJECT_SIGNATURE_TIME\s*\}\}/g, signatureTime);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace PROJECT_SIGNATURE_IP placeholders
  const signatureIP = data?.project?.contact_data?.ip_address || "Unknown";
  if (signatureIP) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*PROJECT_SIGNATURE_IP\s*\}\}/g, signatureIP);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace PROJECT_SIGNATURE_IMAGE placeholders
  const signatureImage = data?.project?.contact_data?.image || "";
  const beforeReplace = result;
  result = result.replace(/\{\{\s*PROJECT_SIGNATURE_IMAGE\s*\}\}/g, signatureImage);
  if (result !== beforeReplace) {
    placeholderApplied = true;
    addBoldTags = true;
  }

  // Replace CLIENT_NAME placeholders
  if (clientName) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*CLIENT_NAME\s*\}\}/g, clientName);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace CLIENT_EMAIL placeholders
  if (clientEmail) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*CLIENT_EMAIL\s*\}\}/g, clientEmail);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace STATUS_NAME placeholders
  if (currentStatusName) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*STATUS_NAME\s*\}\}/g, currentStatusName);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // === NEW PROJECT FIELD PLACEHOLDERS ===

  // Replace NFPA_VERSION placeholders
  const nfpaVersion = data?.project?.nfpa_version || "N/A";
  if (nfpaVersion) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*NFPA_VERSION\s*\}\}/g, nfpaVersion);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace HAZARDOUS_MATERIAL placeholders
  const hazardousMaterial = data?.project?.hazardous_material || "N/A";
  if (hazardousMaterial) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*HAZARDOUS_MATERIAL\s*\}\}/g, hazardousMaterial);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace SITE_ACCESS placeholders
  const siteAccess = data?.project?.site_access || "N/A";
  if (siteAccess) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*SITE_ACCESS\s*\}\}/g, siteAccess);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace EXTERIOR_BEACON placeholders
  const exteriorBeacon = data?.project?.exterior_beacon || "N/A";
  if (exteriorBeacon) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*EXTERIOR_BEACON\s*\}\}/g, exteriorBeacon);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace FIRE_SPRINKLER_INSTALLATION placeholders
  const fireSprinklerInstallation = data?.project?.fire_sprinkler_installation || "N/A";
  if (fireSprinklerInstallation) {
    const beforeReplace = result;
    result = result.replace(
      /\{\{\s*FIRE_SPRINKLER_INSTALLATION\s*\}\}/g,
      fireSprinklerInstallation
    );
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace COMMENCEMENT_OF_CONSTRUCTION placeholders
  const commencementOfConstruction = data?.project?.commencement_of_construction || "N/A";
  if (commencementOfConstruction) {
    const beforeReplace = result;
    result = result.replace(
      /\{\{\s*COMMENCEMENT_OF_CONSTRUCTION\s*\}\}/g,
      commencementOfConstruction
    );
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace SUPPRESSION_DETECTION_SYSTEMS placeholders
  const suppressionDetectionSystems = data?.project?.suppression_detection_systems || "N/A";
  if (suppressionDetectionSystems) {
    const beforeReplace = result;
    result = result.replace(
      /\{\{\s*SUPPRESSION_DETECTION_SYSTEMS\s*\}\}/g,
      suppressionDetectionSystems
    );
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace HPS_COMMODITIES placeholders
  const hpsCommodities = data?.project?.hps_commodities || "N/A";
  if (hpsCommodities) {
    const beforeReplace = result;
    result = result.replace(/\{\{\s*HPS_COMMODITIES\s*\}\}/g, hpsCommodities);
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = true;
    }
  }

  // Replace ASCII_CHECKBOX placeholders
  const beforeReplaceCheckbox = result;
  result = result.replace(/\{\{\s*ASCII_CHECKBOX\s*\}\}/g, "☐");
  if (result !== beforeReplaceCheckbox) {
    placeholderApplied = true;
    addBoldTags = false;
  }

  // Process PROJECT_LINK placeholders
  if (result && projectLink) {
    const beforeReplace = result;
    result = result.replace(/{{PROJECT_LINK(\?[^}]*)?}}/g, (match: string, queryParams: string) => {
      const fullUrl = projectLink + (queryParams || "");

      // Extract tab parameter for display text
      let displayText = "View Project";
      if (queryParams) {
        const tabMatch = queryParams.match(/[?&]status=([^&]*)/);
        if (tabMatch && tabMatch[1]) {
          const tabName = tabMatch[1]
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .replace(/[-_]/g, " ")
            .split(" ")
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ");
          displayText = `Go to ${tabName}`;
        }
      }

      // Return button on new line
      return `<br><br><a href="${fullUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: background-color 0.2s;">${displayText}</a>`;
    });
    if (result !== beforeReplace) {
      placeholderApplied = true;
      addBoldTags = false;
    }
  }

  // return placeholderApplied && addBoldTags ? "<b>" + result + "</b>" : result;
  return result;
}
