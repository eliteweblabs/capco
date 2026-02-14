/**
 * Initialize delete handlers for Socials component remove buttons.
 * Finds all .socials-component[data-socials-context] with .socials-remove-btn.
 */

function initSocialsRemove() {
  const containers = document.querySelectorAll(
    ".socials-component[data-socials-context]"
  ) as NodeListOf<HTMLElement>;

  containers.forEach((container) => {
    container.querySelectorAll(".socials-remove-btn").forEach((btn) => {
      btn.addEventListener("deleteConfirmed", async () => {
        const wrapper = btn.closest(".socials-item-wrapper");
        if (!wrapper || !container) return;
        const index = parseInt(wrapper.getAttribute("data-social-index") ?? "-1", 10);
        if (index < 0) return;

        const linksJson = container.getAttribute("data-socials-links");
        let links: unknown[] = [];
        try {
          links = linksJson ? JSON.parse(linksJson) : [];
        } catch {
          return;
        }
        const updated = links.filter((_, i) => i !== index);
        const res = await fetch("/api/settings/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            settings: { socialNetworks: JSON.stringify(updated) },
          }),
        });
        const data = (await res.json()) as { success?: boolean; error?: string };
        if (data.success !== false) {
          wrapper.remove();
          container.setAttribute("data-socials-links", JSON.stringify(updated));
          if (typeof (window as unknown as { showNotice?: unknown }).showNotice === "function") {
            (
              window as unknown as {
                showNotice: (a: string, b: string, c: string, d: number) => void;
              }
            ).showNotice("success", "Link removed", "Social link has been removed.", 2500);
          }
        } else {
          if (typeof (window as unknown as { showNotice?: unknown }).showNotice === "function") {
            (
              window as unknown as {
                showNotice: (a: string, b: string, c: string, d: number) => void;
              }
            ).showNotice("error", "Remove failed", data.error || "Could not remove link.", 5000);
          }
        }
      });
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSocialsRemove);
} else {
  initSocialsRemove();
}
