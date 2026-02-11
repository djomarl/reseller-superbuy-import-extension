// content.js - Superbuy Sync met Storage Settings

// Globale variabelen
let scannedItems = [];
let isModalOpen = false;

// Helper: Haal instellingen op uit Chrome Storage
async function getSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['dashboardUrl', 'secretKey'], (items) => {
            resolve(items);
        });
    });
}

// 1. Start de knop injectie
window.addEventListener('load', () => attemptInject());
const observer = new MutationObserver(() => {
    if (!document.getElementById('sb-sync-trigger')) attemptInject();
});
observer.observe(document.body, { childList: true, subtree: true });

function attemptInject() {
    // Zoek naar een geschikte plek voor de knop (titel balk of header)
    const target = document.querySelector('.mod-title') || document.querySelector('.user-title') || document.querySelector('h3');
    const table = document.querySelector('table');

    if (target && table && !document.getElementById('sb-sync-trigger')) {
        const btn = document.createElement('button');
        btn.id = 'sb-sync-trigger';
        btn.innerHTML = `
            <span style="font-size: 1.2em; display: inline-block; vertical-align: middle;">🚀</span> 
            <span style="vertical-align: middle;">Super Sync</span>
        `;
        // Verbeterde styling voor de inject knop
        btn.style.cssText = `
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white; 
            padding: 8px 20px; 
            border-radius: 99px; 
            border: none; 
            font-weight: 600; 
            cursor: pointer; 
            margin-left: 15px; 
            box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3), 0 2px 4px -1px rgba(16, 185, 129, 0.2); 
            transition: all 0.2s ease; 
            vertical-align: middle;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            letter-spacing: 0.025em;
        `;
        
        btn.onmouseover = () => {
            btn.style.transform = "translateY(-1px) scale(1.02)";
            btn.style.boxShadow = "0 10px 15px -3px rgba(16, 185, 129, 0.4), 0 4px 6px -2px rgba(16, 185, 129, 0.2)";
        };
        btn.onmouseout = () => {
            btn.style.transform = "translateY(0) scale(1)";
            btn.style.boxShadow = "0 4px 6px -1px rgba(16, 185, 129, 0.3), 0 2px 4px -1px rgba(16, 185, 129, 0.2)";
        };
        
        btn.onclick = openModal;
        target.appendChild(btn);
    }
}

// 2. De Modal Interface
function openModal() {
    if (isModalOpen) return;
    isModalOpen = true;

    // Injecteer CSS animaties en classes
    if (!document.getElementById('sb-custom-styles')) {
        const style = document.createElement('style');
        style.id = 'sb-custom-styles';
        style.innerHTML = `
            @keyframes sb-fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes sb-slideUp { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
            .sb-btn { transition: all 0.2s; position: relative; overflow: hidden; }
            .sb-btn:hover { transform: translateY(-1px); filter: brightness(110%); }
            .sb-btn:active { transform: translateY(0); filter: brightness(95%); }
            .sb-row-hover:hover { background-color: #f3f4f6 !important; }
            .sb-checkbox { width: 18px; height: 18px; cursor: pointer; accent-color: #10b981; }
            
            /* Scrollbar styling */
            #sb-items-container::-webkit-scrollbar { width: 8px; }
            #sb-items-container::-webkit-scrollbar-track { background: #f1f1f1; }
            #sb-items-container::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
            #sb-items-container::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
        `;
        document.head.appendChild(style);
    }

    const overlay = document.createElement('div');
    overlay.id = 'sb-modal-overlay';
    overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(17, 24, 39, 0.7); z-index:99999; display:flex; justify-content:center; align-items:center; backdrop-filter: blur(4px); animation: sb-fadeIn 0.2s ease-out;";
    
    const modal = document.createElement('div');
    modal.style.cssText = "background:white; width:90%; max-width:1000px; height:85%; border-radius:16px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); display:flex; flex-direction:column; overflow:hidden; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; animation: sb-slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);";
    
    modal.innerHTML = `
        <div style="padding:24px; border-bottom:1px solid #e5e7eb; display:flex; justify-content:space-between; align-items:center; background: linear-gradient(to right, #ffffff, #f9fafb);">
            <div style="display:flex; align-items:center; gap:12px;">
                <span style="font-size:1.5rem;">📦</span>
                <div>
                    <h2 style="margin:0; font-size:1.25rem; font-weight:700; color:#111827; letter-spacing: -0.01em;">Superbuy Import</h2>
                    <p style="margin:2px 0 0 0; font-size:0.85rem; color:#6b7280;">Synchroniseer je orders naar het dashboard</p>
                </div>
            </div>
            <button id="sb-close-btn" class="sb-btn" style="background:rgba(229, 231, 235, 0.5); border:none; width:36px; height:36px; border-radius:50%; font-size:1.2rem; cursor:pointer; color:#4b5563; display:flex; align-items:center; justify-content:center;">&times;</button>
        </div>
        
        <div id="sb-actions" style="padding:20px 24px; background:#fff; border-bottom:1px solid #e5e7eb; display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
            <button id="sb-scan-page" class="sb-btn" style="padding:10px 20px; background:#3b82f6; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:600; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); display:flex; align-items:center; gap:6px;">
                <span>📄</span> Scan Huidige Pagina
            </button>
            <button id="sb-scan-all" class="sb-btn" style="padding:10px 20px; background:#6366f1; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:600; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); display:flex; align-items:center; gap:6px;">
                <span>📚</span> Scan Pagina 1-5
            </button>
            <div style="height:24px; width:1px; background:#e5e7eb; margin:0 8px;"></div>
            <span id="sb-status" style="display:flex; align-items:center; color:#6b7280; font-size:0.9rem; font-weight:500; background:#f3f4f6; padding:6px 12px; border-radius:99px;">
                <span>👋 Klaar voor start...</span>
            </span>
        </div>

        <div id="sb-items-container" style="flex:1; overflow-y:auto; padding:0; background:#f9fafb;">
            <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
                <thead style="background:#f9fafb; position:sticky; top:0; z-index:10; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);">
                    <tr>
                        <th style="padding:16px 24px 16px 24px; text-align:left; width:40px; border-bottom: 1px solid #e5e7eb;"><input type="checkbox" id="sb-toggle-all" checked class="sb-checkbox"></th>
                        <th style="padding:16px 12px; text-align:left; width:80px; border-bottom: 1px solid #e5e7eb; color:#6b7280; font-weight:600; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em;">Foto</th>
                        <th style="padding:16px 12px; text-align:left; border-bottom: 1px solid #e5e7eb; color:#6b7280; font-weight:600; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em;">Product Details</th>
                        <th style="padding:16px 12px; text-align:left; border-bottom: 1px solid #e5e7eb; color:#6b7280; font-weight:600; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em;">Status Info</th>
                        <th style="padding:16px 24px 16px 12px; text-align:right; border-bottom: 1px solid #e5e7eb; color:#6b7280; font-weight:600; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em;">Prijs</th>
                    </tr>
                </thead>
                <tbody id="sb-items-list" style="background:white;">
                    <tr><td colspan="5" style="padding:60px; text-align:center; color:#9ca3af;">
                        <div style="font-size:3rem; margin-bottom:10px; opacity:0.3;">🔍</div>
                        <div>Nog geen items gescand.</div>
                        <div style="font-size:0.85rem; margin-top:5px; opacity:0.7;">Klik op een knop hierboven om te beginnen.</div>
                    </td></tr>
                </tbody>
            </table>
        </div>

        <div style="padding:20px 24px; border-top:1px solid #e5e7eb; background:white; display:flex; justify-content:flex-end; gap:16px; align-items:center; z-index:20; box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="margin-right:auto; display:flex; flex-direction:column;">
                <span id="sb-count-label" style="font-weight:700; color:#111827; font-size:1.1rem;">0 items</span>
                <span style="font-size:0.8rem; color:#6b7280;">Geselecteerd voor import</span>
            </div>
            <button id="sb-import-btn" disabled class="sb-btn" style="padding:12px 32px; background:#10b981; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:700; opacity:0.5; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3); font-size:1rem; display:flex; align-items:center; gap:8px;">
                <span>🚀</span> Importeer Selectie
            </button>
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
            
            // Voeg alleen unieke items toe (FIXED: Betere uniekheidscheck op subId)
            itemsOnPage.forEach(item => {
                const isDuplicate = scannedItems.some(x => {
                    // 1. Als we een uniek SubID (DI...) hebben, gebruik dat
                    if (x.subId && item.subId) {
                        return x.subId === item.subId;
                    }
                    // 2. Anders: check OrderNo + Title + Options (variant)
                    return x.orderNo === item.orderNo && 
                           x.title === item.title && 
                           x.options === item.options;
                });

                if (!isDuplicate) {
                    scannedItems.push(item);
                }
            });

            if (itemsOnPage.length === 0 && i > 1) break;
            if (multiPage) await new Promise(r => setTimeout(r, 800)); 

        } catch (e) {
            console.error("Scan error", e);
        }
    }

    // B. Checken op de server
    if (scannedItems.length > 0) {
        statusLabel.innerText = `Controleren op duplicaten...`;
        await checkDuplications();
    }

    statusLabel.innerText = `Klaar! ${scannedItems.length} items gevonden.`;
    renderList();
}

async function checkDuplications() {
    const settings = await getSettings();

    if (!settings.dashboardUrl || !settings.secretKey) {
        console.warn("⚠️ Geen instellingen gevonden.");
        document.getElementById('sb-status').innerText = "⚠️ Stel URL & Secret in bij opties!";
        return;
    }

    try {
        // We sturen nu de Sub IDs mee (DI...)
        // Dit lost de bug op dat hij hele orders markeert als ze hetzelfde ordernummer hebben
        const checkIds = scannedItems.map(i => i.subId).filter(id => id);

        const response = await fetch(`${settings.dashboardUrl}/superbuy/check-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                secret: settings.secretKey,
                order_nos: scannedItems.map(i => i.orderNo), // Backup voor legacy
                sub_ids: checkIds // NIEUW: Stuur specifieke ID's
            })
        });

        const data = await response.json();
        
        if (data.existing && Array.isArray(data.existing)) {
            scannedItems.forEach(item => {
                // BUGFIX: Check of het SPECIFIEKE Sub ID (DI...) bestaat
                // De server moet dus een lijst met DI-nummers teruggeven
                if (item.subId && data.existing.includes(item.subId)) {
                    item.exists = true;
                    item.selected = false;
                }
            });
        }
    } catch (e) {
        console.error("Kon duplicaten niet checken:", e);
        document.getElementById('sb-status').innerText = "⚠️ Kon niet verbinden met server.";
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

            // NIEUW: Probeer het unieke DI nummer te vinden (staat vaak onder de foto of in de tekst)
            const subIdMatch = tr.innerText.match(/(DI\d+)/);
            const subId = subIdMatch ? subIdMatch[0] : "";

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
                subId: subId, // Belangrijk voor duplicaat check
                title: titleEl.innerText.trim(),
                link: titleEl.href,
                image: tr.querySelector('img')?.src || "",
                options: tr.querySelector('.user_orderlist_txt')?.innerText.trim() || tr.querySelector('.goods-sku')?.innerText.trim() || "",
                status: tr.querySelector('.show_status')?.innerText.trim() || "Unknown",
                price: price,
                qcPhotos: qcPhotos,
                selected: true,
                exists: false 
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
        listBody.innerHTML = '<tr><td colspan="5" style="padding:60px; text-align:center; color:#6b7280;">Geen items gevonden.</td></tr>';
        importBtn.disabled = true;
        importBtn.style.opacity = "0.5";
        return;
    }

    scannedItems.forEach((item, index) => {
        // CHECK OP WITHDRAWN STATUS
        const isWithdrawn = item.status && (
            item.status.toLowerCase().includes('withdrawn') || 
            item.status.toLowerCase().includes('geannuleerd') ||
            item.status.toLowerCase().includes('cancel')
        );
        
        // Als item bestaat OF is teruggetrokken, is het "disabled"
        const isUnavailable = item.exists || isWithdrawn;

        // Als unavailable, deselecteer het als default logic
        if (isUnavailable) {
            item.selected = false;
        }

        const tr = document.createElement('tr');
        tr.style.borderBottom = "1px solid #f3f4f6";
        tr.className = isUnavailable ? '' : 'sb-row-hover'; // Alleen hover effect op actieve items
        
        if (isUnavailable) {
            tr.style.opacity = "0.5";
            tr.style.background = "#f9fafb";
            tr.style.filter = "grayscale(100%)"; // Maak withdrawn/existing helemaal grijs
        } else {
            tr.style.background = "white";
        }

        const qcBadge = item.qcPhotos.length > 0 
            ? `<span style="background:#ecfdf5; color:#059669; padding:4px 8px; border-radius:99px; font-size:0.7rem; font-weight:600; border:1px solid #10b98133; display:inline-flex; align-items:center; gap:4px;">📸 ${item.qcPhotos.length}</span>` 
            : ``;
            
        let statusHtml = `<div style="color:${item.status.includes('Warehouse') ? '#10b981' : '#f59e0b'}; font-weight:500;">${item.status}</div>`;
        
        if (item.exists) {
            statusHtml = `<div style="color:#ef4444; font-weight:700; display:flex; align-items:center; gap:6px;">
                <span style="font-size:1.1em;">⚠️</span> Al in voorraad
            </div>`;
        } else if (isWithdrawn) {
            // NIEUWE STATUS WEERGAVE VOOR WITHDRAWN
            statusHtml = `<div style="color:#6b7280; font-weight:700; display:flex; align-items:center; gap:6px;">
                <span style="font-size:1.1em;">🚫</span> Order Withdrawn
            </div>`;
        }

        tr.innerHTML = `
            <td style="padding:16px 24px;">
                <input type="checkbox" class="sb-item-check sb-checkbox" data-index="${index}" 
                ${item.selected ? 'checked' : ''} 
                ${isUnavailable ? 'disabled' : ''}>
            </td>
            <td style="padding:16px 12px;">
                <div style="width:50px; height:50px; border-radius:8px; overflow:hidden; border:1px solid #e5e7eb; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
                    <img src="${item.image}" style="width:100%; height:100%; object-fit:cover;">
                </div>
            </td>
            <td style="padding:16px 12px; max-width:300px;">
                <div style="font-weight:600; color:#111827; margin-bottom:4px; line-height:1.4;" title="${item.title}">
                    ${item.title.length > 60 ? item.title.substring(0, 60) + '...' : item.title}
                </div>
                <div style="display:flex; gap:12px; font-size:0.75rem; color:#6b7280;">
                    <span style="background:#f3f4f6; padding:2px 6px; border-radius:4px;">ORD: ${item.orderNo}</span>
                     ${item.subId ? `<span style="background:#f3f4f6; padding:2px 6px; border-radius:4px;">ID: ${item.subId}</span>` : ''}
                </div>
                <div style="font-size:0.75rem; color:#9ca3af; margin-top:4px; font-style:italic;">${item.options}</div>
            </td>
            <td style="padding:16px 12px; font-size:0.85rem;">
                <div style="margin-bottom:6px;">${qcBadge}</div>
                ${statusHtml}
            </td>
            <td style="padding:16px 24px 16px 12px; text-align:right; font-weight:700; color:#374151; font-size:1rem;">¥${item.price}</td>
        `;
        listBody.appendChild(tr);
    });

    document.querySelectorAll('.sb-item-check').forEach(cb => {
        cb.onchange = (e) => {
            scannedItems[e.target.dataset.index].selected = e.target.checked;
            updateCount();
        };
    });

    const hasSelected = scannedItems.some(i => i.selected);
    importBtn.disabled = !hasSelected;
    importBtn.style.opacity = hasSelected ? "1" : "0.5";
    importBtn.style.cursor = hasSelected ? "pointer" : "not-allowed";
    
    updateCount();
}

function toggleAll(checked) {
    scannedItems.forEach(i => {
        const isWithdrawn = i.status && (
            i.status.toLowerCase().includes('withdrawn') || 
            i.status.toLowerCase().includes('geannuleerd') ||
            i.status.toLowerCase().includes('cancel')
        );
        
        if (!i.exists && !isWithdrawn) {
             i.selected = checked;
        }
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

    const settings = await getSettings();
    if (!settings.dashboardUrl || !settings.secretKey) {
        alert("⚠️ Oeps! Je hebt nog geen URL en Secret ingesteld.\n\nGa naar de extensie instellingen (rechtermuisknop op icoon -> Opties) en vul deze in.");
        return;
    }

    btn.innerText = "Bezig met verzenden...";
    btn.disabled = true;
    btn.style.background = "#f59e0b";

    try {
        const response = await fetch(`${settings.dashboardUrl}/superbuy/import-extension`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                secret: settings.secretKey,
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
        alert("Fout bij importeren: " + e.message);
        btn.disabled = false;
    }
}