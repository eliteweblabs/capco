/**
 * Utility functions for handling toast messages with placeholders
 */

export interface ToastMessageData {
  projectTitle?: string;
  clientEmail?: string;
  clientName?: string;
  projectAddress?: string;
  statusName?: string;
  countdown?: number; // Duration in seconds for countdown
  [key: string]: any;
}

/**
 * Replace placeholders in toast messages with actual data
 * @param message - The message template with placeholders
 * @param data - The data to replace placeholders with
 * @returns The message with placeholders replaced
 */
export function replaceToastPlaceholders(message: string, data: ToastMessageData): string {
  if (!message) return '';

  let result = message;

  // Replace common placeholders
  const placeholders = {
    '{{PROJECT_TITLE}}': `<strong>${data.projectTitle || 'Project'}</strong>`,
    '{{CLIENT_EMAIL}}': `<strong>${data.clientEmail || 'Client'}</strong>`,
    '{{CLIENT_NAME}}': `<strong>${data.clientName || 'Client'}</strong>`,
    '{{PROJECT_ADDRESS}}': `<strong>${data.projectAddress || 'N/A'}</strong>`,
    '{{STATUS_NAME}}': `<strong>${data.statusName || 'Status Update'}</strong>`,
    '{{COUNTDOWN}}': data.countdown ? `<span class="countdown-timer" data-duration="${data.countdown}">${data.countdown}</span>` : '',
  };

  // Replace each placeholder
  Object.entries(placeholders).forEach(([placeholder, value]) => {
    result = result.replace(new RegExp(placeholder, 'g'), value);
  });

  // Replace any custom placeholders from data
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key.toUpperCase()}}}`;
    if (result.includes(placeholder)) {
      result = result.replace(new RegExp(placeholder, 'g'), value?.toString() || '');
    }
  });

  return result;
}

/**
 * Get appropriate toast message based on user role and status
 * @param statusConfig - Status configuration from database
 * @param userRole - Current user's role
 * @param data - Data for placeholder replacement
 * @returns The appropriate toast message
 */
export function getToastMessage(
  statusConfig: { toast_admin?: string; toast_client?: string },
  userRole: string,
  data: ToastMessageData
): string {
  let message = '';

  // Determine which message to use based on role
  if (userRole === 'Admin' || userRole === 'Staff') {
    message = statusConfig.toast_admin || '';
  } else {
    message = statusConfig.toast_client || '';
  }

  // Replace placeholders
  return replaceToastPlaceholders(message, data);
}

/**
 * Prepare toast message data from project and user information
 * @param project - Project data
 * @param user - User data
 * @param statusName - Status name
 * @returns Formatted data for toast message placeholders
 */
export function prepareToastData(
  project: any,
  user: any,
  statusName?: string
): ToastMessageData {
  return {
    projectTitle: project?.title || 'Project',
    clientEmail: project?.profiles?.[0]?.email || user?.email || 'Client',
    clientName: project?.profiles?.[0]?.first_name && project?.profiles?.[0]?.last_name
      ? `${project.profiles[0].first_name} ${project.profiles[0].last_name}`
      : project?.profiles?.[0]?.company_name || 'Client',
    projectAddress: project?.address || 'N/A',
    statusName: statusName || 'Status Update',
  };
}

/**
 * Initialize countdown timers for all countdown elements in the DOM
 * This should be called after toast messages are displayed
 */
export function initializeCountdownTimers(): void {
  const countdownElements = document.querySelectorAll('.countdown-timer');
  
  countdownElements.forEach((element) => {
    const duration = parseInt(element.getAttribute('data-duration') || '0');
    if (duration > 0) {
      startCountdown(element as HTMLElement, duration);
    }
  });
}

/**
 * Start a countdown timer for a specific element
 * @param element - The HTML element to update
 * @param duration - Duration in seconds
 */
function startCountdown(element: HTMLElement, duration: number): void {
  let remaining = duration;
  
  const updateCountdown = () => {
    element.textContent = remaining.toString();
    
    if (remaining <= 0) {
      // Countdown finished - you can add redirect logic here if needed
      element.textContent = '0';
      return;
    }
    
    remaining--;
    setTimeout(updateCountdown, 1000);
  };
  
  // Start the countdown
  updateCountdown();
}
