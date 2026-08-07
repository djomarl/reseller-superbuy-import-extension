// uufinds.js
console.log("[Reseller Pro] UUFinds automation script loaded");

function triggerUpload(file) {
    console.log("[Reseller Pro] Simulating Ctrl+V (paste) on UUFinds...");
    
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    
    const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: dataTransfer,
        bubbles: true,
        cancelable: true
    });
    
    // Dispatch op document en body
    document.dispatchEvent(pasteEvent);
    document.body.dispatchEvent(pasteEvent);
    
    // Fallback: zoek file input als paste niet werkt
    const fileInputs = document.querySelectorAll('input[type="file"]');
    if (fileInputs.length > 0) {
        fileInputs[0].files = dataTransfer.files;
        fileInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
        console.log("[Reseller Pro] Upload triggered via file input fallback");
    }
    
    return true;
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
                
                // UUFinds gebruikt Vue. We wachten even tot de app volledig is geïnitialiseerd.
                setTimeout(() => {
                    triggerUpload(file);
                }, 1500);
            })
            .catch(err => console.error("[Reseller Pro] Error converting base64 to file", err));
    }
});
