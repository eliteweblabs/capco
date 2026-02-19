// Navigation schema
type UserRole = "any" | "Client" | "Admin" | "Staff";
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
        return (
          item.roles.includes("any") ||
          (isAuth && currentRole && item.roles.includes(currentRole as UserRole))
        );
      }

      // Show backend items when on backend pages and authenticated
      if (item.pageType === "backend" && isBackend && isAuth) {
        return (
          item.roles.includes("any") ||
          (currentRole && item.roles.includes(currentRole as UserRole))
        );
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
        // Map buttonStyle to actual CSS classes (matches button-styles.ts)
        // If current page, force primary background
        const buttonStyleMap: Record<string, string> = {
          primary:
            "hover:scale-101 hover:shadow-xl rounded-full border-2 border-primary-500 bg-primary-500 text-white hover:bg-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600 shadow-lg",
          secondary:
            "hover:scale-101 hover:shadow-xl rounded-full border-2 border-secondary-500 bg-secondary-500 text-white hover:bg-secondary-600 dark:bg-secondary-500 dark:hover:bg-secondary-600 shadow-lg",
          outline:
            "hover:scale-101 hover:shadow-xl rounded-full border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-600 dark:hover:text-white backdrop-blur-md",
          ghost:
            "rounded-full text-primary-500 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20",
        };

        // If this is the current page button, use primary style with background
        const styleClasses = item.isPrimary
          ? "hover:scale-101 hover:shadow-xl rounded-full border-2 border-primary-500 bg-primary-500 text-white hover:bg-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600 shadow-lg"
          : buttonStyleMap[item.buttonStyle] || buttonStyleMap.primary;
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
