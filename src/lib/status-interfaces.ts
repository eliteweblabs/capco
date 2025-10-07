// Standardized interfaces for project status data structures

export interface StatusEmail {
  usersToNotify?: any[];
  emailToRoles?: string;
  emailSubject: string;
  emailContent: string;
  emailType: string;
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
  statusAction: string;
  statusColor: string;
  statusSlug: string;
  statusTab: string;
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
  statusSlug: string;
  adminStatusTab: string;
  clientStatusTab: string;
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
  const statusTab = isAdmin ? status.adminStatusTab : status.clientStatusTab;

  // Determine modal content
  const modalMessage = isAdmin ? status.modalAdmin : status.modalClient;
  const modalRedirect = isAdmin ? status.modalAutoRedirectAdmin : status.modalAutoRedirectClient;

  return {
    email: {
      usersToNotify: emailRecipients,
      emailToRoles: isCurrent ? status.email_to_role : undefined,
      emailSubject: emailSubject,
      emailContent: emailContent,
      emailType: "statusUpdate",
      buttonText: status.buttonText,
      buttonLink: status.buttonLink,
    },
    statusName: statusName,
    statusAction: statusAction,
    statusColor: status.statusColor,
    statusSlug: status.statusSlug,
    statusTab: statusTab,
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
