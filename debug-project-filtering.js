// Debug script to help identify the project filtering issue
// Add this to your dashboard.astro script section temporarily

console.log("🔍 [DEBUG] Project Filtering Analysis:");
console.log("🔍 [DEBUG] Current User ID:", currentUser?.id);
console.log("🔍 [DEBUG] Current User ID Type:", typeof currentUser?.id);
console.log("🔍 [DEBUG] Current Role:", currentRole);

// Get all projects from the API response
const allProjects = projects; // This should be the unfiltered projects array
console.log("🔍 [DEBUG] Total projects fetched:", allProjects?.length || 0);

if (allProjects && allProjects.length > 0) {
  console.log("🔍 [DEBUG] Sample project data:");
  allProjects.forEach((project, index) => {
    if (index < 3) {
      // Show first 3 projects
      console.log(`  Project ${index + 1}:`, {
        id: project.id,
        author_id: project.author_id,
        author_id_type: typeof project.author_id,
        title: project.title,
        address: project.address,
        status: project.status,
      });
    }
  });

  // Test the filtering logic
  if (currentRole === "Client") {
    console.log("🔍 [DEBUG] Testing client filtering...");
    const filteredProjects = allProjects.filter((project) => {
      const matches = project.author_id === currentUser?.id;
      console.log(
        `  Project ${project.id}: author_id="${project.author_id}" === currentUser.id="${currentUser?.id}" = ${matches}`
      );
      return matches;
    });

    console.log("🔍 [DEBUG] Filtered projects count:", filteredProjects.length);
    console.log("🔍 [DEBUG] Filtered projects:", filteredProjects);
  }
}

// Check for potential issues
console.log("🔍 [DEBUG] Potential Issues:");
console.log("  - UUID vs String mismatch:", currentUser?.id, typeof currentUser?.id);
console.log("  - Case sensitivity issues");
console.log("  - Null/undefined values");
console.log("  - Database vs API data mismatch");
