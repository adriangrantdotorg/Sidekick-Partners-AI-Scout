// Every shortcut's keys draw as real keycaps (11-03-26: Vote up's "+" key drew as an empty keycap in Settings › Shortcuts).
import { describe, it, expect } from "vitest";
import { ACTIONS, prettyCombo } from "@/lib/shortcuts";

describe("shortcut keycaps", () => {
  it("draws the + and - keys as themselves, and joins a chord with its modifier", () => {
    expect(prettyCombo("+")).toBe("+");
    expect(prettyCombo("-")).toBe("-");
    expect(prettyCombo("cmd+k")).toBe("⌘K");
    expect(prettyCombo("ctrl+k")).toBe("Ctrl+K");
    expect(prettyCombo("g h")).toBe("G then H");
  });
  it("no action's key draws an empty keycap", () => {
    const empty = ACTIONS.flatMap((a) => a.keys.filter((k) => !prettyCombo(k).trim()).map((k) => `${a.id}: "${k}"`));
    expect(empty).toEqual([]);
  });
});
