export const globalClasses = () => {
  return {
    globalInputClasses:
      "color-background shadow-secondary-inner-md w-full border-0 py-2.5 px-4 text-gray-900 transition-colors duration-200 text-grey-900 placeholder:text-gray-600 focus:outline-none dark:text-white dark:placeholder:text-gray-300 no-scrollbar",
    /** Typewriter-agent style for JSON config (MultiStepForm) inputs: no box shadow, color-background so content overwrites dot pattern, visible caret next to icon/placeholder */
    multiStepInputClasses:
      "multi-step-input w-full bg-transparent border-0 py-2.5 px-4 text-gray-900 transition-colors duration-200 placeholder:text-gray-500 focus:outline-none dark:text-white dark:placeholder:text-gray-400 no-scrollbar text-left",
    primaryTextClasses: "text-gray-900 dark:text-gray-100",
    secondaryTextClasses: "text-gray-800 dark:text-gray-200",
    // Flowbite-standard icon-only button (gray/secondary)
    globalIconButtonClasses:
      "inline-flex items-center rounded-full justify-center p-2 text-black dark:text-white hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-700 focus:outline-none",
  };
};

/**
 * Get responsive column classes based on column count
 * @param columns - Number of columns (1, 2, 3, 4, 6, or 12)
 * @returns Tailwind CSS classes for grid columns
 */
export const getColumnClasses = (columns: number | undefined): string => {
  switch (columns) {
    case 1:
      return "col-span-6 md:col-span-12";
    case 2:
      return "col-span-6 md:col-span-6";
    case 3:
      return "col-span-6 md:col-span-4";
    case 4:
      return "col-span-3";
    case 6:
      return "col-span-2";
    case 12:
      return "col-span-1";
    case undefined:
    default:
      return "col-span-6";
  }
};
