export const globalClasses = () => {
  return {
    globalInputClasses:
      "w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 transition-colors duration-200 placeholder:text-gray-600 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 shadow-secondary-inner-md scrollbar-hide dark:border-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-300",
    /** Applied to the input wrapper so it affects animated placeholder and input icons. Height and text size here; input uses multiStepInputCoreClasses to fill and inherit. */
    multiStepInputClasses:
      "h-14 sm:h-16 md:h-18 lg:h-20 text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-900 transition-colors duration-200 dark:text-white text-left",
    /** Input-only classes when inside multistep wrapper: fill wrapper; explicit text/color so input doesn't fall back to browser defaults. */
    multiStepInputCoreClasses:
      "w-full h-full bg-transparent border-0 py-2.5 px-4 text-xl sm:text-2xl md:text-3xl lg:text-4xl text-left text-gray-900 placeholder:text-gray-500 focus:outline-none transition-colors duration-200 dark:text-white dark:placeholder:text-gray-400",
    primaryTextClasses: "text-gray-900 dark:text-gray-100",
    secondaryTextClasses: "text-gray-800 dark:text-gray-200",
    // Flowbite-standard icon-only button (gray/secondary)
    globalIconButtonClasses:
      "w-10 h-10 inline-flex items-center rounded-full justify-center p-2 text-black dark:text-white md:hover:bg-gray-100 dark:hover:bg-gray-700 dark:focus:ring-gray-700 focus:outline-none",

    globalAdminContainerClasses: "color-background rounded-lg shadow-md dark:shadow-gray-700",
    tabContentClasses: "color-background relative mb-16 min-h-[calc(100dvh-24rem)] p-4 shadow-lg",
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
