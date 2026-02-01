/**
 * Inline Address Search - Client-side functionality
 * Reusable module for address autocomplete dropdowns
 */
export function initializeAddressSearch(config) {
  const {
    id,
    fetchApiEndpoint = "/api/google/places-autocomplete",
    apiParams = {},
    valueField = "description",
    labelField = "description",
    onSelect,
    currentLocation = false,
  } = config;
  const searchInput = document.getElementById(`${id}-search-input`);
  const resultsList = document.getElementById(`${id}-results-list`);
  const hiddenInput = document.getElementById(`${id}-value`);
  const emptyState = document.getElementById(`${id}-empty-state`);
  const dropdown = document.getElementById(`${id}-dropdown`);
  const locationBtn = document.getElementById(`${id}-use-location-btn`) || document.getElementById(`${id}-location-btn`);
  const clearBtn = document.getElementById(`${id}-clear-btn`);
  
  if (!searchInput || !resultsList || !hiddenInput || !emptyState || !dropdown) {
    console.error(`[INLINE-ADDRESS] Required elements not found for ${id}`);
    return;
  }
  let searchTimeout;
  let selectedIndex = -1;
  
  // Helper function to update button visibility based on input state
  function updateButtonVisibility() {
    const hasValue = searchInput.value && searchInput.value.trim() !== '';
    
    if (hasValue) {
      // Show clear button, hide location button
      if (locationBtn) locationBtn.classList.add('hidden');
      if (clearBtn) clearBtn.classList.remove('hidden');
    } else {
      // Show location button, hide clear button
      if (locationBtn) locationBtn.classList.remove('hidden');
      if (clearBtn) clearBtn.classList.add('hidden');
    }
  }
  
  // Handle clear button click
  if (clearBtn) {
    clearBtn.addEventListener("click", (e) => {
      e.preventDefault();
      // Clear the input and hidden value
      searchInput.value = '';
      hiddenInput.value = '';
      hideDropdown();
      updateButtonVisibility();
      
      // Dispatch event to notify that address was cleared
      window.dispatchEvent(
        new CustomEvent("inline-address-select", {
          detail: {
            componentId: id,
            value: "",
            label: "",
            data: null,
          },
        })
      );
    });
  }
  
  // Handle location button click
  if (currentLocation && locationBtn) {
    locationBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      console.log(`📍 [INLINE-ADDRESS] Getting current location for ${id}`);
      // Disable button and show loading state
      locationBtn.disabled = true;
      const originalHTML = locationBtn.innerHTML;
      locationBtn.innerHTML = `<svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
      try {
        // Check if geolocation is supported
        if (!navigator.geolocation) {
          throw new Error("Geolocation is not supported by your browser");
        }
        // Get current position
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });
        const { latitude, longitude } = position.coords;
        console.log(`📍 [INLINE-ADDRESS] Got coordinates: ${latitude}, ${longitude}`);
        // Use geocode endpoint to get address
        const geocodeEndpoint = "/api/google/geocode";
        const response = await fetch(`${geocodeEndpoint}?latlng=${latitude},${longitude}`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`Geocoding failed: ${response.status}`);
        }
        const data = await response.json();
        console.log(`📍 [INLINE-ADDRESS] Geocoding results:`, data);
        // Handle different data formats
        let resultsArray = [];
        if (Array.isArray(data)) {
          resultsArray = data;
        } else if (data && Array.isArray(data.predictions)) {
          resultsArray = data.predictions;
        } else if (data && Array.isArray(data.results)) {
          resultsArray = data.results;
        } else if (data && data.data && Array.isArray(data.data)) {
          resultsArray = data.data;
        }
        // Populate results
        if (resultsArray.length > 0) {
          populateResults(resultsArray);
          // Auto-select the first result
          const firstResult = resultsArray[0];
          const firstAddress =
            firstResult[labelField] || firstResult.label || firstResult.description;
          const cleanedAddress = cleanAddress(firstAddress);
          searchInput.value = cleanedAddress;
          hiddenInput.value = firstResult[valueField] || firstResult.value || firstResult.place_id;
          console.log(`✅ [INLINE-ADDRESS] Auto-selected: ${cleanedAddress}`);
          updateButtonVisibility();
        }
      } catch (error) {
        console.error(`📍 [INLINE-ADDRESS] Geolocation error:`, error);
        // Show error notification if available
        if (window.showNotice) {
          let errorMessage = "Failed to get your location. Please try again or search manually.";
          if (error.code === 1) {
            errorMessage =
              "Location access denied. Please enable location permissions and try again.";
          } else if (error.code === 2) {
            errorMessage = "Location unavailable. Please try again or search manually.";
          } else if (error.code === 3) {
            errorMessage = "Location request timed out. Please try again.";
          }
          window.showNotice("error", "Location Error", errorMessage, 5000);
        }
      } finally {
        // Restore button state
        locationBtn.disabled = false;
        locationBtn.innerHTML = originalHTML;
        updateButtonVisibility();
      }
    });
  }
  // Helper function to show dropdown
  function showDropdown() {
    dropdown.classList.remove("hidden");
  }
  // Helper function to hide dropdown
  function hideDropdown() {
    dropdown.classList.add("hidden");
  }
  // Helper function to clean address (remove ", USA" suffix)
  function cleanAddress(address) {
    if (!address) return address;
    return address.replace(/, USA$/i, '').trim();
  }
  
  // Helper function to create result element
  function createResultElement(result, index, isSelected = false) {
    const li = document.createElement("li");
    li.className = `inline-address-result-item cursor-pointer px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 ${
      isSelected
        ? "bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white"
        : "text-gray-700 dark:text-gray-200"
    }`;
    li.style.cssText = "user-select: none; -webkit-user-select: none;";
    li.dataset.index = String(index);
    li.dataset.value = result[valueField] || result.value || result.place_id || result.id;
    
    // Clean the label to remove ", USA"
    const rawLabel = result[labelField] || result.label || result.description;
    const cleanedLabel = cleanAddress(rawLabel);
    li.dataset.label = cleanedLabel;
    
    try {
      li.dataset.json = JSON.stringify(result);
    } catch (e) {
      // ignore non-serializable result
    }
    const textSpan = document.createElement("span");
    textSpan.className = "block";
    textSpan.textContent = cleanedLabel;
    li.appendChild(textSpan);
    return li;
  }
  // Helper function to populate results
  function populateResults(results) {
    resultsList.innerHTML = "";
    if (results.length > 0) {
      emptyState.classList.add("hidden");
      resultsList.classList.remove("hidden");
      
      // Add results with staggered timing (100ms between each)
      results.forEach((result, index) => {
        setTimeout(() => {
          const li = createResultElement(result, index, index === selectedIndex);
          resultsList.appendChild(li);
        }, index * 100); // 100ms delay between each result
      });
      showDropdown();
    } else {
      // Don't show dropdown if there are no results
      hideDropdown();
    }
  }
  // Handle search input
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim();
    // Update button visibility based on input state
    updateButtonVisibility();
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    // Clear results if query is empty
    if (query.length === 0) {
      resultsList.innerHTML = "";
      hideDropdown();
      selectedIndex = -1;
      // Clear the hidden input value
      hiddenInput.value = "";
      // Dispatch event to notify that address was cleared
      window.dispatchEvent(
        new CustomEvent("inline-address-select", {
          detail: {
            componentId: id,
            value: "",
            label: "",
            data: null,
          },
        })
      );
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
          // Handle different data formats
          let resultsArray = [];
          if (Array.isArray(data)) {
            resultsArray = data;
          } else if (data && Array.isArray(data.predictions)) {
            // Google Places format
            resultsArray = data.predictions;
          } else if (data && Array.isArray(data.results)) {
            resultsArray = data.results;
          } else if (data && data.data && Array.isArray(data.data)) {
            resultsArray = data.data;
          }
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
    const li = e.target.closest("li[data-index]");
    if (li) {
      const value = li.dataset.value;
      const label = li.dataset.label;
      console.log(`[INLINE-ADDRESS] Selected: ${label} (${value})`);
      // Update hidden input
      hiddenInput.value = value;
      // Update search input to show selected value
      searchInput.value = label;
      // Update button visibility to show clear button
      updateButtonVisibility();
      // Hide dropdown after selection
      hideDropdown();
      // Update selection styling
      const allItems = resultsList.querySelectorAll("li");
      allItems.forEach((item) => {
        item.classList.remove("bg-gray-100", "dark:bg-gray-600");
        item.classList.add("hover:bg-gray-100", "dark:hover:bg-gray-600");
      });
      li.classList.add("bg-gray-100", "dark:bg-gray-600");
      selectedIndex = parseInt(li.dataset.index);
      // Call custom onSelect callback if provided
      if (onSelect) {
        const data = li.dataset.json ? JSON.parse(li.dataset.json) : null;
        onSelect(value, label, data);
      }
      // Dispatch custom event for other components to listen to
      window.dispatchEvent(
        new CustomEvent("inline-address-select", {
          detail: {
            componentId: id,
            value,
            label,
            data: li.dataset.json ? JSON.parse(li.dataset.json) : null,
          },
        })
      );
    }
  });
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
          const selectedItem = items[selectedIndex];
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
  function updateSelection(items) {
    items.forEach((item, index) => {
      if (index === selectedIndex) {
        item.classList.add("bg-gray-100", "dark:bg-gray-600");
      } else {
        item.classList.remove("bg-gray-100", "dark:bg-gray-600");
      }
    });
  }
  // Scroll to selected item
  function scrollToSelected(item) {
    if (item) {
      item.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }
  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!dropdown.contains(target) && !searchInput.contains(target)) {
      hideDropdown();
    }
  });
}
/**
 * Create HTML structure for inline address search
 * Returns the wrapper element
 */
export function createAddressSearchHTML(config) {
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
  // Search icon
  const searchButton = document.createElement("button");
  searchButton.type = "button";
  searchButton.className =
    "absolute right-2 top-1/2 -translate-y-1/2 transform p-1.5 text-gray-400 transition-colors duration-200 hover:text-gray-600 dark:hover:text-gray-300";
  searchButton.title = "Search for address";
  searchButton.innerHTML = `<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>`;
  searchContainer.appendChild(searchButton);
  // Dropdown
  const dropdown = document.createElement("div");
  dropdown.id = `${id}-dropdown`;
  dropdown.className =
    "inline-address-results-container hidden absolute z-10 mt-2 w-full bg-white divide-y divide-gray-100 rounded-lg shadow-lg dark:bg-gray-700 dark:divide-gray-600";
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
