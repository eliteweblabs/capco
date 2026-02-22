/**
 * Build form initialData from currentUser for prefilling inputs.
 * Use for contactForm, mepForm, etc. (not login, register).
 */

export type UserLike = {
  email?: string;
  phone?: string;
  user_metadata?: {
    firstName?: string;
    lastName?: string;
    full_name?: string;
    phone?: string;
    [key: string]: any;
  };
  profile?: {
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    [key: string]: any;
  };
  [key: string]: any;
};

/**
 * Build initialData object for MultiStepForm/ConfigForm from a logged-in user.
 * Maps Supabase user shape to form field names (fullName, email, phone, firstName, lastName, isAuthenticated).
 * Also checks profile when user_metadata is sparse.
 */
export function buildFormInitialDataFromUser(user: UserLike | null | undefined): Record<string, any> {
  if (!user) return { isAuthenticated: false };

  const meta = user.user_metadata || {};
  const profile = user.profile || {};
  const firstName =
    meta.firstName || profile.firstName || meta.full_name?.split(" ")[0] || profile.name?.split(" ")[0] || "";
  const lastName =
    meta.lastName ||
    profile.lastName ||
    meta.full_name?.split(" ").slice(1).join(" ") ||
    profile.name?.split(" ").slice(1).join(" ") ||
    "";
  const fullName =
    meta.full_name ||
    profile.name ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    user.email ||
    "";
  const phone = meta.phone || profile.phone || user.phone || "";

  return {
    email: user.email ?? "",
    fullName: fullName.trim() || "",
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone: phone.trim(),
    isAuthenticated: true,
    user_metadata: meta,
  };
}
