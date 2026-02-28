export const globalClasses = () => {
  return {
    globalContainerClasses:
      "mx-auto max-w-7xl px-4 sm:px-6 md:px-8 lg:px-10 mb-4 sm:mb-8 md:mb-12 lg:mb-16",
    globalInputClasses:
      "w-full rounded-md border border-gray-300 px-3 py-2 text-base text-gray-900 transition-colors duration-200 placeholder:text-gray-600 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 shadow-secondary-inner-md scrollbar-hide dark:border-gray-600 bg-[var(--color-input-bg)] dark:text-white dark:placeholder:text-gray-300",
    /** Applied to form elements (excl. MultiStepForm). Use for consistent form spacing. */
    globalFormClasses: "color-background p-4 space-y-6 rounded-sm",
    /** Applied to the input wrapper so it affects animated placeholder and input icons. Height and text size here; input uses multiStepInputCoreClasses to fill and inherit. */
    multiStepInputClasses:
      "h-14 sm:h-16 md:h-18 lg:h-20 text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-900 transition-colors duration-200 dark:text-white text-left",
    /** Input-only classes when inside multistep wrapper: fill wrapper; explicit text/color so input doesn't fall back to browser defaults. */
    multiStepInputCoreClasses:
      "w-full h-full bg-transparent border-0 py-2.5 px-4 text-xl sm:text-2xl md:text-3xl lg:text-4xl text-left text-gray-900 placeholder:text-gray-500 focus:outline-none transition-colors duration-200 dark:text-white dark:placeholder:text-gray-400",
    primaryTextClasses: "text-gray-900 dark:text-gray-100",
    secondaryTextClasses: "text-gray-800 dark:text-gray-200",
    /** H3/section heading: text-lg font-semibold. Use for card titles, section headings, modal titles. */
    globalTextH3: "text-lg font-semibold text-gray-900 dark:text-white",
    /** Muted/tertiary text - highly repetitive. Use for descriptions, helper text, labels. */
    mutedTextClasses: "text-gray-600 dark:text-gray-400",
    /** Muted text + text-sm - common combo for captions, hints. */
    mutedTextSmClasses: "text-sm text-gray-600 dark:text-gray-400",
    /** Lighter muted text (gray-500) - for subtle descriptions, placeholders. */
    mutedAltTextClasses: "text-gray-500 dark:text-gray-400",
    /** Form label: mb-2 block text-sm font-medium. Use for <label> elements. */
    globalFormLabel: "mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300",
    /** Inline code: rounded bg-gray-100 px-1. Use for <code> in prose. */
    globalCodeInline: "rounded bg-gray-100 px-1 dark:bg-gray-800",
    /** Extra-small muted text (xs, gray-500). Use for captions, metadata, timestamps. */
    globalTextXsMuted: "text-xs text-gray-500 dark:text-gray-400",
    /** Horizontal flex row: items-center space-x-2. Use for icon+text, buttons in a row. */
    globalFlexRow: "flex items-center space-x-2",
    /** Section header bar: mb-4 flex items-center justify-between. Use for card headers with actions. */
    globalSectionHeaderBar: "mb-4 flex items-center justify-between",
    // Flowbite-standard icon-only button (gray/secondary)
    globalIconButtonClasses:
      "w-10 h-10 inline-flex items-center rounded-full justify-center p-2 text-black dark:text-white md:hover:bg-gray-100 dark:hover:bg-gray-700 dark:focus:ring-gray-700 focus:outline-none",
    /** Dropdown close icon overlay: auth-icon-close + absolute inset-0 flex center + transition-opacity. Used in AuthIcon, NotificationBellButton, StaffSelectTooltip. */
    globalDropdownClose:
      "auth-icon-close absolute inset-0 flex items-center justify-center transition-opacity",

    globalAdminContainerClasses: "color-background rounded-lg shadow-md dark:shadow-gray-700",
    /** Card container: rounded-lg border + semantic background. Use for card/panel containers. */
    globalCardStyle: "rounded-lg border color-background",
    tabContentClasses:
      "color-background relative mb-16 min-h-[calc(100dvh-24rem)] p-6 sm:p-8 md:p-10 lg:p-12 shadow-lg",

    // Data table / accordion table (shared by AccordionDataTable, ProjectList, etc.)
    dataTableCardClasses: "overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900",
    dataTableBorderClasses: "border-gray-200 dark:border-gray-700",
    dataTableHeaderBarClasses:
      "flex items-center justify-between gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-700",
    dataTableTitleClasses: "text-lg font-semibold text-gray-900 dark:text-white",
    dataTableDescriptionClasses: "mt-1 text-sm text-gray-500 dark:text-gray-400",
    dataTableClearButtonClasses:
      "shrink-0 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700",
    dataTableTableWrapperClasses: "w-full text-center no-scrollbar",
    dataTableTableClasses:
      "w-full max-w-full table-fixed divide-gray-200 text-center text-sm dark:divide-gray-700",
    dataTableTheadClasses:
      "sticky top-0 z-10 text-uppercase color-background select-none text-xs font-semibold uppercase tracking-wide",
    dataTableThClasses:
      "color-border-primary border-r border-gray-200 px-4 py-3 font-semibold dark:border-gray-700",
    /** Same as dataTableThClasses + border-l + color-background so Actions column is clearly part of the table */
    dataTableActionsThClasses:
      "color-background color-border-primary border-l border-r border-gray-200 px-4 py-3 font-semibold dark:border-gray-700",
    dataTableTbodyClasses:
      "divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900",
    dataTableEmptyCellClasses: "px-4 py-8 text-sm text-gray-500 dark:text-gray-400",
    dataTableTriggerRowBaseClasses:
      "select-none border-b border-gray-200 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700",
    dataTableDragHandleTdClasses: "w-10 px-2 py-3 align-middle text-gray-400 dark:text-gray-500",
    dataTableDataCellClasses: "px-4 py-2 text-sm text-gray-900 dark:text-white",
    /** Same as dataTableDataCellClasses + whitespace-nowrap + border-l so Actions column matches the rest */
    dataTableActionsCellClasses:
      "whitespace-nowrap border-l border-gray-200 px-4 py-2 text-sm text-gray-900 dark:border-gray-700 dark:text-white",
    dataTableDetailTdClasses: "bg-gray-50 p-0 dark:bg-gray-800/50",
    dataTableSlotMinHeightClasses: "min-h-[120px]",
    dataTableCreateFooterClasses: "border-t border-gray-200 px-4 py-3 dark:border-gray-700",
    dataTableCreateDetailClasses: "rounded-b-lg bg-gray-50 dark:bg-gray-800/50",
    dataTableCreateSlotClasses: "min-h-[120px] p-4",
    dataTableDragThClasses: "w-10 px-2 py-3",
    /** Select column (checkbox) - narrow fixed width */
    dataTableSelectThClasses:
      "color-background color-border-primary border-r border-gray-200 px-2 py-3 font-semibold dark:border-gray-700 w-12 min-w-[3rem]",
    dataTableSelectTdClasses:
      "border-r border-gray-200 px-2 py-2 text-sm dark:border-gray-700 w-12 min-w-[3rem]",
    /** Sticky positioning for first/last columns (e.g. select, actions) */
    dataTableThStickyLeftClasses:
      "sticky left-0 z-[1] bg-white dark:bg-gray-900 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.3)]",
    dataTableTdStickyLeftClasses:
      "sticky left-0 z-[1] bg-white dark:bg-gray-900 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.3)]",
    dataTableThStickyRightClasses:
      "sticky right-0 z-[1] bg-white dark:bg-gray-900 shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)] dark:shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.3)]",
    dataTableTdStickyRightClasses:
      "sticky right-0 z-[1] bg-white dark:bg-gray-900 shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.1)] dark:shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.3)]",

    // Aside / sidebar nav (Aside.astro)
    globalSidebarClasses:
      "bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-sm transition-duration-[350ms]",
    navAnchorClasses:
      "lowercase hover:bg-gray-300 dark:hover:bg-gray-700 flex w-full align-center rounded-lg px-3 py-2 whitespace-nowrap",
    navActiveClasses: "bg-gray-300 dark:bg-gray-700 font-bold",
    navSvgClasses: "h-4 w-4 flex-shrink-0 text-gray-900 dark:text-gray-400",
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
