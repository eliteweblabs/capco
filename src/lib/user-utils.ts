// User utility functions for fetching and managing user information

export interface UserInfo {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  phone: string | null;
  phone_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
  user_metadata: any;
  app_metadata: any;
  profile: {
    id: string;
    name: string | null;
    company_name: string | null;
    email: string | null;
    role: string | null;
    phone: string | null;
    created_at: string | null;
    updated_at: string | null;
  } | null;
  display_name: string;
  role: string;
  company_name: string | null;
}

/**
 * Fetch user information by user ID
 * @param userId - The UUID of the user
 * @returns Promise<UserInfo> - Complete user information
 */
export async function getUserInfo(userId: string): Promise<UserInfo> {
  try {
    const response = await fetch("/api/get-user-info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch user info");
    }

    return data.user;
  } catch (error) {
    console.error("Error fetching user info:", error);
    throw error;
  }
}

/**
 * Fetch user information by user ID using GET method
 * @param userId - The UUID of the user
 * @returns Promise<UserInfo> - Complete user information
 */
export async function getUserInfoGET(userId: string): Promise<UserInfo> {
  try {
    const response = await fetch(`/api/get-user-info?userId=${userId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch user info");
    }

    return data.user;
  } catch (error) {
    console.error("Error fetching user info:", error);
    throw error;
  }
}

/**
 * Get display name for a user with fallbacks
 * @param userInfo - User information object
 * @returns string - Best available display name
 */
export function getDisplayName(userInfo: UserInfo): string {
  return userInfo.display_name;
}

/**
 * Get company name for a user
 * @param userInfo - User information object
 * @returns string | null - Company name or null
 */
export function getCompanyName(userInfo: UserInfo): string | null {
  return userInfo.company_name;
}

/**
 * Get user role
 * @param userInfo - User information object
 * @returns string - User role
 */
export function getUserRole(userInfo: UserInfo): string {
  return userInfo.role;
}

/**
 * Check if user is admin
 * @param userInfo - User information object
 * @returns boolean - True if user is admin
 */
export function isAdmin(userInfo: UserInfo): boolean {
  return userInfo.role === "Admin";
}

/**
 * Check if user is staff
 * @param userInfo - User information object
 * @returns boolean - True if user is staff
 */
export function isStaff(userInfo: UserInfo): boolean {
  return userInfo.role === "Staff";
}

/**
 * Check if user is client
 * @param userInfo - User information object
 * @returns boolean - True if user is client
 */
export function isClient(userInfo: UserInfo): boolean {
  return userInfo.role === "Client";
}

/**
 * Batch fetch multiple users' information
 * @param userIds - Array of user UUIDs
 * @returns Promise<UserInfo[]> - Array of user information
 */
export async function getMultipleUsersInfo(userIds: string[]): Promise<UserInfo[]> {
  try {
    const userPromises = userIds.map((id) => getUserInfo(id));
    const users = await Promise.all(userPromises);
    return users;
  } catch (error) {
    console.error("Error fetching multiple users info:", error);
    throw error;
  }
}

/**
 * Create a user info cache for better performance
 */
export class UserInfoCache {
  private cache = new Map<string, { data: UserInfo; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  async getUserInfo(userId: string): Promise<UserInfo> {
    const cached = this.cache.get(userId);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.TTL) {
      return cached.data;
    }

    const userInfo = await getUserInfo(userId);
    this.cache.set(userId, { data: userInfo, timestamp: now });
    return userInfo;
  }

  clearCache(): void {
    this.cache.clear();
  }

  removeFromCache(userId: string): void {
    this.cache.delete(userId);
  }
}

// Export a default instance
export const userInfoCache = new UserInfoCache();
