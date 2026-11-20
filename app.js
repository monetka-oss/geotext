// State
let currentChapter = null;
let currentLevel = null;

// Карточки
let currentCardIndex = 0;
let isCardFlipped = false;

// Тест: 4 варианта выбора (Multiple Choice)
let choiceItems = [];
let currentChoiceIndex = 0;
let canPickOption = true;

// Тест: Ввод
let quizItems = [];
let currentQuizIndex = 0;

// DOM
const screenChapters = document.getElementById('screen-chapters');
const screenLevels = document.getElementById('screen-levels');
const screenAction = document.getElementById('screen-level-action');
const btnBack = document.getElementById('btn-back');
const appTitle = document.getElementById('app-title');

// Theme Switcher
const btnTheme = document.getElementById('btn-theme');
btnTheme.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});
const savedTheme = localStorage.getItem('theme') || 'dark';
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

// 1. Экран Глав
function renderChapters() {
  appTitle.textContent = "Грузинский язык";
  const list = document.getElementById('chapters-list');
  list.innerHTML = APP_DATA.map(ch => `
    <button class="menu-item" onclick="onSelectChapter('${ch.id}')">
      <span>${ch.title}</span>
      <span class="badge-count">${ch.levels.length} ур.</span>
    </button>
  `).join('');
  showScreen(screenChapters);
}

window.onSelectChapter = (chapterId) => {
  currentChapter = APP_DATA.find(c => c.id === chapterId);
  renderLevels(currentChapter);
};

// 2. Экран Уровней
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
  initAllModes();
};

function initAllModes() {
  initChoiceQuiz();
  initInputQuiz();
  initCards();
  initList();
}

// Вкладки
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// ==========================================
// 1. ТЕСТ: 4 ВАРИАНТА ВЫБОРА (MULTIPLE CHOICE)
// ==========================================
const choiceRu = document.getElementById('choice-ru');
const choiceOptions = document.getElementById('choice-options');
const choiceCounter = document.getElementById('choice-counter');
const choiceProgressBar = document.getElementById('choice-progress-bar');
const choiceFeedback = document.getElementById('choice-feedback');

function initChoiceQuiz() {
  choiceItems = [...currentLevel.items].sort(() => Math.random() - 0.5);
  currentChoiceIndex = 0;
  loadChoiceQuestion();
}

function loadChoiceQuestion() {
  canPickOption = true;
  choiceFeedback.className = 'feedback-toast hidden';
  choiceFeedback.innerHTML = '';

  const total = choiceItems.length;
  const current = choiceItems[currentChoiceIndex];

  choiceCounter.textContent = `${currentChoiceIndex + 1} из ${total}`;
  choiceProgressBar.style.width = `${((currentChoiceIndex + 1) / total) * 100}%`;
  choiceRu.textContent = current.ru;

  // Собираем 4 варианта (1 правильный + 3 случайных из текущего уровня или всей базы)
  const options = [current];
  const allPool = currentChapter.levels.flatMap(l => l.items).filter(item => item.ka !== current.ka);
  const shuffledPool = allPool.sort(() => Math.random() - 0.5);

  for (let item of shuffledPool) {
    if (options.length >= 4) break;
    if (!options.some(o => o.ka === item.ka)) {
      options.push(item);
    }
  }

  // Перемешиваем кнопки ответов
  options.sort(() => Math.random() - 0.5);

  choiceOptions.innerHTML = options.map((opt, i) => `
    <button class="choice-btn font-geo" data-ka="${encodeURIComponent(opt.ka)}">
      ${opt.ka}
    </button>
  `).join('');

  choiceOptions.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => handleChoiceAnswer(btn, decodeURIComponent(btn.dataset.ka), current.ka));
  });
}

function handleChoiceAnswer(selectedBtn, selectedKa, correctKa) {
  if (!canPickOption) return;
  canPickOption = false;

  const isCorrect = selectedKa === correctKa;

  if (isCorrect) {
    selectedBtn.classList.add('correct');
  } else {
    selectedBtn.classList.add('wrong');
    // Подсвечиваем правильный
    choiceOptions.querySelectorAll('.choice-btn').forEach(b => {
      if (decodeURIComponent(b.dataset.ka) === correctKa) {
        b.classList.add('correct');
      }
    });
  }

  // Переход к следующему через 1.1 секунды
  setTimeout(() => {
    if (currentChoiceIndex < choiceItems.length - 1) {
      currentChoiceIndex++;
      loadChoiceQuestion();
    } else {
      // Завершено
      choiceRu.textContent = "Раунд завершён! Вы отлично справились!";
      choiceOptions.innerHTML = `
        <button class="btn btn-primary glass-btn-primary" onclick="initChoiceQuiz()" style="width:100%">
          Пройти ещё раз
        </button>
      `;
      choiceCounter.textContent = `${choiceItems.length} из ${choiceItems.length}`;
      choiceProgressBar.style.width = `100%`;
    }
  }, 1100);
}

// ==========================================
// 2. ТЕСТ НА ВВОД (INPUT QUIZ)
// ==========================================
const quizRu = document.getElementById('quiz-ru');
const quizInput = document.getElementById('quiz-input');
const quizCounter = document.getElementById('quiz-counter');
const quizProgressBar = document.getElementById('quiz-progress-bar');
const quizForm = document.getElementById('quiz-form');
const btnCheck = document.getElementById('btn-check');
const btnNextQuiz = document.getElementById('btn-next-quiz');
const quizFeedback = document.getElementById('quiz-feedback');

function initInputQuiz() {
  quizItems = [...currentLevel.items].sort(() => Math.random() - 0.5);
  currentQuizIndex = 0;
  loadInputQuestion(0);
}

function loadInputQuestion(index) {
  const item = quizItems[index];
  quizRu.textContent = item.ru;
  quizInput.value = '';
  quizInput.disabled = false;
  quizFeedback.className = 'feedback-toast hidden';
  quizFeedback.innerHTML = '';
  btnCheck.classList.remove('hidden');
  btnNextQuiz.classList.add('hidden');
  quizCounter.textContent = `${index + 1} из ${quizItems.length}`;
  quizProgressBar.style.width = `${((index + 1) / quizItems.length) * 100}%`;
  setTimeout(() => quizInput.focus(), 60);
}

function cleanText(text) {
  return text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?!]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

quizForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (btnCheck.classList.contains('hidden')) return;

  const current = quizItems[currentQuizIndex];
  const userAns = cleanText(quizInput.value);
  const correctVariants = current.ka.split('/').map(v => cleanText(v));
  const isMatch = correctVariants.some(v => v === userAns || cleanText(current.ka) === userAns);

  quizFeedback.classList.remove('hidden');
  quizInput.disabled = true;
  btnCheck.classList.add('hidden');
  btnNextQuiz.classList.remove('hidden');

  if (isMatch) {
    quizFeedback.className = 'feedback-toast correct';
    quizFeedback.innerHTML = 'Правильно! 🎉';
  } else {
    quizFeedback.className = 'feedback-toast wrong';
    quizFeedback.innerHTML = `
      <div>Правильный ответ:</div>
      <div class="font-geo" style="font-size:1.15rem; margin-top:0.25rem;">${current.ka}</div>
    `;
  }
});

btnNextQuiz.addEventListener('click', () => {
  if (currentQuizIndex < quizItems.length - 1) {
    currentQuizIndex++;
    loadInputQuestion(currentQuizIndex);
  } else {
    quizRu.textContent = "Уровень пройден!";
    quizInput.classList.add('hidden');
    btnNextQuiz.classList.add('hidden');
    quizFeedback.className = 'feedback-toast correct';
    quizFeedback.innerHTML = `<button class="btn btn-primary glass-btn-primary" onclick="initInputQuiz()" style="width:100%">Пройти заново</button>`;
  }
});

// ==========================================
// 3. КАРТОЧКИ (FLASHCARDS)
// ==========================================
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

// ==========================================
// 4. СЛОВАРЬ И ПОИСК
// ==========================================
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

// Старт
renderChapters();
