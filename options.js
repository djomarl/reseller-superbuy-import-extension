// options.js
document.addEventListener('DOMContentLoaded', () => {
    // Laad opgeslagen waarden
    chrome.storage.sync.get(['dashboardUrl', 'secretKey'], (items) => {
        if (items.dashboardUrl) document.getElementById('dashboardUrl').value = items.dashboardUrl;
        if (items.secretKey) document.getElementById('secretKey').value = items.secretKey;
    });
});

document.getElementById('save').addEventListener('click', () => {
    const dashboardUrl = document.getElementById('dashboardUrl').value.replace(/\/$/, ""); // Haal trailing slash weg
    const secretKey = document.getElementById('secretKey').value;

    chrome.storage.sync.set({
        dashboardUrl: dashboardUrl,
        secretKey: secretKey
    }, () => {
        const status = document.getElementById('status');
        status.textContent = '✅ Instellingen opgeslagen!';
        setTimeout(() => status.textContent = '', 2000);
    });
});