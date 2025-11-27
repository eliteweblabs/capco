/**
 * Visible test - uses alert and ensures all output is shown
 * Copy and paste this entire block into browser console
 */

(async function() {
  const results = [];
  results.push("🚀 Starting knowledge API test...");
  
  const baseUrl = window.location.origin;
  results.push(`📍 Base URL: ${baseUrl}`);
  
  const testEntry = {
    title: "Test Entry " + Date.now(),
    content: "This is a test knowledge entry",
    category: "test",
    tags: ["test"],
    priority: 1
  };
  
  results.push(`📤 Sending entry: ${JSON.stringify(testEntry)}`);
  console.log("📤 Sending:", testEntry);
  
  try {
    const response = await fetch(`${baseUrl}/api/agent/knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(testEntry),
    });
    
    const status = `${response.status} ${response.statusText}`;
    results.push(`📥 Response status: ${status}`);
    console.log("📥 Response status:", status);
    
    const text = await response.text();
    results.push(`📥 Response text: ${text.substring(0, 200)}`);
    console.log("📥 Response text:", text);
    
    let data;
    try {
      data = JSON.parse(text);
      results.push(`📥 Parsed: ${JSON.stringify(data).substring(0, 200)}`);
      console.log("📥 Parsed JSON:", data);
    } catch (e) {
      results.push(`❌ JSON Parse Error: ${e.message}`);
      console.error("❌ Failed to parse JSON:", e);
      alert("❌ Failed to parse response as JSON:\n\n" + text.substring(0, 500));
      return;
    }
    
    if (response.ok && data.success) {
      results.push(`✅ SUCCESS! Entry ID: ${data.entry?.id}`);
      console.log("✅ SUCCESS! Entry created:", data.entry);
      alert("✅ SUCCESS!\n\nEntry created with ID: " + data.entry?.id + "\n\nCheck the console for full details.");
    } else {
      const errorMsg = `❌ FAILED!\n\nError: ${data.error || 'Unknown'}\nMessage: ${data.message || 'None'}\nCode: ${data.code || 'None'}\nDetails: ${data.details || 'None'}\nHint: ${data.hint || 'None'}`;
      results.push(errorMsg);
      console.error("❌ FAILED!", data);
      alert(errorMsg);
    }
  } catch (error) {
    const errorMsg = `❌ EXCEPTION: ${error.message}\n\n${error.stack}`;
    results.push(errorMsg);
    console.error("❌ EXCEPTION:", error);
    alert(errorMsg);
  }
  
  results.push("🏁 Test complete!");
  console.log("🏁 Test complete!");
  
  // Log all results
  console.log("\n" + "=".repeat(50));
  console.log("FULL TEST RESULTS:");
  console.log("=".repeat(50));
  results.forEach(r => console.log(r));
  console.log("=".repeat(50));
})();

