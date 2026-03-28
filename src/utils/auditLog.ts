import { supabase } from "../lib/supabase";

type AuditLogPayload = {
  userName: string;
  action: string;
  details?: string;
};

export async function logSystemAction({
  userName,
  action,
  details,
}: AuditLogPayload) {
  try {
    await supabase.from("system_logs").insert([
      {
        user_name: userName || "Unknown User",
        action,
        details: details || null,
      },
    ]);
  } catch (error) {
    console.error("Failed to write system log:", error);
  }
}
