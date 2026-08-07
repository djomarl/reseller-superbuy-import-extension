document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        dashboardUrl: document.getElementById('dashboardUrl'),
        secretKey: document.getElementById('secretKey'),
        enableSuperbuyExplorer: document.getElementById('enableSuperbuyExplorer'),
        enableSheetTools: document.getElementById('enableSheetTools'),
        enableAutoRedirect: document.getElementById('enableAutoRedirect'),
        defaultSearchEngine: document.getElementById('defaultSearchEngine')
    };

    // Laad opgeslagen waarden met slimme defaults
    chrome.storage.sync.get({
        dashboardUrl: '',
        secretKey: '',
        enableSuperbuyExplorer: true,
        enableSheetTools: true,
        enableAutoRedirect: true,
        defaultSearchEngine: 'uufinds'
    }, (items) => {
        elements.dashboardUrl.value = items.dashboardUrl;
        elements.secretKey.value = items.secretKey;
        elements.enableSuperbuyExplorer.checked = items.enableSuperbuyExplorer;
        elements.enableSheetTools.checked = items.enableSheetTools;
        elements.enableAutoRedirect.checked = items.enableAutoRedirect;
        elements.defaultSearchEngine.value = items.defaultSearchEngine;
    });

    document.getElementById('save').addEventListener('click', () => {
        const dashboardUrl = elements.dashboardUrl.value.replace(/\/$/, ""); // Haal trailing slash weg
        const secretKey = elements.secretKey.value;
        const enableSuperbuyExplorer = elements.enableSuperbuyExplorer.checked;
        const enableSheetTools = elements.enableSheetTools.checked;
        const enableAutoRedirect = elements.enableAutoRedirect.checked;
        const defaultSearchEngine = elements.defaultSearchEngine.value;

        chrome.storage.sync.set({
            dashboardUrl,
            secretKey,
            enableSuperbuyExplorer,
            enableSheetTools,
            enableAutoRedirect,
            defaultSearchEngine
        }, () => {
            const status = document.getElementById('status');
            status.style.opacity = '1';
            setTimeout(() => {
                status.style.opacity = '0';
            }, 2500);
        });
    });
});