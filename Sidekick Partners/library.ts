// The startups saved for Sidekick: the leads in Sidekick Thesis (Enhanced) section 8, found by Scout for Courtside and
// touching Sidekick's industries. Leads to vet, not picks; the Library backfill looks each one up.
import type { LibraryPick } from "../Engine/src/firm/types";

const thesis = (name: string, domain?: string): LibraryPick => ({ name, domain, from: "thesis" });

export const library: LibraryPick[] = [thesis("Snag"), thesis("SuperMush"), thesis("Bird&Be"), thesis("CatchBack")];
