-- =====================================================
-- FIX FOREIGN KEY CONSTRAINT NAMES
-- =====================================================
-- This script renames all foreign key constraints to use camelCase naming
-- =====================================================

-- Drop and recreate all foreign key constraints with proper camelCase names

-- 1. Fix files table foreign key constraints
ALTER TABLE files DROP CONSTRAINT IF EXISTS files_project_id_fkey;
ALTER TABLE files DROP CONSTRAINT IF EXISTS files_assigned_to_fkey;
ALTER TABLE files DROP CONSTRAINT IF EXISTS files_checked_out_by_fkey;

ALTER TABLE files ADD CONSTRAINT files_projectId_fkey FOREIGN KEY ("projectId") REFERENCES public.projects(id);
ALTER TABLE files ADD CONSTRAINT files_assignedTo_fkey FOREIGN KEY ("assignedTo") REFERENCES auth.users(id);
ALTER TABLE files ADD CONSTRAINT files_checkedOutBy_fkey FOREIGN KEY ("checkedOutBy") REFERENCES auth.users(id);

-- 2. Fix generatedDocuments table foreign key constraints
ALTER TABLE "generatedDocuments" DROP CONSTRAINT IF EXISTS generated_documents_project_id_fkey;
ALTER TABLE "generatedDocuments" DROP CONSTRAINT IF EXISTS generated_documents_created_by_fkey;

ALTER TABLE "generatedDocuments" ADD CONSTRAINT generatedDocuments_projectId_fkey FOREIGN KEY ("projectId") REFERENCES public.projects(id);
ALTER TABLE "generatedDocuments" ADD CONSTRAINT generatedDocuments_createdBy_fkey FOREIGN KEY ("createdBy") REFERENCES public.profiles(id);

-- 3. Fix invoices table foreign key constraints
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_project_id_fkey;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_created_by_fkey;

ALTER TABLE invoices ADD CONSTRAINT invoices_projectId_fkey FOREIGN KEY ("projectId") REFERENCES public.projects(id);
ALTER TABLE invoices ADD CONSTRAINT invoices_createdBy_fkey FOREIGN KEY ("createdBy") REFERENCES auth.users(id);

-- 4. Fix punchlist table foreign key constraints
ALTER TABLE punchlist DROP CONSTRAINT IF EXISTS punchlist_project_id_fkey;
ALTER TABLE punchlist DROP CONSTRAINT IF EXISTS punchlist_author_id_fkey;
ALTER TABLE punchlist DROP CONSTRAINT IF EXISTS punchlist_parent_id_fkey;

ALTER TABLE punchlist ADD CONSTRAINT punchlist_projectId_fkey FOREIGN KEY ("projectId") REFERENCES public.projects(id);
ALTER TABLE punchlist ADD CONSTRAINT punchlist_authorId_fkey FOREIGN KEY ("authorId") REFERENCES public.profiles(id);
ALTER TABLE punchlist ADD CONSTRAINT punchlist_parentId_fkey FOREIGN KEY ("parentId") REFERENCES public.punchlist(id);

-- 5. Fix discussion table foreign key constraints
ALTER TABLE discussion DROP CONSTRAINT IF EXISTS discussion_projectId_fkey;
ALTER TABLE discussion DROP CONSTRAINT IF EXISTS discussion_parent_id_fkey;

ALTER TABLE discussion ADD CONSTRAINT discussion_projectId_fkey FOREIGN KEY ("projectId") REFERENCES public.projects(id);
ALTER TABLE discussion ADD CONSTRAINT discussion_parentId_fkey FOREIGN KEY ("parentId") REFERENCES public.discussion(id);

-- 6. Fix any other tables that might have similar issues
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_invoiceId_fkey;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_created_by_fkey;

ALTER TABLE payments ADD CONSTRAINT payments_invoiceId_fkey FOREIGN KEY ("invoiceId") REFERENCES public.invoices(id);
ALTER TABLE payments ADD CONSTRAINT payments_createdBy_fkey FOREIGN KEY ("createdBy") REFERENCES auth.users(id);

-- 7. Fix lineItemsCatalog table foreign key constraints
ALTER TABLE "lineItemsCatalog" DROP CONSTRAINT IF EXISTS line_items_catalog_created_by_fkey;
ALTER TABLE "lineItemsCatalog" ADD CONSTRAINT lineItemsCatalog_createdBy_fkey FOREIGN KEY ("createdBy") REFERENCES auth.users(id);

-- 8. Fix subjects table foreign key constraints
ALTER TABLE subjects DROP CONSTRAINT IF EXISTS subjects_created_by_fkey;
ALTER TABLE subjects ADD CONSTRAINT subjects_createdBy_fkey FOREIGN KEY ("createdBy") REFERENCES public.profiles(id);

-- 9. Fix tutorialConfigs table foreign key constraints
ALTER TABLE "tutorialConfigs" DROP CONSTRAINT IF EXISTS tutorial_configs_user_id_fkey;
ALTER TABLE "tutorialConfigs" ADD CONSTRAINT tutorialConfigs_userId_fkey FOREIGN KEY ("userId") REFERENCES auth.users(id);

-- 10. Fix notifications table foreign key constraints
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE notifications ADD CONSTRAINT notifications_userId_fkey FOREIGN KEY ("userId") REFERENCES auth.users(id);

-- 11. Fix feedback table foreign key constraints
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_user_id_fkey;
ALTER TABLE feedback ADD CONSTRAINT feedback_userId_fkey FOREIGN KEY ("user_id") REFERENCES auth.users(id);

-- 12. Fix fileVersions table foreign key constraints
ALTER TABLE "fileVersions" DROP CONSTRAINT IF EXISTS file_versions_fileId_fkey;
ALTER TABLE "fileVersions" DROP CONSTRAINT IF EXISTS file_versions_uploadedBy_fkey;

ALTER TABLE "fileVersions" ADD CONSTRAINT fileVersions_fileId_fkey FOREIGN KEY ("fileId") REFERENCES public.files(id);
ALTER TABLE "fileVersions" ADD CONSTRAINT fileVersions_uploadedBy_fkey FOREIGN KEY ("uploadedBy") REFERENCES auth.users(id);

-- 13. Fix demoBookings table foreign key constraints
ALTER TABLE "demoBookings" DROP CONSTRAINT IF EXISTS demo_bookings_assigned_to_fkey;
ALTER TABLE "demoBookings" ADD CONSTRAINT demoBookings_assignedTo_fkey FOREIGN KEY ("assignedTo") REFERENCES auth.users(id);

-- 14. Fix chatMessages table foreign key constraints
ALTER TABLE "chatMessages" DROP CONSTRAINT IF EXISTS chatMessages_user_id_fkey;
ALTER TABLE "chatMessages" ADD CONSTRAINT chatMessages_userId_fkey FOREIGN KEY ("userId") REFERENCES auth.users(id);

-- Success message
SELECT 'All foreign key constraint names updated to camelCase!' as status;
