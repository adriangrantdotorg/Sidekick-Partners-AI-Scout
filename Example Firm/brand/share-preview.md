# Share Preview

What LinkedIn, Slack, iMessage and X show when someone shares Scout's link: the picture (`opengraph-image.jpg` beside this file), then the title and description below. Edit the two sections; `npm run check` (in `Engine/`) fails if one is too long. Engine reads a copy of this file.

- **Title:** 60 characters or less.
- **Description:** 125 characters or less. LinkedIn shows it on one line and cut a longer one at 129 characters.
- After an edit: deploy, then refresh LinkedIn in Post Inspector. Posts and messages already sent keep their old card.

## Title
Example Firm Scout

## Description
Deal sourcing for Example Firm: startups inside its thesis, every fact linked to its source.
