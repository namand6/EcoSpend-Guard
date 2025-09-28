// extension/bg.js

async function getCfg() {
  const st = await chrome.storage.sync.get(["ecospend_url", "ecospend_token"]);
  return {
    BASE: st.ecospend_url || "http://127.0.0.1:8000",
    TOKEN: st.ecospend_token || "", // paste your token here for quick local test if you prefer
  };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "INGEST") {
    (async () => {
      const { BASE, TOKEN } = await getCfg();
      if (!TOKEN) {
        sendResponse({ ok: false, error: "no token in storage" });
        return;
      }
      try {
        // Use header Bearer; your server also accepts ?token= if you prefer
        const r = await fetch(`${BASE}/ext/ingest`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${TOKEN}`,
          },
          body: JSON.stringify({ events: msg.events || [] }),
        });
        const data = await r.json();
        sendResponse({ ok: r.ok, data });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    })();
    return true; // keep the message channel open for async
  }
});
