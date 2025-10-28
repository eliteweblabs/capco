/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  // Supabase - Primary (required)
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;

  // Supabase - Alternative names (optional, fallback to above)
  readonly SUPABASE_URI?: string;

  // Email configuration
  readonly EMAIL_PROVIDER?: string;
  readonly EMAIL_API_KEY?: string;
  readonly SMTP_HOST?: string;
  readonly SMTP_PORT?: string;
  readonly SMTP_SECURE?: string;
  readonly SMTP_USER?: string;
  readonly SMTP_PASS?: string;
  readonly FROM_EMAIL?: string;
  readonly FROM_NAME?: string;

  // Google Maps API
  readonly GOOGLE_MAPS_API_KEY?: string;

  // Stripe configuration
  readonly STRIPE_SECRET_KEY?: string;
  readonly STRIPE_PUBLISHABLE_KEY?: string;

  // Company branding
  readonly GLOBAL_COMPANY_NAME?: string;
  readonly GLOBAL_COMPANY_SLOGAN?: string;
  readonly YEAR?: string;

  // Development flag
  readonly DEV?: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    email?: string;
    user?: import("@supabase/supabase-js").User;
    role?: string;
  }
}

// Global window object extensions
declare global {
  interface Window {
    // Global functions and utilities
    showModal?: (
      type: string,
      title: string,
      message: string,
      duration?: number,
      redirectOrActions?:
        | Array<{ label: string; action: () => void; primary?: boolean }>
        | { url: string; delay?: number; showCountdown?: boolean },
      persist?: boolean
    ) => Promise<void>;
    trimText?: (text: string, maxLength?: number, suffix?: string) => string;
    trimWords?: (text: string, wordLimit?: number, suffix?: string) => string;
    hideNotification?: any;
    handleNewStatusModalAndEmail?: any;
    handleUrlNotification?: (type: string, message: string) => void;
    sendEmail?: (emailData: any) => Promise<any>;
    validateEmail?: (email: string) => string | null;
    updateStatus?: (projectId: string | number, status: number, data?: any) => Promise<any>;
    getProject?: (projectId: string | number) => Promise<any>;

    // Project management
    resetForm?: any;
    clipboardData?: any;

    // Proposal management
    proposalManager?: any;
    proposalHelper?: any;
    addNewLineItem?: () => void;
    initializeSubjectEditing?: () => void;
    acceptProposal?: () => void;
    createLineItemRow?: (data: any) => HTMLElement;
    updateProposalTotal?: () => void;

    // Contact form
    // contactUpload?: any;

    // Discussion management
    toggleCommentForm?: () => void;
    refreshManager?: any;
    setPageLoadStatusActionsFromUrl?: any;

    // Project management
    deleteProject?: (projectId: any) => void;

    // Notification management
    requestPushNotificationPermission?: () => void;
    resetNotifications?: () => void;

    // Count bubble utility
    updateCountBubble?: (
      parentElement: HTMLElement,
      count: number,
      options?: any
    ) => HTMLElement | null;
    COUNT_BUBBLE_PRESETS?: {
      notification: {
        bubbleClasses: string;
        maxCount: number;
        showZero: boolean;
      };
      punchlist: {
        bubbleClasses: string;
        maxCount: number;
        showZero: boolean;
      };
      small: {
        bubbleClasses: string;
        maxCount: number;
        showZero: boolean;
      };
    };

    // UX Utility Functions
    hideOnFormFocus?: (elementSelector: string, mobileOnly?: boolean) => void;
    hideOnMobileInput?: (elementSelector: string) => void;

    // Scroll utilities
    scrollToTopOnMobile?: () => void;
    scrollToTop?: (behavior?: ScrollBehavior) => void;

    // Device detection
    isMobile?: () => boolean;
    isTablet?: () => boolean;
    isDesktop?: () => boolean;
    getViewportSize?: () => "mobile" | "tablet" | "desktop";

    // Utility functions
    debounce?: <T extends (...args: any[]) => any>(func: T, wait: number) => T;
    throttle?: <T extends (...args: any[]) => any>(func: T, limit: number) => T;

    // String utilities
    unslugify?: (slug: string) => string;

    // Safari detection
    isSafariIOS?: () => boolean;
    isSafari?: () => boolean;
    isSafariBeta?: () => boolean;
    isSafari18OrLater?: () => boolean;

    // Viewport utilities
    fixSafariViewport?: () => void;
    immediateSafariViewportFix?: () => void;
    setupViewportHandling?: () => void;
    ensureViewportBounds?: (minHeight?: number, maxHeight?: number) => void;

    // Body scroll utilities
    lockBodyScroll?: () => void;
    unlockBodyScroll?: () => void;

    // Partials
    createButtonPartial?: (config: any) => Promise<HTMLElement | null>;
  }
}
