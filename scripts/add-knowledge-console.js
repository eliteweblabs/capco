/**
 * Browser Console Script: Add Knowledge to AI Agent
 *
 * Paste this into your browser console on https://capcofire.com/ai-agent
 *
 * Usage:
 *   addKnowledge({
 *     title: "Company Policy",
 *     content: "We always prioritize safety...",
 *     category: "company_policy",
 *     tags: ["policy", "safety"],
 *     priority: 10
 *   })
 */

async function addKnowledge(entry) {
  try {
    const response = await fetch("/api/agent/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(entry),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log("✅ Knowledge added successfully:", result.entry);
      return result.entry;
    } else {
      console.error("❌ Failed to add knowledge:", result.error || result);
      throw new Error(result.error || "Unknown error");
    }
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

// Example: Add a single knowledge entry
// addKnowledge({
//   title: "Company Name",
//   content: "CAPCO Design Group is a professional fire protection engineering firm.",
//   category: "company_info",
//   tags: ["company", "about"],
//   priority: 10
// });

// Example: Add multiple entries
async function addMultipleKnowledge(entries) {
  const results = [];
  for (const entry of entries) {
    try {
      const result = await addKnowledge(entry);
      results.push({ success: true, entry: result });
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      results.push({ success: false, error: error.message, entry });
    }
  }
  console.log("📊 Results:", results);
  return results;
}

// Make functions available globally
window.addKnowledge = addKnowledge;
window.addMultipleKnowledge = addMultipleKnowledge;

console.log("✅ Knowledge helper functions loaded!");
console.log('Usage: addKnowledge({ title: "...", content: "...", category: "..." })');
console.log("Or: addMultipleKnowledge([{...}, {...}])");
