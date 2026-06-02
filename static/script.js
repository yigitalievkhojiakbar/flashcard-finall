// Telegram WebApp init
const tg = window.Telegram.WebApp;
tg.expand();
const userId = tg.initDataUnsafe?.user?.id || "default";

// App State
let appState = {
    cards: [],
    mode: "manage",
    currentCardIndex: 0,
    studyCards: [],
    isFlipped: false,
    answers: {},
    totalShown: 0
};

// DOM Elements
const manageMode = document.getElementById("manageMode");
const studyMode = document.getElementById("studyMode");
const resultsMode = document.getElementById("resultsMode");
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

// Initialize
function initApp() {
    loadCards();
    renderCards();
    attachEventListeners();
    updateStats();
}

function loadCards() {
    const saved = localStorage.getItem("flashcards_" + userId);
    if (saved) {
        try {
            appState.cards = JSON.parse(saved);
        } catch (e) {
            createEmptyCards();
        }
    } else {
        createEmptyCards();
    }
}

function createEmptyCards() {
    appState.cards = Array(50).fill(null).map((_, i) => ({
        id: i,
        front: "",
        back: ""
    }));
}

function saveCards() {
    localStorage.setItem("flashcards_" + userId, JSON.stringify(appState.cards));
}

function addCard() {
    const front = frontInput.value.trim();
    const back = backInput.value.trim();
    if (!front || !back) {
        alert("Iltimos, ikkala maydonni to'ldiring!");
        return;
    }
    const emptyCard = appState.cards.find(c => !c.front.trim() && !c.back.trim());
    if (emptyCard) {
        emptyCard.front = front;
        emptyCard.back = back;
        saveCards();
        renderCards();
        updateStats();
        frontInput.value = "";
        backInput.value = "";
        frontInput.focus();
    } else {
        alert("Barcha kartalar to'ldirilgan!");
    }
}

function deleteCard(cardId) {
    const card = appState.cards.find(c => c.id === cardId);
    if (card) {
        card.front = "";
        card.back = "";
        saveCards();
        renderCards();
        updateStats();
    }
}

function renderCards() {
    if (!cardsGrid) return;
    cardsGrid.innerHTML = "";
    appState.cards.forEach((card, idx) => {
        const cardEl = document.createElement("div");
        const cardClass = card.front.trim() ? "filled" : "empty";
        cardEl.className = "card-item " + cardClass;
        const cardNumber = document.createElement("div");
        cardNumber.className = "card-number";
        cardNumber.textContent = "#" + (idx + 1);
        cardEl.appendChild(cardNumber);
        if (card.front.trim()) {
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
                deleteCard(card.id);
            };
            cardEl.appendChild(deleteBtn);
        }
        cardsGrid.appendChild(cardEl);
    });
}

function updateStats() {
    const filled = appState.cards.filter(c => c.front.trim() && c.back.trim()).length;
    filledCount.textContent = filled;
    emptyCount.textContent = 50 - filled;
    startButton.disabled = (filled === 0);
}

// Start Study - Tuzatilgan
function startStudy() {
    const filledCards = appState.cards.filter(card => card.front.trim() && card.back.trim());
    if (filledCards.length === 0) {
        alert("Kamida bir kartani qo'shing!");
        return;
    }
    appState.studyCards = [...filledCards].sort(() => Math.random() - 0.5);
    appState.currentCardIndex = 0;
    appState.isFlipped = false;
    appState.answers = {};
    appState.totalShown = 0;
    
    // Tugmalarni faollashtirish
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

// Finish Study - Tuzatilgan
function finishStudy() {
    correctBtn.disabled = false;
    incorrectBtn.disabled = false;
    correctBtn.classList.remove("clicked");
    incorrectBtn.classList.remove("clicked");
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

function switchMode(newMode) {
    appState.mode = newMode;
    manageMode.classList.remove("active");
    studyMode.classList.remove("active");
    resultsMode.classList.remove("active");
    if (newMode === "manage") {
        manageMode.classList.add("active");
    } else if (newMode === "study") {
        studyMode.classList.add("active");
    } else if (newMode === "results") {
        resultsMode.classList.add("active");
    }
}

function toggleFlip() {
    appState.isFlipped = !appState.isFlipped;
    if (appState.isFlipped) {
        flashcard.classList.add("flipped");
    } else {
        flashcard.classList.remove("flipped");
    }
}

function attachEventListeners() {
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
    
    // Tuzatilgan restart va back buttonlar
    if (restartButton) {
        restartButton.addEventListener("click", () => {
            appState.studyCards = [];
            appState.currentCardIndex = 0;
            appState.answers = {};
            appState.totalShown = 0;
            correctBtn.disabled = false;
            incorrectBtn.disabled = false;
            switchMode("manage");
        });
    }
    if (backButton) {
        backButton.addEventListener("click", () => {
            switchMode("manage");
        });
    }
}

window.addEventListener("DOMContentLoaded", initApp);
