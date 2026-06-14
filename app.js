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

// チュンちゃんを跳ねさせ、表情（画像）を変更する共通関数
function triggerSparrowVisual(animationType = "jump", imageType = "normal") {
    const sparrowWrapper = document.querySelector(".sparrow-watercolor-wrapper");
    const sparrowIcon = document.getElementById("sparrow-icon");

    if (sparrowWrapper) {
        sparrowWrapper.classList.remove("jump-animation");
        void sparrowWrapper.offsetWidth; 
        if (animationType === "jump") {
            sparrowWrapper.classList.add("jump-animation");
        }
    }

    if (sparrowIcon) {
        let srcPath = "icon.png";
        if (imageType === "happy") srcPath = "icon-happy.png";
        if (imageType === "sad") srcPath = "icon-sad.png";
        if (imageType === "work") srcPath = "icon-work.png";

        sparrowIcon.onerror = function() {
            this.src = "icon.png";
            this.onerror = null; 
        };
        sparrowIcon.src = srcPath;
    }
}

// お祝いの紙吹雪を降らせるエフェクト関数
function launchConfetti() {
    const colors = ["#E79A82", "#DEB34A", "#5A9E96", "#7FAE7B", "#FFD1A9"];
    for (let i = 0; i < 40; i++) {
        const confetti = document.createElement("div");
        confetti.className = "confetti";
        confetti.style.left = Math.random() * 100 + "vw";
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.transform = `scale(${Math.random() * 0.6 + 0.5})`;
        confetti.style.animationDelay = Math.random() * 0.5 + "s";
        document.body.appendChild(confetti);

        setTimeout(() => confetti.remove(), 3000);
    }
}

// 起動時の時間帯に合わせた挨拶を取得する関数
function getTimeBasedGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 10) {
        return "おはようチュン！今日も無理せず、マイペースにいこうね♪";
    } else if (hour >= 10 && hour < 17) {
        return "こんにちはチュン！お財布を使った記録、忘れないうちにどうぞチュン！";
    } else if (hour >= 17 && hour < 22) {
        return "今日もお疲れ様チュン。がんばった自分を褒めてあげるチュンよ🌟";
    } else {
        return "夜更かしチュン？今日も1日よく頑張ったね、早く休んでのチュン。";
    }
}

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

function onHomePeriodChange() {
    loadHistory();
    updateSummary();
    updateSparrowSpeech();
    triggerSparrowVisual("jump", "normal");
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
                triggerSparrowVisual("jump", "work"); 
            } else if (targetTab === "summary-tab") {
                renderCategoryReport();
                if(speech) speech.textContent = "今月はどんな感じチュン？";
                triggerSparrowVisual("jump", "normal");
            } else if (targetTab === "home-tab") {
                loadHistory();
                updateSummary();
                updateSparrowSpeech();
                renderFavorites(); 
            }
        });
    });
}

function updateSparrowSpeech() {
    const speech = document.getElementById("sparrow-speech");
    if (!speech) return;

    const data = getKakeiboData();
    const datePicker = document.getElementById("home-date-picker");
    if (!datePicker || !datePicker.value) {
        speech.textContent = getTimeBasedGreeting();
        triggerSparrowVisual("none", "normal");
        return;
    }

    const currentPeriod = datePicker.value;
    const currentData = data.filter(item => item.date && item.date.startsWith(currentPeriod));
    
    let totalExpense = 0;
    let totalIncome = 0;
    currentData.forEach(item => {
        if (item.type === "expense") totalExpense += item.amount;
        if (item.type === "income") totalIncome += item.amount;
    });

    const balance = totalIncome - totalExpense;

    if (currentData.length <= 4) {
        speech.textContent = getTimeBasedGreeting();
        triggerSparrowVisual("none", "normal");
    } else if (balance < 0) {
        speech.textContent = "今月はちょっと赤字チュン…！無理せず一緒にがんばろう？";
        triggerSparrowVisual("none", "sad"); 
    } else if (balance > 100000) {
        speech.textContent = "貯金が10万円突破！すごすぎるチュン！天才っ！";
        triggerSparrowVisual("none", "happy"); 
    } else {
        speech.textContent = "いい調子チュン！この調子でコツコツいこう♪";
        triggerSparrowVisual("none", "normal");
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

// 【アイコン無し・文字だけ自動集計版】
function renderFavorites() {
    const favsDiv = document.getElementById("favorites");
    if (!favsDiv) return;
    
    const data = getKakeiboData();
    const counts = {};
    const metaMap = {};

    data.forEach(item => {
        if (item.type === "expense" && item.memo) {
            const memoKey = item.memo.trim();
            counts[memoKey] = (counts[memoKey] || 0) + 1;
            metaMap[memoKey] = { category: item.category };
        }
    });

    let topItems = Object.keys(counts)
        .sort((a, b) => counts[b] - counts[a])
        .map(memo => {
            return {
                name: memo,
                category: metaMap[memo].category,
                memo: memo
            };
        });

    topItems = topItems.slice(0, 5);
    favsDiv.innerHTML = "";
    
    if (topItems.length === 0) return;

    topItems.forEach(item => {
        const card = document.createElement("div");
        card.className = "favorite-item-tag-only"; 
        card.innerHTML = `<span class="fav-tag-text">${item.name}</span>`;

        card.addEventListener("click", () => {
            document.getElementById("type-expense").checked = true;
            document.getElementById("category").value = item.category;
            document.getElementById("memo").value = item.memo;
            document.getElementById("amount").value = "";
            
            if (!document.getElementById("date").value) {
                document.getElementById("date").value = new Date().toISOString().split("T")[0];
            }

            document.querySelector('[data-tab="form-tab"]').click();
            
            setTimeout(() => {
                const amtInput = document.getElementById("amount");
                if(amtInput) amtInput.focus();
            }, 80); 
        });
        favsDiv.appendChild(card);
    });
}

if (saveBtn) {
    saveBtn.addEventListener("click", () => {
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
        renderFavorites(); 
        
        const amtStr = String(amount);
        const isRepeated = amtStr.split('').every(char => char === amtStr[0]) && amtStr.length > 1;
        
        if (amtStr === "777" || amtStr === "7777") {
            alert("トリプルセブン！超ラッキーチュン！運気が上がってるチュンよ！！");
            launchConfetti(); 
            triggerSparrowVisual("jump", "happy");
        } else if (isRepeated) {
            alert(`おおっ、${amount}円のゾロ目チュン！なんか良いことありそう♪`);
            launchConfetti();
            triggerSparrowVisual("jump", "happy");
        } else if (amtStr === "2525") {
            alert("2525（ニコニコ）円チュン！毎日笑顔で過ごそうね！");
            launchConfetti();
            triggerSparrowVisual("jump", "happy");
        } else {
            triggerSparrowVisual("jump", "happy");
            alert("記録を保存したチュン！");
        }

        updateSparrowSpeech();
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
    renderFavorites(); 
    
    triggerSparrowVisual("jump", "sad"); 
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
            triggerSparrowVisual("jump", "normal");
        });
        btnYearly.addEventListener("click", () => {
            currentPeriodMode = "yearly";
            btnYearly.classList.add("active");
            btnMonthly.classList.remove("active");
            initPeriodPicker();
            renderCategoryReport();
            triggerSparrowVisual("jump", "normal");
        });
    }

    if (picker) {
        picker.addEventListener("change", () => {
            renderCategoryReport();
        });
    }
}

function renderCategoryReport() {
    const picker = document.getElementById("report-period-picker");
    const reportTitle = document.getElementById("report-title");
    const reportDiv = document.getElementById("category-report");
    const pieChart = document.getElementById("category-pie-chart");

    if (!picker || !reportDiv) return;

    const selectedPeriod = picker.value;
    if (!selectedPeriod) {
        reportDiv.innerHTML = "<p style='text-align:center;color:#999;'>データがありません</p>";
        if(pieChart) pieChart.style.background = "#eee";
        return;
    }

    const data = getKakeiboData();
    const filtered = data.filter(item => {
        if (!item.date || item.type !== "expense") return false;
        return item.date.startsWith(selectedPeriod);
    });

    let totalExpense = 0;
    const catTotals = {};
    filtered.forEach(item => {
        totalExpense += item.amount;
        catTotals[item.category] = (catTotals[item.category] || 0) + item.amount;
    });

    if(reportTitle) reportTitle.textContent = `支出合計: ¥${totalExpense.toLocaleString()}`;
    reportDiv.innerHTML = "";

    if (totalExpense === 0) {
        reportDiv.innerHTML = "<p style='text-align:center;color:#999;font-size:13px;'>この期間の支出はありませんチュン！</p>";
        if (pieChart) pieChart.style.background = "#eee";
        return;
    }

    const sortedCats = Object.keys(catTotals).sort((a, b) => catTotals[b] - catTotals[a]);
    let percentSum = 0;
    const gradientParts = [];

    sortedCats.forEach(category => {
        const total = catTotals[category];
        const percent = (total / totalExpense) * 100;
        const displayPercent = Math.round(percent);
        const color = CATEGORY_COLORS[category] || "#A2A09B";

        const startDeg = (percentSum / 100) * 360;
        percentSum += percent;
        const endDeg = (percentSum / 100) * 360;

        gradientParts.push(`${color} ${startDeg}deg ${endDeg}deg`);

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

    if (pieChart && gradientParts.length > 0) {
        pieChart.style.background = `conic-gradient(${gradientParts.join(", ")})`;
    }
}

function setupSettings() {
    const clearBtn = document.getElementById("clearDataBtn");
    const exportCsvBtn = document.getElementById("exportCsvBtn");
    const importCsvFile = document.getElementById("importCsvFile");

    if(clearBtn) {
        clearBtn.addEventListener("click", () => {
            if(confirm("すべてのデータを削除します。本当によろしいですか？")) {
                localStorage.setItem("kakeibo", JSON.stringify([]));
                initApp();
                alert("データを初期化しました。");
                document.querySelector('[data-tab="home-tab"]').click();
            }
        });
    }

    if(exportCsvBtn) {
        exportCsvBtn.addEventListener("click", () => {
            const data = getKakeiboData();
            if(data.length === 0) {
                alert("エクスポートする data がないチュン！");
                return;
            }
            let csvContent = "id,date,type,category,amount,memo\n";
            data.forEach(item => {
                const memoEscaped = (item.memo || "").replace(/"/g, '""');
                csvContent += `${item.id},${item.date},${item.type},${item.category},${item.amount},"${memoEscaped}"\n`;
            });

            const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
            const blob = new Blob([bom, csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `kakeibo_backup_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    if(importCsvFile) {
        importCsvFile.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(evt) {
                const text = evt.target.result;
                const lines = text.split("\n");
                let data = getKakeiboData();
                let importCount = 0;

                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    const parts = line.split(",");
                    if (parts.length < 5) continue;

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