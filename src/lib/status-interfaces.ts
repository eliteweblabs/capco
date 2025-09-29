// Standardized interfaces for project status data structures

export interface StatusEmail {
  usersToNotify?: any[];
  email_to_roles?: string;
  email_subject: string;
  email_content: string;
  email_type: string;
  button_text: string;
  button_link: string;
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
  est_time?: string;
}

export interface StatusConfig {
  email: StatusEmail;
  status_name: string;
  status_action: string;
  status_color: string;
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
  status_code: number;
  admin_email_subject: string;
  admin_email_content: string;
  client_email_subject: string;
  client_email_content: string;
  button_text: string;
  button_link: string;
  admin_status_name: string;
  admin_status_action: string;
  client_status_name: string;
  client_status_action: string;
  status_color: string;
  status_slug: string;
  admin_status_tab: string;
  client_status_tab: string;
  modal_admin: string;
  modal_client: string;
  modal_auto_redirect_admin: string;
  modal_auto_redirect_client: string;
  est_time: string;
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
  const emailSubject = isAdmin ? status.admin_email_subject : status.client_email_subject;
  const emailContent = isAdmin ? status.admin_email_content : status.client_email_content;

  // Determine status details
  const statusName = isAdmin ? status.admin_status_name : status.client_status_name;
  const statusAction = isAdmin ? status.admin_status_action : status.client_status_action;
  const statusTab = isAdmin ? status.admin_status_tab : status.client_status_tab;

  // Determine modal content
  const modalMessage = isAdmin ? status.modal_admin : status.modal_client;
  const modalRedirect = isAdmin
    ? status.modal_auto_redirect_admin
    : status.modal_auto_redirect_client;

  return {
    email: {
      usersToNotify: emailRecipients,
      email_to_roles: isCurrent ? status.email_to_role : undefined,
      email_subject: emailSubject,
      email_content: emailContent,
      email_type: "status_update",
      button_text: status.button_text,
      button_link: status.button_link,
    },
    status_name: statusName,
    status_action: statusAction,
    status_color: status.status_color,
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
      est_time: status.est_time,
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
    const statusCode = status.status_code;
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
