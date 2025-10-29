/**
 * API Response Optimization Utilities
 * 
 * Standardized response helpers for consistent API responses across the application
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
  code?: string;
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: string,
  status: number = 400,
  details?: any,
  code?: string
): Response {
  const response: ApiResponse = {
    success: false,
    error,
    ...(details && { details }),
    ...(code && { code }),
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T = any>(
  data: T,
  message?: string,
  status: number = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

/**
 * Creates a standardized validation error response
 */
export function createValidationErrorResponse(
  errors: Record<string, string[]>,
  status: number = 422
): Response {
  return createErrorResponse("Validation failed", status, { validation: errors }, "VALIDATION_ERROR");
}

/**
 * Creates a standardized authentication error response
 */
export function createAuthErrorResponse(message: string = "Authentication required"): Response {
  return createErrorResponse(message, 401, undefined, "AUTH_ERROR");
}

/**
 * Creates a standardized authorization error response
 */
export function createAuthorizationErrorResponse(message: string = "Insufficient permissions"): Response {
  return createErrorResponse(message, 403, undefined, "AUTHORIZATION_ERROR");
}

/**
 * Creates a standardized not found error response
 */
export function createNotFoundErrorResponse(resource: string = "Resource"): Response {
  return createErrorResponse(`${resource} not found`, 404, undefined, "NOT_FOUND");
}

/**
 * Creates a standardized server error response
 */
export function createServerErrorResponse(
  message: string = "Internal server error",
  details?: any
): Response {
  return createErrorResponse(message, 500, details, "SERVER_ERROR");
}

/**
 * Creates a standardized rate limit error response
 */
export function createRateLimitErrorResponse(
  message: string = "Too many requests",
  retryAfter?: number
): Response {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": "true",
  };

  if (retryAfter) {
    headers["Retry-After"] = retryAfter.toString();
  }

  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      code: "RATE_LIMIT",
      ...(retryAfter && { retryAfter }),
    }),
    {
      status: 429,
      headers,
    }
  );
}

/**
 * Creates a standardized pagination response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): Response {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const response: ApiResponse<{
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> = {
    success: true,
    data: {
      items: data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    },
    ...(message && { message }),
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

/**
 * Handles CORS preflight requests
 */
export function handleCorsPreflight(): Response {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400",
    },
  });
}

/**
 * Validates required fields in request body
 */
export function validateRequiredFields(
  body: Record<string, any>,
  requiredFields: string[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields = requiredFields.filter(field => 
    body[field] === undefined || body[field] === null || body[field] === ""
  );

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Sanitizes string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove < and >
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates phone number format (basic US format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
}

/**
 * Generates a random string for IDs, tokens, etc.
 */
export function generateRandomString(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Formats currency for display
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Formats date for API responses
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString();
}

/**
 * Calculates pagination offset
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Clamps a number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Deep clones an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Checks if a value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

/**
 * Safely parses JSON with error handling
 */
export function safeJsonParse<T = any>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Safely stringifies JSON with error handling
 */
export function safeJsonStringify(obj: any, fallback: string = "{}"): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return fallback;
  }
}
