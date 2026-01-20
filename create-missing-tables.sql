-- Table: cmsPages
CREATE TABLE IF NOT EXISTS "cmsPages" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "slug" text NOT NULL,
    "title" text,
    "description" text,
    "content" text NOT NULL,
    "frontmatter" jsonb DEFAULT '{}'::jsonb,
    "template" text DEFAULT 'default'::text,
    "client_id" text,
    "is_active" bool DEFAULT true,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "include_in_navigation" bool DEFAULT false,
    "nav_roles" _text DEFAULT ARRAY['any'::text],
    "nav_page_type" text DEFAULT 'frontend'::text,
    "nav_button_style" text,
    "nav_desktop_only" bool DEFAULT false,
    "nav_hide_when_auth" bool DEFAULT false
);

-- Table: directMessages
CREATE TABLE IF NOT EXISTS "directMessages" (
    "id" integer NOT NULL DEFAULT nextval('direct_messages_id_seq'::regclass),
    "fromUser" uuid,
    "toUser" uuid,
    "fromName" text,
    "message" text,
    "isDeleted" bool DEFAULT false,
    "readAt" timestamptz,
    "messageTimestamp" timestamptz DEFAULT now(),
    "createdAt" timestamptz DEFAULT now()
);

-- Table: documentComponents
CREATE TABLE IF NOT EXISTS "documentComponents" (
    "id" integer NOT NULL DEFAULT nextval('document_components_id_seq'::regclass),
    "documentId" integer,
    "componentId" integer,
    "insertionPoint" varchar(100),
    "displayOrder" integer,
    "componentData" jsonb,
    "createdAt" timestamptz DEFAULT now()
);

-- Table: documentTemplates
CREATE TABLE IF NOT EXISTS "documentTemplates" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "name" text NOT NULL,
    "category" text NOT NULL,
    "description" text,
    "promptTemplate" text NOT NULL,
    "fields" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "isActive" bool DEFAULT true,
    "createdAt" timestamptz DEFAULT now(),
    "updatedAt" timestamptz DEFAULT now()
);

-- Table: filesGlobal
CREATE TABLE IF NOT EXISTS "filesGlobal" (
    "id" integer NOT NULL DEFAULT nextval('files_global_id_seq'::regclass),
    "name" text,
    "fileName" text,
    "filePath" text,
    "fileType" text,
    "fileSize" bigint,
    "type" integer,
    "status" text,
    "uploadedAt" timestamp DEFAULT now()
);

-- Table: globalSettings
CREATE TABLE IF NOT EXISTS "globalSettings" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "key" text NOT NULL,
    "value" text,
    "valueType" text NOT NULL DEFAULT 'text'::text,
    "category" text NOT NULL DEFAULT 'general'::text,
    "description" text,
    "updatedAt" timestamptz DEFAULT now(),
    "updatedBy" uuid
);
