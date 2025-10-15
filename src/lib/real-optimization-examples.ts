/**
 * REAL API Optimization Examples
 *
 * These are actual patterns that prevent redundant database calls
 */

// ❌ BAD: Multiple separate API calls
async function badExample() {
  const user = await fetch("/api/users/123");
  const projects = await fetch("/api/projects?userId=123");
  const files = await fetch("/api/files?userId=123");
  // 3 separate DB queries!
}

// ✅ GOOD: Single API call with joins
async function goodExample() {
  const response = await fetch("/api/dashboard-data?userId=123");
  // Returns: { user, projects, files } in one query with JOINs
}

// ✅ GOOD: Caching with Redis/Memory
class ApiCache {
  private cache = new Map();

  async getProject(projectId: number) {
    const cacheKey = `project:${projectId}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log("🚀 Cache hit - no DB call needed");
      return this.cache.get(cacheKey);
    }

    // Only fetch from DB if not cached
    const project = await this.fetchFromDatabase(projectId);
    this.cache.set(cacheKey, project);
    return project;
  }
}

// ✅ GOOD: Batch operations
async function batchExample() {
  // Instead of multiple calls:
  // await updateProject(1, data1);
  // await updateProject(2, data2);
  // await updateProject(3, data3);

  // Do one batch operation:
  await batchUpdateProjects([
    { id: 1, data: data1 },
    { id: 2, data: data2 },
    { id: 3, data: data3 },
  ]);
}

// ✅ GOOD: Database-level optimization
async function databaseOptimization() {
  // Instead of:
  // SELECT * FROM projects WHERE id = 123
  // SELECT * FROM files WHERE projectId = 123
  // SELECT * FROM users WHERE id = (SELECT authorId FROM projects WHERE id = 123)

  // Do one query with JOINs:
  const { data } = await supabase
    .from("projects")
    .select(
      `
      *,
      files(*),
      author:profiles!authorId(*)
    `
    )
    .eq("id", 123)
    .single();
}

// ✅ GOOD: GraphQL-style field selection
async function fieldSelection() {
  // Client specifies exactly what fields it needs
  const response = await fetch("/api/projects/123?fields=id,title,status");
  // Only fetches those specific fields, not the entire record
}

// ✅ GOOD: Pagination to avoid loading everything
async function paginationExample() {
  const response = await fetch("/api/projects?limit=20&offset=0");
  // Loads 20 records instead of potentially thousands
}
