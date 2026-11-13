import { describe, it, expect } from "vitest";
import { firm, SITE_TITLE } from "@/firm";
import { sharePreview } from "@/lib/share";

// user, 11-12-26: "all page titles should have (DEMO) at the end of the name of the site to communicate its a demo".
describe("Sidekick says it is a demo", () => {
  it("every tab title and the link preview end with (DEMO)", () => {
    expect(firm.titleTag).toBe("(DEMO)");
    expect(SITE_TITLE).toBe("Sidekick Partners AI Scout (DEMO)");
    expect(sharePreview().title).toBe("Sidekick Partners AI Scout (DEMO)");
  });
});
