// Test script to check if the project exists in the database
// Run this on your live server to debug the issue

const testDatabaseQuery = async () => {
  try {
    console.log("🔍 Testing direct database query...");

    // Test 1: Check if the project exists at all
    const response = await fetch("https://capcofire.com/api/get-project", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ API Response:", result);
      console.log("📊 Total projects:", result.projects?.length || 0);

      if (result.projects && result.projects.length > 0) {
        console.log(
          "📋 Project IDs:",
          result.projects.map((p) => p.id)
        );
        console.log(
          "📋 Project Statuses:",
          result.projects.map((p) => p.status)
        );
        console.log(
          "📋 Project Authors:",
          result.projects.map((p) => p.author_id)
        );

        // Look for projects with status 0 (newly created)
        const newProjects = result.projects.filter((p) => p.status === 0);
        console.log("🆕 New projects (status 0):", newProjects.length);
        if (newProjects.length > 0) {
          console.log("🆕 New project details:", newProjects);
        }
      }
    } else {
      const error = await response.text();
      console.log("❌ API Error:", error);
    }
  } catch (error) {
    console.log("❌ Network Error:", error.message);
  }
};

testDatabaseQuery();
