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
  [key: string]: any;
};

/**
 * Build initialData object for MultiStepForm/ConfigForm from a logged-in user.
 * Maps Supabase user shape to form field names (fullName, email, phone, firstName, lastName, isAuthenticated).
 */
export function buildFormInitialDataFromUser(user: UserLike | null | undefined): Record<string, any> {
  if (!user) return { isAuthenticated: false };

  const meta = user.user_metadata || {};
  const firstName = meta.firstName || meta.full_name?.split(" ")[0] || "";
  const lastName = meta.lastName || meta.full_name?.split(" ").slice(1).join(" ") || "";
  const fullName = meta.full_name || [firstName, lastName].filter(Boolean).join(" ") || user.email || "";
  const phone = meta.phone || user.phone || "";

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
