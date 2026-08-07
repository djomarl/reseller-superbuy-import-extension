// uufinds.js
console.log("[Reseller Pro] UUFinds automation script loaded");

function triggerUpload(file) {
    console.log("[Reseller Pro] Attempting to auto-upload to Vue/React SPA...");
    
    // Banner tonen
    if (!document.getElementById('rp-banner')) {
        const banner = document.createElement('div');
        banner.id = 'rp-banner';
        banner.innerText = "🚀 Reseller Pro: Auto-searching your image...";
        Object.assign(banner.style, {
            position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
            padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', zIndex: '999999',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)', fontFamily: 'sans-serif', pointerEvents: 'none'
        });
        document.body.appendChild(banner);
        setTimeout(() => banner.remove(), 4000);
    }
    
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    let success = false;

    // 1. Direct paste in de zoekbalk (Dit is wat de gebruiker handmatig deed!)
    const searchBar = document.querySelector('.nut-searchbar__input-bar');
    if (searchBar) {
        console.log("[Reseller Pro] Found search bar, focusing and pasting...");
        searchBar.focus(); // Belangrijk: element moet focus hebben voor veel SPAs
        const pasteEvent = new ClipboardEvent('paste', { clipboardData: dataTransfer, bubbles: true, cancelable: true });
        searchBar.dispatchEvent(pasteEvent);
        success = true;
    }

    // 2. Drop event op de upload knop
    const uploadTrigger = document.querySelector('.pc-main-image-upload, .trigger-btn');
    if (uploadTrigger) {
        console.log("[Reseller Pro] Found upload trigger, simulating drop...");
        const dropEvent = new DragEvent('drop', { dataTransfer: dataTransfer, bubbles: true, cancelable: true });
        uploadTrigger.dispatchEvent(dropEvent);
        success = true;
    }

    // 3. Fallback: Native Setter op de file input
    const fileInputs = document.querySelectorAll('input[type="file"]');
    if (fileInputs.length > 0) {
        console.log("[Reseller Pro] Found file input, triggering native setter...");
        const input = fileInputs[0];
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "files").set;
        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(input, dataTransfer.files);
        } else {
            input.files = dataTransfer.files;
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        success = true;
    }
    
    if (success) {
        // Dispatch ook nog globaal voor de zekerheid
        const pasteEvent = new ClipboardEvent('paste', { clipboardData: dataTransfer, bubbles: true, cancelable: true });
        document.dispatchEvent(pasteEvent);
        window.dispatchEvent(pasteEvent);
        return true;
    }

    console.log("[Reseller Pro] No targets found yet...");
    return false;
}

chrome.storage.local.get(['pendingImageSearch'], (data) => {
    if (data.pendingImageSearch) {
        console.log("[Reseller Pro] Found pending image search!");
        
        // Maak storage direct leeg om dubbele searches te voorkomen
        chrome.storage.local.remove('pendingImageSearch');
        
        const base64 = data.pendingImageSearch;
        
        // Converteer base64 terug naar Blob/File
        fetch(base64)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], "reseller-pro-search.png", { type: "image/png" });
                
                // UUFinds gebruikt Vue. We zoeken tot 10 seconden lang naar de file input.
                const tryUpload = setInterval(() => {
                    if (triggerUpload(file)) {
                        clearInterval(tryUpload);
                    }
                }, 500);

                setTimeout(() => clearInterval(tryUpload), 10000);
            })
            .catch(err => console.error("[Reseller Pro] Error converting base64 to file", err));
    }
});
