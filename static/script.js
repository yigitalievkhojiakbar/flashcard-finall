// Telegram WebApp init
const tg = window.Telegram.WebApp;
tg.expand();
const userId = tg.initDataUnsafe?.user?.id || "default";

// ========== PAPKALAR TIZIMI ==========
let folders = [];
let currentFolder = null;

// ========== APP STATE ==========
let appState = {
    cards: [],
    mode: "folder",
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

// ========== PAPKALAR UI ==========
function renderFolders() {
    if (!foldersGrid) return;
    foldersGrid.innerHTML = "";
    
    if (folders.length === 0) {
        const emptyMsg = document.createElement("div");
        emptyMsg.className = "empty-message";
        emptyMsg.textContent = "There is no folder yet.";
        foldersGrid.appendChild(emptyMsg);
        return;
    }
    
    folders.forEach(folder => {
        const folderEl = document.createElement("div");
        folderEl.className = "folder-item";
        
        const filled = folder.cards.filter(c => c.front && c.front.trim()).length;
        
        folderEl.innerHTML = `
            <div class="folder-icon">📁</div>
            <div class="folder-name">${escapeHtml(folder.name)}</div>
            <div class="folder-stats">${filled}/50 kartalar</div>
            <div class="folder-actions">
                <button class="folder-open" data-id="${folder.id}">📖 Open</button>
                <button class="folder-delete" data-id="${folder.id}">🗑️ Delete</button>
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
    const folderName = prompt("Enter the name of the new folder:", "My words");
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
    
    currentFolder = folder;
    appState.cards = JSON.parse(JSON.stringify(folder.cards));
    if (currentFolderName) currentFolderName.textContent = folder.name;
    
    renderCards();
    updateStats();
    switchMode("manage");
}

function deleteFolder(folderId) {
    if (confirm("Do you want to delete this folder? All cards will be lost!")) {
        folders = folders.filter(f => f.id !== folderId);
        saveFolders();
        renderFolders();
        if (currentFolder && currentFolder.id === folderId) {
            currentFolder = null;
        }
    }
}

function saveCurrentFolder() {
    if (!currentFolder) {
        const folderName = prompt("Enter the folder name:", "New folder");
        if (!folderName || folderName.trim() === "") return;
        
        currentFolder = {
            id: Date.now().toString(),
            name: folderName.trim(),
            cards: JSON.parse(JSON.stringify(appState.cards))
        };
        folders.push(currentFolder);
        saveFolders();
        if (currentFolderName) currentFolderName.textContent = currentFolder.name;
        alert("✅ File saved!");
    } else {
        currentFolder.cards = JSON.parse(JSON.stringify(appState.cards));
        const index = folders.findIndex(f => f.id === currentFolder.id);
        if (index !== -1) {
            folders[index] = { ...currentFolder };
        }
        saveFolders();
        alert("✅ File updated!");
    }
    renderFolders();
}

// ========== KARTALAR ==========
function renderCards() {
    if (!cardsGrid) return;
    cardsGrid.innerHTML = "";
    appState.cards.forEach((card, idx) => {
        const cardEl = document.createElement("div");
        const isFilled = card.front && card.front.trim();
        cardEl.className = "card-item " + (isFilled ? "filled" : "empty");
        
        const cardNumber = document.createElement("div");
        cardNumber.className = "card-number";
        cardNumber.textContent = "#" + (idx + 1);
        cardEl.appendChild(cardNumber);
        
        if (isFilled) {
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
            deleteBtn.textContent = "🗑️ Delete";
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                card.front = "";
                card.back = "";
                renderCards();
                updateStats();
            };
            cardEl.appendChild(deleteBtn);
        }
        cardsGrid.appendChild(cardEl);
    });
}

function updateStats() {
    const filled = appState.cards.filter(c => c.front && c.front.trim() && c.back && c.back.trim()).length;
    if (filledCount) filledCount.textContent = filled;
    if (emptyCount) emptyCount.textContent = 50 - filled;
    if (startButton) startButton.disabled = (filled === 0);
}

function addCard() {
    const front = frontInput.value.trim();
    const back = backInput.value.trim();
    if (!front || !back) {
        alert("Please, fill both sides!");
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
    } else {
        alert("All cards have been filled!");
    }
}

// ========== O'RGANISH (TO'G'IRILGAN) ==========
function startStudy() {
    const filledCards = appState.cards.filter(card => card.front && card.front.trim() && card.back && card.back.trim());
    if (filledCards.length === 0) {
        alert("Add at least one card!");
        return;
    }
    appState.studyCards = [...filledCards].sort(() => Math.random() - 0.5);
    appState.currentCardIndex = 0;
    appState.isFlipped = false;
    appState.answers = {};
    appState.totalShown = 0;
    
    if (correctBtn) correctBtn.disabled = false;
    if (incorrectBtn) incorrectBtn.disabled = false;
    
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
    if (flashcardFront) flashcardFront.textContent = card.front;
    if (flashcardBack) flashcardBack.textContent = card.back;
    
    // HAR DOIM KARTANI OLD TOMONI BILAN KO'RSAT
    appState.isFlipped = false;
    if (flashcard) flashcard.classList.remove("flipped");
}

function updateProgress() {
    const total = appState.studyCards.length;
    const current = appState.currentCardIndex + 1;
    if (progressCounter) progressCounter.textContent = current + " / " + total;
    if (progressFill) progressFill.style.width = ((current / total) * 100) + "%";
}

function handleAnswer(isCorrect) {
    if (correctBtn) correctBtn.disabled = true;
    if (incorrectBtn) incorrectBtn.disabled = true;
    
    const cardId = appState.studyCards[appState.currentCardIndex].id;
    appState.answers[cardId] = isCorrect;
    appState.totalShown++;
    
    // KARTANI OLD TOMONIGA QAYTARISH
    appState.isFlipped = false;
    if (flashcard) flashcard.classList.remove("flipped");
    
    setTimeout(() => {
        if (appState.currentCardIndex < appState.studyCards.length - 1) {
            appState.currentCardIndex++;
            displayCurrentCard(); // Bu funksiya old tomonni ko'rsatadi
            updateProgress();
            if (correctBtn) correctBtn.disabled = false;
            if (incorrectBtn) incorrectBtn.disabled = false;
        } else {
            finishStudy();
        }
    }, 500);
}

function finishStudy() {
    if (correctBtn) correctBtn.disabled = false;
    if (incorrectBtn) incorrectBtn.disabled = false;
    switchMode("results");
    displayResults();
}

function displayResults() {
    const correct = Object.values(appState.answers).filter(v => v === true).length;
    const incorrect = appState.totalShown - correct;
    const percentage = appState.totalShown > 0 ? Math.round((correct / appState.totalShown) * 100) : 0;
    
    if (scorePercentage) scorePercentage.textContent = percentage + "%";
    if (correctCount) correctCount.textContent = correct;
    if (incorrectCount) incorrectCount.textContent = incorrect;
    
    if (chichvordingBox) chichvordingBox.style.display = "none";
    if (celebrationBox) celebrationBox.style.display = "none";
    
    if (percentage < 90) {
        if (chichvordingBox) chichvordingBox.style.display = "block";
        if (scorePercentage) scorePercentage.style.color = "#ef4444";
    } else {
        if (celebrationBox) celebrationBox.style.display = "block";
        if (scorePercentage) scorePercentage.style.color = "#10b981";
    }
}

function toggleFlip() {
    if (appState.mode !== "study") return;
    if (appState.currentCardIndex < appState.studyCards.length) {
        appState.isFlipped = !appState.isFlipped;
        if (appState.isFlipped) {
            if (flashcard) flashcard.classList.add("flipped");
        } else {
            if (flashcard) flashcard.classList.remove("flipped");
        }
    }
}

function switchMode(newMode) {
    appState.mode = newMode;
    if (folderMode) folderMode.classList.remove("active");
    if (manageMode) manageMode.classList.remove("active");
    if (studyMode) studyMode.classList.remove("active");
    if (resultsMode) resultsMode.classList.remove("active");
    
    if (newMode === "folder") {
        if (folderMode) folderMode.classList.add("active");
        renderFolders();
    } else if (newMode === "manage") {
        if (manageMode) manageMode.classList.add("active");
    } else if (newMode === "study") {
        if (studyMode) studyMode.classList.add("active");
    } else if (newMode === "results") {
        if (resultsMode) resultsMode.classList.add("active");
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
                if (correctBtn) correctBtn.disabled = false;
                if (incorrectBtn) incorrectBtn.disabled = false;
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
    switchMode("folder");
}

window.addEventListener("DOMContentLoaded", initApp);
