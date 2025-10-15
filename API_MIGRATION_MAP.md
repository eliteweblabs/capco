# API Migration Map

## Current API Calls → New Standardized Endpoints

### Users Management

| Current Endpoint               | New Endpoint                     | Method | Status     |
| ------------------------------ | -------------------------------- | ------ | ---------- |
| `/api/get-clients`             | `/api/users?role=Client`         | GET    | ✅ Created |
| `/api/get-mentionable-users`   | `/api/users?role=Client&search=` | GET    | ✅ Created |
| `/api/get-user-emails-by-role` | `/api/users?role=`               | GET    | ✅ Created |
| `/api/user/new`                | `/api/users/upsert`              | POST   | ✅ Created |
| `/api/user/update`             | `/api/users/upsert`              | POST   | ✅ Created |
| `/api/utils/delete-user`       | `/api/users/delete`              | DELETE | ✅ Created |

### Projects Management

| Current Endpoint      | New Endpoint             | Method | Status          |
| --------------------- | ------------------------ | ------ | --------------- |
| `/api/get-project`    | `/api/projects`          | GET    | 🔄 Needs Update |
| `/api/create-project` | `/api/projects`          | POST   | 🔄 Needs Update |
| `/api/project/delete` | `/api/projects/delete`   | DELETE | 🔄 Needs Update |
| `/api/project/${id}`  | `/api/projects?id=${id}` | GET    | 🔄 Needs Update |

### Files Management

| Current Endpoint           | New Endpoint          | Method | Status          |
| -------------------------- | --------------------- | ------ | --------------- |
| `/api/file/get`            | `/api/files`          | GET    | 🔄 Needs Update |
| `/api/file/delete`         | `/api/files/delete`   | DELETE | 🔄 Needs Update |
| `/api/file/download`       | `/api/files/download` | GET    | 🔄 Needs Update |
| `/api/file/preview`        | `/api/files/preview`  | GET    | 🔄 Needs Update |
| `/api/file/checkout`       | `/api/files/checkout` | POST   | 🔄 Needs Update |
| `/api/media`               | `/api/files/upload`   | POST   | 🔄 Needs Update |
| `/api/update-file-details` | `/api/files/upsert`   | POST   | 🔄 Needs Update |

### Discussions Management

| Current Endpoint                   | New Endpoint              | Method | Status          |
| ---------------------------------- | ------------------------- | ------ | --------------- |
| `/api/discussions`                 | `/api/discussions`        | GET    | 🔄 Needs Update |
| `/api/add-discussion`              | `/api/discussions`        | POST   | 🔄 Needs Update |
| `/api/update-discussion-completed` | `/api/discussions/update` | POST   | 🔄 Needs Update |

### Global Data

| Current Endpoint                | New Endpoint                | Method | Status          |
| ------------------------------- | --------------------------- | ------ | --------------- |
| `/api/get-global-activity-feed` | `/api/global/activity-feed` | GET    | ✅ Created      |
| `/api/get-global-discussions`   | `/api/global/discussions`   | GET    | 🔄 Needs Update |

### Notifications

| Current Endpoint                 | New Endpoint                | Method | Status          |
| -------------------------------- | --------------------------- | ------ | --------------- |
| `/api/notifications/get`         | `/api/notifications`        | GET    | 🔄 Needs Update |
| `/api/notifications/create`      | `/api/notifications`        | POST   | 🔄 Needs Update |
| `/api/notifications/mark-viewed` | `/api/notifications/update` | POST   | 🔄 Needs Update |

### Contracts & PDFs

| Current Endpoint             | New Endpoint                | Method | Status          |
| ---------------------------- | --------------------------- | ------ | --------------- |
| `/api/contract/get`          | `/api/contracts`            | GET    | 🔄 Needs Update |
| `/api/get-project-contract`  | `/api/contracts?projectId=` | GET    | 🔄 Needs Update |
| `/api/save-project-contract` | `/api/contracts`            | POST   | 🔄 Needs Update |
| `/api/generate-pdf-unified`  | `/api/pdfs/generate`        | POST   | 🔄 Needs Update |
| `/api/pdf/templates`         | `/api/pdfs/templates`       | GET    | 🔄 Needs Update |
| `/api/pdf/components`        | `/api/pdfs/components`      | GET    | 🔄 Needs Update |
| `/api/pdf/assemble`          | `/api/pdfs/assemble`        | GET    | 🔄 Needs Update |

### Punchlist

| Current Endpoint                  | New Endpoint            | Method | Status          |
| --------------------------------- | ----------------------- | ------ | --------------- |
| `/api/punchlist/get`              | `/api/punchlist`        | GET    | 🔄 Needs Update |
| `/api/update-punchlist-completed` | `/api/punchlist/update` | POST   | 🔄 Needs Update |

### Proposals & Invoices

| Current Endpoint                 | New Endpoint                      | Method | Status          |
| -------------------------------- | --------------------------------- | ------ | --------------- |
| `/api/get-project-invoice`       | `/api/invoices?projectId=`        | GET    | 🔄 Needs Update |
| `/api/create-invoice`            | `/api/invoices`                   | POST   | 🔄 Needs Update |
| `/api/get-invoice-details`       | `/api/invoices?id=`               | GET    | 🔄 Needs Update |
| `/api/line-items-catalog`        | `/api/invoices/line-items`        | GET    | 🔄 Needs Update |
| `/api/update-invoice-line-items` | `/api/invoices/line-items`        | POST   | 🔄 Needs Update |
| `/api/delete-line-item`          | `/api/invoices/line-items/delete` | DELETE | 🔄 Needs Update |

### System & Utilities

| Current Endpoint          | New Endpoint                 | Method | Status          |
| ------------------------- | ---------------------------- | ------ | --------------- |
| `/api/project-statuses`   | `/api/statuses`              | GET    | 🔄 Needs Update |
| `/api/update-status`      | `/api/statuses/update`       | POST   | 🔄 Needs Update |
| `/api/update-delivery`    | `/api/notifications/deliver` | POST   | 🔄 Needs Update |
| `/api/save-signature`     | `/api/signatures`            | POST   | 🔄 Needs Update |
| `/api/contact-submission` | `/api/contact`               | POST   | 🔄 Needs Update |
| `/api/chat`               | `/api/chat`                  | POST   | ✅ Keep as-is   |
| `/api/payments`           | `/api/payments`              | POST   | ✅ Keep as-is   |

## Migration Priority

### Phase 1: Core CRUD Operations (High Priority)

1. ✅ Users (get, upsert, delete) - COMPLETED
2. 🔄 Projects (get, upsert, delete) - IN PROGRESS
3. 🔄 Files (get, upload, delete, download) - PENDING
4. 🔄 Discussions (get, add, update) - PENDING

### Phase 2: Global Data (Medium Priority)

1. ✅ Global Activity Feed - COMPLETED
2. 🔄 Global Discussions - PENDING
3. 🔄 Notifications - PENDING

### Phase 3: Specialized Features (Lower Priority)

1. 🔄 Contracts & PDFs - PENDING
2. 🔄 Proposals & Invoices - PENDING
3. 🔄 Punchlist - PENDING

## Frontend Update Requirements

### High Impact Files (Need Updates)

- `src/pages/dashboard.astro` - Project loading
- `src/components/project/ProjectForm.astro` - Project creation
- `src/components/project/FileManager.astro` - File operations
- `src/components/form/Discussions.astro` - Discussion management
- `src/components/admin/ContractEditor.astro` - Contract management

### Medium Impact Files

- `src/components/common/NotificationDropdown.astro` - Notifications
- `src/components/project/PDFGenerator.astro` - PDF operations
- `src/components/project/Punchlist.astro` - Punchlist management

### Low Impact Files

- Various specialized components for proposals, payments, etc.

## Backward Compatibility Strategy

1. **Keep old endpoints** during transition period
2. **Add deprecation warnings** to old endpoints
3. **Update frontend gradually** by component
4. **Remove old endpoints** after full migration
5. **Update documentation** with new API structure
