const API_BASE = '';

async function fetchAPI(endpoint) {
    try {
        const response = await fetch(endpoint);
        const data = await response.json();
        if (data.status === 'success') {
            return data.data;
        }
        return [];
    } catch (error) {
        console.error('Error fetching:', endpoint, error);
        return [];
    }
}

async function updateTicker() {
    const tickerList = document.getElementById('tickerList');
    if (!tickerList) return;
    
    const importantItems = ['دلار آمریکا', 'یورو', 'سکه امامی', 'طلای ۱۸ عیار'];
    const allData = await fetchAPI('/api/home-items/');
    
    const tickerItems = allData.filter(item => importantItems.includes(item.name));
    
    if (tickerItems.length > 0) {
        let html = '';
        tickerItems.forEach(item => {
            let changeText = '0%';
            let changeClass = 'positive';
            
            html += `
                <li class="price-list-item">
                    ${item.name}<br>
                    <span class="price-list-price">${item.numeric_value.toLocaleString()}</span> ریال
                    <span class="${changeClass}">${changeText}</span>
                </li>
            `;
        });
        tickerList.innerHTML = html;
    } else {
        tickerList.innerHTML = '<li class="price-list-item">در حال بارگذاری...</li>';
    }
}

function getIconForName(name) {
    if (name.includes('دلار')) return 'fas fa-dollar-sign';
    if (name.includes('یورو')) return 'fas fa-euro-sign';
    if (name.includes('پوند')) return 'fas fa-pound-sign';
    if (name.includes('لیر')) return 'fas fa-lira-sign';
    if (name.includes('طلا') || name.includes('سکه')) return 'fas fa-gem';
    if (name.includes('بیت')) return 'fas fa-coins';  
    if (name.includes('اتریوم')) return 'fas fa-coins';
    if (name.includes('تتر')) return 'fas fa-dollar-sign';
    if (name.includes('نفت')) return 'fas fa-oil-can';
    return 'fas fa-chart-line';
}

function renderTable(data, title, headerIcon, category) {
    if (!data || data.length === 0) {
        return `
            <div class="table-section">
                <div class="table-header">
                    <i class="fas ${headerIcon}" style="font-size: 28px; color: var(--color3);"></i>
                    <h3>${title}</h3>
                </div>
                <p style="color: #ccc; text-align: center; padding: 20px;">اطلاعاتی برای نمایش وجود ندارد</p>
            </div>
        `;
    }
    
    let currencyUnit = 'ریال';
    if (category === 'crypto' || category === 'oil') {
        currencyUnit = 'دلار';
    }
    
    const tableId = `table-${category}`;
    let html = `
        <div class="table-section">
            <div class="table-header">
                <i class="fas ${headerIcon}" style="font-size: 28px; color: var(--color3);"></i>
                <h3>${title}</h3>
            </div>
            <div class="price-search-wrap" style="margin-bottom:14px;">
                <i class="fas fa-search"></i>
                <input class="price-search" type="text" placeholder="جستجو..." data-table="${tableId}">
            </div>
            <p class="no-results" data-noresults="${tableId}">نتیجه‌ای یافت نشد</p>
            <div class="table-responsive">
                <table class="prices-table" id="${tableId}">
                    <thead>
                        <tr>
                            <th>نام</th>
                            <th>قیمت (${currencyUnit})</th>
                            <th>تغییرات</th>
                        </td>
                    </thead>
                    <tbody>
    `;
    
    data.forEach(item => {
        let changeClass = item.change >= 0 ? 'positive' : 'negative';
        let changeText = item.change ? (item.change >= 0 ? `+${item.change}%` : `${item.change}%`) : '--%';
        html += `
            <tr>
                <td>
                    <i class="${getIconForName(item.name)}" style="margin-left: 8px; color: var(--color3);"></i>
                    ${item.name}
                </td>
                <td>${item.numeric_value.toLocaleString()} ${currencyUnit}</td>
                <td class="${changeClass}">${changeText}${changeText !== '--%' ? '' : ''}</td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    return html;
}

async function renderHomePage() {
    const [currencyData, goldData, cryptoData, oilData] = await Promise.all([
        fetchAPI('/api/currency/'),
        fetchAPI('/api/gold/'),
        fetchAPI('/api/crypto/'),
        fetchAPI('/api/oil/')
    ]);
    
    const hasData = (currencyData && currencyData.length > 0) || 
                    (goldData && goldData.length > 0) || 
                    (cryptoData && cryptoData.length > 0) || 
                    (oilData && oilData.length > 0);
    
    if (!hasData) {
        return `
            <div style="text-align: center; padding: 50px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 50px; color: var(--color3);"></i>
                <p style="color: white; margin-top: 20px;">در حال بارگذاری داده‌ها...</p>
            </div>
        `;
    }
    
    let html = `
        <div class="home-container">
            <h1 style="text-align: center; margin-bottom: 15px; color: white;">📊 قیمت زنده بازارهای مالی</h1>
            <p style="text-align: center; margin-bottom: 40px; color: #ddd;">آخرین نرخ‌های ارز، طلا، کریپتو و نفت به صورت لحظه‌ای</p>
            
            <div class="tables-wrapper">
    `;
    
    html += renderTable(currencyData, '💱 نرخ ارزها', 'fa-exchange-alt', 'currency');
    html += renderTable(goldData, '🏆 طلا و سکه', 'fa-coins', 'gold');
    html += renderTable(cryptoData, '₿ ارزهای دیجیتال', 'fa-coins', 'crypto');
    html += renderTable(oilData, '🛢️ نفت و انرژی', 'fa-chart-pie', 'oil');
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}


function drawChart(canvasId, prices) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !prices || prices.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice;
    
    ctx.clearRect(0, 0, width, height);
    
    ctx.beginPath();
    const step = width / (prices.length - 1);
    
    for (let i = 0; i < prices.length; i++) {
        const x = i * step;
        const y = height - ((prices[i] - minPrice) / (range || 1)) * (height - 20) - 10;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    const isUp = prices[prices.length - 1] > prices[0];
    ctx.strokeStyle = isUp ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fillStyle = isUp ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    ctx.fill();
}


async function loadCharts() {
    const chartPlaceholders = document.querySelectorAll('.chart-placeholder');
    
    for (let placeholder of chartPlaceholders) {
        if (placeholder.getAttribute('data-loaded') === 'true') continue;
        
        let itemName = '';
        const card = placeholder.closest('.crypto-card');
        if (card) {
            const nameElem = card.querySelector('.header h2');
            if (nameElem) itemName = nameElem.textContent.trim();
        }
        
        if (!itemName) continue;
        
        try {
            const response = await fetch(`/api/chart/${encodeURIComponent(itemName)}/`);
            const data = await response.json();
            
            if (data.status === 'success' && data.data && data.data.prices) {
                const prices = data.data.prices;
                
                if (prices && prices.length > 0) {
                    const canvasId = `chart-${Date.now()}-${Math.random()}`;
                    
                    // فقط نمودار بدون درصد تغییرات
                    const chartHtml = `
                        <div class="custom-chart">
                            <canvas id="${canvasId}" width="300" height="80" style="width:100%; height:80px;"></canvas>
                        </div>
                    `;
                    
                    placeholder.innerHTML = chartHtml;
                    
                    setTimeout(() => {
                        drawChart(canvasId, prices);
                    }, 50);
                    
                    placeholder.setAttribute('data-loaded', 'true');
                } else {
                    placeholder.innerHTML = '<div class="chart-error">📉 داده‌ای وجود ندارد</div>';
                    placeholder.setAttribute('data-loaded', 'error');
                }
            } else {
                placeholder.innerHTML = '<div class="chart-error">📉 نمودار در دسترس نیست</div>';
                placeholder.setAttribute('data-loaded', 'error');
            }
        } catch (error) {
            console.error('Chart load error:', error);
            placeholder.innerHTML = '<div class="chart-error">⚠️ خطا در بارگذاری</div>';
            placeholder.setAttribute('data-loaded', 'error');
        }
    }
}

async function renderCategoryPage(category, title, icon) {
    let endpoint = '';
    if (category === 'currency') endpoint = '/api/currency/';
    else if (category === 'gold') endpoint = '/api/gold/';
    else if (category === 'crypto') endpoint = '/api/crypto/';
    else if (category === 'oil') endpoint = '/api/oil/';
    else return '<p style="color:white; text-align:center;">دسته‌بندی نامعتبر</p>';
    
    const data = await fetchAPI(endpoint);
    
    if (!data || data.length === 0) {
        return `
            <div style="text-align: center; padding: 50px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 50px; color: var(--color3);"></i>
                <p style="color: white;">در حال بارگذاری...</p>
            </div>
        `;
    }
    
    let currencyUnit = 'ریال';
    if (category === 'crypto' || category === 'oil') {
        currencyUnit = 'دلار';
    }
    
    const cardsId = `cards-${category}`;
    let html = `
        <div class="category-header">
            <i class="fas ${icon}" style="font-size: 50px; color: var(--color3);"></i>
            <h1>${title}</h1>
            <p>آخرین قیمت‌های لحظه‌ای ${title}</p>
        </div>

        <div class="price-search-wrap">
            <i class="fas fa-search"></i>
            <input class="price-search" type="text" placeholder="جستجو در ${title}..." data-cards="${cardsId}">
        </div>
        <p class="no-results" data-noresults="${cardsId}">نتیجه‌ای یافت نشد</p>

        <div class="category-cards-container" id="${cardsId}">
    `;
    
    data.forEach(item => {
        let changeClass = item.change >= 0 ? 'positive' : 'negative';
        let changeText = item.change ? (item.change >= 0 ? `+${item.change}%` : `${item.change}%`) : '--%';
        html += `
            <div class="crypto-card" data-item-name="${item.name}">
                <div class="header">
                    <i class="${getIconForName(item.name)}" style="font-size: 40px; color: var(--color3);"></i>
                    <h2>${item.name}</h2>
                </div>
                <div class="price">${item.numeric_value.toLocaleString()} ${currencyUnit}</div>
                <div class="change ${changeClass}" style="font-size: 16px; margin: 8px 0;">${changeText}</div>
                <div class="chart-placeholder" data-item-name="${item.name}">
                    <div class="chart-loading">📊 در حال بارگذاری نمودار...</div>
                </div>
                <div class="description">آخرین به‌روزرسانی: لحظه‌ای</div>
            </div>
        `;
    });
    
    html += `</div>`;
    return html;
}

async function renderConverterPage() {
    const allData = await fetchAPI('/api/all-prices/');

    if (!allData || allData.length === 0) {
        return `
            <div style="text-align: center; padding: 50px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 50px; color: var(--color3);"></i>
                <p style="color: white; margin-top: 20px;">در حال بارگذاری...</p>
            </div>
        `;
    }

    const categoryOrder = [
        ['currency', 'ارز'],
        ['gold', 'طلا'],
        ['crypto', 'کریپتو'],
        ['oil', 'نفت'],
    ];

    let optionsHtml = '';
    for (const [cat, label] of categoryOrder) {
        const items = allData.filter(d => d.category === cat);
        if (items.length > 0) {
            optionsHtml += `<optgroup label="${label}">`;
            items.forEach(item => {
                optionsHtml += `<option value="${item.name}">${item.name}</option>`;
            });
            optionsHtml += `</optgroup>`;
        }
    }

    return `
        <div class="converter-container">
            <div class="category-header">
                <i class="fas fa-calculator" style="font-size: 50px; color: var(--color3);"></i>
                <h1>مبدل ارز</h1>
                <p>تبدیل بین ارزها، طلا، کریپتو و نفت</p>
            </div>

            <div class="converter-card">
                <div class="converter-row">
                    <label class="converter-label">مقدار</label>
                    <input type="number" id="converterAmount" class="converter-input"
                           value="1" min="0.000001" step="any" placeholder="مقدار را وارد کنید">
                </div>

                <div class="converter-row">
                    <label class="converter-label">از</label>
                    <select id="converterFrom" class="converter-select">
                        ${optionsHtml}
                    </select>
                </div>

                <div class="converter-swap">
                    <button id="converterSwapBtn" class="converter-swap-btn" title="جابجایی">
                        <i class="fas fa-arrows-alt-v"></i>
                    </button>
                </div>

                <div class="converter-row">
                    <label class="converter-label">به</label>
                    <select id="converterTo" class="converter-select">
                        ${optionsHtml}
                    </select>
                </div>

                <button id="converterSubmitBtn" class="converter-btn">
                    <i class="fas fa-calculator"></i>&nbsp; محاسبه
                </button>

                <div id="converterResult" class="converter-result" style="display:none;"></div>
            </div>
        </div>
    `;
}

function formatConverterNumber(num) {
    if (num === 0) return '۰';
    const decimals = Math.abs(num) >= 1 ? 4 : 8;
    return num.toLocaleString('fa-IR', { maximumFractionDigits: decimals });
}

async function doConvert() {
    const amount = parseFloat(document.getElementById('converterAmount').value);
    const from = document.getElementById('converterFrom').value;
    const to = document.getElementById('converterTo').value;
    const resultBox = document.getElementById('converterResult');

    if (!from || !to || isNaN(amount) || amount <= 0) {
        resultBox.style.display = 'block';
        resultBox.innerHTML = '<p class="converter-error">لطفاً مقدار و ارزهای معتبر انتخاب کنید.</p>';
        return;
    }

    resultBox.style.display = 'block';
    resultBox.innerHTML = '<p style="color:var(--color5);text-align:center;">در حال محاسبه...</p>';

    try {
        const url = `/api/convert/?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${amount}`;
        const resp = await fetch(url);
        const json = await resp.json();

        if (json.status === 'success') {
            const d = json.data;
            const resultFormatted = formatConverterNumber(d.result);
            const rateFormatted = formatConverterNumber(d.result / amount);
            resultBox.innerHTML = `
                <div class="result-label">نتیجه تبدیل</div>
                <div class="result-value">
                    ${formatConverterNumber(amount)} ${from}
                    <br>
                    = <strong>${resultFormatted}</strong> ${to}
                </div>
                <div class="result-detail">نرخ: ۱ ${from} = ${rateFormatted} ${to}</div>
            `;
        } else {
            resultBox.innerHTML = `<p class="converter-error">${json.message || 'خطا در محاسبه'}</p>`;
        }
    } catch (err) {
        resultBox.innerHTML = '<p class="converter-error">خطا در اتصال به سرور</p>';
    }
}

function setupConverter() {
    const submitBtn = document.getElementById('converterSubmitBtn');
    const swapBtn = document.getElementById('converterSwapBtn');
    const amountInput = document.getElementById('converterAmount');
    const fromSelect = document.getElementById('converterFrom');
    const toSelect = document.getElementById('converterTo');

    if (toSelect && toSelect.options.length > 1) {
        toSelect.selectedIndex = 1;
    }

    if (submitBtn) submitBtn.addEventListener('click', doConvert);

    if (swapBtn) {
        swapBtn.addEventListener('click', () => {
            const tmp = fromSelect.value;
            fromSelect.value = toSelect.value;
            toSelect.value = tmp;
        });
    }

    if (amountInput) {
        amountInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') doConvert();
        });
    }
}

let currentPage = 'home';

async function loadPage(pageId) {
    currentPage = pageId;
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    // Fade out
    mainContent.classList.add('page-leaving');
    await new Promise(r => setTimeout(r, 200));
    mainContent.classList.remove('page-leaving');

    mainContent.innerHTML = `
        <div style="text-align:center;padding:50px;">
            <i class="fas fa-spinner fa-spin" style="font-size:50px;color:var(--color3);"></i>
            <p style="color:white;margin-top:16px;">در حال بارگذاری...</p>
        </div>
    `;

    let content = '';
    switch (pageId) {
        case 'home':      content = await renderHomePage(); break;
        case 'currency':  content = await renderCategoryPage('currency', 'نرخ ارز', 'fa-exchange-alt'); break;
        case 'gold':      content = await renderCategoryPage('gold', 'طلا و سکه', 'fa-coins'); break;
        case 'crypto':    content = await renderCategoryPage('crypto', 'ارزهای دیجیتال', 'fa-coins'); break;
        case 'oil':       content = await renderCategoryPage('oil', 'نفت و انرژی', 'fa-chart-pie'); break;
        case 'converter': content = await renderConverterPage(); break;
        default:          content = await renderHomePage();
    }

    mainContent.innerHTML = content;
    animateTableRows();

    if (pageId === 'converter') {
        setupConverter();
    } else {
        attachSearchHandlers();
        setTimeout(loadCharts, 500);
    }

    startAutoRefresh();
}

/* ─── Staggered row entrance ─────────────────────────────── */
function animateTableRows() {
    document.querySelectorAll('.prices-table tbody tr').forEach((row, i) => {
        row.style.animationDelay = `${i * 30}ms`;
    });
    document.querySelectorAll('.crypto-card').forEach((card, i) => {
        card.style.animationDelay = `${i * 50}ms`;
    });
}

/* ─── Search / filter ────────────────────────────────────── */
function attachSearchHandlers() {
    document.querySelectorAll('.price-search').forEach(input => {
        input.addEventListener('input', () => {
            const q = input.value.toLowerCase().trim();
            const tableId = input.dataset.table;
            const cardsId = input.dataset.cards;

            if (tableId) {
                const tbody = document.querySelector(`#${tableId} tbody`);
                if (!tbody) return;
                let visible = 0;
                tbody.querySelectorAll('tr').forEach(row => {
                    const name = row.querySelector('td')?.textContent.toLowerCase() || '';
                    const show = name.includes(q);
                    row.style.display = show ? '' : 'none';
                    if (show) visible++;
                });
                const noRes = document.querySelector(`[data-noresults="${tableId}"]`);
                if (noRes) noRes.style.display = visible === 0 ? 'block' : 'none';
            }

            if (cardsId) {
                const grid = document.getElementById(cardsId);
                if (!grid) return;
                let visible = 0;
                grid.querySelectorAll('.crypto-card').forEach(card => {
                    const name = (card.querySelector('h2')?.textContent || '').toLowerCase();
                    const show = name.includes(q);
                    card.style.display = show ? '' : 'none';
                    if (show) visible++;
                });
                const noRes = document.querySelector(`[data-noresults="${cardsId}"]`);
                if (noRes) noRes.style.display = visible === 0 ? 'block' : 'none';
            }
        });
    });
}

/* ─── Auto-refresh countdown ─────────────────────────────── */
let _refreshTimer = null;
let _refreshSecondsLeft = 300;

function startAutoRefresh() {
    clearInterval(_refreshTimer);
    _refreshSecondsLeft = 300;
    updateRefreshUI();

    _refreshTimer = setInterval(() => {
        _refreshSecondsLeft--;
        updateRefreshUI();
        if (_refreshSecondsLeft <= 0) {
            clearInterval(_refreshTimer);
            triggerRefresh();
        }
    }, 1000);
}

function updateRefreshUI() {
    const el = document.getElementById('refreshCountdown');
    if (!el) return;
    const m = Math.floor(_refreshSecondsLeft / 60);
    const s = _refreshSecondsLeft % 60;
    el.textContent = `${m}:${s.toString().padStart(2, '0')}`;
}

async function triggerRefresh() {
    const btn = document.getElementById('refreshBtn');
    if (btn) btn.classList.add('spinning');
    await loadPage(currentPage);
    if (btn) {
        setTimeout(() => btn.classList.remove('spinning'), 700);
    }
}

/* ─── Toast notifications ─────────────────────────────────── */
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    const icon = type === 'success' ? 'check-circle' : type === 'info' ? 'info-circle' : 'times-circle';
    toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
    container.appendChild(toast);
    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('toast--visible'));
    });
    setTimeout(() => {
        toast.classList.remove('toast--visible');
        setTimeout(() => toast.remove(), 320);
    }, 2600);
}

/* ─── Copy to clipboard ──────────────────────────────────── */
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => showToast('شماره کپی شد!'));
    } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try { document.execCommand('copy'); showToast('شماره کپی شد!'); }
        catch { showToast('کپی ناموفق', 'error'); }
        document.body.removeChild(ta);
    }
}

/* ─── Scroll to top ──────────────────────────────────────── */
function initScrollToTop() {
    const btn = document.getElementById('scrollToTopBtn');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 300);
    });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

const menuItems = document.querySelectorAll('.wrapper ul li');
menuItems.forEach(item => {
    item.addEventListener('click', () => {
        menuItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const pageId = item.getAttribute('data-page');
        if (pageId) loadPage(pageId);
    });
});

function setPersianDate() {
    const now = new Date();
    const persianDate = new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(now);
    const dateElement = document.getElementById('persianDate');
    if (dateElement) dateElement.innerHTML = persianDate;
}

function initBanner() {
    const closeBanner = document.getElementById('closeBannerBtn');
    const bannerContainer = document.getElementById('bannerContainer');
    
    if (closeBanner && bannerContainer) {
        const lastClosedTime = localStorage.getItem('bannerLastClosed');
        const currentTime = Date.now();
        const twoMinutes = 2 * 60 * 1000;
        
        if (!lastClosedTime || (currentTime - parseInt(lastClosedTime)) >= twoMinutes) {
            bannerContainer.style.display = 'block';
        } else {
            bannerContainer.style.display = 'none';
        }
        
        closeBanner.addEventListener('click', function() {
            bannerContainer.style.display = 'none';
            localStorage.setItem('bannerLastClosed', Date.now().toString());
        });
    }
}
 
async function waitForFetch() {
    let initial;
    try {
        const res = await fetch('/api/fetch-status/');
        const json = await res.json();
        initial = json.data;
    } catch (e) {
        return; // can't reach API, just load the page
    }

    if (initial.done) return; // data already ready, skip overlay

    const overlay = document.getElementById('fetchOverlay');
    const bar = document.getElementById('fetchProgressBar');
    const currentItem = document.getElementById('fetchCurrentItem');
    const counter = document.getElementById('fetchCounter');

    overlay.style.display = 'flex';

    await new Promise(resolve => {
        const poll = setInterval(async () => {
            let s;
            try {
                const res = await fetch('/api/fetch-status/');
                s = (await res.json()).data;
            } catch (e) {
                clearInterval(poll);
                resolve();
                return;
            }

            const pct = s.total > 0 ? (s.progress / s.total) * 100 : 0;
            bar.style.width = pct + '%';
            currentItem.textContent = s.current_item
                ? 'دریافت: ' + s.current_item
                : 'در حال اتصال...';
            counter.textContent = s.progress + ' / ' + s.total;

            if (s.done) {
                clearInterval(poll);
                bar.style.width = '100%';
                currentItem.textContent = 'آماده ✓';
                setTimeout(() => {
                    overlay.classList.add('fade-out');
                    setTimeout(() => { overlay.style.display = 'none'; }, 500);
                    resolve();
                }, 500);
            }
        }, 350);
    });
}

function initDevModal() {
    const btn = document.getElementById('devBtn');
    const overlay = document.getElementById('devModal');
    const closeBtn = document.getElementById('devModalClose');

    if (!btn || !overlay) return;

    btn.addEventListener('click', () => overlay.classList.add('active'));
    closeBtn.addEventListener('click', () => overlay.classList.remove('active'));
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
    });

    // Copy phone numbers on click
    overlay.querySelectorAll('.dev-phone-number').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            copyToClipboard(el.textContent.trim());
        });
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') overlay.classList.remove('active');
    });
}

function initRefreshButton() {
    const btn = document.getElementById('refreshBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        _refreshSecondsLeft = 0; // triggers immediately on next tick
        triggerRefresh();
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    setPersianDate();
    initBanner();
    initDevModal();
    initScrollToTop();
    initRefreshButton();
    await waitForFetch();
    updateTicker();
    loadPage('home');
    setInterval(updateTicker, 60000);
    setInterval(setPersianDate, 3600000);
});