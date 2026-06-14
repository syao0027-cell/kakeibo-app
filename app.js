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

document.getElementById("date").value = new Date().toISOString().split("T")[0];

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

initApp();
setupTabs();
setupSettings();
setupReportFilters();

function checkAndInsertSampleData() {
    const data = localStorage.getItem("kakeibo");
    if (!data) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        
        const sampleRecords = [
            { id: 1, date: `${year}-${month}-01`, type: "income", category: "その他", amount: 250000, memo: "お給料" },
            { id: 2, date: `${year}-${month}-02`, type: "expense", category: "食費", amount: 4500, memo: "スーパーでお買い物" },
            { id: 3, date: `${year}-${month}-03`, type: "expense", category: "日用品", amount: 1200, memo: "ドラッグストア" },
            { id: 4, date: `${year}-${month}-05`, type: "expense", category: "趣味", amount: 8000, memo: "ほしかった本やゲーム" }
        ];
        localStorage.setItem("kakeibo", JSON.stringify(sampleRecords));
    }
}

function getKakeiboData() {
    return JSON.parse(localStorage.getItem("kakeibo")) || [];
}

function initHomeDatePicker() {
    const datePicker = document.getElementById("home-date-picker");
    if (!datePicker) return;
    
    const data = getKakeiboData();
    const periods = new Set();
    
    const now = new Date();
    periods.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

    data.forEach(item => {
        if (item.date && item.date.length >= 7) {
            periods.add(item.date.substring(0, 7));
        }
    });

    const sortedPeriods = Array.from(periods).sort().reverse();
    const currentSelected = datePicker.value;
    
    datePicker.innerHTML = "";
    sortedPeriods.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p;
        const [y, m] = p.split("-");
        opt.textContent = `${y}年${parseInt(m, 10)}月`;
        datePicker.appendChild(opt);
    });

    if (currentSelected && sortedPeriods.includes(currentSelected)) {
        datePicker.value = currentSelected;
    } else {
        datePicker.value = sortedPeriods[0];
    }
}

/* 【追加】index.htmlのセレクトボックスのonchangeイベントから
  呼び出されるグローバル関数を正しく定義しました。
*/
function onHomePeriodChange() {
    loadHistory();
    updateSummary();
    updateSparrowSpeech();
}

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
            
            const speech = document.getElementById("sparrow-speech");
            if (targetTab === "form-tab") {
                if(speech) speech.textContent = "忘れずに書くの、えらいチュン！";
            } else if (targetTab === "summary-tab") {
                renderCategoryReport();
                if(speech) speech.textContent = "今月はどんな感じチュン？";
            } else if (targetTab === "home-tab") {
                loadHistory();
                updateSummary();
                updateSparrowSpeech();
            }
        });
    });
}

function updateSparrowSpeech() {
    const speech = document.getElementById("sparrow-speech");
    if (!speech) return;

    const data = getKakeiboData();
    const datePicker = document.getElementById("home-date-picker");
    if (!datePicker || !datePicker.value) return;

    const currentPeriod = datePicker.value;
    const currentData = data.filter(item => item.date && item.date.startsWith(currentPeriod));
    
    let totalExpense = 0;
    let totalIncome = 0;
    currentData.forEach(item => {
        if (item.type === "expense") totalExpense += item.amount;
        if (item.type === "income") totalIncome += item.amount;
    });

    const balance = totalIncome - totalExpense;

    if (currentData.length === 0) {
        speech.textContent = "まだ今月のデータがないチュン！記録を待ってるよ！";
    } else if (balance < 0) {
        speech.textContent = "今月はちょっと赤字チュン…！一緒にがんばろう？";
    } else if (balance > 100000) {
        speech.textContent = "貯金がいっぱい！すごすぎるチュン！天才！";
    } else {
        speech.textContent = "いい調子チュン！この調子でコツコツいこう♪";
    }
}

function updateSummary() {
    const data = getKakeiboData();
    const datePicker = document.getElementById("home-date-picker");
    if (!datePicker || !datePicker.value) return;

    const currentPeriod = datePicker.value;
    const filtered = data.filter(item => item.date && item.date.startsWith(currentPeriod));

    let income = 0;
    let expense = 0;

    filtered.forEach(item => {
        if (item.type === "income") income += item.amount;
        else expense += item.amount;
    });

    const balance = income - expense;

    document.getElementById("monthlyIncome").textContent = `¥${income.toLocaleString()}`;
    document.getElementById("monthlyExpense").textContent = `¥${expense.toLocaleString()}`;
    
    const balanceEl = document.getElementById("monthlyBalance");
    balanceEl.textContent = `¥${balance.toLocaleString()}`;
    if (balance < 0) {
        balanceEl.style.color = "#E79A82"; 
    } else {
        balanceEl.style.color = "#DEB34A"; 
    }
}

function loadHistory() {
    if (!historyDiv) return;
    historyDiv.innerHTML = "";

    const data = getKakeiboData();
    const datePicker = document.getElementById("home-date-picker");
    if (!datePicker || !datePicker.value) {
        historyDiv.innerHTML = "<p style='text-align:center;font-size:13px;color:#999;'>データがありません</p>";
        return;
    }

    const currentPeriod = datePicker.value;
    const filtered = data.filter(item => item.date && item.date.startsWith(currentPeriod));

    if (filtered.length === 0) {
        historyDiv.innerHTML = "<p style='text-align:center;font-size:13px;color:#999;'>今月の明細はまだありません</p>";
        return;
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    filtered.forEach(item => {
        const day = item.date.split("-")[2] || "";
        const typeBadge = item.type === "income" ? "🌱" : "👛";
        const badgeClass = item.type === "income" ? "badge-income" : "badge-expense";
        const amtPrefix = item.type === "income" ? "+" : "-";
        const amtColor = item.type === "income" ? "#7FAE7B" : "#E79A82";

        const groupWrap = document.createElement("div");
        groupWrap.className = "history-group-wrap";

        const itemDiv = document.createElement("div");
        itemDiv.className = "rich-history-item";
        itemDiv.innerHTML = `
            <div class="history-date-box">${day}日</div>
            <div class="history-type-badge ${badgeClass}">${typeBadge}</div>
            <div class="history-main-info">
                <div class="history-title">${item.category}</div>
                <div class="history-memo-sub">${item.memo || "（メモなし）"}</div>
            </div>
            <div class="history-right-amount">
                <div class="amt-val" style="color:${amtColor}">${amtPrefix}¥${item.amount.toLocaleString()}</div>
            </div>
            <div class="history-row-arrow" id="arrow-${item.id}">▶</div>
        `;

        const actionsDiv = document.createElement("div");
        actionsDiv.className = "history-actions";
        actionsDiv.id = `actions-${item.id}`;
        actionsDiv.innerHTML = `
            <button class="action-btn edit-btn" onclick="editRecord(${item.id})">編集</button>
            <button class="action-btn delete-btn-action" onclick="deleteRecord(${item.id})">削除</button>
        `;

        itemDiv.addEventListener("click", (e) => {
            if (e.target.classList.contains("action-btn")) return;
            const arrow = document.getElementById(`arrow-${item.id}`);
            const actions = document.getElementById(`actions-${item.id}`);
            
            const isOpen = actions.classList.contains("open");
            
            document.querySelectorAll(".history-actions").forEach(el => el.classList.remove("open"));
            document.querySelectorAll(".history-row-arrow").forEach(el => el.classList.remove("open"));

            if (!isOpen) {
                actions.classList.add("open");
                arrow.classList.add("open");
            }
        });

        groupWrap.appendChild(itemDiv);
        groupWrap.appendChild(actionsDiv);
        historyDiv.appendChild(groupWrap);
    });
}

function renderFavorites() {
    const favsDiv = document.getElementById("favorites");
    if (!favsDiv) return;
    
    const favItems = [
        { name: "コンビニ", category: "食費", icon: "🛒", memo: "コンビニ" },
        { name: "スーパー", category: "食費", icon: "🥩", memo: "ライフ" },
        { name: "ドラッグ", category: "日用品", icon: "💊", memo: "薬局" },
        { name: "カフェ", category: "食費", icon: "☕", memo: "カフェ" },
        { name: "電車移動", category: "交通費", icon: "🚃", memo: "切符代" }
    ];

    favsDiv.innerHTML = "";
    favItems.forEach(item => {
        const card = document.createElement("div");
        card.className = "favorite-item-card-rich";
        card.innerHTML = `
            <div class="fav-icon">${item.icon}</div>
            <div class="fav-name">${item.name}</div>
        `;
        card.addEventListener("click", () => {
            document.getElementById("type-expense").checked = true;
            document.getElementById("category").value = item.category;
            document.getElementById("memo").value = item.memo;
            document.getElementById("amount").value = "";
            document.querySelector('[data-tab="form-tab"]').click();
            document.getElementById("amount").focus();
        });
        favsDiv.appendChild(card);
    });
}

if (saveBtn) {
    saveBtn.addEventListener("click", () => {
        /* 【修正】構文エラーの原因だったセレクタ指定を修正し、
          チェックされているラジオボタンの値を確実に取得できるようにしました。
        */
        const type = document.querySelector('input[name="type"]:checked').value;
        const amount = Number(document.getElementById("amount").value);
        const category = document.getElementById("category").value;
        const memo = document.getElementById("memo").value;
        const date = document.getElementById("date").value;

        if (!amount || amount <= 0) {
            alert("正しい金額を入力してくださいチュン！");
            return;
        }
        if (!date) {
            alert("日付を選んでほしいチュン！");
            return;
        }

        const data = getKakeiboData();

        if (editId) {
            const index = data.findIndex(item => item.id === editId);
            if (index !== -1) {
                data[index] = { id: editId, date, type, category, amount, memo };
            }
            editId = null;
            saveBtn.textContent = "登録する";
        } else {
            const newRecord = { id: Date.now(), date, type, category, amount, memo };
            data.push(newRecord);
        }

        localStorage.setItem("kakeibo", JSON.stringify(data));

        document.getElementById("amount").value = "";
        document.getElementById("memo").value = "";
        document.getElementById("date").value = new Date().toISOString().split("T")[0];

        initHomeDatePicker();
        loadHistory();
        updateSummary();
        updateSparrowSpeech();

        alert("記録を保存したチュン！");
        document.querySelector('[data-tab="home-tab"]').click();
    });
}

function editRecord(id) {
    const data = getKakeiboData();
    const record = data.find(item => item.id === id);
    if (!record) return;

    editId = id;
    document.getElementById(`type-${record.type}`).checked = true;
    document.getElementById("amount").value = record.amount;
    document.getElementById("category").value = record.category;
    document.getElementById("memo").value = record.memo;
    document.getElementById("date").value = record.date;

    saveBtn.textContent = "変更を保存する";
    document.querySelector('[data-tab="form-tab"]').click();
}

function deleteRecord(id) {
    if (!confirm("本当にこの記録を消しちゃうチュンか？")) return;
    let data = getKakeiboData();
    data = data.filter(item => item.id !== id);
    localStorage.setItem("kakeibo", JSON.stringify(data));
    
    loadHistory();
    updateSummary();
    updateSparrowSpeech();
    renderCategoryReport();
}

function initPeriodPicker() {
    const picker = document.getElementById("report-period-picker");
    if (!picker) return;

    const data = getKakeiboData();
    const periods = new Set();
    const now = new Date();

    if (currentPeriodMode === "monthly") {
        periods.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
        data.forEach(item => { if (item.date && item.date.length >= 7) periods.add(item.date.substring(0, 7)); });
    } else {
        periods.add(`${now.getFullYear()}`);
        data.forEach(item => { if (item.date && item.date.length >= 4) periods.add(item.date.substring(0, 4)); });
    }

    const sorted = Array.from(periods).sort().reverse();
    const prevVal = picker.value;
    picker.innerHTML = "";

    sorted.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p;
        if (currentPeriodMode === "monthly") {
            const [y, m] = p.split("-");
            opt.textContent = `${y}年${parseInt(m,10)}月`;
        } else {
            opt.textContent = `${p}年`;
        }
        picker.appendChild(opt);
    });

    if (prevVal && sorted.includes(prevVal)) picker.value = prevVal;
    else picker.value = sorted[0];
}

function setupReportFilters() {
    const btnMonthly = document.getElementById("btn-monthly");
    const btnYearly = document.getElementById("btn-yearly");
    const picker = document.getElementById("report-period-picker");

    if(btnMonthly && btnYearly) {
        btnMonthly.addEventListener("click", () => {
            currentPeriodMode = "monthly";
            btnMonthly.classList.add("active");
            btnYearly.classList.remove("active");
            initPeriodPicker();
            renderCategoryReport();