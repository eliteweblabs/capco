export const globalCompanyData = () => {
  // Get logo from environment variable, fallback to simple text logo
  const logoFromEnv = process.env.GLOBAL_COMPANY_LOGO_SVG;
  const companyName = process.env.RAILWAY_PROJECT_NAME || "Company";

  // Default logo: Simple text-based SVG that uses company name
  const defaultLogo = `<svg xmlns="http://www.w3.org/2000/svg" height="36" viewBox="0 0 200 36">
    <text x="0" y="24" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="currentColor">${companyName}</text>
  </svg>`;

  const logo = logoFromEnv || defaultLogo;
  const icon = process.env.GLOBAL_COMPANY_ICON_SVG;

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
    globalCompanyLogo: logo,
    globalCompanyLogoDark: logo,
    globalCompanyLogoLight: logo,

    // Logo URL for OG images and social sharing (must be a file path, not SVG markup)

    // SVG markup for icons (used for favicons, converted to data URIs)
    globalCompanyIcon: icon,
    globalCompanyIconDark: icon,
    globalCompanyIconLight: icon,

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
