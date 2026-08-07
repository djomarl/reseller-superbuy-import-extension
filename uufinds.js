// uufinds.js
console.log("[Reseller Pro] UUFinds automation script loaded");

function triggerUpload(file) {
    // Zoek naar alle file inputs
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    if (fileInputs.length > 0) {
        console.log("[Reseller Pro] Found file input(s)", fileInputs);
        
        // UUFinds heeft wss 1 main file input voor image search
        const targetInput = fileInputs[0];
        
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        
        targetInput.files = dataTransfer.files;
        targetInput.dispatchEvent(new Event('change', { bubbles: true }));
        console.log("[Reseller Pro] Upload triggered via input change!");
        return true;
    }
    
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
                
                // UUFinds gebruikt waarschijnlijk een framework zoals Vue/React.
                // We wachten even tot de DOM volledig is opgebouwd.
                const tryUpload = setInterval(() => {
                    if (triggerUpload(file)) {
                        clearInterval(tryUpload);
                    }
                }, 500);

                // Stop na 10 seconden
                setTimeout(() => clearInterval(tryUpload), 10000);
            })
            .catch(err => console.error("[Reseller Pro] Error converting base64 to file", err));
    }
});
