// Sidekick's browser tests (Plan step 10) and Engine's (Courtside's lessons, Plan step 12) on a made-up local Scout,
// before Sidekick's database exists (Plan step 13). npm run e2e:sidekick writes the data (fixture.ts), builds Sidekick
// on it and runs both suites (tests/e2e-lib/firm-config.ts); `--project sidekick-partners` or `--project engine` runs one.
import { fileURLToPath } from "node:url";
import { firmE2E } from "../../../e2e-lib/firm-config";

export default firmE2E("sidekick-partners", ".local-db/sidekick-fixture.tar.gz", fileURLToPath(new URL(".", import.meta.url)));
