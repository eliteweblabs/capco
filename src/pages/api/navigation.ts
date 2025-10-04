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

export const navigation = (
  currentUrl: string,
  isAuth: boolean,
  currentRole: string | null,
  isBackend: boolean
) => {
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
    {
      label: "New Project",
      href: "/project/new",
      roles: ["Client", "Admin", "Staff"],
      pageType: "backend",
      isPrimary: currentUrl.startsWith("/project/new"),
    },
    {
      label: "Projects",
      href: "/projects",
      roles: ["any"],
      pageType: "frontend",
      isDrawer: false, // Special flag for drawer trigger
      isPrimary: currentUrl.startsWith("/projects"),
    },
    {
      label: "Book Demo",
      href: "/demo",
      roles: ["any"],
      pageType: "frontend",
      isPrimary: currentUrl.startsWith("/demo"),
      buttonStyle: "outline",
      desktopOnly: true,
      hideWhenAuth: true,
    },
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
    {
      label: "Discussions",
      href: "/discussions",
      roles: ["Admin", "Staff"],
      pageType: "backend",
      isPrimary: currentUrl.startsWith("/discussions"),
    },
    {
      label: "Global Activity",
      href: "/admin/global-activity",
      roles: ["Admin"],
      pageType: "backend",
      isPrimary: currentUrl.startsWith("/admin/global-activity"),
    },
    {
      label: "Global Discussions",
      href: "/admin/global-discussions",
      roles: ["Admin"],
      pageType: "backend",
      isPrimary: currentUrl.startsWith("/admin/global-discussions"),
    },
    {
      label: "Users",
      href: "/users",
      roles: ["Admin"],
      pageType: "backend",
      isPrimary: currentUrl.startsWith("/users"),
    },
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

    const results = filteredItems.map((item: NavItem) => {
      // Handle dropdown items
      if (item.isDropdown && item.dropdownItems) {
        return `
          <li class="group relative">
            <a
              class="block px-3 py-2 md:p-0 text-black hover:text-primary dark:text-white dark:hover:text-primary ${
                item.isPrimary
                  ? "text-primary dark:text-primary-dark"
                  : "text-black dark:text-white"
              }"
            >
              ${item.label}
              <i class="bx bx-chevron-down ml-1 h-4 w-4"></i>
            </a>
            <div class="invisible absolute left-0 mt-2 w-64 rounded-lg border border-border-light  opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100 dark:border-border-dark _1jTZ8KXRZul60S6czNi SWeL9OnwkbKp0VeBUJlf">
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

        return `<li><a href="${item.href}" class="relative inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-0.5 text-sm bg-primary-500 text-white hover:bg-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600 shadow-lg hover:shadow-xl w-full">${item.label}</a></li>`;
      }

      // Handle regular links
      return `<li>
        <a
          href="${item.href}"
            class="block px-3 py-2 md:p-0 ${
              item.isPrimary
                ? "text-primary dark:text-primary-dark"
                : "text-black hover:text-primary dark:text-white dark:hover:text-primary"
            }"
        >
          ${item.label}
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
