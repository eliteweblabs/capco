// OTP Email Form Configuration
// Centralized configuration for OTP authentication email input

export interface OTPEmailConfig {
  id: string;
  name: string;
  type: "email";
  placeholder: string;
  required: boolean;
  autocomplete: string;
  autofocus: boolean;
  label: {
    text: string;
    classes: string;
  };
  validation: {
    type: string;
    errorMessage: string;
  };
}

export const otpEmailConfig: OTPEmailConfig = {
  id: "otp-email",
  name: "email",
  type: "email" as const,
  placeholder: "Your email address",
  required: true,
  autocomplete: "email",
  autofocus: true,
  label: {
    text: "Email",
    classes: "hidden mb-1 text-sm font-medium text-gray-700 dark:text-gray-300",
  },
  validation: {
    type: "email",
    errorMessage: "Please enter your email address",
  },
};

export interface OTPCodeConfig {
  id: string;
  name: string;
  type: "text";
  placeholder: string;
  required: boolean;
  maxlength: number;
  pattern: string;
  autocomplete: string;
  label: {
    text: string;
    classes: string;
  };
  instructionText: string;
  validation: {
    length: number;
    errorMessage: string;
  };
}

export const otpCodeConfig: OTPCodeConfig = {
  id: "otp-code",
  name: "token",
  type: "text" as const,
  placeholder: "Enter 6-digit code",
  required: true,
  maxlength: 6,
  pattern: "[0-9]{6}",
  autocomplete: "one-time-code",
  label: {
    text: "Verification Code",
    classes: "hidden mb-1 text-sm font-medium text-gray-700 dark:text-gray-300",
  },
  instructionText: "Enter the 6-digit code sent to",
  validation: {
    length: 6,
    errorMessage: "Please enter a valid 6-digit code",
  },
};

type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "outline"
  | "ghost"
  | "link"
  | "loading"
  | "disabled"
  | "anchor"
  | "selected"
  | "tab";

type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";
type IconPosition = "left" | "right";
type ButtonType = "button" | "reset" | "submit";

export interface OTPFormButtonConfig {
  sendCode: {
    type: ButtonType;
    variant: ButtonVariant;
    size: ButtonSize;
    icon: string;
    iconPosition: IconPosition;
    label: string;
  };
  verify: {
    type: ButtonType;
    variant: ButtonVariant;
    size: ButtonSize;
    icon: string;
    iconPosition: IconPosition;
    label: string;
  };
  back: {
    variant: ButtonVariant;
    size: ButtonSize;
    icon: string;
    iconPosition: IconPosition;
    label: string;
  };
  resend: {
    type: ButtonType;
    classes: string;
    label: string;
  };
}

export const otpFormButtonConfig: OTPFormButtonConfig = {
  sendCode: {
    type: "submit" as const,
    variant: "primary" as const,
    size: "lg" as const,
    icon: "mail",
    iconPosition: "right" as const,
    label: "Send Code",
  },
  verify: {
    type: "submit" as const,
    variant: "primary" as const,
    size: "lg" as const,
    icon: "check",
    iconPosition: "right" as const,
    label: "Verify",
  },
  back: {
    variant: "outline" as const,
    size: "lg" as const,
    icon: "arrow-left",
    iconPosition: "left" as const,
    label: "back",
  },
  resend: {
    type: "button" as const,
    classes:
      "text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline",
    label: "Resend code",
  },
};

export interface OTPApiConfig {
  endpoints: {
    sendOtp: string;
    verifyOtp: string;
  };
  requestBody: {
    sendOtp: {
      type: string;
    };
    verifyOtp: {
      type: string;
    };
  };
  redirectUrl: string;
}

export const otpApiConfig: OTPApiConfig = {
  endpoints: {
    sendOtp: "/api/auth/send-otp",
    verifyOtp: "/api/auth/verify-otp",
  },
  requestBody: {
    sendOtp: {
      type: "magiclink",
    },
    verifyOtp: {
      type: "email",
    },
  },
  redirectUrl: "/project/dashboard",
};

export interface OTPNotificationConfig {
  sending: {
    type: string;
    title: string;
    message: string;
  };
  sent: {
    type: string;
    title: string;
    message: string;
  };
  verifying: {
    type: string;
    title: string;
    message: string;
  };
  verified: {
    type: string;
    title: string;
    message: string;
  };
  error: {
    type: string;
    title: string;
  };
  resending: {
    type: string;
    title: string;
    message: string;
  };
  resent: {
    type: string;
    title: string;
    message: string;
  };
}

export const otpNotificationConfig: OTPNotificationConfig = {
  sending: {
    type: "info",
    title: "Sending Code...",
    message: "Please wait while we send your verification code",
  },
  sent: {
    type: "success",
    title: "Code Sent!",
    message: "Check your email for the verification code",
  },
  verifying: {
    type: "info",
    title: "Verifying...",
    message: "Please wait while we verify your code",
  },
  verified: {
    type: "success",
    title: "Success!",
    message: "Verification successful. Redirecting...",
  },
  error: {
    type: "error",
    title: "Error",
  },
  resending: {
    type: "info",
    title: "Resending Code...",
    message: "Please wait",
  },
  resent: {
    type: "success",
    title: "Code Resent!",
    message: "Check your email for the new code",
  },
};
