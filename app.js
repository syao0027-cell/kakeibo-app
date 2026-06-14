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

// ... (他の関数はそのまま) ...

function setupSettings() {
    // ... setupSettings の中の処理 ...
    // ... (reader.onload の中身も含む)
    
        if(importCsvFile) {
            importCsvFile.addEventListener("change", (e) => {
                // ... インポートの処理 ...
            }); // ← importCsvFileの閉じ括弧
        }
} // ← 【重要】ここで setupSettings 関数を閉じる

// そのすぐ下に、Service Worker の登録処理を置く
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('serviceworker.js')
            .then((reg) => console.log('PWA Service Worker 登録完了範囲:', reg.scope))
            .catch((err) => console.error('PWA 登録失敗:', err));
    });
