// State
let currentChapter = null;
let currentLevel = null;
let currentCardIndex = 0;
let isCardFlipped = false;
let currentQuizIndex = 0;
let quizItems = [];

// DOM
const screenChapters = document.getElementById('screen-chapters');
const screenLevels = document.getElementById('screen-levels');
const screenAction = document.getElementById('screen-level-action');
const btnBack = document.getElementById('btn-back');
const appTitle = document.getElementById('app-title');

// Theme toggle
const btnTheme = document.getElementById('btn-theme');
btnTheme.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});
const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', savedTheme);

// Navigation
function showScreen(screen) {
  [screenChapters, screenLevels, screenAction].forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
  btnBack.classList.toggle('hidden', screen === screenChapters);
}

btnBack.addEventListener('click', () => {
  if (screenAction.classList.contains('active')) {
    renderLevels(currentChapter);
  } else if (screenLevels.classList.contains('active')) {
    renderChapters();
  }
});

// 1. Render Chapters
function renderChapters() {
  appTitle.textContent = "Грузинский язык";
  const list = document.getElementById('chapters-list');
  list.innerHTML = APP_DATA.map(ch => `
    <button class="menu-item" onclick="onSelectChapter('${ch.id}')">
      <span>${ch.title}</span>
      <span class="badge-count">${ch.levels.length} уровней</span>
    </button>
  `).join('');
  showScreen(screenChapters);
}

window.onSelectChapter = (chapterId) => {
  currentChapter = APP_DATA.find(c => c.id === chapterId);
  renderLevels(currentChapter);
};

// 2. Render Levels
function renderLevels(chapter) {
  appTitle.textContent = chapter.title;
  const list = document.getElementById('levels-list');
  list.innerHTML = chapter.levels.map(lvl => `
    <button class="menu-item" onclick="onSelectLevel('${lvl.id}')">
      <span>${lvl.title}</span>
      <span class="badge-count">${lvl.items.length} фраз</span>
    </button>
  `).join('');
  showScreen(screenLevels);
}

window.onSelectLevel = (levelId) => {
  currentLevel = currentChapter.levels.find(l => l.id === levelId);
  appTitle.textContent = currentLevel.title;
  showScreen(screenAction);
  initLevelAction();
};

// 3. Level Actions (Tabs, List, Flashcards, Quiz)
function initLevelAction() {
  initList();
  initCards();
  initQuiz();
}

// Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// List & Search
const searchInput = document.getElementById('search-input');
const wordsList = document.getElementById('words-list');
const phrasesCount = document.getElementById('phrases-count');

function initList() {
  searchInput.value = '';
  renderList(currentLevel.items);
}

function renderList(items) {
  phrasesCount.textContent = `Показано: ${items.length} из ${currentLevel.items.length}`;
  wordsList.innerHTML = items.map(w => `
    <div class="word-card">
      <div class="word-ka font-geo">${w.ka}</div>
      <div class="word-tr">${w.tr}</div>
      <div class="word-ru">${w.ru}</div>
      ${w.ctx ? `<div class="word-context">${w.ctx}</div>` : ''}
    </div>
  `).join('');
}

searchInput.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase().trim();
  const filtered = currentLevel.items.filter(w => 
    w.ka.toLowerCase().includes(q) || 
    w.ru.toLowerCase().includes(q) || 
    w.tr.toLowerCase().includes(q)
  );
  renderList(filtered);
});

// Flashcards
const flashcard = document.getElementById('flashcard');
const cardRu = document.getElementById('card-ru');
const cardKa = document.getElementById('card-ka');
const cardTr = document.getElementById('card-tr');
const cardEx = document.getElementById('card-ex');
const cardCounter = document.getElementById('card-counter');
const cardFront = flashcard.querySelector('.card-front');
const cardBack = flashcard.querySelector('.card-back');

function initCards() {
  currentCardIndex = 0;
  showCard(0);
}

function showCard(index) {
  isCardFlipped = false;
  cardFront.classList.remove('hidden');
  cardBack.classList.add('hidden');
  
  const item = currentLevel.items[index];
  cardRu.textContent = item.ru;
  cardKa.textContent = item.ka;
  cardTr.textContent = item.tr;
  cardEx.textContent = item.ctx || '';
  cardCounter.textContent = `${index + 1} / ${currentLevel.items.length}`;
}

flashcard.addEventListener('click', () => {
  isCardFlipped = !isCardFlipped;
  cardFront.classList.toggle('hidden', isCardFlipped);
  cardBack.classList.toggle('hidden', !isCardFlipped);
});

document.getElementById('btn-prev-card').addEventListener('click', () => {
  if (currentCardIndex > 0) {
    currentCardIndex--;
    showCard(currentCardIndex);
  }
});
document.getElementById('btn-next-card').addEventListener('click', () => {
  if (currentCardIndex < currentLevel.items.length - 1) {
    currentCardIndex++;
    showCard(currentCardIndex);
  }
});

// Quiz (Translate from RU to KA)
const quizRu = document.getElementById('quiz-ru');
const quizInput = document.getElementById('quiz-input');
const quizCounter = document.getElementById('quiz-counter');
const quizForm = document.getElementById('quiz-form');
const btnCheck = document.getElementById('btn-check');
const btnNextQuiz = document.getElementById('btn-next-quiz');
const quizFeedback = document.getElementById('quiz-feedback');

function initQuiz() {
  // Перемешиваем фразы для теста
  quizItems = [...currentLevel.items].sort(() => Math.random() - 0.5);
  currentQuizIndex = 0;
  loadQuizQuestion(0);
}

function loadQuizQuestion(index) {
  const item = quizItems[index];
  quizRu.textContent = item.ru;
  quizInput.value = '';
  quizInput.disabled = false;
  quizFeedback.className = 'feedback-box hidden';
  quizFeedback.innerHTML = '';
  btnCheck.classList.remove('hidden');
  btnNextQuiz.classList.add('hidden');
  quizCounter.textContent = `${index + 1} / ${quizItems.length}`;
  setTimeout(() => quizInput.focus(), 50);
}

// Нормализация для сравнения (удаляет знаки препинания и пробелы по краям)
function cleanText(text) {
  return text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?!]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

quizForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (btnCheck.classList.contains('hidden')) return;

  const current = quizItems[currentQuizIndex];
  const userAns = cleanText(quizInput.value);
  
  // Допускаем совпадение с ka (или вариантами, если есть слэш '/')
  const correctVariants = current.ka.split('/').map(v => cleanText(v));
  const isMatch = correctVariants.some(v => v === userAns || cleanText(current.ka) === userAns);

  quizFeedback.classList.remove('hidden');
  quizInput.disabled = true;
  btnCheck.classList.add('hidden');
  btnNextQuiz.classList.remove('hidden');

  if (isMatch) {
    quizFeedback.className = 'feedback-box correct';
    quizFeedback.innerHTML = 'Правильно! 🎉';
  } else {
    quizFeedback.className = 'feedback-box wrong';
    quizFeedback.innerHTML = `
      <div>Не совсем так. Правильный ответ:</div>
      <div class="feedback-answer font-geo">${current.ka}</div>
    `;
  }
});

btnNextQuiz.addEventListener('click', () => {
  if (currentQuizIndex < quizItems.length - 1) {
    currentQuizIndex++;
    loadQuizQuestion(currentQuizIndex);
  } else {
    // Конец раунда
    quizRu.textContent = "Раунд завершён! Отличная работа!";
    quizInput.classList.add('hidden');
    btnNextQuiz.classList.add('hidden');
    quizFeedback.className = 'feedback-box correct';
    quizFeedback.innerHTML = `<button class="btn btn-primary" onclick="initQuiz()" style="width:100%">Пройти заново</button>`;
  }
});

// App Start
renderChapters();
