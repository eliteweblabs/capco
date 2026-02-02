export const globalClasses = () => {
  return {
    globalInputClasses:
      "backdrop-blur-sm border-gray-100/50 dark:border-gray-900/50 bg-white/50 dark:bg-black/50 backdrop-blur-sm shadow-secondary-inner-md w-full rounded-xl border-0 py-2.5 px-4 text-gray-900 transition-colors duration-200 placeholder:text-gray-400 focus:outline-none dark:text-white dark:placeholder:text-gray-500 no-scrollbar",
    primaryTextClasses: "text-gray-900 dark:text-gray-100",
    secondaryTextClasses: "text-gray-800 dark:text-gray-200",
    globalIconButtonClasses:
      "flex align-center rounded-full p-2 text-center text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-600",
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
