import { supabase } from "./db.js";

export async function logEvent({ agent, eventType, message, attachment }) {
  const now = new Date();

  const date = now.toISOString().split("T")[0];
  const time = now.toTimeString().split(" ")[0];
  const day = now.toLocaleString("en-US", { weekday: "long" });

  const { error } = await supabase.from("agent_logs").insert({
    agent,
    event_type: eventType,
    date,
    time,
    day,
    message,
    attachment_url: attachment
  });

  if (error) console.error("Supabase Insert Error:", error);
}
