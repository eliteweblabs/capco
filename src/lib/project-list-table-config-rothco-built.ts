/**
 * Project List Table Configuration - Rothco Built
 * Re-exports capco config; override columns here for client-specific layout
 */

import type { ProjectListColumnConfig } from "./project-list-table-config";
import { PROJECT_LIST_COLUMNS as capcoColumns } from "./project-list-table-config-capco-design-group";

export const PROJECT_LIST_COLUMNS: ProjectListColumnConfig[] = capcoColumns;
