-- Add navigation properties to cms_pages table
-- These properties control how CMS pages appear in the navigation menu

ALTER TABLE cms_pages 
ADD COLUMN IF NOT EXISTS nav_roles TEXT[] DEFAULT ARRAY['any'],
ADD COLUMN IF NOT EXISTS nav_page_type TEXT DEFAULT 'frontend' CHECK (nav_page_type IN ('frontend', 'backend')),
ADD COLUMN IF NOT EXISTS nav_button_style TEXT CHECK (nav_button_style IN ('primary', 'secondary', 'ghost', 'outline')),
ADD COLUMN IF NOT EXISTS nav_desktop_only BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS nav_hide_when_auth BOOLEAN DEFAULT false;

-- Add comments
COMMENT ON COLUMN cms_pages.nav_roles IS 'Array of user roles that can see this page in navigation: any, Client, Admin, Staff';
COMMENT ON COLUMN cms_pages.nav_page_type IS 'Page type: frontend or backend';
COMMENT ON COLUMN cms_pages.nav_button_style IS 'Optional button style for navigation: primary, secondary, ghost, outline';
COMMENT ON COLUMN cms_pages.nav_desktop_only IS 'If true, show only on desktop navigation';
COMMENT ON COLUMN cms_pages.nav_hide_when_auth IS 'If true, hide this navigation item when user is authenticated';
