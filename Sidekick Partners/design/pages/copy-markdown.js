// Copy as Markdown: hover a section, press its button, and the section's words land on the clipboard as Markdown
// (user, 10-31-26). The buttons are written into the page by build.py; this file only gives them behavior.
(function () {
  var MD_SKIP = ["mdcopy", "dropzone", "filters", "more", "prog", "skrow", "sk"];
  function txt(el) {
    var c = el.cloneNode(true);
    c.querySelectorAll(".mdcopy, .sk").forEach(function (n) { n.remove(); });
    c.querySelectorAll(".smp").forEach(function (n) { n.textContent = "(Sample)"; });
    c.querySelectorAll(".st").forEach(function (n) { n.textContent = "(" + n.textContent.trim() + ")"; });
    c.querySelectorAll("br").forEach(function (n) { n.replaceWith(" · "); });
    return c.textContent.replace(/\s+/g, " ").replace(/ · · /g, " · ").trim();
  }
  function cells(tr) { return Array.prototype.map.call(tr.children, function (c) { return txt(c).replace(/\|/g, "\\|"); }); }
  function md(el) {
    var out = [];
    Array.prototype.forEach.call(el.children, function (n) {
      var cl = n.classList, t = n.tagName;
      if (MD_SKIP.some(function (k) { return cl.contains(k); })) return;
      if (t === "H2") {
        var h = n.cloneNode(true), sm = h.querySelector("small");
        if (sm) sm.remove();
        out.push("## " + txt(h));
        if (n.querySelector("small")) out.push("_" + txt(n.querySelector("small")) + "_");
      } else if (t === "H4") out.push("### " + txt(n));
      else if (t === "P") { if (txt(n)) out.push(txt(n)); }
      else if (t === "DL") n.querySelectorAll("dt").forEach(function (dt) {
        var dd = dt.nextElementSibling; out.push("- **" + txt(dt) + ":** " + (dd ? txt(dd) : ""));
      });
      else if (t === "UL" || t === "OL") Array.prototype.forEach.call(n.children, function (li) { out.push("- " + txt(li)); });
      else if (t === "TABLE") {
        var head = n.querySelector("thead tr"), rows = n.querySelectorAll("tbody tr"), lines = [];
        if (head) { var h1 = cells(head); lines.push("| " + h1.join(" | ") + " |", "|" + h1.map(function () { return "---"; }).join("|") + "|"); }
        rows.forEach(function (r) { lines.push("| " + cells(r).join(" | ") + " |"); });
        out.push(lines.join("\n"));
      } else if (cl.contains("uel")) {
        var v = n.querySelector(".uev"), note = n.querySelector(".uenote");
        out.push("- **" + txt(n.querySelector(".uen")) + ":** " + txt(v) + (v.classList.contains("est") ? " (estimate)" : "") +
          " · " + txt(n.querySelector(".uer")) + (note ? " · " + txt(note) : ""));
      } else if (cl.contains("bar")) out.push("- " + txt(n.querySelector("span")) + ": " + txt(n.querySelector("em")));
      else if (cl.contains("simrow")) out.push("- **" + txt(n.querySelector("b")) + "** — " + txt(n.querySelector("small")) + " (fit " + txt(n.querySelector("em")) + ")");
      else if (cl.contains("card")) out.push("- **" + txt(n.querySelector("h4")) + "** — " + txt(n.querySelector(".line")) + " · " + txt(n.querySelector(".raised")));
      else { var inner = md(n); if (inner) out.push(inner); }
    });
    return out.reduce(function (acc, chunk, i) {
      var list = /^- /.test(chunk) && i > 0 && /(^|\n)- [^\n]*$/.test(out[i - 1]);
      return acc + (i === 0 ? "" : list ? "\n" : "\n\n") + chunk;
    }, "");
  }
  function copy(text) {
    window.__lastCopied = text;
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.left = "-9999px";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      ta.remove();
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).catch(fallback);
    else fallback();
  }
  var timer;
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".mdcopy");
    if (!b) return;
    copy(md(b.closest("section")));
    var toast = document.querySelector(".mdtoast");
    toast.classList.add("on");
    clearTimeout(timer);
    timer = setTimeout(function () { toast.classList.remove("on"); }, 1800);
  });
  window.__sectionMarkdown = md;
})();
