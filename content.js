let isModalOpen = false;
let isParcelSync = false;
let scannedItems = [];
let currentParcelData = null;

// 1. Start de knop injectie
window.addEventListener('load', () => attemptInject());
const observer = new MutationObserver(() => {
    attemptInject();
});
observer.observe(document.body, { childList: true, subtree: true });

function attemptInject() {
    const url = window.location.href.toLowerCase();
    const isOrderPage = url.includes('/order') && !url.includes('/parceldetail');
    const isParcelPage = url.includes('/parceldetail') || url.includes('/package/detail') || url.includes('id=pn');

    if (!isOrderPage && !isParcelPage) return;

    // Reguliere Order Sync Knop
    if (isOrderPage && !document.getElementById('sb-sync-trigger')) {
        let target = document.querySelector('.mod-title') || document.querySelector('.user-title') || document.querySelector('h3');
        const table = document.querySelector('table');

        // Checkt op table of body text om er zeker van te zijn dat pagina klaar is
        if (table || (document.body && document.body.innerText.includes('Order'))) {
            const btn = document.createElement('button');
            btn.id = 'sb-sync-trigger';
            btn.innerHTML = `<span style="font-size: 1.2em; display: inline-block; vertical-align: middle;">🚀</span> <span style="vertical-align: middle; margin-left: 4px;">Super Sync</span>`;
            
            if (target) {
                // Invoegen in titel (originele plaats)
                btn.style.cssText = `
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 8px 20px; border-radius: 99px; border: none; font-weight: 600; cursor: pointer; margin-left: 15px; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3), 0 2px 4px -1px rgba(16, 185, 129, 0.2); transition: all 0.2s ease; vertical-align: middle; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; letter-spacing: 0.025em; display: inline-flex; align-items: center; justify-content: center;
                `;
                btn.onmouseover = () => { btn.style.transform = "translateY(-1px) scale(1.02)"; btn.style.boxShadow = "0 10px 15px -3px rgba(16, 185, 129, 0.4)"; };
                btn.onmouseout = () => { btn.style.transform = "translateY(0) scale(1)"; btn.style.boxShadow = "0 4px 6px -1px rgba(16, 185, 129, 0.3)"; };
                btn.onclick = () => { isParcelSync = false; openModal(); };
                target.appendChild(btn);
            } else {
                // Floating Fallback rechts beneden
                btn.style.cssText = `
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 28px; border-radius: 99px; border: none; font-weight: 700; cursor: pointer; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.4); transition: all 0.2s ease; position: fixed; bottom: 30px; right: 30px; z-index: 999999; font-size: 16px; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center;
                `;
                btn.onmouseover = () => { btn.style.transform = "translateY(-2px) scale(1.05)"; btn.style.boxShadow = "0 15px 25px -5px rgba(16, 185, 129, 0.5)"; };
                btn.onmouseout = () => { btn.style.transform = "translateY(0) scale(1)"; btn.style.boxShadow = "0 10px 15px -3px rgba(16, 185, 129, 0.4)"; };
                btn.onclick = () => { isParcelSync = false; openModal(); };
                document.body.appendChild(btn);
            }
        }
    }

    // Parcel Sync Knop (op parcel details pagina)
    if (isParcelPage && !document.getElementById('sb-parcel-sync-trigger')) {
        const text = document.body ? document.body.innerText : '';
        // Alleen tonen als we zeker weten dat the DOM geladen is
        if (text.includes('Parcel') || document.querySelector('.Problem-Consulting') || url.includes('id=pn')) {
            const pbtn = document.createElement('button');
            pbtn.id = 'sb-parcel-sync-trigger';
            pbtn.innerHTML = `<span style="font-size: 1.2em; display: inline-block; vertical-align: middle;">📦</span> <span style="vertical-align: middle; margin-left: 4px;">Sync Parcel</span>`;
            
            // Altijd Floating Fixed Widget voor pakketten! Super strak en duidelijk zichtbaar
            pbtn.style.cssText = `
                background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 14px 28px; border-radius: 99px; border: none; font-weight: 700; cursor: pointer; box-shadow: 0 10px 15px -3px rgba(139, 92, 246, 0.4), 0 4px 6px -2px rgba(139, 92, 246, 0.2); transition: all 0.2s ease; position: fixed; bottom: 30px; right: 30px; z-index: 999999; font-size: 16px; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center;
            `;
            // Add a little entrance animation class directly encoded
            const animId = 'sb-bounce-anim';
            if (!document.getElementById(animId)) {
                const style = document.createElement('style');
                style.id = animId;
                style.innerHTML = `@keyframes sbBounceIn { 0% { opacity: 0; transform: translateY(40px) scale(0.9); } 100% { opacity: 1; transform: translateY(0) scale(1); } }`;
                document.head.appendChild(style);
            }
            pbtn.style.animation = 'sbBounceIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards';

            pbtn.onmouseover = () => { pbtn.style.transform = "translateY(-2px) scale(1.05)"; pbtn.style.boxShadow = "0 15px 25px -5px rgba(139, 92, 246, 0.5)"; };
            pbtn.onmouseout = () => { pbtn.style.transform = "translateY(0) scale(1)"; pbtn.style.boxShadow = "0 10px 15px -3px rgba(139, 92, 246, 0.4)"; };
            pbtn.onclick = () => { isParcelSync = true; openModal(); };
            
            document.body.appendChild(pbtn);
        }
    }
}

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

    const titleText = isParcelSync ? 'Superbuy Parcel Import' : 'Superbuy Import';
    const subText = isParcelSync ? 'Synchroniseer je hele pakket en vind de bijbehorende items' : 'Synchroniseer je orders naar het dashboard';
    const importBtnText = isParcelSync ? 'Importeer Parcel & Selectie' : 'Importeer Selectie';

    let actionsHtml = '';
    if (isParcelSync) {
        actionsHtml = `
            <button id="sb-scan-parcel" class="sb-btn" style="padding:10px 20px; background:#8b5cf6; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:600; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); display:flex; align-items:center; gap:6px;">
                <span>📦</span> Haal Parcel Items Op
            </button>
            <div style="height:24px; width:1px; background:#e5e7eb; margin:0 8px;"></div>
            <span id="sb-status" style="display:flex; align-items:center; color:#6b7280; font-size:0.9rem; font-weight:500; background:#f3f4f6; padding:6px 12px; border-radius:99px;">
                <span>👋 Klik op de knop om orders te doorzoeken...</span>
            </span>
        `;
    } else {
        actionsHtml = `
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
        `;
    }

    modal.innerHTML = `
        <div style="padding:24px; border-bottom:1px solid #e5e7eb; display:flex; justify-content:space-between; align-items:center; background: linear-gradient(to right, #ffffff, #f9fafb);">
            <div style="display:flex; align-items:center; gap:12px;">
                <span style="font-size:1.5rem;">${isParcelSync ? '📦' : '🚀'}</span>
                <div>
                    <h2 style="margin:0; font-size:1.25rem; font-weight:700; color:#111827; letter-spacing: -0.01em;">${titleText}</h2>
                    <p style="margin:2px 0 0 0; font-size:0.85rem; color:#6b7280;">${subText}</p>
                </div>
            </div>
            <button id="sb-close-btn" class="sb-btn" style="background:rgba(229, 231, 235, 0.5); border:none; width:36px; height:36px; border-radius:50%; font-size:1.2rem; cursor:pointer; color:#4b5563; display:flex; align-items:center; justify-content:center;">&times;</button>
        </div>
        
        <div id="sb-actions" style="padding:20px 24px; background:#fff; border-bottom:1px solid #e5e7eb; display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
            ${actionsHtml}
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
                <span>🚀</span> ${importBtnText}
            </button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.getElementById('sb-close-btn').onclick = closeModal;
    if (isParcelSync) {
        document.getElementById('sb-scan-parcel').onclick = () => runParcelScan();
    } else {
        document.getElementById('sb-scan-page').onclick = () => runScan(false);
        document.getElementById('sb-scan-all').onclick = () => runScan(true);
    }
    document.getElementById('sb-toggle-all').onchange = (e) => toggleAll(e.target.checked);
    document.getElementById('sb-import-btn').onclick = sendToLaravel;
}

function closeModal() {
    const overlay = document.getElementById('sb-modal-overlay');
    if (overlay) overlay.remove();
    isModalOpen = false;
    scannedItems = [];
    currentParcelData = null;
}

// 3. Scan & Check Logica (Parcel Sync)
async function runParcelScan() {
    const listBody = document.getElementById('sb-items-list');
    const statusLabel = document.getElementById('sb-status');
    scannedItems = [];
    currentParcelData = null;
    listBody.innerHTML = '<tr><td colspan="5" style="padding:40px; text-align:center; color:#6b7280;">🔍 Bezig met ophalen parcel info...</td></tr>';

    // 1. Scrape Parcel Info
    const text = document.body.innerText;
    
    // Probeer eerst via de URL (bijv. id=PN26731043232)
    const urlParams = new URLSearchParams(window.location.search);
    let parcelNo = urlParams.get('id');
    
    // Anders via de tekst
    if (!parcelNo) {
        const parcelMatch = text.match(/Parcel No\.:?\s*(PN\d+)/) || text.match(/(PN\d+)/);
        parcelNo = parcelMatch ? parcelMatch[1] : '';
    }

    const actualPaidMatch = text.match(/Actual Paid:\s*([A-Za-z€$£￥\s]+[\d\.,]+)/i) || text.match(/Total Amount:\s*([A-Za-z€$£￥\s]+[\d\.,]+)/i);
    const actualPaid = actualPaidMatch ? actualPaidMatch[1].trim() : '0.00';

    const diMatches = text.match(/DI\d+/g) || [];
    const targetDIs = [...new Set(diMatches)];

    if (!parcelNo) {
        statusLabel.innerText = "⚠️ Kon Parcel No niet vinden op de pagina.";
        listBody.innerHTML = '';
        return;
    }

    currentParcelData = {
        parcelNo: parcelNo,
        shippingCostRaw: actualPaid,
        targetDIs: targetDIs
    };

    if (targetDIs.length === 0) {
        statusLabel.innerText = "⚠️ Kon geen items (DI-nummers) vinden in dit pakket.";
        listBody.innerHTML = '';
        return;
    }

    statusLabel.innerText = `${targetDIs.length} items gevonden in pakket. Zoeken naar productdetails in orders...`;

    // 2. Fetch Orders /order page to get all details for these DIs
    let maxPages = 15;
    let matchedItemsCount = 0;
    
    for (let i = 1; i <= maxPages; i++) {
        statusLabel.innerText = `Orders doorzoeken (pagina ${i}). Gevonden: ${matchedItemsCount}/${targetDIs.length}...`;
        try {
            const fetchUrl = `${window.location.origin}/order?page=${i}`;
            const response = await fetch(fetchUrl);
            const htmlText = await response.text();
            
            if (response.url.toLowerCase().includes('login') || htmlText.includes('loginUser') || htmlText.includes('<title>Login')) {
                console.error("Not logged in or redirected");
                statusLabel.innerText = "⚠️ Je bent niet ingelogd op Superbuy!";
                break;
            }

            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');

            const itemsOnPage = scrapeDOM(doc);
            
            // Check if items match target DIs
            itemsOnPage.forEach(item => {
                if (item.subId && targetDIs.includes(item.subId)) {
                    // Check if already in scannedItems
                    if (!scannedItems.some(x => x.subId === item.subId)) {
                        scannedItems.push(item);
                        matchedItemsCount++;
                    }
                }
            });

            if (itemsOnPage.length === 0 && i > 1) {
                break; // Einde orders bereikt (of geen order tabellen gevonden)
            }

            if (matchedItemsCount >= targetDIs.length) {
                break; // Alle items gevonden
            }

            await new Promise(r => setTimeout(r, 600)); // sleep slightly

        } catch (e) {
            console.error("Error fetching order page", e);
        }
    }

    if (scannedItems.length > 0) {
        statusLabel.innerText = `Controleren op bestaande items...`;
        await checkDuplications();
    }

    statusLabel.innerText = `Klaar! ${scannedItems.length} pakket items gedetailleerd gevonden.`;
    renderList();
}


// 3. Scan & Check Logica (Reguliere Sync)
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

            // Voeg alleen unieke items toe
            itemsOnPage.forEach(item => {
                const isDuplicate = scannedItems.some(x => {
                    if (x.subId && item.subId) return x.subId === item.subId;
                    return x.orderNo === item.orderNo && x.title === item.title && x.options === item.options;
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
        const checkIds = scannedItems.map(i => i.subId).filter(id => id);

        const response = await fetch(`${settings.dashboardUrl}/superbuy/check-items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                secret: settings.secretKey,
                order_nos: scannedItems.map(i => i.orderNo),
                sub_ids: checkIds
            })
        });

        const data = await response.json();

        if (data.existing_details) {
            scannedItems.forEach(item => {
                const key = item.subId || item.orderNo;
                const details = data.existing_details[key] || (item.subId ? data.existing_details[item.subId] : null);

                if (details) {
                    const serverCount = details.qc_count || 0;
                    const localCount = item.qcPhotos.length;

                    if (localCount > serverCount) {
                        item.exists = true;
                        item.isUpdate = true;
                        item.selected = true; // Bij parcel sync updaten we ook bestaande
                    } else {
                        item.exists = true;
                        item.isUpdate = false;
                        // Bij een parcel sync willen we waarschijnlijk ook bestaande items meesturen zodat ze gekoppeld worden aan het pakket
                        item.selected = isParcelSync ? true : false;
                    }
                }
            });
        }
        else if (data.existing && Array.isArray(data.existing)) {
            scannedItems.forEach(item => {
                if (item.subId && data.existing.includes(item.subId)) {
                    item.exists = true;
                    item.selected = isParcelSync ? true : false;
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
                subId: subId,
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
        const isWithdrawn = item.status && (
            item.status.toLowerCase().includes('withdrawn') ||
            item.status.toLowerCase().includes('geannuleerd') ||
            item.status.toLowerCase().includes('cancel')
        );

        // Bij Parcel Sync staan we wel toe dat bestaande items geselecteerd zijn (om ze te koppelen)
        const isUnavailable = (!isParcelSync && item.exists && !item.isUpdate) || isWithdrawn;

        if (isUnavailable) {
            item.selected = false;
        }

        const tr = document.createElement('tr');
        tr.style.borderBottom = "1px solid #f3f4f6";
        tr.className = isUnavailable ? '' : 'sb-row-hover';

        if (isUnavailable) {
            tr.style.opacity = "0.5";
            tr.style.background = "#f9fafb";
            tr.style.filter = "grayscale(100%)";
        } else if (item.isUpdate) {
            tr.style.background = "#eff6ff";
        } else if (isParcelSync && item.exists) {
            tr.style.background = "#f0fdf4"; // Groenige tintje voor bestaande items in pakket
        } else {
            tr.style.background = "white";
        }

        const qcBadge = item.qcPhotos.length > 0
            ? `<span style="background:#ecfdf5; color:#059669; padding:4px 8px; border-radius:99px; font-size:0.7rem; font-weight:600; border:1px solid #10b98133; display:inline-flex; align-items:center; gap:4px;">📸 ${item.qcPhotos.length}</span>`
            : ``;

        let statusHtml = `<div style="color:${item.status.includes('Warehouse') ? '#10b981' : '#f59e0b'}; font-weight:500;">${item.status}</div>`;

        if (item.isUpdate) {
            statusHtml = `<div style="color:#2563eb; font-weight:700; display:flex; align-items:center; gap:6px;">
                <span style="font-size:1.1em;">🆙</span> NIEUWE FOTO'S
            </div>`;
        } else if (item.exists) {
            statusHtml = `<div style="color:${isParcelSync ? '#10b981' : '#ef4444'}; font-weight:700; display:flex; align-items:center; gap:6px;">
                <span style="font-size:1.1em;">${isParcelSync ? '✅' : '⚠️'}</span> Al in voorraad ${isParcelSync ? '(Wordt gekoppeld)' : ''}
            </div>`;
        } else if (isWithdrawn) {
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

    importBtn.disabled = scannedItems.filter(i => i.selected).length === 0;
    importBtn.style.opacity = importBtn.disabled ? "0.5" : "1";
    updateCount();
}

function toggleAll(checked) {
    const checkboxes = document.querySelectorAll('.sb-item-check:not([disabled])');
    checkboxes.forEach(cb => {
        cb.checked = checked;
        scannedItems[cb.dataset.index].selected = checked;
    });
    updateCount();
}

function updateCount() {
    const count = scannedItems.filter(i => i.selected).length;
    document.getElementById('sb-count-label').innerText = `${count} items`;
    const importBtn = document.getElementById('sb-import-btn');
    importBtn.disabled = count === 0;
    importBtn.style.opacity = count === 0 ? "0.5" : "1";
}

document.addEventListener('change', (e) => {
    if (e.target && e.target.classList.contains('sb-item-check')) {
        const index = e.target.dataset.index;
        scannedItems[index].selected = e.target.checked;
        updateCount();
    }
});

// 5. Verzenden naar Laravel
async function sendToLaravel() {
    const selectedItems = scannedItems.filter(i => i.selected);

    if (selectedItems.length === 0) return;

    const btn = document.getElementById('sb-import-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>⏳</span> Bezig...';
    btn.disabled = true;

    const settings = await getSettings();

    if (!settings.dashboardUrl || !settings.secretKey) {
        alert("⚠️ Geen instellingen! Vul je Dashboard URL en Secret Key in via de extensie opties.");
        btn.innerHTML = originalText;
        btn.disabled = false;
        return;
    }

    try {
        const endpoint = isParcelSync ? '/superbuy/import-parcel-extension' : '/superbuy/import-extension';
        
        const payload = {
            secret: settings.secretKey,
            items: selectedItems
        };

        if (isParcelSync && currentParcelData) {
            payload.parcel = currentParcelData;
        }

        const response = await fetch(`${settings.dashboardUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const rawText = await response.text();
        let result;
        try {
            result = JSON.parse(rawText);
        } catch (e) {
            throw new Error(`Server returned non-JSON: ${rawText.substring(0, 100)}`);
        }

        if (response.ok && result.success) {
            btn.innerHTML = '<span>✅</span> Gelukt!';
            btn.style.background = '#059669';
            setTimeout(() => {
                closeModal();
            }, 1000);
        } else {
            alert("⚠️ Fout bij importeren: " + (result.error || result.message || "Onbekende fout"));
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error("Netwerk fout:", error);
        alert(`⚠️ Oeps! Bestaat je domein wel?\n\nFout: ${error.message}\nURL: ${settings.dashboardUrl}`);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Hulpmethode Sync Storage
function getSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['dashboardUrl', 'secretKey'], (data) => {
            resolve(data);
        });
    });
}