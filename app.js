let editId = null;
let currentPeriodMode = "monthly"; 
const saveBtn = document.getElementById("saveBtn");
const historyDiv = document.getElementById("history");

// カラーマップ（円グラフとレポート用）
const CATEGORY_COLORS = {
    "食費": "#E79A82",
    "日用品": "#DEB34A",
    "交通費": "#5A9E96",
    "趣味": "#7FAE7B",
    "その他": "#A2A09B"
};

// 初期設定: 日付フォームに今日を設定
document.getElementById("date").value = new Date().toISOString().split("T")[0];

function initApp() {
    checkAndInsertSampleData(); // 【追加】初回起動時にサンプルデータを挿入
    initHomeDatePicker();  
    loadHistory();
    updateSummary();
    renderFavorites();
    initPeriodPicker();    
    renderCategoryReport(); 
    updateSparrowSpeech();      // 【追加】チュンちゃんのお喋りロジックを更新
}

// 起動
initApp();
setupTabs();
setupSettings();
setupReportFilters();

// ==================== 【新機能】初期データ（サンプル）の充実化 ====================
function checkAndInsertSampleData() {
    const data = localStorage.getItem("kakeibo");
    // まだデータが一度も作られていない場合（nullのとき）にダミーを投入
    if (!data) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        
        const sampleRecords = [
            { id: Date.now() - 30000, type: "income", amount: 200000, category: "その他", memo: "お給料", date: `${year}-${month}-01` },
            { id: Date.now() - 20000, type: "expense", amount: 1500, category: "食費", memo: "ランチ代", date: `${year}-${month}-05` },
            { id: Date.now() - 10000, type: "expense", amount: 2400, category: "日用品", memo: "洗剤・シャンプー", date: `${year}-${month}-10` },
            { id: Date.now(), type: "expense", amount: 5000, category: "趣味", memo: "ほしかった本・ゲーム", date: `${year}-${month}-12` }
        ];
        localStorage.setItem("kakeibo", JSON.stringify(sampleRecords));
    }
}

// ==================== 【新機能】チュンちゃんのお喋り連動システム ====================
function updateSparrowSpeech(customText = null) {
    const speech = document.getElementById("sparrow-speech");
    if (!speech) return;

    if (customText) {
        speech.textContent = customText;
        return;
    }

    const data = JSON.parse(localStorage.getItem("kakeibo")) || [];
    const now = new Date();
    const targetYear = now.getFullYear();
    const targetMonth = now.getMonth();

    let income = 0;
    let expense = 0;
    let foodExpense = 0;

    data.forEach(item => {
        const d = new Date(item.date);
        if (d.getFullYear() === targetYear && d.getMonth() === targetMonth) {
            if (item.type === "income") income += item.amount;
            if (item.type === "expense") {
                expense += item.amount;
                if (item.category === "食費") foodExpense += item.amount;
            }
        }
    });

    // 1. 収入がまだ入っていない、または支出ゼロの初期状態
    if (income === 0 && expense === 0) {
        speech.textContent = "まずは『よく使う項目』をタップしてテストしてみてね！チュン！";
        return;
    }

    // 2. 食費の割合が全体の45%を超えている場合への警告
    if (expense > 0 && (foodExpense / expense) > 0.45) {
        speech.textContent = "今月は食費がちょっと多めかも？美味しいものの食べすぎ注意だチュン！";
        return;
    }

    // 3. 収入ベースの残高計算（目安の予算ベースでもOK。ここでは簡易的に収入からの残金）
    if (income > 0) {
        const remaining = income - expense;
        if (remaining <= 0) {
            speech.textContent = "ひぇ〜！今月の収支が赤字になっちゃいそうだチュン！お財布を締めよう！";
        } else if (remaining < 30000) {
            speech.textContent = `今月はあと「¥${remaining.toLocaleString()}」使えるよ！大切に使おうね♪`;
        } else {
            speech.textContent = "いい調子だチュン！このペースで無駄遣いを減らしていこう！";
        }
    } else {
        // 収入が未入力で支出だけある場合
        speech.textContent = `今月の支出は ¥${expense.toLocaleString()} だよ。しっかり記録できてて偉いチュン！`;
    }
}

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
            
            // タブ移動のタイミングでもベースのチュンちゃんのセリフを切り替え
            if (targetTab === "form-tab") {
                updateSparrowSpeech("忘れずに記録しよう♪ 下のフォームを埋めるんだチュン！");
            } else if (targetTab === "summary-tab") {
                updateSparrowSpeech("今月の分析はどうかな？ グラフを見てみよう！");
            } else if (targetTab === "settings-tab") {
                updateSparrowSpeech("バックアップや初期化はここで管理するチュン。");
            } else {
                updateSparrowSpeech(); // ホームは自動分析セリフ
            }
        });
    });
}

function onHomePeriodChange() {
    updateSummary();
    loadHistory();
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

// ==================== 【UI改善】履歴リストの描画とアコーディオン制御 ====================
function loadHistory(){
    const data = JSON.parse(localStorage.getItem("kakeibo")) || [];
    data.sort((a,b) => new Date(b.date) - new Date(a.date));

    historyDiv.innerHTML = "";
    if(data.length === 0) {
        historyDiv.innerHTML = '<p style="color:#999; text-align:center; padding: 20px;">履歴がありません</p>';
        return;
    }

    const homePicker = document.getElementById("home-date-picker");
    let targetYearMonth = "";
    if (homePicker && homePicker.value) {
        const matches = homePicker.value.match(/(\d+)年(\d+)月/);
        if (matches) targetYearMonth = `${matches[1]}-${matches[2]}`;
    }

    // 丸角のコンテナボックスを1つ生成してそこにアイテムを詰める
    const containerBox = document.createElement("div");
    containerBox.className = "history-container-box";

    let hasItems = false;

    data.forEach(item=>{
        if (targetYearMonth && !item.date.startsWith(targetYearMonth)) return;
        hasItems = true;

        const dateObj = new Date(item.date);
        const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
        const dayName = dayNames[dateObj.getDay()];
        const [,, dayStr] = item.date.split("-");

        let catIcon = "🏷️";
        if (item.category === "食費") catIcon = "🛒";
        if (item.category === "交通費") catIcon = "🚗";
        if (item.category === "趣味") catIcon = "🎮";
        if (item.category === "日用品") catIcon = "🏡";

        // メイン行
        const rowDiv = document.createElement("div");
        rowDiv.className = "rich-history-item";
        rowDiv.innerHTML = `
            <div class="history-date-box">
                <div>${dateObj.getMonth()+1}/${dayStr}</div>
                <div style="color:#A2A09B; font-size:11px;">(${dayName})</div>
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
                    ${item.type === 'expense' ? '-' : '+'}${item.amount.toLocaleString()}円
                </div>
                <div class="cat-val">${catIcon} ${item.category}</div>
            </div>
            <div class="history-row-arrow" id="arrow-${item.id}">＞</div>
        `;

        // 隠されている操作パネル（スライドして出てくる）
        const actionDiv = document.createElement("div");
        actionDiv.className = "history-actions";
        actionDiv.id = `actions-${item.id}`;
        actionDiv.innerHTML = `
            <button class="action-btn edit-btn" onclick="event.stopPropagation(); editRecord(${item.id})">編集</button>
            <button class="action-btn delete-btn-action" onclick="event.stopPropagation(); deleteRecord(${item.id})">削除</button>
        `;

        // タップしたときにアコーディオンを開閉するクリックイベント
        rowDiv.addEventListener("click", () => {
            const panel = document.getElementById(`actions-${item.id}`);
            const arrow = document.getElementById(`arrow-${item.id}`);
            
            // 他の開いているパネルを閉じる（お好みで）
            document.querySelectorAll(".history-actions").forEach(p => {
                if (p.id !== `actions-${item.id}`) p.classList.remove("open");
            });
            document.querySelectorAll(".history-row-arrow").forEach(a => {
                if (a.id !== `arrow-${item.id}`) a.classList.remove("open");
            });

            // トグル処理
            panel.classList.toggle("open");
            arrow.classList.toggle("open");
        });

        containerBox.appendChild(rowDiv);
        containerBox.appendChild(actionDiv);
    });

    if (hasItems) {
        historyDiv.appendChild(containerBox);
    } else {
        historyDiv.innerHTML = '<p style="color:#999; text-align:center; padding: 20px;">この月の履歴はありません</p>';
    }
}

function renderFavorites(){
    const favorites = document.getElementById("favorites");
    if (!favorites) return;
    
    const data = JSON.parse(localStorage.getItem("kakeibo")) || [];
    const counts = {};

    data.forEach(item=>{
        if(!item.memo){ return; }
        const key = item.category + "|" + item.memo;
        counts[key] = (counts[key] || 0) + 1;
    });

    const top3 = Object.entries(counts).sort((a,b)=> b[1]-a[1]).slice(0,4); 
    favorites.innerHTML = "";

    if(top3.length === 0) {
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
        updateSparrowSpeech(`『${memo}』を選んだね！金額を入力して登録ボタンをポチだチュン！`);
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

// ==================== 【新機能】グラフの導入 & レポート描画 ====================
function renderCategoryReport() {
    const reportDiv = document.getElementById("category-report");
    const picker = document.getElementById("report-period-picker");
    const pieChart = document.getElementById("category-pie-chart");
    
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
        if (pieChart) pieChart.style.background = "#eee"; // 空白状態
        return;
    }

    // 降順にソートして並び替え
    entries.sort((a, b) => b[1] - a[1]);

    // --- CSS conic-gradientを使った円グラフのスタイル計算 ---
    let gradientParts = [];
    let currentPercentSum = 0;

    entries.forEach(([category, total]) => {
        const percent = totalSum > 0 ? (total / totalSum) * 100 : 0;
        const displayPercent = Math.round(percent);
        const color = CATEGORY_COLORS[category] || "#A2A09B";

        // グラデーションの開始位置と終了位置を計算
        const startDeg = (currentPercentSum / 100) * 360;
        currentPercentSum += percent;
        const endDeg = (currentPercentSum / 100) * 360;

        gradientParts.push(`${color} ${startDeg}deg ${endDeg}deg`);

        // レポート行を生成
        const itemDiv = document.createElement("div");
        itemDiv.className = "report-item";
        itemDiv.innerHTML = `
            <span>
                <span style="display:inline-block; width:12px; height:12px; background:${color}; border-radius:3px; margin-right:6px;"></span>
                ${category} <small style="color:#999; font-size:11px;">(${displayPercent}%)</small>
            </span>
            <strong>¥${total.toLocaleString()}</strong>
        `;
        reportDiv.appendChild(itemDiv);
    });

    // 円グラフの背景スタイルを動的に書き換える
    if (pieChart) {
        pieChart.style.background = `conic-gradient(${gradientParts.join(", ")})`;
    }
}

// ==================== ④ 設定画面 ====================
function setupSettings() {
    const clearBtn = document.getElementById("clearDataBtn");
    if(!clearBtn) return;

    clearBtn.addEventListener("click", () => {
        if(confirm("すべてのデータを削除します。本当によろしいですか？")) {
            localStorage.removeItem("kakeibo");
            // 完全に初期化されたらサンプルも作らないように、空配列で上書き
            localStorage.setItem("kakeibo", JSON.stringify([]));
            initApp();
            alert("データを初期化しました。");
            document.querySelector('[data-tab="home-tab"]').click();
        }
    });

    document.getElementById("exportCsvBtn").addEventListener("click", () => {
        const data = JSON.parse(localStorage.getItem("kakeibo")) || [];