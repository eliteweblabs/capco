export const globalCompanyData = () => {
  // Get logos from environment variables
  // Support separate logos for light/dark mode, with fallback to single logo
  const logoLight =
    process.env.GLOBAL_COMPANY_LOGO_SVG_LIGHT || process.env.GLOBAL_COMPANY_LOGO_SVG || "";
  const logoDark =
    process.env.GLOBAL_COMPANY_LOGO_SVG_DARK || process.env.GLOBAL_COMPANY_LOGO_SVG || "";
  const logo = process.env.GLOBAL_COMPANY_LOGO_SVG || ""; // Fallback for backward compatibility

  const iconLight =
    process.env.GLOBAL_COMPANY_ICON_SVG_LIGHT || process.env.GLOBAL_COMPANY_ICON_SVG || "";
  const iconDark =
    process.env.GLOBAL_COMPANY_ICON_SVG_DARK || process.env.GLOBAL_COMPANY_ICON_SVG || "";
  const icon = process.env.GLOBAL_COMPANY_ICON_SVG || ""; // Fallback for backward compatibility

  // Website URL - ensure it has protocol
  const websiteRaw = process.env.RAILWAY_PUBLIC_DOMAIN;
  const website = websiteRaw?.startsWith("http") ? websiteRaw : `https://${websiteRaw}`;

  // Logo URL for OG images - derived from website

  // Favicon paths - consistent format with leading slash
  const faviconSvgPath = "/img/favicon.svg";
  const faviconPngPath = "/img/favicon.png";

  return {
    globalCompanyName: process.env.RAILWAY_PROJECT_NAME,
    globalCompanySlogan: process.env.GLOBAL_COMPANY_SLOGAN,
    globalCompanyAddress: process.env.GLOBAL_COMPANY_ADDRESS,
    globalCompanyPhone: process.env.VAPI_PHONE_NUMBER,
    globalCompanyEmail: process.env.GLOBAL_COMPANY_EMAIL,
    globalCompanyWebsite: process.env.RAILWAY_PUBLIC_DOMAIN,

    // SVG markup for logos (used in UI components)
    // Support light/dark mode variants
    globalCompanyLogo: logo, // Fallback for backward compatibility
    globalCompanyLogoLight: logoLight,
    globalCompanyLogoDark: logoDark,

    // Logo URL for OG images and social sharing (must be a file path, not SVG markup)

    // SVG markup for icons (used for favicons, converted to data URIs)
    // Support light/dark mode variants
    globalCompanyIcon: icon, // Fallback for backward compatibility
    globalCompanyIconLight: iconLight,
    globalCompanyIconDark: iconDark,

    // Favicon file paths (used in manifest.json and link tags)
    globalCompanyFaviconSvg: faviconSvgPath,
    globalCompanyFaviconPng: faviconPngPath,

    // Theme colors
    primaryColor: process.env.GLOBAL_COLOR_PRIMARY,
    secondaryColor: process.env.GLOBAL_COLOR_SECONDARY,
  };
};

//
//
// RAILWAY_PROJECT_NAME="CAPCO Design Group"
// # GLOBAL_COMPANY_SLOGAN="Professional Fire Protection Plan Review & Approval"
// GLOBAL_COMPANY_SLOGAN="Powering the world's most reliable fire protection systems.."
// YEAR="2025"
