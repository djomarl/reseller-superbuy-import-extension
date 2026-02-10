// content.js - Superbuy Sync met Duplicaat Check

let secretKey = 'reseller123'; // MOET MATCHEN MET JE .ENV
let dashboardUrl = 'http://127.0.0.1:8000'; // JOUW LARAVEL URL

// Globale variabelen
let scannedItems = [];
let isModalOpen = false;

// 1. Start de knop injectie
window.addEventListener('load', () => attemptInject());
const observer = new MutationObserver(() => {
    if (!document.getElementById('sb-sync-trigger')) attemptInject();
});
observer.observe(document.body, { childList: true, subtree: true });

function attemptInject() {
    const target = document.querySelector('.mod-title') || document.querySelector('.user-title') || document.querySelector('h3');
    const table = document.querySelector('table');

    if (target && table && !document.getElementById('sb-sync-trigger')) {
        const btn = document.createElement('button');
        btn.id = 'sb-sync-trigger';
        btn.innerHTML = "🚀 Super Sync";
        btn.style.cssText = "background:#10b981; color:white; padding:8px 16px; border-radius:6px; border:none; font-weight:bold; cursor:pointer; margin-left:15px; box-shadow:0 4px 6px rgba(0,0,0,0.1); transition: transform 0.1s; vertical-align: middle;";
        btn.onmouseover = () => btn.style.transform = "scale(1.05)";
        btn.onmouseout = () => btn.style.transform = "scale(1)";
        btn.onclick = openModal;
        target.appendChild(btn);
    }
}

// 2. De Modal Interface
function openModal() {
    if (isModalOpen) return;
    isModalOpen = true;

    const overlay = document.createElement('div');
    overlay.id = 'sb-modal-overlay';
    overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:99999; display:flex; justify-content:center; align-items:center; backdrop-filter: blur(2px);";
    
    const modal = document.createElement('div');
    modal.style.cssText = "background:white; width:90%; max-width:900px; height:85%; border-radius:12px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); display:flex; flex-direction:column; overflow:hidden; font-family: sans-serif;";
    
    modal.innerHTML = `
        <div style="padding:20px; border-bottom:1px solid #e5e7eb; display:flex; justify-content:space-between; align-items:center; background:#f9fafb;">
            <h2 style="margin:0; font-size:1.25rem; color:#111827;">📦 Superbuy Import</h2>
            <button id="sb-close-btn" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:#6b7280;">&times;</button>
        </div>
        
        <div id="sb-actions" style="padding:20px; background:#fff; border-bottom:1px solid #e5e7eb; display:flex; gap:10px; flex-wrap:wrap;">
            <button id="sb-scan-page" style="padding:8px 16px; background:#3b82f6; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:500;">📄 Scan Huidige Pagina</button>
            <button id="sb-scan-all" style="padding:8px 16px; background:#6366f1; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:500;">📚 Scan Pagina 1-5</button>
            <span id="sb-status" style="margin-left:auto; display:flex; align-items:center; color:#6b7280; font-size:0.9rem;">Klaar voor start...</span>
        </div>

        <div style="flex:1; overflow-y:auto; padding:0; background:#f9fafb;">
            <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
                <thead style="background:#f3f4f6; position:sticky; top:0; z-index:10; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                    <tr>
                        <th style="padding:12px; text-align:left; width:40px;"><input type="checkbox" id="sb-toggle-all" checked></th>
                        <th style="padding:12px; text-align:left; width:80px;">Foto</th>
                        <th style="padding:12px; text-align:left;">Product</th>
                        <th style="padding:12px; text-align:left;">Info</th>
                        <th style="padding:12px; text-align:right;">Prijs</th>
                    </tr>
                </thead>
                <tbody id="sb-items-list" style="background:white;">
                    <tr><td colspan="5" style="padding:40px; text-align:center; color:#9ca3af;">Nog geen items gescand.</td></tr>
                </tbody>
            </table>
        </div>

        <div style="padding:20px; border-top:1px solid #e5e7eb; background:white; display:flex; justify-content:flex-end; gap:10px; align-items:center;">
            <span id="sb-count-label" style="margin-right:auto; font-weight:bold; color:#374151;">0 items geselecteerd</span>
            <button id="sb-import-btn" disabled style="padding:10px 24px; background:#10b981; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold; opacity:0.5; transition: all 0.2s;">Importeer Selectie</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.getElementById('sb-close-btn').onclick = closeModal;
    document.getElementById('sb-scan-page').onclick = () => runScan(false);
    document.getElementById('sb-scan-all').onclick = () => runScan(true);
    document.getElementById('sb-toggle-all').onchange = (e) => toggleAll(e.target.checked);
    document.getElementById('sb-import-btn').onclick = sendToLaravel;
}

function closeModal() {
    const overlay = document.getElementById('sb-modal-overlay');
    if (overlay) overlay.remove();
    isModalOpen = false;
    scannedItems = [];
}

// 3. Scan & Check Logica
async function runScan(multiPage) {
    const listBody = document.getElementById('sb-items-list');
    const statusLabel = document.getElementById('sb-status');
    scannedItems = [];
    listBody.innerHTML = '<tr><td colspan="5" style="padding:40px; text-align:center; color:#6b7280;">🔍 Bezig met scannen...</td></tr>';
    
    let pagesToScan = multiPage ? 5 : 1;
    let currentPageUrl = window.location.href;
    const urlObj = new URL(currentPageUrl);
    urlObj.searchParams.delete('page');
    const baseUrl = urlObj.toString();

    // A. Scrapen
    for (let i = 1; i <= pagesToScan; i++) {
        statusLabel.innerText = `Scannen pagina ${i} van ${pagesToScan}...`;
        
        try {
            let doc = document;
            if (i > 1 || (multiPage && i === 1)) {
                const fetchUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}page=${i}`;
                const response = await fetch(fetchUrl);
                const text = await response.text();
                const parser = new DOMParser();
                doc = parser.parseFromString(text, 'text/html');
            }

            const itemsOnPage = scrapeDOM(doc);
            
            itemsOnPage.forEach(item => {
                if (!scannedItems.find(x => x.orderNo === item.orderNo && x.title === item.title)) {
                    scannedItems.push(item);
                }
            });

            if (itemsOnPage.length === 0 && i > 1) break;
            if (multiPage) await new Promise(r => setTimeout(r, 800)); 

        } catch (e) {
            console.error("Scan error", e);
        }
    }

    // B. Checken op de server (NIEUW)
    if (scannedItems.length > 0) {
        statusLabel.innerText = `Controleren op duplicaten...`;
        await checkDuplications();
    }

    statusLabel.innerText = `Klaar! ${scannedItems.length} items gevonden.`;
    renderList();
}

async function checkDuplications() {
    try {
        const orderNos = scannedItems.map(i => i.orderNo);
        
        const response = await fetch(`${dashboardUrl}/superbuy/check-items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ 
                secret: secretKey,
                order_nos: orderNos 
            })
        });

        const data = await response.json();
        
        if (data.existing && Array.isArray(data.existing)) {
            // Markeer items die bestaan
            scannedItems.forEach(item => {
                if (data.existing.includes(item.orderNo)) {
                    item.exists = true;
                    item.selected = false; // Automatisch deselecteren
                }
            });
        }
    } catch (e) {
        console.error("Kon duplicaten niet checken:", e);
    }
}

function scrapeDOM(doc) {
    const items = [];
    const orderDivs = doc.querySelectorAll('div[id^="div"], table.user_orderlist tbody');

    orderDivs.forEach(container => {
        let headerText = "";
        const thead = container.querySelector('thead');
        if (thead) headerText = thead.innerText;
        else if (container.previousElementSibling?.tagName === 'THEAD') headerText = container.previousElementSibling.innerText;
        else if (container.innerText.includes('Order No')) headerText = container.innerText;

        const orderNo = headerText.match(/Order No[:：]\s*([A-Z0-9]+)/i)?.[1] || "UNKNOWN";
        if (orderNo === "UNKNOWN" && container.tagName !== 'TBODY') return;

        const rows = container.tagName === 'TBODY' ? container.querySelectorAll('tr') : container.querySelectorAll('tbody tr');
        rows.forEach(tr => {
            const titleEl = tr.querySelector('.js-item-title') || tr.querySelector('a[href*="item.htm"]');
            if (!titleEl) return;

            const priceText = Array.from(tr.querySelectorAll('td')).find(td => /[\d.,]+/.test(td.innerText) && (td.innerText.includes('￥') || td.innerText.includes('$') || td.innerText.includes('€')))?.innerText || "0";
            const price = priceText.match(/[\d.,]+/)?.[0] || "0";

            const qcPhotos = [];
            tr.querySelectorAll('.pic-list li').forEach(li => {
                const link = li.querySelector('a.lookPic'); 
                const img = li.querySelector('img');
                let url = link ? link.href : (img ? img.src : null);
                if (url && !url.includes('javascript')) {
                    if (url.startsWith('//')) url = 'https:' + url;
                    url = url.split('?')[0]; 
                    qcPhotos.push(url);
                }
            });

            if (qcPhotos.length === 0) {
                 tr.querySelectorAll('a').forEach(a => {
                    if ((a.innerText.includes('Photo') || a.className.includes('pic')) && !a.href.includes('javascript') && !a.href.includes('item.htm')) {
                        qcPhotos.push(a.href);
                    }
                });
            }

            items.push({
                orderNo,
                title: titleEl.innerText.trim(),
                link: titleEl.href,
                image: tr.querySelector('img')?.src || "",
                options: tr.querySelector('.user_orderlist_txt')?.innerText.trim() || tr.querySelector('.goods-sku')?.innerText.trim() || "",
                status: tr.querySelector('.show_status')?.innerText.trim() || "Unknown",
                price: price,
                qcPhotos: qcPhotos,
                selected: true,
                exists: false // Standaard false
            });
        });
    });
    return items;
}

// 4. Render met "Bestaat al" logica
function renderList() {
    const listBody = document.getElementById('sb-items-list');
    const importBtn = document.getElementById('sb-import-btn');
    
    listBody.innerHTML = '';

    if (scannedItems.length === 0) {
        listBody.innerHTML = '<tr><td colspan="5" style="padding:20px; text-align:center;">Geen items gevonden.</td></tr>';
        importBtn.disabled = true;
        importBtn.style.opacity = "0.5";
        return;
    }

    scannedItems.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = "1px solid #f3f4f6";
        
        // Styling voor bestaande items (beetje vervaagd)
        if (item.exists) {
            tr.style.opacity = "0.6";
            tr.style.background = "#f9fafb";
        }

        const qcBadge = item.qcPhotos.length > 0 
            ? `<span style="background:#d1fae5; color:#065f46; padding:2px 6px; border-radius:4px; font-size:0.75rem;">📸 ${item.qcPhotos.length}</span>` 
            : ``;
            
        // Status label of "Bestaat al" label
        let statusHtml = `<div style="color:${item.status.includes('Warehouse') ? 'green' : 'orange'}">${item.status}</div>`;
        if (item.exists) {
            statusHtml = `<div style="color:#ef4444; font-weight:bold;">⚠️ Al in voorraad</div>`;
        }

        tr.innerHTML = `
            <td style="padding:10px;">
                <input type="checkbox" class="sb-item-check" data-index="${index}" 
                ${item.selected ? 'checked' : ''} 
                ${item.exists ? 'disabled' : ''}>
            </td>
            <td style="padding:10px;"><img src="${item.image}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;"></td>
            <td style="padding:10px; max-width:250px;">
                <div style="font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${item.title}">${item.title}</div>
                <div style="font-size:0.8rem; color:#6b7280;">Order: ${item.orderNo}</div>
            </td>
            <td style="padding:10px; font-size:0.85rem; color:#4b5563;">
                <div style="margin-bottom:4px;">${qcBadge}</div>
                ${statusHtml}
            </td>
            <td style="padding:10px; text-align:right; font-weight:bold;">¥${item.price}</td>
        `;
        listBody.appendChild(tr);
    });

    document.querySelectorAll('.sb-item-check').forEach(cb => {
        cb.onchange = (e) => {
            scannedItems[e.target.dataset.index].selected = e.target.checked;
            updateCount();
        };
    });

    importBtn.disabled = false;
    importBtn.style.opacity = "1";
    updateCount();
}

function toggleAll(checked) {
    // Selecteer alleen items die NIET bestaan
    scannedItems.forEach(i => {
        if (!i.exists) i.selected = checked;
    });
    renderList();
}

function updateCount() {
    const count = scannedItems.filter(i => i.selected).length;
    document.getElementById('sb-count-label').innerText = `${count} items geselecteerd`;
}

async function sendToLaravel() {
    const selected = scannedItems.filter(i => i.selected);
    const btn = document.getElementById('sb-import-btn');
    
    if (selected.length === 0) {
        alert("Selecteer ten minste 1 item.");
        return;
    }

    btn.innerText = "Bezig met verzenden...";
    btn.disabled = true;
    btn.style.background = "#f59e0b";

    try {
        const response = await fetch(`${dashboardUrl}/superbuy/import-extension`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ 
                secret: secretKey,
                items: selected 
            })
        });

        const data = await response.json();

        if (data.success) {
            btn.innerText = "✅ Succes!";
            btn.style.background = "#10b981";
            document.getElementById('sb-status').innerText = data.message;
            document.getElementById('sb-status').style.color = "green";
            setTimeout(closeModal, 2000);
        } else {
            throw new Error(data.error || "Server error");
        }
    } catch (e) {
        console.error(e);
        btn.innerText = "❌ Fout";
        btn.style.background = "#ef4444";
        alert("Fout: " + e.message);
        btn.disabled = false;
    }
}