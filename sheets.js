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
        document.addEventListener('click', async (e) => {
            const img = e.target;
            if (img.tagName !== 'IMG') return;
            
            const src = img.getAttribute('src') || '';
            if (!src) return;
            
            // Skip Google UI icons
            if (src.includes('ssl.gstatic.com') || src.includes('www.gstatic.com') || src.includes('/favicon')) return;
            // Skip tiny spacer images
            if (src.startsWith('data:') && src.length < 500) return;

            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            const highRes = getHighResUrl(src);
            showToast('⏳ Copying image...');

            try {
                const response = await fetch(highRes, { credentials: 'include' });
                if (!response.ok) throw new Error('Fetch failed: ' + response.status);
                
                let blob = await response.blob();

                // Clipboard API vereist image/png
                if (blob.type !== 'image/png') {
                    const bitmap = await createImageBitmap(blob);
                    const canvas = document.createElement('canvas');
                    canvas.width = bitmap.width;
                    canvas.height = bitmap.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(bitmap, 0, 0);
                    blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                }

                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                
                showToast('✅ Image copied to clipboard!');
            } catch (err) {
                console.error('[Reseller Pro] Copy failed:', err);
                showToast('❌ Copy failed — opening in new tab', true);
                window.open(highRes, '_blank');
            }
        }, true); // useCapture = true, zodat we VOOR Google's handlers zitten
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
        console.log('[Reseller Pro] Initializing on frame:', window === window.top ? 'TOP' : 'IFRAME');
        removeBlockades();
        injectStyles();
        setupClickToCopy();
        showBannerIfNeeded();
    }

    // Run zodra DOM klaar is
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Blijf blokkades verwijderen als Google ze opnieuw toevoegt
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

})();
