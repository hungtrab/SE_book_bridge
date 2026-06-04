import { describe, expect, it } from "vitest";
import { isConversationParticipant, MessageSchema } from "@/server/messaging/service";

describe("messaging", () => {
  it("validates and trims message bodies", () => {
    expect(MessageSchema.parse({ body: "  hello  " }).body).toBe("hello");
    expect(MessageSchema.safeParse({ body: "   " }).success).toBe(false);
    expect(MessageSchema.safeParse({ body: "x".repeat(2001) }).success).toBe(false);
  });
  it("allows only conversation participants", () => {
    expect(isConversationParticipant("a", "a", "b")).toBe(true);
    expect(isConversationParticipant("b", "a", "b")).toBe(true);
    expect(isConversationParticipant("c", "a", "b")).toBe(false);
  });
});
