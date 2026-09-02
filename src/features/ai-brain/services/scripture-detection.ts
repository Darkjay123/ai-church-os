import type { ScriptureSuggestion } from "@/features/live-output/types";
import {
  detectReferenceFromTranscript,
  normaliseReference,
} from "@/features/live-output/utils/scripture";

const detectionModel =
  process.env.AI_CHURCH_OS_SCRIPTURE_DETECTION_MODEL ?? "gpt-4o-mini";

type OpenAiDetection = {
  reference?: unknown;
  confidence_score?: unknown;
};

export async function detectScriptureReference(
  transcript: string,
): Promise<ScriptureSuggestion | null> {
  const cleanedTranscript = transcript.trim().slice(0, 2_000);
  if (!cleanedTranscript) return null;

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    const detected = await detectWithOpenAi(cleanedTranscript, apiKey);
    if (detected) return detected;
  }

  return detectReferenceFromTranscript(cleanedTranscript);
}

async function detectWithOpenAi(transcript: string, apiKey: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: detectionModel,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Identify at most one Bible reference supported by the transcript. Never generate Bible verse text. Return JSON only: {"reference":"Book Chapter:Verse" | null,"confidence_score":0..1}. Use null when uncertain.',
        },
        { role: "user", content: transcript },
      ],
    }),
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) return null;
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as OpenAiDetection;
    const reference =
      typeof parsed.reference === "string"
        ? normaliseReference(parsed.reference)
        : null;
    const confidence =
      typeof parsed.confidence_score === "number" ? parsed.confidence_score : 0;
    if (!reference || confidence < 0.6 || confidence > 1) return null;
    return { reference, confidence };
  } catch {
    return null;
  }
}
