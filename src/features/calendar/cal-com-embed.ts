/** Cal.com embed initializer - runs on DOMContentLoaded */
export function initCalComEmbed(): void {
  document.addEventListener("DOMContentLoaded", function () {
    const calEmbedContainer = document.getElementById("cal-com-embed");
    if (!calEmbedContainer) {
      console.error("Cal.com embed container not found");
      return;
    }

    const calLink = calEmbedContainer.dataset.calLink ?? "capco/30min";
    const calComBaseUrl =
      calEmbedContainer.dataset.calBaseUrl ??
      "https://calcom-web-app-production-0b16.up.railway.app";
    let prefill: Record<string, string> | null = null;
    try {
      const raw = calEmbedContainer.dataset.prefill;
      if (raw) prefill = JSON.parse(raw) as Record<string, string>;
    } catch {
      /* ignore */
    }

    const isDarkMode =
      document.documentElement.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const calConfig = {
      calLink,
      layout: "month_view",
      theme: isDarkMode ? "dark" : "light",
      branding: {
        brandColor: "#825BDD",
        hideEventTypeDetails: false,
        hideLandingPageDetails: false,
      },
      baseUrl: calComBaseUrl,
      prefill: prefill ?? {},
    };

    function initializeCalEmbed(): void {
      try {
        if (calEmbedContainer) calEmbedContainer.innerHTML = "";
        const iframe = document.createElement("iframe");
        iframe.src = `${calConfig.baseUrl}/${calConfig.calLink}?embed=true&layout=${calConfig.layout}&theme=${calConfig.theme}`;
        iframe.style.width = "100%";
        iframe.style.height = "600px";
        iframe.style.border = "none";
        iframe.style.borderRadius = "8px";
        iframe.allow = "camera; microphone; geolocation";
        iframe.setAttribute(
          "sandbox",
          "allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        );
        iframe.onload = () => console.log("Cal.com iframe loaded");
        iframe.onerror = showFallbackBooking;
        calEmbedContainer?.appendChild(iframe);
      } catch {
        showFallbackBooking();
      }
    }

    function showFallbackBooking(): void {
      if (!calEmbedContainer) return;
      const html = [
        '<div class="text-center py-12">',
        '  <div class="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">',
        '    <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">',
        '      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"></path>',
        "    </svg>",
        "  </div>",
        '<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Calendar Unavailable</h3>',
        '<p class="text-gray-600 dark:text-gray-400 mb-4">We are having trouble loading our booking calendar.</p>',
        '<div class="space-y-2">',
        '<p class="text-sm text-gray-600 dark:text-gray-400">Please contact us directly to schedule your demo:</p>',
        '<div class="flex flex-col sm:flex-row gap-2 justify-center">',
        '<a href="mailto:support@capcofire.com" class="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">Email Us</a>',
        '<a href="tel:+1-555-0123" class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Call Us</a>',
        "</div></div></div>",
      ].join("");
      calEmbedContainer.innerHTML = html;
    }

    initializeCalEmbed();
  });
}
