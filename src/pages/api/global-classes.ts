export const globalClasses = () => {
  return {
    globalInputClasses:
      "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-gray-100 dark:bg-gray-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:text-white dark:focus:border-primary-400 dark:focus:ring-primary-400",
    globalPrimaryTextClasses: "text-gray-900 dark:text-gray-100",
    globalSecondaryTextClasses: "text-gray-800 dark:text-gray-200",
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
      return "col-span-12";
    case 2:
      return "col-span-12 md:col-span-6";
    case 3:
      return "col-span-12 md:col-span-4";
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
