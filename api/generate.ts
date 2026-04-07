import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const PROTOCOL_SCHEMA = {
  type: "object" as const,
  properties: {
    injuryName: { type: "string" as const },
    overview: { type: "string" as const, description: "Pathophysiology and mechanism (clinical terms)" },
    laymanExplanation: { type: "string" as const, description: "Explanation in simple layman's terms" },
    equipment: { type: "array" as const, items: { type: "string" as const }, description: "Equipment needed for the 12-week protocol" },
    redFlags: { type: "array" as const, items: { type: "string" as const }, description: "Symptoms requiring immediate medical attention" },
    phases: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          phaseNumber: { type: "number" as const },
          phaseName: { type: "string" as const },
          weeks: { type: "string" as const, description: "e.g. Weeks 1-4" },
          description: { type: "string" as const },
          exercises: {
            type: "array" as const,
            items: {
              type: "object" as const,
              properties: {
                name: { type: "string" as const },
                sets: { type: "string" as const },
                reps: { type: "string" as const },
                rest: { type: "string" as const },
                frequency: { type: "string" as const },
                videoUrl: { type: "string" as const, description: "YouTube search URL for this exercise" },
                instructions: { type: "string" as const },
                regression: { type: "string" as const, description: "Easier version if pain is too high" },
                progression: { type: "string" as const, description: "Harder version if too easy" },
              },
              required: ["name", "sets", "reps", "rest", "frequency", "videoUrl", "regression", "progression"],
            },
          },
          progressionCriteria: { type: "array" as const, items: { type: "string" as const } },
        },
        required: ["phaseNumber", "phaseName", "weeks", "description", "exercises", "progressionCriteria"],
      },
    },
    references: { type: "array" as const, items: { type: "string" as const } },
  },
  required: ["injuryName", "overview", "laymanExplanation", "equipment", "redFlags", "phases", "references"],
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { injury } = req.body;
  if (!injury || typeof injury !== "string" || injury.trim().length === 0) {
    return res.status(400).json({ error: "Missing or invalid 'injury' field" });
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: `You are a world-class physical therapist and sports medicine researcher.
Generate comprehensive, evidence-based 12-week rehabilitation protocols.
Base recommendations on the most recent peer-reviewed research.
Always respond with valid JSON matching the exact schema requested.
For videoUrl fields, generate YouTube search URLs like: https://www.youtube.com/results?search_query=exercise+name+rehab`,
      messages: [
        {
          role: "user",
          content: `Generate a comprehensive, evidence-based 12-week rehabilitation protocol for: "${injury.trim()}".

Return a JSON object with this exact structure:
- injuryName: string
- overview: string (pathophysiology and mechanism in clinical terms)
- laymanExplanation: string (simple explanation for patients)
- equipment: string[] (all equipment needed)
- redFlags: string[] (symptoms requiring immediate medical attention)
- phases: array of phase objects, each with:
  - phaseNumber: number
  - phaseName: string
  - weeks: string (e.g. "Weeks 1-3")
  - description: string
  - exercises: array of exercise objects, each with:
    - name, sets, reps, rest, frequency, videoUrl, instructions, regression, progression
  - progressionCriteria: string[]
- references: string[] (relevant research citations)

Respond ONLY with the JSON object, no markdown fences or extra text.`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    // Strip markdown fences if present
    let jsonText = textBlock.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const protocol = JSON.parse(jsonText);
    return res.status(200).json(protocol);
  } catch (error) {
    console.error("Protocol generation error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate protocol";
    return res.status(500).json({ error: message });
  }
}
