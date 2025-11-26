/**
 * Script to add Jay's knowledge base entries to the AI agent
 * 
 * Run this in the browser console while logged into the app, or use curl/Postman
 */

const knowledgeEntries = [
  {
    title: "Jay's Purpose & Context",
    content: `Jay is a licensed fire protection engineer at CAP Design Group, specializing in fire sprinkler design and fire alarm design with a focus on Massachusetts projects. His work involves reviewing and stamping fire protection plans for approval, conducting technical analyses for code compliance challenges, and preparing comprehensive project submissions. Jay operates as a top-tier third-party consultant, working with projects that require expertise in NFPA codes (particularly 13, 14, 25, 72, 101, and 1), Massachusetts Building Code (780 CMR), and International Building/Residential Codes as applied in Massachusetts.

His primary objectives center on delivering accurate technical documentation while streamlining repetitive processes that currently consume significant time. Success is measured by regulatory approval, code compliance, and operational efficiency. Jay works with local authorities having jurisdiction (AHJs), building and fire departments, and design teams, requiring documentation suitable for formal regulatory presentation.`,
    category: "purpose_context",
    tags: ["jay", "cap-design-group", "massachusetts", "fire-protection-engineer"],
    priority: 10
  },
  {
    title: "Jay's Current State",
    content: `Jay has successfully automated his narrative documentation process, moving from 30-45 minutes of manual work per project to under 5 minutes through a Google Forms → Google Sheets → Google Docs workflow. The system handles 12 key project fields and generates both Google Docs and PDFs with proper formatting preservation. He's actively using this automation for project submissions at CAP Design Group.

Recent work includes complex feasibility analyses for facilities like the 47 Kemble Street transfer station in Roxbury, involving detailed hydraulic calculations, code compliance analysis, and cost comparisons for fire protection system upgrades. Jay is currently navigating projects that require balancing standard NFPA 13 requirements against manufacturer-specific listings to optimize system performance within available water supply constraints.`,
    category: "current_state",
    tags: ["jay", "automation", "workflow", "current-projects"],
    priority: 10
  },
  {
    title: "Jay's Key Learnings & Principles",
    content: `Jay has established that practical enforcement by local AHJs often takes precedence over strict code compliance, requiring solutions that are both technically sound and politically feasible. He's learned that fire-rated separation solutions (like 2-hour walls) can be more cost-effective than full property reclassification, with savings ranging from $15,000-90,000+ per project.

In system design, Jay recognizes that standard NFPA 13 criteria often provide more practical solutions than manufacturer-specific listings, particularly when water supply constraints are a factor. He's discovered that K25.2 ESFR sprinklers can effectively protect Class I-IV commodities at 20-foot storage heights up to 45-foot ceilings, requiring only 15 psi minimum pressure versus much higher manufacturer-specified requirements.

For automation projects, Jay has proven that preserving document formatting (including background images and professional appearance) is critical for client acceptance, and that manual trigger systems often provide better reliability than automatic triggers for document generation workflows.`,
    category: "learnings",
    tags: ["jay", "principles", "ahj", "nfpa13", "esfr", "automation"],
    priority: 9
  },
  {
    title: "Jay's Approach & Patterns",
    content: `Jay's technical analysis follows a structured approach: comprehensive code review, multiple design option evaluation, detailed cost-benefit analysis, and risk assessment with safety margins. He consistently provides deliverables in multiple formats - detailed technical reports, executive summaries for decision-makers, and exportable documents (Excel, CSV, PDF) for team collaboration and regulatory submission.

His problem-solving methodology emphasizes practical solutions that exceed minimum code requirements while remaining cost-effective. Jay typically recommends safety margins (like 25 psi versus 5 psi hydraulic margins) and prefers proven standard approaches over cutting-edge alternatives when reliability is paramount.

For client communication, Jay structures presentations with strategic talking points for regulatory meetings, emphasizing how proposed solutions exceed code minimums and represent standard construction practices.`,
    category: "approach",
    tags: ["jay", "methodology", "problem-solving", "client-communication"],
    priority: 8
  },
  {
    title: "Jay's Tools & Resources",
    content: `Jay's primary technical resources include NFPA 13 (2019 version), Massachusetts Building Code (780 CMR), and related fire protection standards. His automation infrastructure relies on Google Workspace (Forms, Sheets, Docs, Drive) with custom Apps Script integration for document generation.

For project management, Jay uses Google Drive folder structures with specific document IDs for templates and output locations. His workflow includes hydraulic calculation software for system design and various document formats (PDF, Excel, CSV) for different stakeholder needs. Jay maintains template documents with precise placeholder patterns and has established reliable column mapping systems for data integration between platforms.`,
    category: "tools",
    tags: ["jay", "tools", "google-workspace", "nfpa13", "780-cmr"],
    priority: 7
  }
];

/**
 * Add knowledge entries via API
 * Run this function in browser console while logged in
 */
async function addJayKnowledge() {
  const baseUrl = window.location.origin;
  
  for (const entry of knowledgeEntries) {
    try {
      const response = await fetch(`${baseUrl}/api/agent/knowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(entry),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Added: ${entry.title}`);
      } else {
        console.error(`❌ Failed to add "${entry.title}":`, result.error);
      }
    } catch (error) {
      console.error(`❌ Error adding "${entry.title}":`, error);
    }
  }
  
  console.log('🎉 Finished adding knowledge entries!');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.addJayKnowledge = addJayKnowledge;
}

// For Node.js usage (if running as script)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { knowledgeEntries, addJayKnowledge };
}

