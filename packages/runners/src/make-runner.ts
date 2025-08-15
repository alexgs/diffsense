import { LegacyRunner } from "@diffsense/types";
import { openaiChatRunner } from "./openai-chat";
import { mockPass, mockFail, mockEcho, mockCodefix } from "./mocks";

export function makeRunner(kind: string): LegacyRunner {
  if (kind === "openai:chat") return openaiChatRunner();
  if (kind === "mock:pass") return mockPass;
  if (kind === "mock:fail") return mockFail;
  if (kind === "mock:echo") return mockEcho;
  if (kind === "mock:codefix") return mockCodefix;
  throw new Error(`Unknown runner: ${kind}`);
}
