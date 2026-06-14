let editId = null;
let currentPeriodMode = "monthly"; 
const saveBtn = document.getElementById("saveBtn");
const historyDiv = document.getElementById("history");

// 初期設定: 日付フォームに今日を設定
document.getElementById("date").value = new Date().toISOString().split("T")[0];

function initApp() {
    initHomeDatePicker();  // ホーム画面用の年月フィルターを生成
    loadHistory();
    updateSummary();
    renderFavorites();
    initPeriodPicker();    // 集計画面用のプルダウンを初期化
    renderCategoryReport(); // 集計レポート生成
}

// 起動
initApp();
setupTabs();
setupSettings();
setupReportFilters();

// ==================== タブ切り替え ====================
function setupTabs() {
    const navButtons = document.querySelectorAll(".nav-item-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    navButtons.forEach(button => {
        button.addEventListener("click", () => {
            const targetTab = button.getAttribute("data-tab");
            navButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            tabContents.forEach(tab => {
                if (tab.id === targetTab) {
                    tab.classList.add("active");
                } else {
                    tab.classList.remove("active");
                }
            });
            window.scrollTo(0, 0);
            
            // 登録画面を開いた時にスズメのセリフを変更するおちゃめ演出
            const speech = document.getElementById("sparrow-speech");
            if (targetTab === "form-tab") {
                speech.textContent = "忘れずに記録しよう♪";
            } else if (targetTab === "summary-tab") {
                speech.textContent = "今月の分析はどうかな？";
            } else {
                speech.textContent = "今日も記録しよう♪";
            }
        });
    });
}

// ホーム画面上部の日付フィルターの初期化
function initHomeDatePicker() {
    const picker = document.getElementById("home-date-picker");
    const data = JSON.parse(localStorage.getItem("kakeibo")) || [];
    const periods = new Set();

    const now = new Date();
    const currentPeriod = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月`;
    periods.add(currentPeriod);

    data.forEach(item => {
        if(!item.date) return;
        const [year, month] = item.date.split("-");
        periods.add(`${year}年${month}月`);
    });

    const sortedPeriods = Array.from(periods).sort((a, b) => b.localeCompare(a));
    const currentSelected = picker.value;
    picker.innerHTML = "";

    sortedPeriods.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = p;
        picker.appendChild(opt);
    });

    if (currentSelected && sortedPeriods.includes(currentSelected)) {
        picker.value = currentSelected;
    } else {
        picker.value = currentPeriod;
    }
}

// 登録画面での支出/収入切り替え時の文字色トグル
function toggleTypeTab() {
    // スタイルはCSS側で処理
}

// ==================== データ保存・編集・削除 ====================
function saveData(){
    const type = document.querySelector('input[name="type"]:checked').value;
    const amount = Number(document.getElementById("amount").value);
    const category = document.getElementById("category").value;
    const memo = document.getElementById("memo").value;
    const date = document.getElementById("date").value;

    if(!amount){
        alert("金額を入力してください");
        return;
    }

    const data = JSON.parse(localStorage.getItem("kakeibo")) || [];

    if(editId){
        const index = data.findIndex(item => Number(item.id) === Number(editId));
        if (index !== -1) {
            data[index] = { id: Number(editId), type, amount, category, memo, date };
        }
        editId = null;
        saveBtn.textContent = "登録する";
    } else {
        const record = { id: Date.now(), type, amount, category, memo, date };
        data.push(record);
    }

    localStorage.setItem("kakeibo", JSON.stringify(data));
    document.getElementById("amount").value = "";
    document.getElementById("memo").value = "";

    initApp();
    document.querySelector('[data-tab="home-tab"]').click();
}

function loadHistory(){
    const data = JSON.parse(localStorage.getItem("kakeibo")) || [];
    data.sort((a,b) => new Date(b.date) - new Date(a.date));

    historyDiv.innerHTML = "";
    if(data.length === 0) {
        historyDiv.innerHTML = '<p style="color:#999; text-align:center; padding: 20px;">履歴がありません</p>';
        return;
    }

    // ホーム画面で選択されている月に応じて履歴をフィルタリング
    const homePicker = document.getElementById("home-date-picker");
    let targetYearMonth = "";
    if (homePicker && homePicker.value) {
        const matches = homePicker.value.match(/(\d+)年(\d+)月/);
        if (matches) targetYearMonth = `${matches[1]}-${matches[2]}`;
    }

    data.forEach(item=>{
        if (targetYearMonth && !item.date.startsWith(targetYearMonth)) return;

        const dateObj = new Date(item.date);
        const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
        const dayName = dayNames[dateObj.getDay()];
        const [,, dayStr] = item.date.split("-");

        // カテゴリ別の仮アイコンマッピング
        let catIcon = "🏷️";
        if (item.category === "食費") catIcon = "🛒";
        if (item.category === "交通費") catIcon = "🚗";
        if (item.category === "趣味") catIcon = "🎮";
        if (item.category === "日用品") catIcon = "🏡";

        const div = document.createElement("div");
        div.className = "rich-history-item";
        div.innerHTML = `
            <div class="history-date-box">
                <div>${dateObj.getMonth()+1}/${dayStr}</div>
                <div style="color:#A2A0Handle; font-size:11px;">(${dayName})</div>
            </div>
            <div class="history-type-badge ${item.type === 'expense' ? 'badge-expense' : 'badge-income'}">
                ${item.type === 'expense' ? '↓' : '↑'}
            </div>
            <div class="history-main-info">
                <div class="history-title">${item.memo || item.category}</div>
                <div class="history-memo-sub">${item.type === 'expense' ? '支出' : '収入'}</div>
            </div>
            <div class="history-right-amount">
                <div class="amt-val" style="color: ${item.type === 'expense' ? '#333' : '#6FBF73'}">
                    ${item.type === 'expense' ? '-' : '+'}$${item.amount.toLocaleString()}
                </div>
                <div class="cat-val">${catIcon} ${item.category}</div>
            </div>
            <div class="history-row-arrow">＞</div>
        `;

        // 操作ボタンエリア
        const actionDiv = document.createElement("div");
        actionDiv.className = "history-actions";
        actionDiv.innerHTML = `
            <button class="edit-btn" onclick="editRecord(${item.id})">編集</button>
            <button class="delete-btn" onclick="deleteRecord(${item.id})">削除</button>
        `;

        historyDiv.appendChild(div);
        historyDiv.appendChild(actionDiv);
    });
}

function renderFavorites(){
    const favorites = document.getElementById("favorites");
    const data = JSON.parse(localStorage.getItem("kakeibo")) || [];
    const counts = {};

    data.forEach(item=>{
        if(!item.memo){ return; }
        const key = item.category + "|" + item.memo;
        counts[key] = (counts[key] || 0) + 1;
    });

    const top3 = Object.entries(counts).sort((a,b)=> b[1]-a[1]).slice(0,4); // 上位4つ表示
    favorites.innerHTML = "";

    if(top3.length === 0) {
        // デフォルトのサンプルを表示
        const samples = [
            {cat: "食費", memo: "スーパー", icon: "🛒"},
            {cat: "食費", memo: "セブンイレブン", icon: "🏪"},
            {cat: "交通費", memo: "ガソリン", icon: "⛽"}
        ];
        samples.forEach(s => {
            createFavBtn(s.cat, s.memo, s.icon);
        });
    } else {
        top3.forEach(item=>{
            const [key] = item;
            const [cat, memo] = key.split("|");
            let icon = "🏷️";
            if (cat === "食費") icon = "🛒";
            if (memo.includes("セブン")) icon = "🏪";
            if (memo.includes("ガソリン")) icon = "⛽";
            createFavBtn(cat, memo, icon);
        });
    }

    // 追加ダミーボタン
    const addBtn = document.createElement("div");
    addBtn.className = "favorite-item-card-rich";
    addBtn.style.borderStyle = "dashed";
    addBtn.innerHTML = `<div class="fav-icon" style="color:#999;">＋</div><div class="fav-name" style="color:#999;">追加</div>`;
    favorites.appendChild(addBtn);
}

function createFavBtn(cat, memo, icon) {
    const favorites = document.getElementById("favorites");
    const div = document.createElement("div");
    div.className = "favorite-item-card-rich";
    div.innerHTML = `
        <div class="fav-icon">${icon}</div>
        <div class="fav-name">${memo}</div>
    `;
    div.onclick = ()=>{
        document.getElementById("category").value = cat;
        document.getElementById("memo").value = memo;
    };
    favorites.appendChild(div);
}

function deleteRecord(id){
    if(!confirm("削除しますか？")){ return; }
    let data = JSON.parse(localStorage.getItem("kakeibo")) || [];
    data = data.filter(item => item.id !== id);
    localStorage.setItem("kakeibo", JSON.stringify(data));
    initApp();
}

function updateSummary(){
    const data = JSON.parse(localStorage.getItem("kakeibo")) || [];
    
    // ホーム画面上のプルダウンで選択されている対象月を取得
    const homePicker = document.getElementById("home-date-picker");
    let targetYear = new Date().getFullYear();
    let targetMonth = new Date().getMonth();
    
    if (homePicker && homePicker.value) {
        const matches = homePicker.value.match(/(\d+)年(\d+)月/);
        if (matches) {
            targetYear = Number(matches[1]);
            targetMonth = Number(matches[2]) - 1;
        }
    }

    let income = 0; let expense = 0;

    data.forEach(item=>{
        const d = new Date(item.date);
        if(d.getFullYear() === targetYear && d.getMonth() === targetMonth){
            if(item.type === "income"){ income += item.amount; }
            if(item.type === "expense"){ expense += item.amount; }
        }
    });

    document.getElementById("monthlyIncome").textContent = "¥" + income.toLocaleString();
    document.getElementById("monthlyExpense").textContent = "¥" + expense.toLocaleString();
    
    const balance = income - expense;
    document.getElementById("monthlyBalance").textContent = (balance >= 0 ? "+" : "") + "¥" + balance.toLocaleString();
}

function editRecord(id){
    const data = JSON.parse(localStorage.getItem("kakeibo")) || [];
    const item = data.find(record => record.id === id);
    if(!item){ return; }

    editId = id;
    document.querySelector(`input[name="type"][value="${item.type}"]`).checked = true;
    document.getElementById("amount").value = item.amount;
    document.getElementById("category").value = item.category;
    document.getElementById("memo").value = item.memo;
    document.getElementById("date").value = item.date;

    saveBtn.textContent = "更新する";
    document.querySelector('[data-tab="form-tab"]').click();
}

saveBtn.addEventListener("click", saveData);

// ==================== ③ 集計画面 ====================
function setupReportFilters() {
    const btnMonthly = document.getElementById("btn-monthly");
    const btnYearly = document.getElementById("btn-yearly");
    const picker = document.getElementById("report-period-picker");

    if(!btnMonthly) return;

    btnMonthly.addEventListener("click", () => {
        currentPeriodMode = "monthly";
        btnMonthly.classList.add("active");
        btnYearly.classList.remove("active");
        initPeriodPicker();
        renderCategoryReport();
    });

    btnYearly.addEventListener("click", () => {
        currentPeriodMode = "yearly";
        btnYearly.classList.add("active");
        btnMonthly.classList.remove("active");
        initPeriodPicker();
        renderCategoryReport();
    });

    picker.addEventListener("change", renderCategoryReport);
}

function initPeriodPicker() {
    const picker = document.getElementById("report-period-picker");
    if(!picker) return;
    const data = JSON.parse(localStorage.getItem("kakeibo")) || [];
    const periods = new Set();

    if(data.length === 0) {
        const now = new Date();
        if(currentPeriodMode === "monthly") {
            periods.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
        } else {
            periods.add(`${now.getFullYear()}`);
        }
    }

    data.forEach(item => {
        if(!item.date) return;
        const [year, month] = item.date.split("-");
        if(currentPeriodMode === "monthly") {
            periods.add(`${year}-${month}`);
        } else {
            periods.add(`${year}`);
        }
    });

    const sortedPeriods = Array.from(periods).sort((a, b) => b.localeCompare(a));
    const savedValue = picker.value;
    picker.innerHTML = "";

    sortedPeriods.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = currentPeriodMode === "monthly" ? `${p.split("-")[0]}年${p.split("-")[1]}月` : `${p}年`;
        picker.appendChild(opt);
    });

    if(sortedPeriods.includes(savedValue)) {
        picker.value = savedValue;
    }
}

function renderCategoryReport() {
    const reportDiv = document.getElementById("category-report");
    const picker = document.getElementById("report-period-picker");
    if(!reportDiv || !picker || !picker.value) return;

    const data = JSON.parse(localStorage.getItem("kakeibo")) || [];
    const selected = picker.value; 
    const categoryTotals = {};
    let totalSum = 0;

    data.forEach(item => {
        if(item.type !== "expense" || !item.date) return;
        
        let match = false;
        if(currentPeriodMode === "monthly" && item.date.startsWith(selected)) {
            match = true;
        } else if(currentPeriodMode === "yearly" && item.date.startsWith(selected)) {
            match = true;
        }

        if(match) {
            categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.amount;
            totalSum += item.amount;
        }
    });

    reportDiv.innerHTML = "";
    document.getElementById("report-title").textContent = `${currentPeriodMode === 'monthly' ? '月間' : '年間'}支出合計: ¥${totalSum.toLocaleString()}`;

    const entries = Object.entries(categoryTotals);
    if(entries.length === 0) {
        reportDiv.innerHTML = '<p style="color:#999; text-align:center; margin:10px 0;">データがありません</p>';
        return;
    }

    entries.sort((a, b) => b[1] - a[1]).forEach(([category, total]) => {
        const percent = totalSum > 0 ? Math.round((total / totalSum) * 100) : 0;
        const itemDiv = document.createElement("div");
        itemDiv.className = "report-item";
        itemDiv.innerHTML = `
            <span>${category} <small style="color:#999; font-size:11px;">(${percent}%)</small></span>
            <strong>¥${total.toLocaleString()}</strong>
        `;
        reportDiv.appendChild(itemDiv);
    });
}

// ==================== ④ 設定画面 ====================
function setupSettings() {
    const clearBtn = document.getElementById("clearDataBtn");
    if(!clearBtn) return;

    clearBtn.addEventListener("click", () => {
        if(confirm("すべてのデータを削除します。本当によろしいですか？")) {
            localStorage.removeItem("kakeibo");
            initApp();
            alert("データを初期化しました。");
            document.querySelector('[data-tab="home-tab"]').click();
        }
    });

    document.getElementById("exportCsvBtn").addEventListener("click", () => {
        const data = JSON.parse(localStorage.getItem("kakeibo")) || [];
        if(data.length === 0) {
            alert("出力するデータがありません。");
            return;
        }
        let csvContent = "\uFEFF" + "ID,日付,タイプ,カテゴリ,金額,メモ\n";
        data.forEach(item => {
            csvContent += `${item.id},${item.date},${item.type},${item.category},${item.amount},"${(item.memo || '').replace(/"/g, '""')}"\n`;
        });
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `kakeibo_backup_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    document.getElementById("importCsvFile").addEventListener("change", (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            const text = event.target.result;
            const lines = text.split(/\r\n|\n/);
            const data = JSON.parse(localStorage.getItem("kakeibo")) || [];
            let importCount = 0;

            for(let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if(!line) continue;
                const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                if(parts.length < 5) continue;

                const id = parts[0] ? Number(parts[0]) : Date.now() + i;
                const date = parts[1];
                const type = parts[2];
                const category = parts[3];
                const amount = Number(parts[4]);
                let memo = parts[5] || "";
                
                if(memo.startsWith('"') && memo.endsWith('"')) {
                    memo = memo.slice(1, -1).replace(/""/g, '"');
                }
                const existingIndex = data.findIndex(item => Number(item.id) === Number(id));
                const record = { id, date, type, category, amount, memo };

                if(existingIndex !== -1) {
                    data[existingIndex] = record;
                } else {
                    data.push(record);
                }
                importCount++;
            }
            localStorage.setItem("kakeibo", JSON.stringify(data));
            initApp();
            alert(`${importCount}件のデータをインポートしました！`);
            e.target.value = "";
            document.querySelector('[data-tab="home-tab"]').click();
        };
        reader.readAsText(file);
    });
}

// ==================== PWA サービスワーカー自動登録 ====================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('serviceWorker.js')
            .then((reg) => console.log('PWA Service Worker 登録完了範囲:', reg.scope))
            .catch((err) => console.error('PWA 登録失敗:', err));
    });
}