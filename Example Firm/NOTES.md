# Example Firm · Notes

The blank profile to copy for a new firm. Nothing here is live or deployed. How to start
a firm from it: this folder's `CLAUDE.md`.

## What a real firm's NOTES.md holds

Copy this section's list into the new firm's `NOTES.md` and fill it at its launch (Sidekick's is the model):

- **Live:** site address, Vercel project (`<id>-scout`), database, where its keys sit, its launch progress page.
- **Deploy and check:** the update, `verify:live`, `check:ai` and share-image commands with its address.
- **The thesis in Scout:** its industries, stages, cap, and what the AI Thesis Check screens for.
- **Switches:** each feature that is off, and why.
- **Sources and lists:** each list with its count and file.
- **Launch seed:** when `seed/launch-seed.json` was exported and what it carries.
- **Tests:** its unit and browser test commands.

## Before its first launch

- A responsive framework comes first (see the root `CLAUDE.md`).
- Its design round, a screen review and every moving part answered in `effects`.
- No seed yet: its first launch starts from its profile, then `npm run seed:export` writes its own.
