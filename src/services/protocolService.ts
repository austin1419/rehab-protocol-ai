import type { RehabProtocol } from "../types";

export async function generateRehabProtocol(injury: string): Promise<RehabProtocol> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ injury }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(data.error || `Server error: ${response.status}`);
  }

  return response.json();
}
