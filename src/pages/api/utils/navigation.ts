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
      let query = supabaseAdmin
        .from("cmsPages")
        .select(
          "slug, title, includeInNavigation, nav_roles, nav_page_type, nav_button_style, nav_desktop_only, nav_hide_when_auth"
        )
        .eq("isActive", true)
        .eq("includeInNavigation", true);

      // Filter by clientId: show global (null) or matching clientId
      if (clientId) {
        query = query.or(`clientId.is.null,clientId.eq.${clientId}`);
      }
      // If no clientId set, show all pages (no filter)

      // Try to order by display_order if column exists, otherwise order by title
      let { data: cmsPages, error } = await query.order("display_order", {
        ascending: true,
        nullsFirst: false,
      });

      // If ordering by display_order fails (column doesn't exist), fall back to title ordering
      if (error && error.code === "42703") {
        // Column doesn't exist, use title ordering instead
        let fallbackQuery = supabaseAdmin
          .from("cmsPages")
          .select(
            "slug, title, includeInNavigation, nav_roles, nav_page_type, nav_button_style, nav_desktop_only, nav_hide_when_auth"
          )
          .eq("isActive", true)
          .eq("includeInNavigation", true);
        if (clientId) {
          fallbackQuery = fallbackQuery.or(`clientId.is.null,clientId.eq.${clientId}`);
        }
        const fallbackResult = await fallbackQuery.order("title");
        cmsPages = fallbackResult.data;
      }

      if (cmsPages && cmsPages.length > 0) {
        cmsNavItems = cmsPages.map((page: any) => ({
          label: page.title || page.slug,
          href: `/${page.slug}`,
          roles:
            page.nav_roles && Array.isArray(page.nav_roles) && page.nav_roles.length > 0
              ? (page.nav_roles as UserRole[])
              : ["any"],
          pageType: (page.nav_page_type === "backend" ? "backend" : "frontend") as NavType,
          isPrimary: currentUrl === `/${page.slug}` || currentUrl.startsWith(`/${page.slug}/`),
          buttonStyle: page.nav_button_style || undefined,
          desktopOnly: page.nav_desktop_only === true,
          hideWhenAuth: page.nav_hide_when_auth === true,
        }));
      }
    }
  } catch (error) {
    console.warn("Failed to fetch CMS navigation pages:", error);
    // Continue without CMS pages if fetch fails
  }

  // Navigation items
  const navItems: NavItem[] = [
    // Frontend navigation (hidden on backend pages to reduce clutter)
    // {
    //   label: "Why CAPCo",
    //   href: "#",
    //   roles: ["any"],
    //   pageType: "frontend",
    //   isPrimary: false,
    //   isDropdown: true,
    //   dropdownItems: [
    //     { label: "Unified Fire Protection Platform", href: "/solutions" },
    //     { label: "CAPCo vs Competitors", href: "/solutions" },
    //     { label: "Move to CAPCo", href: "/solutions" },
    //     { label: "See Our Customers", href: "/customers" },
    //   ],
    // },
    // {
    //   label: "Pricing",
    //   href: "/pricing",
    //   roles: ["any"],
    //   pageType: "frontend",
    //   isPrimary: currentUrl.startsWith("/pricing"),
    //   desktopOnly: true,
    // },

    // Backend navigation (shown on backend pages)
    // {
    //   label: "New Project",
    //   href: "/project/new",
    //   roles: ["Client", "Admin", "Staff"],
    //   pageType: "backend",
    //   isPrimary: currentUrl.startsWith("/project/new"),
    // },
    // {
    //   label: "Projects",
    //   href: "/projects",
    //   roles: ["any"],
    //   pageType: "frontend",
    //   isDrawer: false, // Special flag for drawer trigger
    //   isPrimary: currentUrl.startsWith("/projects"),
    // },
    // {
    //   label: "Book Demo",
    //   href: "/demo",
    //   roles: ["any"],
    //   pageType: "frontend",
    //   isPrimary: currentUrl.startsWith("/demo"),
    //   buttonStyle: "outline",
    //   desktopOnly: true,
    //   hideWhenAuth: true,
    // },
    // {
    //   label: "Email Your Project",
    //   href: "mailto:project@new.capcofire.com",
    //   roles: ["any"],
    //   pageType: "frontend",
    //   isPrimary: false,
    //   buttonStyle: "outline",
    //   desktopOnly: false,
    //   hideWhenAuth: true,
    // },
    // {
    //   label: "Discussions",
    //   href: "/discussions",
    //   roles: ["Admin", "Staff"],
    //   pageType: "backend",
    //   isPrimary: currentUrl.startsWith("/discussions"),
    // },
    // {
    //   label: "Global Activity",
    //   href: "/admin/global-activity",
    //   roles: ["Admin"],
    //   pageType: "backend",
    //   isPrimary: currentUrl.startsWith("/admin/global-activity"),
    // },
    // {
    //   label: "Global Discussions",
    //   href: "/admin/discussions",
    //   roles: ["Admin"],
    //   pageType: "backend",
    //   isPrimary: currentUrl.startsWith("/admin/discussions"),
    // },
    // {
    //   label: "Users",
    //   href: "/users",
    //   roles: ["Admin"],
    //   pageType: "backend",
    //   isPrimary: currentUrl.startsWith("/users"),
    // },
    // {
    //   label: "Analytics",
    //   href: "/analytics",
    //   roles: ["Admin"],
    //   pageType: "backend",
    //   isPrimary: currentUrl.startsWith("/analytics"),
    // },
    // Add CMS pages that are marked for navigation
    ...cmsNavItems,
  ];

  // Dropdown menus are now integrated into navItems array above

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
        // Since we can't use fetch() during SSR, create the button HTML manually
        // This matches the Button component's output structure

        return `<li class="${mobileClass}"><a href="${item.href}" class="relative inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-0.5 text-sm bg-primary-500 text-white hover:bg-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600 shadow-lg hover:shadow-xl w-full">${item.label}</a></li>`;
      }

      // Handle regular links
      return `<li class="${mobileClass}">
        <a
          href="${item.href}"
            class="block px-3 py-2 md:p-0 ${
              item.isPrimary
                ? "text-primary dark:text-primary-dark"
                : "text-black hover:text-primary dark:text-white dark:hover:text-primary"
            }"
        >
          <svg class="inline-block w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"></path></svg>${item.label}
        </a>
      </li>`;
    });

    return results.join("");
  }

  // Generate navigation HTML for reuse
  const visibleNavItems = getVisibleNavItems(navItems, isAuth, currentRole, isBackend);
  const desktopNavigationHTML = generateNavigationHTML(visibleNavItems, "desktop");
  const mobileNavigationHTML = generateNavigationHTML(visibleNavItems, "mobile");

  return {
    visibleNavItems,
    desktopNavigationHTML,
    mobileNavigationHTML,
  };
};
