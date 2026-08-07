// uufinds.js
console.log("[Reseller Pro] UUFinds automation script loaded");

function triggerUpload(file) {
    console.log("[Reseller Pro] Attempting to auto-upload to Vue/React SPA...");
    
    // Banner tonen
    const banner = document.createElement('div');
    banner.innerText = "🚀 Reseller Pro: Auto-searching your image...";
    Object.assign(banner.style, {
        position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
        background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
        padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', zIndex: '999999',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)', fontFamily: 'sans-serif'
    });
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 4000);
    
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    // Methode 1: Native Setter op de file input (werkt voor Vue/React)
    const fileInputs = document.querySelectorAll('input[type="file"]');
    if (fileInputs.length > 0) {
        console.log("[Reseller Pro] Found file input, triggering native setter...");
        const input = fileInputs[0];
        
        // Gebruik de native setter om framework overrides te omzeilen
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "files").set;
        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(input, dataTransfer.files);
        } else {
            input.files = dataTransfer.files;
        }
        
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
    }
    
    // Methode 2: Fallback paste en drop events
    console.log("[Reseller Pro] No file input found yet, simulating paste/drop...");
    const pasteEvent = new ClipboardEvent('paste', { clipboardData: dataTransfer, bubbles: true, cancelable: true });
    document.dispatchEvent(pasteEvent);
    if (document.activeElement) document.activeElement.dispatchEvent(pasteEvent);
    window.dispatchEvent(pasteEvent);
    
    const dropEvent = new DragEvent('drop', { dataTransfer: dataTransfer, bubbles: true, cancelable: true });
    document.dispatchEvent(dropEvent);
    
    return false; // Geef false terug zodat setInterval het nog eens probeert
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
