// FIXED: Efficient Project Logging - Append without reading full array
import { checkAuth } from "./auth";
import { supabase } from "./supabase";
import { supabaseAdmin } from "./supabase-admin";

// ... [keep all the existing interfaces and types] ...

export class SimpleProjectLogger {
// ... [keep getClient and checkClient methods] ...

/\*\*

- Add a log entry using PostgreSQL JSONB append (EFFICIENT)
- This avoids reading the entire log array into memory
  \*/
  static async addLogEntry(
  projectIdOrProject: number | any,
  type: LogType,
  message: string,
  metadata?: any,
  cookies?: any
  ): Promise<boolean> {
  try {
  // Determine project ID
  let projectId: number;
  if (typeof projectIdOrProject === "number") {
  projectId = projectIdOrProject;
  } else if (projectIdOrProject?.id) {
  projectId = projectIdOrProject.id;
  } else {
  console.error("📝 [SIMPLE-LOGGER] Invalid projectIdOrProject");
  return false;
  }

      // Get user (same logic as before)
      let currentUser = metadata?.currentUser || null;
      if (!currentUser && cookies) {
        try {
          const authResult = await checkAuth(cookies);
          currentUser = authResult.currentUser;
        } catch (error) {
          // Silent fail
        }
      }

      const userName = this.extractUserName(currentUser);

      // Create log entry
      const logEntry = {
        timestamp: new Date().toISOString(),
        action: type,
        user: userName,
        message,
        metadata: metadata || null,
      };

      const client = this.checkClient(this.getClient(projectId));
      if (!client) return false;

      // 🔥 KEY FIX: Use PostgreSQL's jsonb_insert to append efficiently
      // This does NOT read the entire log array into memory!
      const { error } = await client.rpc("append_project_log", {
        project_id: projectId,
        log_entry: logEntry,
      });

      if (error) {
        console.error("📝 [SIMPLE-LOGGER] Error appending log:", error);
        return false;
      }

      console.log(`📝 [SIMPLE-LOGGER] Logged ${type}: ${message}`);
      return true;

  } catch (error) {
  console.error("Error in addLogEntry:", error);
  return false;
  }
  }

// ... [keep all other methods] ...
}
