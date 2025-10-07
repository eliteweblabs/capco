// Standardized interfaces for project status data structures

export interface StatusEmail {
  usersToNotify?: any[];
  email_to_roles?: string;
  email_subject: string;
  email_content: string;
  email_type: string;
  buttonText: string;
  buttonLink: string;
}

export interface StatusModal {
  type: string;
  persist: boolean;
  message: string;
  title: string;
  redirect: {
    url: string;
    delay: number;
    showCountdown: boolean;
  };
  showCountdown: boolean;
  duration: number;
  estTime?: string;
}

export interface StatusConfig {
  email: StatusEmail;
  statusName: string;
  status_action: string;
  statusColor: string;
  status_slug: string;
  status_tab: string;
  modal: StatusModal;
}

export interface SimplifiedStatus {
  admin: StatusConfig;
  client: StatusConfig;
  current: StatusConfig;
}

export interface StatusData {
  statusCode: number;
  adminEmailSubject: string;
  adminEmailContent: string;
  clientEmailSubject: string;
  clientEmailContent: string;
  buttonText: string;
  buttonLink: string;
  adminStatusName: string;
  adminStatusAction: string;
  clientStatusName: string;
  clientStatusAction: string;
  statusColor: string;
  status_slug: string;
  admin_status_tab: string;
  client_status_tab: string;
  modalAdmin: string;
  modalClient: string;
  modalAutoRedirectAdmin: string;
  modalAutoRedirectClient: string;
  estTime: string;
  email_to_role: string;
}

// Utility function to create standardized status configuration
export function createStatusConfig(
  status: StatusData,
  role: "admin" | "client" | "current",
  isAdminOrStaff: boolean,
  adminStaffEmails: any[],
  projectAuthorEmail?: string
): StatusConfig {
  const isCurrent = role === "current";
  const isAdmin = role === "admin" || (isCurrent && isAdminOrStaff);
  const isClient = role === "client" || (isCurrent && !isAdminOrStaff);

  // Determine email recipients
  let emailRecipients: any[] = [];
  if (isAdmin) {
    emailRecipients = adminStaffEmails;
  } else if (isClient && projectAuthorEmail) {
    emailRecipients = [{ email: projectAuthorEmail }];
  }

  // Determine email content
  const emailSubject = isAdmin ? status.adminEmailSubject : status.clientEmailSubject;
  const emailContent = isAdmin ? status.adminEmailContent : status.clientEmailContent;

  // Determine status details
  const statusName = isAdmin ? status.adminStatusName : status.clientStatusName;
  const statusAction = isAdmin ? status.adminStatusAction : status.clientStatusAction;
  const statusTab = isAdmin ? status.admin_status_tab : status.client_status_tab;

  // Determine modal content
  const modalMessage = isAdmin ? status.modalAdmin : status.modalClient;
  const modalRedirect = isAdmin ? status.modalAutoRedirectAdmin : status.modalAutoRedirectClient;

  return {
    email: {
      usersToNotify: emailRecipients,
      email_to_roles: isCurrent ? status.email_to_role : undefined,
      email_subject: emailSubject,
      email_content: emailContent,
      email_type: "statusUpdate",
      buttonText: status.buttonText,
      buttonLink: status.buttonLink,
    },
    statusName: statusName,
    status_action: statusAction,
    statusColor: status.statusColor,
    status_slug: status.status_slug,
    status_tab: statusTab,
    modal: {
      type: "info",
      persist: false,
      message: modalMessage,
      title: "Project Updated",
      redirect: {
        url: modalRedirect,
        delay: 3000,
        showCountdown: true,
      },
      showCountdown: true,
      duration: 2500,
      estTime: status.estTime,
    },
  };
}

// Utility function to create the complete simplified statuses structure
export function createSimplifiedStatuses(
  statusesData: StatusData[],
  isAdminOrStaff: boolean,
  adminStaffEmails: any[],
  projectAuthorEmail?: string
): Record<number, SimplifiedStatus> {
  const simplifiedStatuses: Record<number, SimplifiedStatus> = {};

  statusesData.forEach((status: StatusData) => {
    const statusCode = status.statusCode;
    if (statusCode) {
      simplifiedStatuses[statusCode] = {
        admin: createStatusConfig(
          status,
          "admin",
          isAdminOrStaff,
          adminStaffEmails,
          projectAuthorEmail
        ),
        client: createStatusConfig(
          status,
          "client",
          isAdminOrStaff,
          adminStaffEmails,
          projectAuthorEmail
        ),
        current: createStatusConfig(
          status,
          "current",
          isAdminOrStaff,
          adminStaffEmails,
          projectAuthorEmail
        ),
      };
    }
  });

  return simplifiedStatuses;
}
