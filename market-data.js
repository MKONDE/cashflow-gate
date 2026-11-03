/* Cashflow Gate — public market-data adapters V1.
 * Read-only quotes only. No orders, balances, custody or payment functions.
 * Sources: CoinGecko public simple-price endpoint; Frankfurter ECB reference rates.
 */
(function () {
  "use strict";
  const TIMEOUT_MS = 8000;
  const timeoutFetch = async (url) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Provider HTTP " + response.status);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  };
  const validNumber = (value) => typeof value === "number" && Number.isFinite(value) && value > 0;
  async function load() {
    const results = [];
    const tasks = [
      timeoutFetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true")
        .then((data) => {
          const now = new Date().toISOString();
          if (data.bitcoin && validNumber(data.bitcoin.usd)) results.push({ id: "bitcoin", price: data.bitcoin.usd, change: Number.isFinite(data.bitcoin.usd_24h_change) ? data.bitcoin.usd_24h_change : null, source: "CoinGecko", observedAt: now });
          if (data.ethereum && validNumber(data.ethereum.usd)) results.push({ id: "ethereum", price: data.ethereum.usd, change: Number.isFinite(data.ethereum.usd_24h_change) ? data.ethereum.usd_24h_change : null, source: "CoinGecko", observedAt: now });
        }),
      timeoutFetch("https://api.frankfurter.app/latest?from=EUR&to=USD")
        .then((data) => {
          const rate = data && data.rates && data.rates.USD;
          if (validNumber(rate)) results.push({ id: "eurusd", price: rate, change: null, source: "Frankfurter / ECB reference rates", observedAt: data.date || new Date().toISOString() });
        }),
      timeoutFetch("https://api.frankfurter.app/latest?from=GBP&to=USD")
        .then((data) => {
          const rate = data && data.rates && data.rates.USD;
          if (validNumber(rate)) results.push({ id: "gbpusd", price: rate, change: null, source: "Frankfurter / ECB reference rates", observedAt: data.date || new Date().toISOString() });
        })
    ];
    const settled = await Promise.allSettled(tasks);
    return { quotes: results, providersAvailable: settled.filter(x => x.status === "fulfilled").length, checkedAt: new Date().toISOString() };
  }
  window.CFGMarketData = Object.freeze({ load });
})();