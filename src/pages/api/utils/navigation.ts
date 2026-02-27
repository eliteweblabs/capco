// Navigation schema
import { buttonVariantClasses } from "../../../lib/button-styles";

type UserRole = "any" | "Client" | "Admin" | "Staff" | "SuperAdmin";
type NavType = "frontend" | "backend";

interface NavItem {
  label: string;
  href: string;
  roles: UserRole[];
  pageType: NavType;
  isPrimary: boolean;
  isDrawer?: boolean; // Special flag for drawer trigger
  mobileOnly?: boolean; // Show only on mobile
  desktopOnly?: boolean; // Show only on desktop
  buttonStyle?: "primary" | "secondary" | "ghost" | "outline"; // Button variant
  isDropdown?: boolean; // Is a dropdown menu
  dropdownItems?: DropdownItem[]; // Items for dropdown
  showWhenAuth?: boolean; // Show only when authenticated
  hideWhenAuth?: boolean; // Hide when authenticated
}

interface DropdownItem {
  label: string;
  href: string;
}

interface DropdownMenu {
  label: string;
  items: DropdownItem[];
}

export const navigation = async (
  currentUrl: string,
  isAuth: boolean,
  currentRole: string | null,
  isBackend: boolean
) => {
  // Fetch CMS pages that should be included in navigation
  let cmsNavItems: NavItem[] = [];
  try {
    const { supabaseAdmin } = await import("../../../lib/supabase-admin");
    if (supabaseAdmin) {
      const clientId = process.env.RAILWAY_PROJECT_NAME || null;
      const { quoteClientIdForPostgrest } = await import("../../../lib/content");
      let query = supabaseAdmin
        .from("cmsPages")
        .select(
          "slug, title, includeInNavigation, navRoles, navPageType, navButtonStyle, navDesktopOnly, navHideWhenAuth"
        )
        .eq("isActive", true)
        .eq("includeInNavigation", true);

      // Filter by clientId: show global (null) or matching clientId
      if (clientId) {
        query = query.or(`clientId.is.null,clientId.eq.${quoteClientIdForPostgrest(clientId)}`);
      }
      // If no clientId set, show all pages (no filter)

      // Try to order by displayOrder if column exists, otherwise order by title
      let { data: cmsPages, error } = await query.order("displayOrder", {
        ascending: true,
        nullsFirst: false,
      });

      // If ordering by displayOrder fails (column doesn't exist), fall back to title ordering
      if (error && error.code === "42703") {
        // Column doesn't exist, use title ordering instead
        let fallbackQuery = supabaseAdmin
          .from("cmsPages")
          .select(
            "slug, title, includeInNavigation, navRoles, navPageType, navButtonStyle, navDesktopOnly, navHideWhenAuth"
          )
          .eq("isActive", true)
          .eq("includeInNavigation", true);
        if (clientId) {
          fallbackQuery = fallbackQuery.or(
            `clientId.is.null,clientId.eq.${quoteClientIdForPostgrest(clientId)}`
          );
        }
        const fallbackResult = await fallbackQuery.order("title");
        cmsPages = fallbackResult.data;
      }

      if (cmsPages && cmsPages.length > 0) {
        cmsNavItems = cmsPages.map((page: any) => ({
          label: page.title || page.slug,
          href: `/${page.slug}`,
          roles:
            page.navRoles && Array.isArray(page.navRoles) && page.navRoles.length > 0
              ? (page.navRoles as UserRole[])
              : ["any"],
          pageType: (page.navPageType === "backend" ? "backend" : "frontend") as NavType,
          isPrimary: currentUrl === `/${page.slug}` || currentUrl.startsWith(`/${page.slug}/`),
          buttonStyle: page.navButtonStyle || undefined,
          desktopOnly: page.navDesktopOnly === true,
          hideWhenAuth: page.navHideWhenAuth === true,
        }));
      }
    }
  } catch (error) {
    console.warn("Failed to fetch CMS navigation pages:", error);
    // Continue without CMS pages if fetch fails
  }

  // Filter navigation items based on auth state, role, and page type
  function getVisibleNavItems(
    navItems: NavItem[],
    isAuth: boolean,
    currentRole: string | null,
    isBackend: boolean
  ): NavItem[] {
    return navItems.filter((item) => {
      // Check auth-specific visibility
      if (item.hideWhenAuth && isAuth) return false;
      if (item.showWhenAuth && !isAuth) return false;

      // Show frontend items when not on backend pages
      if (item.pageType === "frontend" && !isBackend) {
        const roleMatch =
          isAuth &&
          currentRole &&
          (item.roles.includes(currentRole as UserRole) ||
            (currentRole === "SuperAdmin" && item.roles.includes("Admin")));
        return item.roles.includes("any") || !!roleMatch;
      }

      // Show backend items when on backend pages and authenticated
      if (item.pageType === "backend" && isBackend && isAuth) {
        const roleMatch =
          currentRole &&
          (item.roles.includes(currentRole as UserRole) ||
            (currentRole === "SuperAdmin" && item.roles.includes("Admin")));
        return item.roles.includes("any") || !!roleMatch;
      }

      return false;
    });
  }

  function generateNavigationHTML(
    navItems: NavItem[],
    filterType: "desktop" | "mobile" = "desktop"
  ): string {
    const filteredItems = navItems.filter((item: any) => {
      if (filterType === "desktop") {
        return !item.mobileOnly; // Show only desktop items
      } else {
        return !item.desktopOnly; // Show only mobile items
      }
    });

    // Add flex md:hidden class to mobile navigation items (show in mobile sidebar, hide on desktop)
    // isAuth is available from parent scope
    const mobileClass = filterType === "mobile" && !isAuth ? "flex md:hidden" : "";

    const results = filteredItems.map((item: NavItem) => {
      // Handle dropdown items
      if (item.isDropdown && item.dropdownItems) {
        return `
          <li class="group relative ${mobileClass}">
            <a class="md:block  hover:bg-gray-300 dark:hover:bg-gray-700 flex w-full align-center rounded-lg p-2 pr-0 whitespace-nowrap ${
              item.isPrimary ? "text-primary dark:text-primary-dark" : "text-black dark:text-white"
            }"
            >
              ${item.label}
              <svg class="inline-block ml-1 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"></path></svg>
            </a>
            <div class="invisible absolute left-0 mt-2 w-64 rounded-lg border border-border-light opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100 dark:border-border-dark color-background">
              <div class="py-1">
                ${item.dropdownItems
                  .map(
                    (dropdownItem: DropdownItem) => `
                  <a
                    href="${dropdownItem.href}"
                                class="block px-3 py-2 text-black hover:text-primary dark:text-white dark:hover:text-primary md:p-0"

                  >
                    ${dropdownItem.label}
                  </a>
                `
                  )
                  .join("")}
              </div>
            </div>
          </li>
        `;
      }

      // Handle button style items
      if (item.buttonStyle && item.href && item.label) {
        // Use shared button variant classes from button-styles.ts; if current page, force primary
        const styleClasses = item.isPrimary
          ? buttonVariantClasses.primary
          : buttonVariantClasses[item.buttonStyle] || buttonVariantClasses.primary;
        const baseClasses =
          "font-secondary relative inline-flex items-center justify-center font-medium transition-all duration-200";

        const sizeClasses = "px-4 py-1 text-sm";

        return `<li class="${mobileClass}"><a href="${item.href}" class="${baseClasses} ${sizeClasses} ${styleClasses}">${item.label}</a></li>`;
      }

      // Handle regular links
      return `<li class="${mobileClass}">
        <a
          href="${item.href}"
            class="flex items-center md:p-0  w-full align-center rounded-lg px-3 py-2 whitespace-nowrap  ${
              item.isPrimary
                ? "text-primary dark:text-primary-dark"
                : "text-black sm:hover:text-primary dark:text-white sm:dark:hover:text-primary"
            }"
         >
          <svg class="inline w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"></path></svg>
          <span class="inline md:hidden" data-sidebar-collapse-hide="">${item.label}</span>
          <span class="hidden md:inline">${item.label}</span>
        </a>
      </li>`;
    });

    return results.join("");
  }

  // Generate navigation HTML for reuse
  const visibleNavItems = getVisibleNavItems(cmsNavItems, isAuth, currentRole, isBackend);
  const desktopNavigationHTML = generateNavigationHTML(visibleNavItems, "desktop");
  const mobileNavigationHTML = generateNavigationHTML(visibleNavItems, "mobile");

  return {
    visibleNavItems,
    desktopNavigationHTML,
    mobileNavigationHTML,
  };
};
