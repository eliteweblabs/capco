// Debug script to test the get-project API directly
// Run this in your browser console on the live site

const debugAPI = async () => {
  try {
    console.log("🔍 Testing /api/get-project API...");

    const response = await fetch("/api/get-project", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("📊 Response Status:", response.status);
    console.log("📊 Response OK:", response.ok);

    if (response.ok) {
      const result = await response.json();
      console.log("📊 Full API Response:", result);
      console.log("📊 Projects Array:", result.projects);
      console.log("📊 Projects Count:", result.projects?.length || 0);

      if (result.projects && result.projects.length > 0) {
        console.log("📋 First Project:", result.projects[0]);
        console.log(
          "📋 All Project IDs:",
          result.projects.map((p) => p.id)
        );
      } else {
        console.log("❌ No projects returned from API");
      }
    } else {
      const error = await response.text();
      console.log("❌ API Error:", error);
    }
  } catch (error) {
    console.log("❌ Network Error:", error.message);
  }
};

// Run the debug
debugAPI();
