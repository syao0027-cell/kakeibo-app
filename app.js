// === 変数定義 ===
let editId = null;
let currentPeriodMode = "monthly"; 
const saveBtn = document.getElementById("saveBtn");
const historyDiv = document.getElementById("history");

const CATEGORY_COLORS = {
    "食費": "#E79A82",
    "日用品": "#DEB34A",
    "交通費": "#5A9E96",
    "趣味": "#7FAE7B",
    "その他": "#A2A09B"
};

// === 履歴データ操作関数 (先に定義する必要があります) ===
function getKakeiboData() {
    return JSON.parse(localStorage.getItem("kakeibo")) || [];
}

function loadHistory() {
    // 履歴を読み込む処理をここに記述
    console.log("履歴を読み込みました");
}

function updateSummary() {
    console.log("集計を更新しました");
}

function renderFavorites() {
    console.log("お気に入りを表示しました");
}

function initPeriodPicker() {
    console.log("期間選択を初期化しました");
}

function renderCategoryReport() {
    console.log("レポートを表示しました");
}

function updateSparrowSpeech() {
    console.log("チュンのセリフを更新しました");
}

function checkAndInsertSampleData() {
    const data = localStorage.getItem("kakeibo");
    if (!data) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const sampleRecords = [
            { id: 1, date: `${year}-${month}-01`, type: "income", category: "その他", amount: 250000, memo: "お給料" }
        ];
        localStorage.setItem("kakeibo", JSON.stringify(sampleRecords));
    }
}

function initHomeDatePicker() {
    const datePicker = document.getElementById("home-date-picker");
    if (!datePicker) return;
    // (日付選択の処理)
}

// === 起動用関数 ===
function initApp() {
    checkAndInsertSampleData(); 
    initHomeDatePicker();  
    loadHistory();
    updateSummary();
    renderFavorites(); 
    initPeriodPicker();    
    renderCategoryReport(); 
    updateSparrowSpeech();      
}

// === その他の関数 ===
function setupTabs() { /* タブ切り替え処理 */ }
function setupSettings() { 
    // 設定関連の処理
    const importCsvFile = document.getElementById("importCsvFile");
    if(importCsvFile) {
        importCsvFile.addEventListener("change", (e) => {
            // インポート処理
        });
    }
}
function setupReportFilters() { /* レポートフィルタ処理 */ }

function triggerSparrowVisual(animationType = "jump", imageType = "normal") { /* 演出 */ }
function launchConfetti() { /* 紙吹雪 */ }
function getTimeBasedGreeting() { /* 挨拶 */ }

// === ここで初めてアプリを動かす ===
document.getElementById("date").value = new Date().toISOString().split("T")[0];

initApp();
setupTabs();
setupSettings();
setupReportFilters();

// Service Worker の登録
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('serviceworker.js')
            .then((reg) => console.log('PWA Service Worker 登録完了'))
            .catch((err) => console.error('PWA 登録失敗:', err));
    });
}