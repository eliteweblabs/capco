export const filteredStatusObj = (statusObj: any, role: string) => {
  console.log("🔍 [PROJECT-LIST-ITEM] Status object:", statusObj);
  // const statusInfo = statuses[statusCode];
  let filteredStatusObj: any = {};

  // Check if statusObj is defined before accessing its properties
  if (!statusObj) {
    console.warn("⚠️ [PROJECT-LIST-ITEM] Status object is undefined");
    return {
      status_name: "Unknown Status",
      status_tab: null,
    };
  }

  // Function to generate slug from status name
  function generateStatusSlug(statusName: string): string {
    // Generate slug from status name
    const slug = statusName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();

    return slug;
  }
  // Generate the status slug for this project
  // Default to "Client" if currentRole is empty or undefined
  // const statusTab = statusObj.status_tab || null;

  // Use client_status_name for clients, admin_status_name for admins
  if (role === "Client" && statusObj.client_status_name) {
    filteredStatusObj.status_name = statusObj.client_status_name;
    filteredStatusObj.status_slug = generateStatusSlug(statusObj.client_status_name);
    filteredStatusObj.status_tab = statusObj.client_status_tab;
  } else if (statusObj.admin_status_name) {
    filteredStatusObj.status_name = statusObj.admin_status_name;
    filteredStatusObj.status_slug = generateStatusSlug(statusObj.admin_status_name);
    filteredStatusObj.status_tab = statusObj.admin_status_tab;
  }

  return filteredStatusObj;
};
