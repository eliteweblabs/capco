export const globalClasses = () => {
  return {
    globalInputClasses:
      "border-gray-100/50 dark:border-gray-900/50 color-background-50  w-full rounded-lg border-2 py-2.5 px-4 text-gray-900 transition-colors duration-200 placeholder:text-gray-400 focus:border-secondary-500 focus:outline-none focus:ring-2 focus:ring-secondary-500/20 dark:border-gray-800/50 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-secondary-400 dark:focus:ring-secondary-400/20",
    primaryTextClasses: "text-gray-900 dark:text-gray-100",
    secondaryTextClasses: "text-gray-800 dark:text-gray-200",
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
