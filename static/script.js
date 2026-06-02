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

// Initialize App
function initApp() {
    loadCards();
    renderCards();
    attachEventListeners();
    updateStats();
}

// Load Cards from localStorage
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

// Create 50 Empty Cards
function createEmptyCards() {
    appState.cards = Array(50).fill(null).map((_, i) => ({
        id: i,
        front: "",
        back: ""
    }));
}

// Save Cards to localStorage
function saveCards() {
    localStorage.setItem("flashcards_" + userId, JSON.stringify(appState.cards));
}

// Add New Card
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

// Delete Card
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

// Render Cards Grid
function renderCards() {
    if (!cardsGrid) {
        console.error("cardsGrid element not found!");
        return;
    }
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

// Update Stats
function updateStats() {
    const filled = appState.cards.filter(c => c.front.trim() && c.back.trim()).length;
    filledCount.textContent = filled;
    emptyCount.textContent = 50 - filled;
    
    startButton.disabled = (filled === 0);
}

// Start Study
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
    
    switchMode("study");
    displayCurrentCard();
    updateProgress();
}

// Display Current Card
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

// Update Progress
function updateProgress() {
    const total = appState.studyCards.length;
    const current = appState.currentCardIndex + 1;
    progressCounter.textContent = current + " / " + total;
    progressFill.style.width = ((current / total) * 100) + "%";
}

// Handle Answer
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

// Finish Study
function finishStudy() {
    switchMode("results");
    displayResults();
}

// Display Results
function displayResults() {
    const correct = Object.values(appState.answers).filter(v => v === true).length;
    const incorrect = appState.totalShown - correct;
    const percentage = appState.totalShown > 0 
        ? Math.round((correct / appState.totalShown) * 100) 
        : 0;

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

// Switch Mode
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

// Toggle Flip
function toggleFlip() {
    appState.isFlipped = !appState.isFlipped;
    if (appState.isFlipped) {
        flashcard.classList.add("flipped");
    } else {
        flashcard.classList.remove("flipped");
    }
}

// Attach Event Listeners
function attachEventListeners() {
    addCardBtn.addEventListener("click", addCard);
    
    frontInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            backInput.focus();
        }
    });
    
    backInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            addCard();
        }
    });

    startButton.addEventListener("click", startStudy);
    exitBtn.addEventListener("click", () => switchMode("manage"));
    flashcardContainer.addEventListener("click", toggleFlip);
    
    incorrectBtn.addEventListener("click", () => handleAnswer(false));
    correctBtn.addEventListener("click", () => handleAnswer(true));

    restartButton.addEventListener("click", () => switchMode("manage"));
    backButton.addEventListener("click", () => switchMode("manage"));
}

// Start App
window.addEventListener("DOMContentLoaded", initApp);
