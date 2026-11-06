"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, List } from "lucide-react";

type Story = { title: string; url: string; outlet: string; icon: string };

/** The two labeled buttons under a trend's story, and the stories they open in a row of their own under them, so no
 *  button moves when they open (user, 11-04-26, on round 2's A: "Clicking the 'See the three stories' button causes
 *  the button to jump lines. That should not be the case."). */
export function TrendStories({ href, stories }: { href: string; stories: Story[] }) {
  const [open, setOpen] = useState(false);
  const n = stories.length;
  return (
    <>
      <div className="tc-acts">
        <Link className="btn tc-btn" href={href} title="Opens the Pipeline, filtered to startups in this trend">
          <Search className="ico" />
          Find Startups in This Trend
        </Link>
        <button type="button" className="btn tc-btn" aria-expanded={open} onClick={() => setOpen(!open)} title={open ? "Hide the stories" : "Shows the stories behind this trend"}>
          <List className="ico" />
          See the {n} {n === 1 ? "Story" : "Stories"}
        </button>
      </div>
      {open && (
        <ol className="tc-stories" data-testid="trend-stories">
          {stories.map((s, i) => (
            <li key={i}>
              <img src={s.icon} alt="" width={18} height={18} />
              <span>
                <a href={s.url} target="_blank" rel="noopener noreferrer" title="Opens the story in a new window">
                  {s.title}
                </a>
                <small>{s.outlet}</small>
              </span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
