-- =====================================================
-- SCHEMA IMPORT - Generated from CSV export
-- Generated: 2026-01-14T01:49:31.693Z
-- =====================================================

-- Foreign Key: ai_agent_conversations_projectId_fkey on ai_agent_conversations
ALTER TABLE ai_agent_conversations
    ADD CONSTRAINT
-- Foreign Key: ai_agent_knowledge_projectId_fkey on ai_agent_knowledge
ALTER TABLE ai_agent_knowledge
    ADD CONSTRAINT
-- Foreign Key: ai_agent_messages_conversationId_fkey on ai_agent_messages
ALTER TABLE ai_agent_messages
    ADD CONSTRAINT
-- Foreign Key: ai_agent_project_memory_projectId_fkey on ai_agent_project_memory
ALTER TABLE ai_agent_project_memory
    ADD CONSTRAINT
-- Foreign Key: ai_agent_usage_conversationId_fkey on ai_agent_usage
ALTER TABLE ai_agent_usage
    ADD CONSTRAINT
-- Foreign Key: ai_agent_usage_messageId_fkey on ai_agent_usage
ALTER TABLE ai_agent_usage
    ADD CONSTRAINT
-- Foreign Key: ai_generated_documents_projectId_fkey on ai_generated_documents
ALTER TABLE ai_generated_documents
    ADD CONSTRAINT
-- Foreign Key: ai_generated_documents_templateId_fkey on ai_generated_documents
ALTER TABLE ai_generated_documents
    ADD CONSTRAINT
-- Foreign Key: ai_generations_documentId_fkey on ai_generations
ALTER TABLE ai_generations
    ADD CONSTRAINT
-- Foreign Key: discussion_projectId_fkey on discussion
ALTER TABLE discussion
    ADD CONSTRAINT
-- Foreign Key: fileCheckoutHistory_fileId_fkey on fileCheckoutHistory
ALTER TABLE
-- Foreign Key: file_versions_fileId_fkey on fileVersions
ALTER TABLE
-- Foreign Key: invoices_projectid_fkey on invoices
ALTER TABLE invoices
    ADD CONSTRAINT invoices_projectid_fkey
    FOREIGN KEY (
-- Foreign Key: payments_invoiceId_fkey on payments
ALTER TABLE payments
    ADD CONSTRAINT
-- Foreign Key: pdfGenerationHistory_jobId_fkey on pdfGenerationHistory
ALTER TABLE
-- Foreign Key: pdfGenerationHistory_projectId_fkey on pdfGenerationHistory
ALTER TABLE
-- Foreign Key: pdfGenerationHistory_templateId_fkey on pdfGenerationHistory
ALTER TABLE
-- Foreign Key: pdfGenerationJobs_projectId_fkey on pdfGenerationJobs
ALTER TABLE
-- Foreign Key: pdfGenerationJobs_templateId_fkey on pdfGenerationJobs
ALTER TABLE
-- Foreign Key: pdfTemplateFields_templateId_fkey on pdfTemplateFields
ALTER TABLE
-- Foreign Key: pdfTemplates_projectId_fkey on pdfTemplates
ALTER TABLE
-- Foreign Key: punchlist_author_id_fkey on punchlist
ALTER TABLE punchlist
    ADD CONSTRAINT punchlist_author_id_fkey
    FOREIGN KEY (

