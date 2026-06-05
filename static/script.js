// Telegram WebApp init
const tg = window.Telegram.WebApp;
tg.expand();
const userId = tg.initDataUnsafe?.user?.id || "default";

// ========== PAPKALAR TIZIMI ==========
let folders = [];
let currentFolder = null; // { id, name, cards }

// ========== APP STATE ==========
let appState = {
    cards: [],
    mode: "folder", // folder, manage, study, results
    currentCardIndex: 0,
    studyCards: [],
    isFlipped: false,
    answers: {},
    totalShown: 0
};

// ========== DOM ELEMENTS ==========
const folderMode = document.getElementById("folderMode");
const manageMode = document.getElementById("manageMode");
const studyMode = document.getElementById("studyMode");
const resultsMode = document.getElementById("resultsMode");

const foldersGrid = document.getElementById("foldersGrid");
const newFolderBtn = document.getElementById("newFolderBtn");
const backToMainBtn = document.getElementById("backToMainBtn");
const backToFoldersBtn = document.getElementById("backToFoldersBtn");
const saveFolderBtn = document.getElementById("saveFolderBtn");
const currentFolderName = document.getElementById("currentFolderName");

const frontInput = document.getElementById("frontInput");
const backInput = document.getElementById("backInput");
const addCardBtn = document.getElementById("addCardBtn");
const cardsGrid = document.getElementById("cardsGrid");
const startButton = document.getElementById("startButton");
const filledCount = document.getElementById("filledCount");
const emptyCount = document.getElementById("emptyCount");

const exitBtn = document.getElementById("exitBtn");
const progressCounter = document.getElementById("progressCounter");
const progressFill = document.getElementById("progressFill");
const flashcardContainer = document.getElementById("flashcardContainer");
const flashcard = document.getElementById("flashcard");
const flashcardFront = document.getElementById("flashcardFront");
const flashcardBack = document.getElementById("flashcardBack");
const incorrectBtn = document.getElementById("incorrectBtn");
const correctBtn = document.getElementById("correctBtn");
const scorePercentage = document.getElementById("scorePercentage");
const correctCount = document.getElementById("correctCount");
const incorrectCount = document.getElementById("incorrectCount");
const chichvordingBox = document.getElementById("chichvordingBox");
const celebrationBox = document.getElementById("celebrationBox");
const restartButton = document.getElementById("restartButton");
const backButton = document.getElementById("backButton");

// ========== LOCALSTORAGE ==========
function loadFolders() {
    const saved = localStorage.getItem("flashcard_folders_" + userId);
    if (saved) {
        try {
            folders = JSON.parse(saved);
        } catch (e) {
            folders = [];
        }
    } else {
        folders = [];
    }
    renderFolders();
}

function saveFolders() {
    localStorage.setItem("flashcard_folders_" + userId, JSON.stringify(folders));
}

function saveCurrentFolderToStorage() {
    if (currentFolder) {
        const index = folders.findIndex(f => f.id === currentFolder.id);
        if (index !== -1) {
            folders[index].cards = currentFolder.cards;
        } else {
            folders.push(currentFolder);
        }
        saveFolders();
    }
}

// ========== PAPKALAR UI ==========
function renderFolders() {
    if (!foldersGrid) return;
    foldersGrid.innerHTML = "";
    
    if (folders.length === 0) {
        const emptyMsg = document.createElement("div");
        emptyMsg.className = "empty-message";
        emptyMsg.textContent = "📭 Hozircha papka yo'q. Yangi papka yarating!";
        foldersGrid.appendChild(emptyMsg);
        return;
    }
    
    folders.forEach(folder => {
        const folderEl = document.createElement("div");
        folderEl.className = "folder-item";
        
        const filledCount = folder.cards.filter(c => c.front && c.front.trim()).length;
        const totalCount = folder.cards.length;
        
        folderEl.innerHTML = `
            <div class="folder-icon">📁</div>
            <div class="folder-name">${escapeHtml(folder.name)}</div>
            <div class="folder-stats">${filledCount}/${totalCount} cards</div>
            <div class="folder-actions">
                <button class="folder-open" data-id="${folder.id}">📖 Ochish</button>
                <button class="folder-delete" data-id="${folder.id}">🗑️ O'chir</button>
            </div>
        `;
        
        folderEl.querySelector(".folder-open").addEventListener("click", () => openFolder(folder.id));
        folderEl.querySelector(".folder-delete").addEventListener("click", () => deleteFolder(folder.id));
        
        foldersGrid.appendChild(folderEl);
    });
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function createNewFolder() {
    const folderName = prompt("Yangi papka nomini kiriting:", "Mening so'zlarim");
    if (!folderName || folderName.trim() === "") return;
    
    const newFolder = {
        id: Date.now().toString(),
        name: folderName.trim(),
        cards: Array(50).fill(null).map((_, i) => ({ id: i, front: "", back: "" }))
    };
    folders.push(newFolder);
    saveFolders();
    renderFolders();
}

function openFolder(folderId) {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    
    currentFolder = { ...folder, cards: [...folder.cards] };
    appState.cards = [...currentFolder.cards];
    currentFolderName.textContent = currentFolder.name;
    
    renderCards();
    updateStats();
    switchMode("manage");
}

function deleteFolder(folderId) {
    if (confirm("Bu papkani o'chirmoqchimisiz? Barcha kartalar yo'qoladi!")) {
        folders = folders.filter(f => f.id !== folderId);
        saveFolders();
        renderFolders();
        if (currentFolder && currentFolder.id === folderId) {
            currentFolder = null;
            appState.cards = Array(50).fill(null).map((_, i) => ({ id: i, front: "", back: "" }));
        }
    }
}

function saveCurrentFolder() {
    if (!currentFolder) {
        // Yangi papka sifatida saqlash
        const folderName = prompt("Papka nomini kiriting:", "Yangi papka");
        if (!folderName || folderName.trim() === "") return;
        
        currentFolder = {
            id: Date.now().toString(),
            name: folderName.trim(),
            cards: [...appState.cards]
        };
        folders.push(currentFolder);
        saveFolders();
        currentFolderName.textContent = currentFolder.name;
        alert("✅ Papka saqlandi!");
    } else {
        // Mavjud papkani yangilash
        currentFolder.cards = [...appState.cards];
        const index = folders.findIndex(f => f.id === currentFolder.id);
        if (index !== -1) {
            folders[index] = { ...currentFolder };
        }
        saveFolders();
        alert("✅ Papka yangilandi!");
    }
    renderFolders();
}

// ========== KARTALAR BILAN ISHLASH ==========
function renderCards() {
    if (!cardsGrid) return;
    cardsGrid.innerHTML = "";
    appState.cards.forEach((card, idx) => {
        const cardEl = document.createElement("div");
        const cardClass = card.front && card.front.trim() ? "filled" : "empty";
        cardEl.className = "card-item " + cardClass;
        const cardNumber = document.createElement("div");
        cardNumber.className = "card-number";
        cardNumber.textContent = "#" + (idx + 1);
        cardEl.appendChild(cardNumber);
        if (card.front && card.front.trim()) {
            const frontPreview = document.createElement("div");
            frontPreview.className = "card-preview";
            frontPreview.textContent = card.front.substring(0, 15);
            cardEl.appendChild(frontPreview);
            const backPreview = document.createElement("div");
            backPreview.className = "card-preview";
            backPreview.textContent = card.back.substring(0, 15);
            cardEl.appendChild(backPreview);
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "button";
            deleteBtn.style.background = "#ef4444";
            deleteBtn.style.width = "100%";
            deleteBtn.style.marginTop = "5px";
            deleteBtn.style.padding = "4px";
            deleteBtn.style.fontSize = "12px";
            deleteBtn.textContent = "🗑️ O'chir";
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                card.front = "";
                card.back = "";
                renderCards();
                updateStats();
                if (currentFolder) {
                    saveCurrentFolder();
                }
            };
            cardEl.appendChild(deleteBtn);
        }
        cardsGrid.appendChild(cardEl);
    });
}

function updateStats() {
    const filled = appState.cards.filter(c => c.front && c.front.trim() && c.back && c.back.trim()).length;
    filledCount.textContent = filled;
    emptyCount.textContent = 50 - filled;
    startButton.disabled = (filled === 0);
}

function addCard() {
    const front = frontInput.value.trim();
    const back = backInput.value.trim();
    if (!front || !back) {
        alert("Iltimos, ikkala maydonni to'ldiring!");
        return;
    }
    const emptyCard = appState.cards.find(c => !c.front || !c.front.trim());
    if (emptyCard) {
        emptyCard.front = front;
        emptyCard.back = back;
        renderCards();
        updateStats();
        frontInput.value = "";
        backInput.value = "";
        frontInput.focus();
        if (currentFolder) {
            saveCurrentFolder();
        }
    } else {
        alert("Barcha kartalar to'ldirilgan!");
    }
}

// ========== O'RGANISH ==========
function startStudy() {
    const filledCards = appState.cards.filter(card => card.front && card.front.trim() && card.back && card.back.trim());
    if (filledCards.length === 0) {
        alert("Kamida bir kartani qo'shing!");
        return;
    }
    appState.studyCards = [...filledCards].sort(() => Math.random() - 0.5);
    appState.currentCardIndex = 0;
    appState.isFlipped = false;
    appState.answers = {};
    appState.totalShown = 0;
    
    correctBtn.disabled = false;
    incorrectBtn.disabled = false;
    correctBtn.classList.remove("clicked");
    incorrectBtn.classList.remove("clicked");
    
    switchMode("study");
    displayCurrentCard();
    updateProgress();
}

function displayCurrentCard() {
    if (appState.currentCardIndex >= appState.studyCards.length) {
        finishStudy();
        return;
    }
    const card = appState.studyCards[appState.currentCardIndex];
    flashcardFront.textContent = card.front;
    flashcardBack.textContent = card.back;
    
    // MUHIM: Har doim oldinga holatda boshlash
    appState.isFlipped = false;
    flashcard.classList.remove("flipped");
}

function updateProgress() {
    const total = appState.studyCards.length;
    const current = appState.currentCardIndex + 1;
    progressCounter.textContent = current + " / " + total;
    progressFill.style.width = ((current / total) * 100) + "%";
}

function handleAnswer(isCorrect) {
    correctBtn.disabled = true;
    incorrectBtn.disabled = true;
    const cardId = appState.studyCards[appState.currentCardIndex].id;
    appState.answers[cardId] = isCorrect;
    appState.totalShown++;
    
    setTimeout(() => {
        if (appState.currentCardIndex < appState.studyCards.length - 1) {
            appState.currentCardIndex++;
            displayCurrentCard();
            updateProgress();
            correctBtn.disabled = false;
            incorrectBtn.disabled = false;
        } else {
            finishStudy();
        }
    }, 500);
}

function finishStudy() {
    correctBtn.disabled = false;
    incorrectBtn.disabled = false;
    switchMode("results");
    displayResults();
}

function displayResults() {
    const correct = Object.values(appState.answers).filter(v => v === true).length;
    const incorrect = appState.totalShown - correct;
    const percentage = appState.totalShown > 0 ? Math.round((correct / appState.totalShown) * 100) : 0;
    scorePercentage.textContent = percentage + "%";
    correctCount.textContent = correct;
    incorrectCount.textContent = incorrect;
    chichvordingBox.style.display = "none";
    celebrationBox.style.display = "none";
    if (percentage < 90) {
        chichvordingBox.style.display = "block";
        scorePercentage.style.color = "#ef4444";
    } else {
        celebrationBox.style.display = "block";
        scorePercentage.style.color = "#10b981";
    }
}

function toggleFlip() {
    if (appState.mode !== "study") return;
    appState.isFlipped = !appState.isFlipped;
    if (appState.isFlipped) {
        flashcard.classList.add("flipped");
    } else {
        flashcard.classList.remove("flipped");
    }
}

function switchMode(newMode) {
    appState.mode = newMode;
    folderMode.classList.remove("active");
    manageMode.classList.remove("active");
    studyMode.classList.remove("active");
    resultsMode.classList.remove("active");
    
    if (newMode === "folder") {
        folderMode.classList.add("active");
        renderFolders();
    } else if (newMode === "manage") {
        manageMode.classList.add("active");
    } else if (newMode === "study") {
        studyMode.classList.add("active");
    } else if (newMode === "results") {
        resultsMode.classList.add("active");
    }
}

// ========== EVENT LISTENERS ==========
function attachEventListeners() {
    if (newFolderBtn) newFolderBtn.addEventListener("click", createNewFolder);
    if (backToMainBtn) backToMainBtn.addEventListener("click", () => switchMode("folder"));
    if (backToFoldersBtn) backToFoldersBtn.addEventListener("click", () => switchMode("folder"));
    if (saveFolderBtn) saveFolderBtn.addEventListener("click", saveCurrentFolder);
    
    if (addCardBtn) addCardBtn.addEventListener("click", addCard);
    if (frontInput) {
        frontInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && backInput) backInput.focus();
        });
    }
    if (backInput) {
        backInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") addCard();
        });
    }
    if (startButton) startButton.addEventListener("click", startStudy);
    if (exitBtn) exitBtn.addEventListener("click", () => switchMode("manage"));
    if (flashcardContainer) flashcardContainer.addEventListener("click", toggleFlip);
    if (incorrectBtn) incorrectBtn.addEventListener("click", () => handleAnswer(false));
    if (correctBtn) correctBtn.addEventListener("click", () => handleAnswer(true));
    
    if (restartButton) {
        restartButton.addEventListener("click", () => {
            const filledCards = appState.cards.filter(card => card.front && card.front.trim() && card.back && card.back.trim());
            if (filledCards.length > 0) {
                appState.studyCards = [...filledCards].sort(() => Math.random() - 0.5);
                appState.currentCardIndex = 0;
                appState.isFlipped = false;
                appState.answers = {};
                appState.totalShown = 0;
                correctBtn.disabled = false;
                incorrectBtn.disabled = false;
                switchMode("study");
                displayCurrentCard();
                updateProgress();
            } else {
                switchMode("manage");
            }
        });
    }
    if (backButton) {
        backButton.addEventListener("click", () => {
            switchMode("manage");
        });
    }
}

// ========== INIT ==========
function initApp() {
    loadFolders();
    if (!appState.cards || appState.cards.length === 0) {
        appState.cards = Array(50).fill(null).map((_, i) => ({ id: i, front: "", back: "" }));
    }
    attachEventListeners();
    renderFolders();
    switchMode("folder");
}

window.addEventListener("DOMContentLoaded", initApp);
