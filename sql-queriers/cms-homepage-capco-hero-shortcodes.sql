-- Inspect homepage CMS body for Capco hero merge (NodesCapco + LayoutProductCapco).
-- MarkdownPage only renders CapcoHeroSection when BOTH shortcodes exist in order (see mergeCapcoHeroSegments).
-- Run in Supabase SQL editor for the project that backs this deployment.

select
  id,
  slug,
  "clientId",
  "isActive",
  length(coalesce(content, '')) as content_len,
  (content ilike '%NodesCapco%') as has_nodes_capco,
  (content ilike '%LayoutProductCapco%') as has_layout_product_capco
from "cmsPages"
where slug in ('/', 'home')
  and coalesce("isActive", true) = true
order by "clientId" desc nulls last, slug;

-- Prefer the repo script (handles clientId + insertion before <LayoutProductCapco):
--   npm run cms:restore-home-nodes
--   npm run cms:restore-home-nodes -- --apply
--
-- Raw SQL example (review clientId / slug; mutates live DB):
-- update "cmsPages"
-- set content = '<NodesCapco />' || E'\n\n' || content
-- where slug = '/'
--   and "isActive" = true
--   and content ilike '%LayoutProductCapco%'
--   and content not ilike '%NodesCapco%';
