-- =====================================================
-- REMOVE DUPLICATE FOREIGN KEY CONSTRAINTS
-- =====================================================
-- This script removes all the duplicate foreign key constraints with lowercase naming
-- =====================================================

-- Remove duplicate foreign key constraints with lowercase naming

-- Files table
ALTER TABLE files DROP CONSTRAINT IF EXISTS files_projectid_fkey;
ALTER TABLE files DROP CONSTRAINT IF EXISTS files_assignedto_fkey;
ALTER TABLE files DROP CONSTRAINT IF EXISTS files_checkedoutby_fkey;

-- FileVersions table
ALTER TABLE "fileVersions" DROP CONSTRAINT IF EXISTS fileversions_fileid_fkey;
ALTER TABLE "fileVersions" DROP CONSTRAINT IF EXISTS fileversions_uploadedby_fkey;

-- Payments table
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_invoiceid_fkey;

-- GeneratedDocuments table
ALTER TABLE "generatedDocuments" DROP CONSTRAINT IF EXISTS generateddocuments_projectid_fkey;
ALTER TABLE "generatedDocuments" DROP CONSTRAINT IF EXISTS generateddocuments_createdby_fkey;

-- Invoices table
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_projectid_fkey;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_createdby_fkey;

-- Punchlist table
ALTER TABLE punchlist DROP CONSTRAINT IF EXISTS punchlist_projectid_fkey;
ALTER TABLE punchlist DROP CONSTRAINT IF EXISTS punchlist_authorid_fkey;
ALTER TABLE punchlist DROP CONSTRAINT IF EXISTS punchlist_parentid_fkey;

-- ChatMessages table
ALTER TABLE "chatMessages" DROP CONSTRAINT IF EXISTS chatmessages_userid_fkey;

-- DemoBookings table
ALTER TABLE "demoBookings" DROP CONSTRAINT IF EXISTS demobookings_assignedto_fkey;

-- Feedback table
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_userid_fkey;

-- LineItemsCatalog table
ALTER TABLE "lineItemsCatalog" DROP CONSTRAINT IF EXISTS lineitemscatalog_createdby_fkey;

-- Notifications table
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_userid_fkey;

-- Subjects table
ALTER TABLE subjects DROP CONSTRAINT IF EXISTS subjects_createdby_fkey;

-- TutorialConfigs table
ALTER TABLE "tutorialConfigs" DROP CONSTRAINT IF EXISTS tutorialconfigs_userid_fkey;

-- Success message
SELECT 'All duplicate foreign key constraints with lowercase naming have been removed!' as status;
