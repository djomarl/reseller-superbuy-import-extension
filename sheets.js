(function() {
    console.log("[Reseller Pro] Sheets script loaded on:", window.location.href);

    // === STAP 1: Verwijder Google's copy-blokkades ===
    
    // Verwijder blokkade-classes van body
    function removeBlockades() {
        document.body.classList.remove('docsshared-disable-image-copy');
        document.body.classList.remove('docsshared-no-select');
        // Sta selectie toe
        document.body.style.userSelect = 'auto';
        document.body.style.webkitUserSelect = 'auto';
    }

    // === STAP 2: Inject CSS om pointer-events:none te overrulen ===

    function injectStyles() {
        if (document.getElementById('rp-sheets-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'rp-sheets-styles';
        style.textContent = `
            /* Override Google's pointer-events:none op ALLE images */
            img {
                pointer-events: auto !important;
                cursor: pointer !important;
            }

            /* Hover effect zodat je ziet dat je kan klikken */
            img:hover {
                outline: 3px solid #3b82f6 !important;
                outline-offset: 2px !important;
                filter: brightness(1.1) !important;
                transition: outline 0.15s ease, filter 0.15s ease !important;
            }

            /* Blokkeer Google's no-select overal */
            .docsshared-no-select,
            .docsshared-disable-image-copy {
                user-select: auto !important;
                -webkit-user-select: auto !important;
                pointer-events: auto !important;
            }

            /* Toast notificatie */
            .rp-toast {
                position: fixed;
                bottom: 80px;
                left: 50%;
                transform: translateX(-50%) translateY(20px);
                background: #10b981;
                color: white;
                padding: 14px 28px;
                border-radius: 14px;
                font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
                font-weight: 700;
                font-size: 15px;
                z-index: 99999999;
                box-shadow: 0 10px 30px rgba(16, 185, 129, 0.5);
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                pointer-events: none;
                white-space: nowrap;
            }
            .rp-toast.show {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            .rp-toast.error {
                background: #ef4444;
                box-shadow: 0 10px 30px rgba(239, 68, 68, 0.5);
            }
        `;
        document.head.appendChild(style);
    }

    // === STAP 3: Toast systeem ===

    let toastEl = null;
    let toastTimer = null;

    function getToast() {
        if (toastEl && toastEl.parentNode) return toastEl;
        toastEl = document.createElement('div');
        toastEl.className = 'rp-toast';
        document.body.appendChild(toastEl);
        return toastEl;
    }

    function showToast(msg, isError = false) {
        const t = getToast();
        t.textContent = msg;
        t.classList.remove('show', 'error');
        if (isError) t.classList.add('error');
        // Force reflow
        void t.offsetWidth;
        t.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
    }

    // === STAP 4: Click-to-copy handler ===

    function getHighResUrl(src) {
        if (!src) return src;
        // Fix protocol-relative URLs
        if (src.startsWith('//')) src = 'https:' + src;
        // Google sheets-images-rt: =w200-h127 -> =w1600
        if (src.includes('sheets-images-rt') || src.includes('googleusercontent')) {
            src = src.replace(/=w\d+(-h\d+)?$/, '=w1600');
            src = src.replace(/=s\d+$/, '=s1600');
        }
        return src;
    }

    function setupClickToCopy() {
        // Maak het zwevende actiemenu
        const actionBar = document.createElement('div');
        actionBar.id = 'rp-action-bar';
        Object.assign(actionBar.style, {
            position: 'absolute',
            display: 'none',
            gap: '8px',
            background: 'rgba(15, 23, 42, 0.9)',
            padding: '6px',
            borderRadius: '8px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            zIndex: '99999999',
            backdropFilter: 'blur(4px)',
            pointerEvents: 'auto',
            animation: 'rp-fadeIn 0.2s ease-out'
        });

        const copyBtn = document.createElement('button');
        copyBtn.innerText = '📋 Copy';
        
        const uufindsBtn = document.createElement('button');
        
        let engineName = 'UUFinds';
        if (window.rpDefaultSearchEngine === 'taobao') engineName = 'Taobao';
        else if (window.rpDefaultSearchEngine === '1688') engineName = '1688';
        else if (window.rpDefaultSearchEngine === 'google_lens') engineName = 'Google Lens';
        
        uufindsBtn.innerText = `🔍 ${engineName}`;
        uufindsBtn.title = `Reverse Image Search on ${engineName}`;
        
        [copyBtn, uufindsBtn].forEach(btn => {
            Object.assign(btn.style, {
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '12px',
                fontWeight: '600',
                transition: 'all 0.2s'
            });
            btn.onmouseover = () => btn.style.background = '#3b82f6';
            btn.onmouseout = () => btn.style.background = 'rgba(255,255,255,0.1)';
        });
        
        uufindsBtn.onmouseover = () => uufindsBtn.style.background = '#8b5cf6';
        uufindsBtn.onmouseout = () => uufindsBtn.style.background = 'rgba(255,255,255,0.1)';

        actionBar.appendChild(copyBtn);
        actionBar.appendChild(uufindsBtn);
        document.body.appendChild(actionBar);

        // State voor de hover
        let currentTargetImg = null;
        let hideTimeout = null;

        function showActionBar(img) {
            clearTimeout(hideTimeout);
            currentTargetImg = img;
            
            const rect = img.getBoundingClientRect();
            
            // Zet de action bar in de top-right hoek van de afbeelding (rekening houdend met scroll)
            actionBar.style.top = (rect.top + window.scrollY + 8) + 'px';
            actionBar.style.left = (rect.right + window.scrollX - actionBar.offsetWidth - 8) + 'px';
            actionBar.style.display = 'flex';
            
            // Zorg dat hij niet buiten het scherm valt links
            if (parseFloat(actionBar.style.left) < 0) {
                actionBar.style.left = (rect.left + window.scrollX + 8) + 'px';
            }
        }

        function hideActionBar() {
            hideTimeout = setTimeout(() => {
                actionBar.style.display = 'none';
                currentTargetImg = null;
            }, 100);
        }

        // Mouse events op het hele document vangen (event delegation)
        document.addEventListener('mouseover', (e) => {
            if (e.target.tagName === 'IMG' && e.target.closest('td')) {
                const src = e.target.getAttribute('src') || '';
                if (!src || src.includes('ssl.gstatic.com') || (src.startsWith('data:') && src.length < 500)) return;
                
                // Zorg dat actie balk eerst in DOM gerenderd is voor offsetWidth
                actionBar.style.display = 'flex'; 
                actionBar.style.opacity = '0'; // verberg even tijdens berekenen
                
                setTimeout(() => {
                    showActionBar(e.target);
                    actionBar.style.opacity = '1';
                }, 10);
            }
        }, true);

        document.addEventListener('mouseout', (e) => {
            if (e.target.tagName === 'IMG' && e.target.closest('td')) {
                hideActionBar();
            }
        }, true);

        // Hou menu open als we erover hoveren
        actionBar.addEventListener('mouseover', () => clearTimeout(hideTimeout));
        actionBar.addEventListener('mouseleave', hideActionBar);

        // UUFINDS KLIK ACTIE
        uufindsBtn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!currentTargetImg) return;
            
            const src = currentTargetImg.getAttribute('src');
            const highRes = getHighResUrl(src);
            
            showToast('⏳ Copying for UUFinds...');
            const origText = uufindsBtn.innerText;
            uufindsBtn.innerText = '⏳...';

            try {
                // Eerst de image kopiëren naar klembord
                const response = await fetch(highRes, { credentials: 'include' });
                if (!response.ok) throw new Error('Fetch failed');
                let blob = await response.blob();

                if (blob.type !== 'image/png') {
                    const bitmap = await createImageBitmap(blob);
                    const canvas = document.createElement('canvas');
                    canvas.width = bitmap.width;
                    canvas.height = bitmap.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(bitmap, 0, 0);
                    blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                }

                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                showToast('✅ Auto-searching...');
                
                // Converteer naar base64 voor automatische upload op uufinds
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    chrome.storage.local.set({ pendingImageSearch: reader.result }, () => {
                        if (chrome.runtime.lastError) {
                            console.error('[Reseller Pro] Storage error:', chrome.runtime.lastError);
                            showToast('❌ Auto-search failed (Image too large)', true);
                            window.open('https://uufinds.com/', '_blank');
                            return;
                        }
                        // Daarna openen we uufinds of een ander platform
                        setTimeout(() => {
                            let urlToOpen = 'https://uufinds.com/';
                            
                            if (window.rpDefaultSearchEngine === 'taobao') {
                                urlToOpen = `https://s.taobao.com/search?q=&imgfile=&js=1&stats_click=search_radio_all%3A1&initiative_id=staobaoz_20230221&ie=utf8&tfsid=&app=imgsearch&imageUrl=${encodeURIComponent(highRes)}`;
                            } else if (window.rpDefaultSearchEngine === '1688') {
                                urlToOpen = `https://s.1688.com/youyuan/index.htm?tab=imageSearch&imageAddress=${encodeURIComponent(highRes)}`;
                            } else if (window.rpDefaultSearchEngine === 'google_lens') {
                                urlToOpen = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(highRes)}`;
                            }
                            
                            window.open(urlToOpen, '_blank');
                        }, 500);
                    });
                };
            } catch (err) {
                console.error('[Reseller Pro] Copy failed:', err);
                showToast('❌ Auto-search failed', true);
                window.open('https://uufinds.com/', '_blank');
            }
            
            uufindsBtn.innerText = origText;
            hideActionBar();
        };

        // COPY KLIK ACTIE
        copyBtn.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!currentTargetImg) return;
            
            const src = currentTargetImg.getAttribute('src');
            const highRes = getHighResUrl(src);
            
            showToast('⏳ Copying image...');
            const origText = copyBtn.innerText;
            copyBtn.innerText = '⏳...';

            try {
                const response = await fetch(highRes, { credentials: 'include' });
                if (!response.ok) throw new Error('Fetch failed');
                let blob = await response.blob();

                if (blob.type !== 'image/png') {
                    const bitmap = await createImageBitmap(blob);
                    const canvas = document.createElement('canvas');
                    canvas.width = bitmap.width;
                    canvas.height = bitmap.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(bitmap, 0, 0);
                    blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                }

                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                showToast('✅ Image copied to clipboard!');
            } catch (err) {
                console.error('[Reseller Pro] Copy failed:', err);
                showToast('❌ Copy failed — opening in new tab', true);
                window.open(highRes, '_blank');
            }
            
            copyBtn.innerText = origText;
            hideActionBar();
        };

        // Zorg dat we pointer-events op td's ook niet blokkeren, anders werkt mouseover soms niet
        const style = document.createElement('style');
        style.textContent = `
            @keyframes rp-fadeIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
            td img { pointer-events: auto !important; }
        `;
        document.head.appendChild(style);
    }

    // === STAP 5: Banner op /edit pagina ===

    function showBannerIfNeeded() {
        // Alleen op de top-level frame (niet in de iframe)
        if (window !== window.top) return;
        
        const url = window.location.href;
        if (!url.includes('/edit') && !url.includes('/preview')) return;
        if (document.getElementById('rp-htmlview-banner')) return;

        const banner = document.createElement('div');
        banner.id = 'rp-htmlview-banner';
        Object.assign(banner.style, {
            position: 'fixed',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '12px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
            zIndex: '99999999',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'rp-slideDown 0.4s ease-out'
        });

        const animStyle = document.createElement('style');
        animStyle.textContent = `@keyframes rp-slideDown { from { opacity:0; transform:translateX(-50%) translateY(-20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`;
        document.head.appendChild(animStyle);

        banner.innerHTML = `
            <span>📸 Tip: Open in HTMLView om images te kopieren</span>
            <button id="rp-go-htmlview" style="background:#3b82f6; color:white; border:none; padding:6px 14px; border-radius:8px; cursor:pointer; font-weight:600; font-size:12px;">Open HTMLView →</button>
            <button id="rp-dismiss" style="background:none; border:none; color:rgba(255,255,255,0.5); cursor:pointer; font-size:16px; padding:0 4px;">✕</button>
        `;
        document.body.appendChild(banner);

        document.getElementById('rp-go-htmlview').onclick = () => {
            const idMatch = url.match(/\/spreadsheets\/d\/([^\/]+)/);
            if (idMatch) {
                const gidMatch = url.match(/gid=(\d+)/);
                let newUrl = `https://docs.google.com/spreadsheets/d/${idMatch[1]}/htmlview`;
                if (gidMatch) newUrl += `#gid=${gidMatch[1]}`;
                window.location.href = newUrl;
            }
        };

        document.getElementById('rp-dismiss').onclick = () => {
            banner.style.opacity = '0';
            setTimeout(() => banner.remove(), 300);
        };
    }

    // === INIT ===

    function init() {
        chrome.storage.sync.get({
            enableSheetTools: true,
            enableAutoRedirect: true,
            defaultSearchEngine: 'uufinds'
        }, (settings) => {
            console.log('[Reseller Pro] Initializing on frame:', window === window.top ? 'TOP' : 'IFRAME', settings);
            
            window.rpDefaultSearchEngine = settings.defaultSearchEngine;

            if (settings.enableSheetTools) {
                removeBlockades();
                injectStyles();
                setupClickToCopy();
            }
            
            if (settings.enableAutoRedirect) {
                showBannerIfNeeded();
            }
            
            // Mutation observer voor blockades alleen als sheet tools aan staan
            if (settings.enableSheetTools) {
                const mo = new MutationObserver(() => {
                    if (document.body.classList.contains('docsshared-disable-image-copy')) {
                        removeBlockades();
                    }
                });
                if (document.body) {
                    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
                } else {
                    document.addEventListener('DOMContentLoaded', () => {
                        mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
                    });
                }
            }
        });
    }

    // Run zodra DOM klaar is
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // De oude mutation observer was hier; we hebben hem nu in init() gezet afhankelijk van instellingen.

})();
