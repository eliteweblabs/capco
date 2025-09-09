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

  // Use client_status_name for clients, admin_status_name for admins
  if (role === "Client" && statusObj.client_status_name) {
    filteredStatusObj.status_name = statusObj.client_status_name;
    filteredStatusObj.status_tab = statusObj.client_status_tab;
  } else if (statusObj.admin_status_name) {
    filteredStatusObj.status_name = statusObj.admin_status_name || "";
  }

  return filteredStatusObj;
};
