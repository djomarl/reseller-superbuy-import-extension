document.addEventListener('DOMContentLoaded', () => {
    // 1. Laad opgeslagen waarden in als de popup opent
    chrome.storage.sync.get(['dashboardUrl', 'secretKey'], (items) => {
        if (items.dashboardUrl) {
            document.getElementById('dashboardUrl').value = items.dashboardUrl;
        }
        if (items.secretKey) {
            document.getElementById('secretKey').value = items.secretKey;
        }
    });
});

// 2. Sla op als er op de knop wordt geklikt
document.getElementById('saveBtn').addEventListener('click', () => {
    const dashboardUrlRaw = document.getElementById('dashboardUrl').value;
    const secretKey = document.getElementById('secretKey').value;

    // Verwijder eventuele trailing slash van de URL (http://.../ -> http://...)
    const dashboardUrl = dashboardUrlRaw.replace(/\/$/, "");

    if (!dashboardUrl || !secretKey) {
        showStatus('❌ Vul beide velden in!', 'red');
        return;
    }

    chrome.storage.sync.set({
        dashboardUrl: dashboardUrl,
        secretKey: secretKey
    }, () => {
        showStatus('✅ Instellingen opgeslagen!', 'green');
    });
});

function showStatus(text, color) {
    const status = document.getElementById('status');
    status.textContent = text;
    status.style.color = color;
    setTimeout(() => {
        status.textContent = '';
    }, 2500);
}