/**
 * Inline Address Search - Client-side functionality
 * Reusable module for address autocomplete dropdowns
 */

export interface AddressSearchConfig {
  id: string;
  fetchApiEndpoint?: string;
  apiParams?: Record<string, any>;
  valueField?: string;
  labelField?: string;
  onSelect?: (value: string, label: string, data: any) => void;
  currentLocation?: boolean;
}

export function initializeAddressSearch(config: AddressSearchConfig) {
  const {
    id,
    fetchApiEndpoint = "/api/google/places-autocomplete",
    apiParams = {},
    valueField = "description",
    labelField = "description",
    onSelect,
    currentLocation = false,
  } = config;

  const searchInput = document.getElementById(`${id}-search-input`) as HTMLInputElement;
  const resultsList = document.getElementById(`${id}-results-list`) as HTMLUListElement;
  const hiddenInput = document.getElementById(`${id}-value`) as HTMLInputElement;
  const emptyState = document.getElementById(`${id}-empty-state`) as HTMLDivElement;
  const dropdown = document.getElementById(`${id}-dropdown`) as HTMLDivElement;
  const useLocationBtn = document.getElementById(
    `${id}-use-location-btn`
  ) as HTMLButtonElement | null;

  if (!searchInput || !resultsList || !hiddenInput || !emptyState || !dropdown) {
    console.error(`[INLINE-ADDRESS] Required elements not found for ${id}`);
    return;
  }

  if (searchInput.dataset.inlineAddressInitialized === "true") {
    return;
  }
  searchInput.dataset.inlineAddressInitialized = "true";

  let searchTimeout: NodeJS.Timeout;
  let selectedIndex = -1;

  function getResultLabel(result: any): string {
    return (
      result?.[labelField] ||
      result?.formatted_address ||
      result?.label ||
      result?.description ||
      result?.name ||
      ""
    );
  }

  function getResultValue(result: any): string {
    return (
      result?.[valueField] ||
      result?.place_id ||
      result?.id ||
      result?.formatted_address ||
      result?.description ||
      ""
    );
  }

  // Helper function to show dropdown
  function showDropdown() {
    dropdown.classList.remove("hidden");
  }

  // Helper function to hide dropdown
  function hideDropdown() {
    dropdown.classList.add("hidden");
  }

  // Helper function to format address (remove USA)
  function formatAddress(address: string): string {
    return address.replace(/, USA$/i, "").trim();
  }

  // Helper function to create result element
  function createResultElement(result: any, index: number, isSelected = false) {
    const li = document.createElement("li");
    li.className = `inline-address-result-item cursor-pointer px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 ${
      isSelected
        ? "bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white"
        : "text-gray-700 dark:text-gray-200"
    }`;
    li.style.cssText = "user-select: none; -webkit-user-select: none;";
    li.dataset.index = String(index);
    li.dataset.value = getResultValue(result);

    // Format the label to remove USA
    const rawLabel = getResultLabel(result);
    const formattedLabel = formatAddress(rawLabel);
    li.dataset.label = formattedLabel;

    try {
      li.dataset.json = JSON.stringify(result);
    } catch (e) {
      // ignore non-serializable result
    }

    const textSpan = document.createElement("span");
    textSpan.className = "block";
    textSpan.textContent = formattedLabel;

    li.appendChild(textSpan);
    return li;
  }

  // Helper function to populate results
  function populateResults(results: any[]) {
    resultsList.innerHTML = "";

    if (results.length > 0) {
      emptyState.classList.add("hidden");
      resultsList.classList.remove("hidden");
      results.forEach((result, index) => {
        const li = createResultElement(result, index, index === selectedIndex);
        resultsList.appendChild(li);
      });
      showDropdown();
    } else {
      // Don't show dropdown if there are no results
      hideDropdown();
    }
  }

  function extractResultsArray(data: any): any[] {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.predictions)) return data.predictions;
    if (data && Array.isArray(data.results)) return data.results;
    if (data && data.data && Array.isArray(data.data)) return data.data;
    return [];
  }

  function selectResult(value: string, label: string, resultData: any) {
    hiddenInput.value = value;
    searchInput.value = label;
    hideDropdown();

    if (onSelect) {
      onSelect(value, label, resultData);
    }

    window.dispatchEvent(
      new CustomEvent("inline-address-select", {
        detail: {
          componentId: id,
          value,
          label,
          data: resultData,
        },
      })
    );
  }

  // Handle search input
  searchInput.addEventListener("input", (e) => {
    const query = (e.target as HTMLInputElement).value.trim();

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Clear results if query is empty
    if (query.length === 0) {
      resultsList.innerHTML = "";
      hideDropdown();
      selectedIndex = -1;
      return;
    }

    // Perform search after debounce
    if (query.length >= 2) {
      searchTimeout = setTimeout(async () => {
        try {
          console.log(`[INLINE-ADDRESS] Searching for: ${query}`);

          // Build search URL with API params
          const searchParams = new URLSearchParams({
            input: query,
            ...apiParams,
          });

          const response = await fetch(`${fetchApiEndpoint}?${searchParams}`, {
            credentials: "include",
          });

          if (!response.ok) {
            throw new Error(`Search failed: ${response.status}`);
          }

          const data = await response.json();
          console.log(`[INLINE-ADDRESS] Search results:`, data);

          const resultsArray = extractResultsArray(data);
          console.log(`[INLINE-ADDRESS] Results array:`, resultsArray);
          populateResults(resultsArray);
        } catch (error) {
          console.error(`[INLINE-ADDRESS] Search error:`, error);
          resultsList.innerHTML = "";
          hideDropdown();
        }
      }, 300); // 300ms debounce
    }
  });

  // Handle click on result items
  resultsList.addEventListener("click", (e) => {
    const li = (e.target as HTMLElement).closest("li[data-index]") as HTMLLIElement;
    if (li) {
      const value = li.dataset.value!;
      const label = li.dataset.label!;

      console.log(`[INLINE-ADDRESS] Selected: ${label} (${value})`);

      const selectedData = li.dataset.json ? JSON.parse(li.dataset.json) : null;
      selectResult(value, label, selectedData);

      // Update selection styling
      const allItems = resultsList.querySelectorAll("li");
      allItems.forEach((item) => {
        item.classList.remove("bg-gray-100", "dark:bg-gray-600");
        item.classList.add("hover:bg-gray-100", "dark:hover:bg-gray-600");
      });
      li.classList.add("bg-gray-100", "dark:bg-gray-600");

      selectedIndex = parseInt(li.dataset.index!);
    }
  });

  if (currentLocation && useLocationBtn) {
    useLocationBtn.addEventListener("click", async () => {
      const originalHtml = useLocationBtn.innerHTML;
      useLocationBtn.disabled = true;
      useLocationBtn.innerHTML =
        '<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>';

      try {
        if (!navigator.geolocation) {
          throw new Error("Geolocation is not supported by your browser");
        }

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });

        const { latitude, longitude } = position.coords;
        console.log(`[INLINE-ADDRESS] Got current coordinates: ${latitude}, ${longitude}`);

        const response = await fetch(`/api/google/geocode?latlng=${latitude},${longitude}`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Geocode failed with status ${response.status}`);
        }

        const geocodeData = await response.json();
        const resultsArray = extractResultsArray(geocodeData);
        console.log(`[INLINE-ADDRESS] Geocode results:`, resultsArray);

        if (!resultsArray.length) {
          throw new Error("No address found for current location");
        }

        populateResults(resultsArray);

        const first = resultsArray[0];
        const value = getResultValue(first);
        const rawLabel = getResultLabel(first);
        const label = formatAddress(rawLabel);
        selectResult(value, label, first);
      } catch (error: any) {
        console.error(`[INLINE-ADDRESS] Current location error:`, error);
        if (window.showNotice) {
          let message = "Unable to get your location. Please search manually.";
          if (typeof error?.code === "number") {
            if (error.code === 1) message = "Location access denied. Please allow location access.";
            if (error.code === 2) message = "Location unavailable. Please try again.";
            if (error.code === 3) message = "Location request timed out. Please try again.";
          } else if (error?.message) {
            message = error.message;
          }
          window.showNotice("error", "Location Error", message, 5000);
        }
      } finally {
        useLocationBtn.disabled = false;
        useLocationBtn.innerHTML = originalHtml;
      }
    });
  }

  // Handle keyboard navigation
  searchInput.addEventListener("keydown", (e) => {
    const items = resultsList.querySelectorAll("li");
    const maxIndex = items.length - 1;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (maxIndex >= 0) {
          selectedIndex = Math.min(selectedIndex + 1, maxIndex);
          updateSelection(items);
          scrollToSelected(items[selectedIndex]);
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        if (maxIndex >= 0) {
          selectedIndex = Math.max(selectedIndex - 1, 0);
          updateSelection(items);
          scrollToSelected(items[selectedIndex]);
        }
        break;

      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex <= maxIndex) {
          const selectedItem = items[selectedIndex] as HTMLElement;
          selectedItem.click();
        }
        break;

      case "Escape":
        e.preventDefault();
        hideDropdown();
        break;
    }
  });

  // Update selection styling
  function updateSelection(items: NodeListOf<Element>) {
    items.forEach((item, index) => {
      if (index === selectedIndex) {
        item.classList.add("bg-gray-100", "dark:bg-gray-600");
      } else {
        item.classList.remove("bg-gray-100", "dark:bg-gray-600");
      }
    });
  }

  // Scroll to selected item
  function scrollToSelected(item: Element) {
    if (item) {
      item.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (!dropdown.contains(target) && !searchInput.contains(target)) {
      hideDropdown();
    }
  });
}

/**
 * Create HTML structure for inline address search
 * Returns the wrapper element
 */
export function createAddressSearchHTML(config: {
  id: string;
  name?: string;
  placeholder?: string;
  inputClasses?: string;
  value?: string;
}): HTMLDivElement {
  const {
    id,
    name = id,
    placeholder = "Search for an address...",
    inputClasses = "",
    value = "",
  } = config;

  // Wrapper
  const wrapper = document.createElement("div");
  wrapper.className = "inline-address-search-wrapper";

  // Hidden input
  const hiddenInput = document.createElement("input");
  hiddenInput.type = "hidden";
  hiddenInput.id = `${id}-value`;
  hiddenInput.name = name;
  hiddenInput.value = value;
  wrapper.appendChild(hiddenInput);

  // Search container
  const searchContainer = document.createElement("div");
  searchContainer.className = "relative";

  // Search input
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.id = `${id}-search-input`;
  searchInput.placeholder = placeholder;
  searchInput.autocomplete = "off";
  searchInput.className = inputClasses;
  searchInput.value = value;
  searchContainer.appendChild(searchInput);

  // Dropdown
  const dropdown = document.createElement("div");
  dropdown.id = `${id}-dropdown`;
  dropdown.className =
    "inline-address-results-container hidden absolute z-10 mt-2 w-full divide-y divide-gray-100 color-background-50 scrollbar-hide rounded-lg shadow-lg dark:divide-gray-600";

  // Results list
  const resultsList = document.createElement("ul");
  resultsList.id = `${id}-results-list`;
  resultsList.className = "max-h-60 overflow-y-auto py-2 text-sm text-gray-700 dark:text-gray-200";
  dropdown.appendChild(resultsList);

  // Empty state
  const emptyState = document.createElement("div");
  emptyState.id = `${id}-empty-state`;
  emptyState.className = "hidden px-4 py-8 text-center";
  emptyState.innerHTML = `<p class="text-sm text-gray-500 dark:text-gray-400">Type to search addresses...</p>`;
  dropdown.appendChild(emptyState);

  searchContainer.appendChild(dropdown);
  wrapper.appendChild(searchContainer);

  return wrapper;
}
