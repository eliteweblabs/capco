-- =====================================================
-- SCHEMA IMPORT - Generated from CSV export
-- Generated: 2026-01-14T01:48:28.728Z
-- =====================================================

"-- Foreign Key: ai_agent_conversations_projectId_fkey on ai_agent_conversations
ALTER TABLE ai_agent_conversations;
"-- Foreign Key: ai_agent_knowledge_projectId_fkey on ai_agent_knowledge
ALTER TABLE ai_agent_knowledge;
"-- Foreign Key: ai_agent_messages_conversationId_fkey on ai_agent_messages
ALTER TABLE ai_agent_messages;
"-- Foreign Key: ai_agent_project_memory_projectId_fkey on ai_agent_project_memory
ALTER TABLE ai_agent_project_memory;
"-- Foreign Key: ai_agent_usage_conversationId_fkey on ai_agent_usage
ALTER TABLE ai_agent_usage;
"-- Foreign Key: ai_agent_usage_messageId_fkey on ai_agent_usage
ALTER TABLE ai_agent_usage;
"-- Foreign Key: ai_generated_documents_projectId_fkey on ai_generated_documents
ALTER TABLE ai_generated_documents;
"-- Foreign Key: ai_generated_documents_templateId_fkey on ai_generated_documents
ALTER TABLE ai_generated_documents;
"-- Foreign Key: ai_generations_documentId_fkey on ai_generations
ALTER TABLE ai_generations;
"-- Foreign Key: discussion_projectId_fkey on discussion
ALTER TABLE discussion;
"-- Foreign Key: fileCheckoutHistory_fileId_fkey on fileCheckoutHistory
ALTER TABLE "fileCheckoutHistory";
"-- Foreign Key: file_versions_fileId_fkey on fileVersions
ALTER TABLE "fileVersions";
"-- Foreign Key: invoices_projectid_fkey on invoices
ALTER TABLE invoices;
"-- Foreign Key: payments_invoiceId_fkey on payments
ALTER TABLE payments;
"-- Foreign Key: pdfGenerationHistory_jobId_fkey on pdfGenerationHistory
ALTER TABLE "pdfGenerationHistory";
"-- Foreign Key: pdfGenerationHistory_projectId_fkey on pdfGenerationHistory
ALTER TABLE "pdfGenerationHistory";
"-- Foreign Key: pdfGenerationHistory_templateId_fkey on pdfGenerationHistory
ALTER TABLE "pdfGenerationHistory";
"-- Foreign Key: pdfGenerationJobs_projectId_fkey on pdfGenerationJobs
ALTER TABLE "pdfGenerationJobs";
"-- Foreign Key: pdfGenerationJobs_templateId_fkey on pdfGenerationJobs
ALTER TABLE "pdfGenerationJobs";
"-- Foreign Key: pdfTemplateFields_templateId_fkey on pdfTemplateFields
ALTER TABLE "pdfTemplateFields";
"-- Foreign Key: pdfTemplates_projectId_fkey on pdfTemplates
ALTER TABLE "pdfTemplates";
"-- Foreign Key: punchlist_author_id_fkey on punchlist
ALTER TABLE punchlist;

