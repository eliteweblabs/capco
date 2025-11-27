/**
 * Simple test for knowledge API - guaranteed to show output
 * Copy and paste this entire block into browser console
 */

(async function() {
  console.log("🚀 Starting knowledge API test...");
  
  const baseUrl = window.location.origin;
  console.log("📍 Base URL:", baseUrl);
  
  // Test entry
  const testEntry = {
    title: "Test Entry " + Date.now(),
    content: "This is a test knowledge entry",
    category: "test",
    tags: ["test"],
    priority: 1
  };
  
  console.log("📤 Sending entry:", testEntry);
  
  try {
    const response = await fetch(`${baseUrl}/api/agent/knowledge`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(testEntry),
    });
    
    console.log("📥 Response status:", response.status, response.statusText);
    
    const text = await response.text();
    console.log("📥 Response text:", text);
    
    let data;
    try {
      data = JSON.parse(text);
      console.log("📥 Parsed JSON:", data);
    } catch (e) {
      console.error("❌ Failed to parse JSON:", e);
      console.error("Raw response:", text);
      return;
    }
    
    if (response.ok && data.success) {
      console.log("✅ SUCCESS! Entry created:", data.entry);
      console.log("📋 Entry ID:", data.entry?.id);
    } else {
      console.error("❌ FAILED!");
      console.error("Error:", data.error);
      console.error("Message:", data.message);
      console.error("Code:", data.code);
      console.error("Details:", data.details);
      console.error("Hint:", data.hint);
      console.error("Full response:", data);
    }
  } catch (error) {
    console.error("❌ EXCEPTION:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
  }
  
  console.log("🏁 Test complete!");
})();

