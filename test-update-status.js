// Test script to verify the update-status API fix
// Run this from your local machine to test the live server

const testUpdateStatus = async () => {
  try {
    console.log("🧪 Testing update-status API on live server...");

    const response = await fetch("https://capcofire.com/api/update-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId: 1, // Use a real project ID
        status: 10, // Use a valid status
        currentUserId: "test-user-id",
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ API call successful:", result);
    } else {
      const error = await response.text();
      console.log("❌ API call failed:", error);
    }
  } catch (error) {
    console.log("❌ Network error:", error.message);
  }
};

testUpdateStatus();
