// extension/content.amazon.js
(async function main() {
  // --- badge
  (function badge() {
    const el = document.createElement("div");
    el.id = "ecospend-badge";
    el.textContent = "EcoSpend ✓";
    el.style.cssText = `
      position:fixed;right:12px;bottom:12px;z-index:2147483647;
      background:#10b981;color:#fff;padding:6px 10px;border-radius:999px;
      font:12px/1.2 system-ui;box-shadow:0 2px 10px rgba(0,0,0,.15);
    `;
    document.documentElement.appendChild(el);
    console.log("[EcoSpend] content script active:", location.href);
  })();

  function sendEvents(events) {
    chrome.runtime.sendMessage({ type: "INGEST", events }, (resp) => {
      console.log("[EcoSpend] ingest response:", resp);
      const badge = document.getElementById("ecospend-badge");
      if (!badge) return;
      if (resp?.ok) {
        const n = resp?.data?.count ?? events.length;
        badge.textContent = `EcoSpend ✓ +${n}`;
        setTimeout(() => (badge.textContent = "EcoSpend ✓"), 2000);
      } else {
        badge.textContent = "EcoSpend ⚠";
        setTimeout(() => (badge.textContent = "EcoSpend ✓"), 2000);
      }
    });
  }

  // Only run on orders pages
  const ORDERS_URL = /\/your-orders|\/order-history|\/orders\/orders/i;
  if (!ORDERS_URL.test(location.href)) return;

  function parseAmount(txt) {
    const v = parseFloat((txt || "").replace(/[^\d.]/g, ""));
    return Number.isFinite(v) ? v : 0;
  }

  function findText(el, re) {
    const nodes = el.querySelectorAll("span,div,td,th,small,strong,em,b");
    for (const n of nodes) {
      if (re.test(n.textContent || "")) return n;
    }
    return null;
  }

  function extractOrderIdFromText(scope) {
    const m = (scope.textContent || "").match(/\b\d{3}-\d{7}-\d{7}\b/);
    return m ? m[0] : null;
  }

  function scrapeOnce() {
    // Cover common containers
    const cards = document.querySelectorAll(
      '[data-order-id], .a-box-group.a-spacing-base, .order-card, #ordersContainer .a-box-group'
    );

    const events = [];
    cards.forEach((card) => {
      // Order ID
      const orderIdAttr = card.getAttribute?.("data-order-id");
      const orderId =
        orderIdAttr ||
        (card.querySelector('[href*="/order-details/"]')?.textContent || "")
          .replace(/ORDER\s*#\s*/i, "")
          .trim() ||
        extractOrderIdFromText(card);
      if (!orderId) return;

      // Date near "ORDER PLACED"
      let dateIso = null;
      const placedNode = findText(card, /ORDER PLACED/i);
      if (placedNode) {
        // try same row / next siblings for a date like "November 11, 2023"
        const row = placedNode.closest("div,td,th,span") || placedNode.parentElement || card;
        const dateTxtMatch = (row.textContent || "").match(/\b\w+\s+\d{1,2},\s*\d{4}\b/);
        if (dateTxtMatch) {
          dateIso = new Date(dateTxtMatch[0]).toISOString().slice(0, 10);
        }
      }

      // Total near "TOTAL"
      let amount = 0;
      const totalNode = findText(card, /^\s*TOTAL\s*$/i) || findText(card, /TOTAL/i);
      if (totalNode) {
        const row = totalNode.closest("div,td,th,span") || totalNode.parentElement || card;
        const moneyMatch = (row.textContent || "").match(/\$\s*[\d,.]+/);
        if (moneyMatch) amount = parseAmount(moneyMatch[0]);
      } else {
        // fallback: first price we see
        const priceNode = findText(card, /\$\s*[\d,.]+/);
        if (priceNode) amount = parseAmount(priceNode.textContent || "");
      }

      // Items
      const items = [
        ...card.querySelectorAll(
          '.a-fixed-left-grid .a-col-right .a-link-normal, .a-link-normal[href*="/gp/product/"], a.a-link-normal'
        ),
      ]
        .map((a) => (a.textContent || "").trim())
        .filter(Boolean)
        .slice(0, 3);

      events.push({
        source: "amazon",
        order_id: orderId,
        date_iso: dateIso,
        merchant: "AMAZON Mktp US",
        amount_usd: amount,
        line_items: items,
      });
    });

    if (events.length) {
      console.log(`[EcoSpend] found ${events.length} orders`, events);
      sendEvents(events);
    } else {
      console.log("[EcoSpend] no orders found on this variant");
    }
  }

  // initial + SPA changes
  scrapeOnce();
  let last = location.pathname + location.search;
  const mo = new MutationObserver(() => {
    const now = location.pathname + location.search;
    if (now !== last) {
      last = now;
      if (ORDERS_URL.test(location.href)) scrapeOnce();
    }
  });
  mo.observe(document, { childList: true, subtree: true });
})();
