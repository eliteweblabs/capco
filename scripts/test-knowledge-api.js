/**
 * Test the knowledge API endpoint directly
 * Run this in browser console while logged in
 */

async function testKnowledgeAPI() {
  const baseUrl = window.location.origin;
  
  console.log("🧪 Testing Knowledge API...");
  console.log("📍 Base URL:", baseUrl);
  
  // Test 1: Check if endpoint exists
  console.log("\n1️⃣ Testing GET endpoint...");
  try {
    const getResponse = await fetch(`${baseUrl}/api/agent/knowledge`, {
      method: 'GET',
      credentials: 'include',
    });
    const getData = await getResponse.json();
    console.log("✅ GET Response:", getResponse.status, getData);
  } catch (error) {
    console.error("❌ GET failed:", error);
  }
  
  // Test 2: Try creating a simple entry
  console.log("\n2️⃣ Testing POST endpoint with simple entry...");
  try {
    const testEntry = {
      title: "Test Entry",
      content: "This is a test knowledge entry",
      category: "test",
      tags: ["test"],
      priority: 1
    };
    
    console.log("📤 Sending:", testEntry);
    
    const postResponse = await fetch(`${baseUrl}/api/agent/knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(testEntry),
    });
    
    console.log("📥 Response status:", postResponse.status, postResponse.statusText);
    
    const postData = await postResponse.json();
    console.log("📥 Response data:", postData);
    
    if (postResponse.ok && postData.success) {
      console.log("✅ Entry created successfully!");
      console.log("📋 Entry ID:", postData.entry?.id);
    } else {
      console.error("❌ Failed to create entry");
      console.error("Error details:", {
        error: postData.error,
        message: postData.message,
        code: postData.code,
        details: postData.details,
        hint: postData.hint,
      });
    }
  } catch (error) {
    console.error("❌ POST failed:", error);
    console.error("Error stack:", error.stack);
  }
  
  // Test 3: Check authentication
  console.log("\n3️⃣ Checking authentication...");
  try {
    const authResponse = await fetch(`${baseUrl}/api/agent/status`, {
      method: 'GET',
      credentials: 'include',
    });
    const authData = await authResponse.json();
    console.log("🔐 Auth check:", authResponse.status, authData);
  } catch (error) {
    console.error("❌ Auth check failed:", error);
  }
}

// Export for browser console
if (typeof window !== 'undefined') {
  window.testKnowledgeAPI = testKnowledgeAPI;
  console.log("💡 Run testKnowledgeAPI() to test the knowledge API endpoint");
}

