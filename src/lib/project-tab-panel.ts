/** SSR + client: hide project workspace tab panels that are not active. */
export function projectTabPanelClass(isActiveTab: boolean, baseClasses: string): string {
  return isActiveTab ? baseClasses : `${baseClasses} hidden`.trim();
}
