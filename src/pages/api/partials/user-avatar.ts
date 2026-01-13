import type { APIRoute } from "astro";
import { validateAvatarUrl, getSafeAvatarUrl } from "../../../lib/avatar-utils";

interface UserAvatarPartialRequest {
  user?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    avatarUrl?: string;
    companyName?: string;
  };
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showBorder?: boolean;
  class?: string;
  id?: string;
  title?: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: UserAvatarPartialRequest = await request.json();
    const { user, size = "md", showBorder = true, class: className = "", id, title } = body;

    // Generate user display name and initials
    const fullName = user
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.companyName || "User"
      : "User";

    const initials = fullName
      .split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);

    // Get avatar URL with fallback validation
    const avatarUrl = user ? getSafeAvatarUrl(user.avatarUrl) : null;
    const shouldShowAvatar = avatarUrl && !validateAvatarUrl(avatarUrl).shouldUseFallback;

    // Size classes
    const sizeClasses = {
      xs: "w-6 h-6 text-xs",
      sm: "w-8 h-8 text-sm",
      md: "w-10 h-10 text-base",
      lg: "w-12 h-12 text-lg",
      xl: "w-16 h-16 text-xl",
    };

    const borderClass = showBorder
      ? "border-2 border-white dark:border-gray-700 shadow-sm"
      : "";

    const containerClasses = `${sizeClasses[size]} rounded-full ${borderClass} bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-medium ${className}`.trim();

    const idAttr = id ? ` id="${id}"` : "";
    const titleAttr = title ? ` title="${title}"` : ` title="${fullName}"`;
    const avatarUrlAttr = shouldShowAvatar ? ` data-avatar-url="${avatarUrl}"` : "";
    const dataAttrs = `data-user-name="${fullName}" data-user-initials="${initials}"`;

    // Generate HTML
    let avatarHTML = `<div class="${containerClasses}"${idAttr}${titleAttr}${avatarUrlAttr} ${dataAttrs}>`;

    if (shouldShowAvatar) {
      avatarHTML += `
        <img
          src="${avatarUrl}"
          alt="${fullName}"
          class="rounded-full w-full h-full object-cover user-avatar-img"
          style="display: none;"
          onerror="this.style.display='none'; this.parentElement?.querySelector('.user-avatar-fallback')?.classList.remove('hidden');"
        />
        <span class="user-avatar-fallback">${initials}</span>
      `;
    } else {
      avatarHTML += `<span>${initials}</span>`;
    }

    avatarHTML += `</div>`;

    // Add script for avatar loading
    avatarHTML += `
      <script>
        (function() {
          const container = document.currentScript.previousElementSibling;
          const avatarUrl = container.getAttribute("data-avatar-url");
          const avatarImg = container.querySelector(".user-avatar-img");
          const fallbackSpan = container.querySelector(".user-avatar-fallback");

          if (avatarUrl && avatarImg && fallbackSpan) {
            const img = new Image();
            img.onload = function() {
              avatarImg.style.display = "block";
              fallbackSpan.classList.add("hidden");
            };
            img.onerror = function() {
              avatarImg.style.display = "none";
              fallbackSpan.classList.remove("hidden");
            };
            img.src = avatarUrl;
          }
        })();
      </script>
    `;

    return new Response(avatarHTML, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error generating user avatar partial:", error);
    return new Response("Error generating user avatar", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
};

