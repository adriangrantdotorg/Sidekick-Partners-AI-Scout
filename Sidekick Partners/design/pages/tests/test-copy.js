// Presses every "Copy this section as Markdown" button headlessly and reads back what it copied.
// Run per page: webprobe <page>.html tests/test-copy.js   (webprobe: ~/Development/Taste Profile/tests/webprobe.swift)
const s = document.createElement("style"); s.textContent = "*{transition:none!important}"; document.head.appendChild(s);
const out = { page: location.pathname.split("/").pop(), buttons: [] };
for (const b of document.querySelectorAll(".mdcopy")) {
  const sec = b.closest("section");
  b.scrollIntoView({ block: "center" });  // the button, not the section: a tall section would push it off screen
  const r = b.getBoundingClientRect();
  const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  window.__lastCopied = null;
  b.click();
  await sleep(30);
  const md = window.__lastCopied || "";
  const h2 = sec.querySelector("h2").cloneNode(true); h2.querySelector("small")?.remove();
  out.buttons.push({
    section: h2.textContent.trim(),
    hit: t === b || b.contains(t),
    tip: b.getAttribute("data-tip"),
    startsWithHeading: md.startsWith("## " + h2.textContent.trim()),
    lines: md.split("\n").length,
    toast: document.querySelector(".mdtoast").classList.contains("on"),
    sample: md.slice(0, 160),
  });
}
return out;
