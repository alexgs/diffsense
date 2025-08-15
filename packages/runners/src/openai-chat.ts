import "dotenv/config";
import OpenAI from "openai";
import { LegacyRunner, LegacyScenario } from "@diffsense/types";

export function openaiChatRunner(): LegacyRunner {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const name = "openai:chat";

  return {
    name,
    run: async (prompt: string, _scenario: LegacyScenario) => {
      const instructions =
        "You are a tool that extracts the exact text following 'Return exactly:' from the user input. " +
        "Return ONLY that text with no quotes, punctuation, or explanation. " +
        "If the user input does not contain that phrase, return an empty string.";
      const resp = await client.responses.create({
        model: "gpt-4o-mini",
        input: prompt,
        instructions,
        temperature: 0
      });
      return resp.output_text ?? "";
    }
  };
}
