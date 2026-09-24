// NM-A27: dependency-free, real-Chrome mobile visual QA harness.
// Run `npm run serve`, then `node scripts/mobile-visual-qa.js`.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const origin = process.env.FINDNORD_QA_ORIGIN || "http://127.0.0.1:4173";
const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const widths = [320, 375, 390, 430];
const outputDir = path.resolve(__dirname, "..", "evidence", "mobile-visual-qa", "2026-09-23");
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "findnord-mobile-qa-"));
const port = 9333 + Math.floor(Math.random() * 500);
fs.mkdirSync(outputDir, { recursive: true });

const chrome = spawn(chromePath, [
  "--headless=new", "--hide-scrollbars", "--disable-gpu", "--no-first-run",
  `--remote-debugging-port=${port}`, `--user-data-dir=${profileDir}`, "about:blank"
], { stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
chrome.on("error", (error) => console.error(`Chrome launch failed: ${error.message}`));
chrome.on("exit", (code) => { if (code && !process.exitCode) console.error(`Chrome exited early (${code}).`); });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function retry(fn, attempts = 40) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try { return await fn(); } catch (error) { last = error; await wait(150); }
  }
  throw last;
}

async function main() {
  const page = await retry(async () => {
    const response = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
    if (!response.ok) throw new Error(`DevTools page creation failed: ${response.status}`);
    return response.json();
  });
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await Promise.race([
    new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); }),
    wait(5000).then(() => { throw new Error("Timed out connecting to Chrome DevTools"); })
  ]);
  let id = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const messageId = ++id;
    pending.set(messageId, { resolve, reject });
    socket.send(JSON.stringify({ id: messageId, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Browser evaluation failed");
    return result.result.value;
  };
  const navigate = async (url) => {
    await send("Page.navigate", { url });
    await retry(async () => {
      const ready = await evaluate("document.readyState === 'complete' && document.querySelector('.view.active-view') !== null");
      if (!ready) throw new Error("page not ready");
    });
    await wait(350);
  };
  await send("Page.enable");
  await send("Runtime.enable");
  console.log("Chrome connected; loading FindNord...");
  await navigate(origin);

  // A synthetic local-only account gives the Inbox capture a genuine thread.
  // Seed listings have no real seller (sellerId is null -- see
  // db/seed-data.js), so a real seller account publishes a real listing
  // FIRST; registering again afterward (as the actual QA visitor) switches
  // this shared browser session to the visitor without touching the
  // seller's own published listing, letting the visitor message a REAL
  // seller instead of hitting the server's real NOT NULL rejection of a
  // conversation with a null participant.
  const setup = await evaluate(`(async () => {
    const stamp = Date.now();
    const sellerAuth = await fetch('/api/auth/register', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({name:'Mobile QA Seller', email:'mobile-qa-seller-'+stamp+'@example.test', password:'VisualQA123!'})}).then(r=>r.json());
    const sellerListing = await fetch('/api/listings', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({title:'Mobile QA Listing', category:'Electronics', price:'500', locality:'Stockholm', region:'Stockholm', country:'Sweden', condition:'Good', description:'A real listing published for the mobile visual QA harness.', images:[{css:'linear-gradient(135deg, #b48762, #f2d9b7)', aiGenerated:false}]})}).then(r=>r.json());
    const auth = await fetch('/api/auth/register', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({name:'Mobile QA', email:'mobile-qa-'+stamp+'@example.test', password:'VisualQA123!'})}).then(r=>r.json());
    // These raw fetch() registrations set real session cookies but bypass
    // the app's own completeSignIn(), so its in-memory currentUser never
    // learns a session now exists -- refreshInboxCache() silently no-ops
    // for a null currentUser, so the conversation-thread capture would
    // otherwise always come up empty. Sync it directly.
    currentUser = await DataService.users.getCurrent();
    const listings = await fetch('/api/listings').then(r=>r.json());
    const listing = listings.find(item => item.id === sellerListing.id) || listings[0];
    const conversation = await fetch('/api/conversations/start-or-get', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({listingId:listing.id, participantIds:[auth.id, listing.sellerId]})}).then(r=>r.json());
    await fetch('/api/conversations/'+conversation.id+'/messages', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({text:'Hello! Is this still available?'})});
    return {listingId:listing.id, sellerId:listing.sellerId, conversationId:conversation.id};
  })()`);
  console.log("Synthetic conversation ready; starting viewport captures...");

  const states = [
    { name: "browse-no-filters", prepare: `showView('browse-view'); window.scrollTo(0,0)` , target: "#listing-grid" },
    { name: "browse-active-filters", prepare: `showView('browse-view'); activeFilters.conditions = ['Good']; renderActiveFilterChips(); renderListings(); window.scrollTo(0,0)`, target: "#active-filter-chips .active-filter-chip" },
    { name: "listing-detail-cta", prepare: `await refreshListingsCache(); await openListing(${JSON.stringify(setup.listingId)}); window.scrollTo(0, document.documentElement.scrollHeight)`, target: "#detail-view .detail-actions" },
    { name: "sell", prepare: `showView('sell-view'); window.scrollTo(0,0)`, target: "#sell-form" },
    { name: "conversation-thread", prepare: `await refreshInboxCache(); await openThread(${JSON.stringify(setup.conversationId)}); window.scrollTo(0, document.documentElement.scrollHeight)`, target: "#thread-reply-form" },
    { name: "public-profile", prepare: `await openSellerProfile(${JSON.stringify(setup.sellerId)}); window.scrollTo(0,0)`, target: "#seller-profile" },
    { name: "auth-login", prepare: `showView('login-view'); window.scrollTo(0,0)`, target: "#login-form" },
    { name: "legal-footer", prepare: `openStaticPage('privacyPolicy'); window.scrollTo(0, document.documentElement.scrollHeight)`, target: ".site-footer" }
  ];
  const report = [];
  for (const width of widths) {
    console.log(`Rendering ${width}px states...`);
    await send("Emulation.setDeviceMetricsOverride", { width, height: 844, deviceScaleFactor: 1, mobile: true });
    for (const state of states) {
      await evaluate(`(async()=>{ ${state.prepare}; await new Promise(r=>setTimeout(r,250)); })()`);
      const metrics = await evaluate(`(() => {
        const target = document.querySelector(${JSON.stringify(state.target)});
        const rect = target && target.getBoundingClientRect();
        return {
          viewport: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
          targetVisible: !!target && !target.hidden && getComputedStyle(target).display !== 'none' && rect.width > 0 && rect.height > 0,
          target: ${JSON.stringify(state.target)},
          aboveFoldListing: ${JSON.stringify(state.name)}.startsWith('browse') ? !!document.querySelector('#listing-grid .listing-card') && document.querySelector('#listing-grid .listing-card').getBoundingClientRect().top < innerHeight : null
        };
      })()`);
      const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, fromSurface: true });
      const filename = `${width}-${state.name}.png`;
      fs.writeFileSync(path.join(outputDir, filename), Buffer.from(screenshot.data, "base64"));
      const pass = metrics.viewport === width && metrics.scrollWidth <= width && metrics.bodyScrollWidth <= width && metrics.targetVisible && metrics.aboveFoldListing !== false;
      report.push({ width, state: state.name, file: filename, pass, ...metrics });
    }
  }
  fs.writeFileSync(path.join(outputDir, "results.json"), `${JSON.stringify(report, null, 2)}\n`);
  const failures = report.filter((item) => !item.pass);
  console.log(`Captured ${report.length} real Chrome screenshots in ${outputDir}`);
  console.log(`Assertions: ${report.length - failures.length} passed, ${failures.length} failed`);
  if (failures.length) console.log(JSON.stringify(failures, null, 2));
  socket.close();
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => {
  chrome.kill();
  try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch (_) { /* Windows may still hold Chrome's profile briefly. */ }
});
