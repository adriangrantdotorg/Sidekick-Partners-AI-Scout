#!/bin/bash
# The progress page from second zero (10-14-26). Plain HTML with no dependencies, so it can open before
# `npm ci` has run. It shows whose turn it is during the first two minutes (sign in to Vercel, accept the
# database terms), then "you can walk away", and hands over to the full page (scripts/step.ts) at step 1:
# the full page is written to the SAME file and the plain page reloads itself once, when the rich state appears.
#
#   prestart.sh open                      write the page + the first state, open it in the browser, mark it opened
#   prestart.sh state start|signin|terms|walk [url] [code]
#   PRESTART_NO_OPEN=1                    write everything, open nothing (tests)
set -u
# VC Scout's own folder (~/.vc-scout/<firm>), never the old Courtside repo's (firm.config.mjs)
DIR=$(node "$(dirname "$0")/../firm.config.mjs" progress-dir 2>/dev/null)
[ -n "$DIR" ] || DIR="$HOME/.vc-scout/${NEXT_PUBLIC_SCOUT_FIRM:-sidekick-partners}"
PAGE="$DIR/progress.html"
JS="$DIR/progress.js"
mkdir -p "$DIR"
now_ms() { node -e 'console.log(Date.now())' 2>/dev/null || echo $(( $(date +%s) * 1000 )); }

write_state() { # phase url code
  START=$(cat "$DIR/started-at" 2>/dev/null || now_ms)
  printf 'window.__progress = {"pre":"%s","url":"%s","code":"%s","startedAt":%s,"updatedAt":%s};\n' "$1" "${2:-}" "${3:-}" "$START" "$(now_ms)" > "$JS"
}

write_page() {
cat > "$PAGE" <<'HTML'
<!doctype html><html lang="en" data-build="pre-1"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>__PRODUCT__ · launching</title>
__LOOK__
<style>
/* the plain page's own parts, in the progress view's tokens (--pg-*), which the firm's theme sets: no color or font here */
.pre{max-width:760px}
.pre .sub{color:var(--pg-text2);margin:0 0 24px}
.pre .card{background:var(--pg-surface);border:1px solid var(--pg-border);border-radius:14px;padding:24px 26px;margin:0 0 18px}
.pre .turn{border-color:var(--pg-amber);box-shadow:0 0 0 1px var(--pg-amber) inset}
.pre .turn .kicker{color:var(--pg-amber)}
.pre .walk{border-color:var(--pg-green)}
.pre .walk .kicker{color:var(--pg-green)}
.pre .kicker{font:600 14px/1 var(--font-body);color:var(--pg-text3);margin:0 0 10px}
.pre .card h2{font:600 clamp(22px,3.4vw,30px)/1.15 var(--font-head);color:var(--pg-head);margin:0 0 10px}
.pre .card p{margin:0 0 14px;color:var(--pg-text);overflow-wrap:anywhere}
.pre .btn{display:inline-flex;align-items:center;min-height:48px;padding:0 22px;border-radius:10px;background:var(--pg-red);color:var(--pg-on-red);font:600 16px/1 var(--font-body);text-decoration:none}
.pre .btn:hover{filter:brightness(1.12)}
.pre .code{font:600 22px/1 var(--font-mono);letter-spacing:.08em;background:var(--pg-bg);border:1px solid var(--pg-border);border-radius:8px;padding:10px 14px;display:inline-block;margin:0 0 14px;color:var(--pg-head)}
.pre .steps{color:var(--pg-text3);font-size:14px;margin:18px 0 0;padding-left:18px}
.pre .steps li{margin:0 0 4px}
[hidden]{display:none !important}
</style></head><body><div class="building"><main class="pg pre">
<div class="pg-eyebrow">__PRODUCT__</div>
<h1 class="pg-title">Scout Is Launching</h1>
<p class="sub">Launching on this account. This page updates by itself; the full progress page takes over in a moment.</p>

<section class="card" id="start"><p class="kicker">Starting</p><h2>Getting ready</h2><p>Checking the Vercel sign-in and preparing the install.</p></section>

<section class="card turn" id="signin" hidden><p class="kicker">Your turn</p><h2>Sign in to Vercel</h2>
<p>A Vercel page has opened in this browser. Sign in there, or create a free account on that page (an email code, or GitHub, GitLab, Bitbucket). If the page is not in front, use the button.</p>
<p id="codeRow" hidden>Enter this code if the page asks for it: <br><span class="code" id="code"></span></p>
<p><a class="btn" id="signinBtn" href="#" target="_blank" rel="noopener">Open the Vercel Page</a></p></section>

<section class="card turn" id="terms" hidden><p class="kicker">Your turn</p><h2>Accept the Database Terms</h2>
<p>The free database (Neon, through Vercel) needs its terms accepted once. A page has opened for it; click Accept there. This page continues by itself the moment you do.</p>
<p><a class="btn" id="termsBtn" href="#" target="_blank" rel="noopener">Open the Terms Page</a></p></section>

<section class="card walk" id="walk" hidden><p class="kicker">Nothing more is needed from you</p><h2>You Can Walk Away</h2>
<p>The install, build, tests and deploy run on their own now. The site opens in this browser by itself in a few minutes, and this page shows every step until then.</p></section>

<div class="pg-stats">
  <div class="pg-stat now"><b id="since" style="font-variant-numeric:tabular-nums">0:00</b><span>Since Start</span></div>
  <div class="pg-stat"><b id="togo">~7 min</b><span>Roughly to Go</span><small id="togoSub">after your part</small></div>
</div>
<ul class="steps"><li>1 Setup · 2 Database · 3 Build and Tests · 4 Deploy · 5 Open</li><li>Each step gets its own line on the full page, with the time it took.</li></ul>
</main></div>
<script>
function clock(sec){sec=Math.max(0,Math.floor(sec));var m=Math.floor(sec/60),s=String(sec%60).padStart(2,"0");return m+":"+s}
function set(el,txt){if(el&&el.textContent!==txt)el.textContent=txt}
function show(id,on){var el=document.getElementById(id);if(el.hidden===on)el.hidden=!on}
var P=null,handed=false;
function render(){
  var p=window.__progress;if(!p)return;P=p;
  if(!p.pre){ if(!handed){handed=true;location.replace(location.pathname+"?handoff="+Date.now());} return; } /* the full page replaced this one: load it, once */
  ["start","signin","terms","walk"].forEach(function(id){show(id,p.pre===id)});
  if(p.pre==="signin"){var b=document.getElementById("signinBtn");if(p.url&&b.getAttribute("href")!==p.url)b.setAttribute("href",p.url);show("codeRow",!!p.code);set(document.getElementById("code"),p.code||"")}
  if(p.pre==="terms"){var t=document.getElementById("termsBtn");if(p.url&&t.getAttribute("href")!==p.url)t.setAttribute("href",p.url)}
  set(document.getElementById("since"),clock((Date.now()-p.startedAt)/1000));
  show("togoSub",p.pre!=="walk");
}
function pull(){var s=document.createElement("script");s.src="progress.js?t="+Date.now();s.onload=s.onerror=function(){s.remove();render()};document.head.appendChild(s)}
pull();setInterval(pull,2000);setInterval(render,1000);
</script></body></html>
HTML
  # the firm's own name and look (firm.config.mjs reads both from the firm's folder), never a firm spelled here
  node "$(dirname "$0")/../firm.config.mjs" fill-launch-page "$PAGE" > /dev/null 2>&1 || sed -i.bak "s/__PRODUCT__/Scout/g; s/__LOOK__//" "$PAGE"
  rm -f "$PAGE.bak"
}

case "${1:-}" in
  open)
    rm -f "$DIR/progress-state.json" "$DIR"/progress.html.opened-* 2>/dev/null
    now_ms > "$DIR/started-at"
    write_page
    write_state start
    : > "$PAGE.opened-pre"   # tells scripts/step.ts the page is already open: no second tab
    if [ -z "${PRESTART_NO_OPEN:-}" ]; then
      case "$(uname -s)" in Darwin) open "$PAGE" ;; Linux) xdg-open "$PAGE" > /dev/null 2>&1 || true ;; *) true ;; esac
    fi
    ;;
  state) write_state "${2:-start}" "${3:-}" "${4:-}" ;;
  --help|-h) sed -n '2,9p' "$0"; exit 2 ;;
  *) echo "usage: prestart.sh open | state <start|signin|terms|walk> [url] [code]" >&2; exit 2 ;;
esac
