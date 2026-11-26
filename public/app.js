const $ = (s) => document.querySelector(s);
const api = (p) => fetch(p).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
const usd = (n, d = 0) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const kfmt = (n) => (n >= 1000 ? `$${Math.round(n / 1000)}K` : usd(n));
const flag = (cc) => (cc ? cc.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt())) : '🌐');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

$('#yr').textContent = new Date().getFullYear();
$('#burger').onclick = () => $('#navLinks').classList.toggle('open');

// Stats
api(`/api/stats?lang=${LANG}`).then((rows) => {
  $('#stats').innerHTML = rows.map((s) => `<div class="stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('');
}).catch(() => {});

// Payouts carousel
api('/api/payouts').then((rows) => {
  const card = (p) => `<div class="pcard">
    <div class="who"><span class="flag">${flag(p.country_code)}</span>${esc(p.display_name)} ${p.is_sample ? `<span class="badge">${t('sample')}</span>` : ''}</div>
    <div class="paid">${t('paid')}</div><div class="amt">${usd(p.amount)}</div>
    <div class="meta"><span>${esc(p.country_name)}</span>${p.certificate_url ? `<a href="${esc(p.certificate_url)}" class="link">${t('viewCert')}</a>` : ''}</div></div>`;
  const html = rows.map(card).join('');
  $('#payoutTrack').innerHTML = html + html; // duplicated for seamless loop
}).catch(() => {});

// Plan, rules & pricing
api('/api/plans/pay-after-pass').then((plan) => {
  const rules = [
    [plan.phases, t('phase')],
    [plan.profit_target_pct && `${+plan.profit_target_pct}%`, t('profitTarget')],
    [plan.max_daily_loss_pct && `${+plan.max_daily_loss_pct}%`, t('dailyLoss')],
    [plan.max_drawdown_pct && `${+plan.max_drawdown_pct}%`, t('drawdown')],
    [plan.profit_split_pct && `${t('upTo')} ${+plan.profit_split_pct}%`, t('split')],
    [plan.time_limit_days ? `${plan.time_limit_days} ${t('days')}` : t('none'), t('timeLimit')],
  ].filter(([v]) => v);
  $('#rules').innerHTML = rules.map(([v, l]) => `<div class="rule"><b>${esc(v)}</b><span>${l}</span></div>`).join('');

  const sizes = plan.sizes;
  if (!sizes.length) return;
  $('#heroPrice').textContent = usd(Math.min(...sizes.map((s) => +s.entry_price)));
  const priceHtml = (s) => (+s.regular_price > +s.entry_price ? `<s>${usd(s.regular_price)}</s>` : '') + usd(s.entry_price);

  const renderCard = (s) => {
    $('#priceCard').innerHTML = `
      <div class="muted">${esc(plan.market)} · ${esc(plan.name)}</div>
      <div class="size">${usd(s.account_size)}</div>
      <div class="big">${priceHtml(s)}</div>
      <div class="row"><span>${t('payToday')}</span><b>${usd(s.entry_price)}</b></div>
      <div class="row"><span>${t('payAfter')}</span><b>${usd(s.activation_fee)}</b></div>
      <div class="row"><span>${t('profitTarget')}</span><b>${+plan.profit_target_pct}%</b></div>
      <a href="#" class="btn btn-primary" data-size="${s.id}">${t('startSize', kfmt(+s.account_size))}</a>`;
  };
  $('#sizeTabs').innerHTML = sizes.map((s, i) => `<button data-i="${i}" class="${i === 0 ? 'on' : ''}">${kfmt(+s.account_size)}</button>`).join('');
  $('#sizeTabs').onclick = (e) => {
    const b = e.target.closest('button'); if (!b) return;
    $('#sizeTabs').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    renderCard(sizes[b.dataset.i]);
  };
  renderCard(sizes[0]);

  $('#priceRows').innerHTML = sizes.map((s) => `<tr>
    <td>${esc(plan.market)}</td><td>${esc(plan.name)}</td><td><b>${kfmt(+s.account_size)}</b> <span class="muted">(${usd(s.account_size)})</span></td>
    <td>${priceHtml(s)}</td><td>${usd(s.activation_fee)}</td>
    <td><a href="#" class="btn btn-primary">${t('start')}</a></td></tr>`).join('');
}).catch(() => {});

// Testimonials
api('/api/testimonials').then((rows) => {
  $('#vgrid').innerHTML = rows.map((tm) => `<div class="vcard">
    ${tm.video_url ? `<iframe src="${esc(tm.video_url)}" allow="autoplay; fullscreen" loading="lazy"></iframe>` : '<div class="play">▶</div>'}
    <div class="nm">${esc(tm.display_name)} ${tm.is_sample ? `<span class="badge">${t('sample')}</span>` : ''}</div>
    <small>${flag(tm.country_code)} ${esc(tm.country_name)}</small></div>`).join('');
}).catch(() => {});

// FAQ
api(`/api/faqs?lang=${LANG}`).then((rows) => {
  $('#faq').innerHTML = rows.map((f) => `<details><summary>${esc(f.question)}</summary><p>${esc(f.answer)}</p></details>`).join('');
}).catch(() => {});

// ---------- MT5 chart ----------
const TFS = ['M15', 'H1', 'H4', 'D1'];
let sym = 'EURUSD', tf = 'H1', chart, series, vol;

function initChart() {
  const el = $('#chartEl');
  chart = LightweightCharts.createChart(el, {
    autoSize: true,
    layout: { background: { color: 'transparent' }, textColor: '#8a9bc2', fontFamily: 'Inter' },
    grid: { vertLines: { color: '#111a33' }, horzLines: { color: '#111a33' } },
    timeScale: { timeVisible: true, borderColor: '#1a2544' },
    rightPriceScale: { borderColor: '#1a2544' },
  });
  series = chart.addCandlestickSeries({ upColor: '#3b82f6', downColor: '#475569', borderVisible: false, wickUpColor: '#3b82f6', wickDownColor: '#475569' });
  vol = chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: '', color: 'rgba(59,130,246,.3)' });
  vol.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
}

async function loadCandles() {
  try {
    const res = await fetch(`/api/candles?symbol=${sym}&timeframe=${tf}&limit=500`);
    if (!res.ok) throw res.status;
    const rows = await res.json();
    const simulated = res.headers.get('X-Data-Source') === 'simulated';
    $('#simBadge').hidden = !simulated;
    $('#simBadge').textContent = t('simulated');
    $('#chartEmpty').style.display = rows.length ? 'none' : 'grid';
    series.setData(rows.map(({ time, open, high, low, close }) => ({ time, open, high, low, close })));
    vol.setData(rows.map((r) => ({ time: r.time, value: r.volume })));
  } catch { $('#chartEmpty').style.display = 'grid'; }
}

async function loadSymbols() {
  const list = await api('/api/symbols').catch(() => []);
  const sel = $('#symSel');
  sel.innerHTML = list.map((s) => `<option ${s.symbol === sym ? 'selected' : ''}>${esc(s.symbol)}</option>`).join('');
  const cur = list.find((s) => s.symbol === sym);
  $('#quote').textContent = cur && cur.bid ? `${sym}  ${t('bid')} ${(+cur.bid).toFixed(cur.digits)}  ·  ${t('ask')} ${(+cur.ask).toFixed(cur.digits)}  ·  ${new Date(cur.ts).toLocaleString(LANG === 'th' ? 'th-TH' : 'en-US')}` : '';
}

if (window.LightweightCharts) {
  initChart();
  $('#tfSel').innerHTML = TFS.map((t) => `<button class="${t === tf ? 'on' : ''}">${t}</button>`).join('');
  $('#tfSel').onclick = (e) => {
    const b = e.target.closest('button'); if (!b) return;
    tf = b.textContent;
    $('#tfSel').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    loadCandles();
  };
  $('#symSel').onchange = (e) => { sym = e.target.value; loadCandles(); loadSymbols(); };
  loadSymbols().then(loadCandles);
  setInterval(() => { loadCandles(); loadSymbols(); }, 5000); // poll for new bars from the MT5 bridge
}
