/**
 * Who may see aggregate labor (all staff time entries) for a given project via service-role APIs.
 */

export async function canViewAggregateProjectLabor(
  supabaseAdmin: any,
  projectId: number,
  userId: string,
  role: string | null | undefined
): Promise<boolean> {
  if (role === "Admin" || role === "superAdmin") return true;

  const { data: row, error } = await supabaseAdmin
    .from("projects")
    .select("authorId, assignedToId")
    .eq("id", projectId)
    .maybeSingle();

  if (error || !row) return false;

  if (role === "Staff") {
    return row.authorId === userId || row.assignedToId === userId;
  }

  return false;
}
