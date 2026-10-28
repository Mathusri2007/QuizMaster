// ---------- Quiz data ----------
// Add or edit questions here. `answer` is the index of the correct option.
const QUESTIONS = [
  {
    question: "Which keyword declares a block-scoped variable that can be reassigned?",
    options: ["var", "let", "const", "static"],
    answer: 1,
  },
  {
    question: "What does typeof null return?",
    options: ['"null"', '"undefined"', '"object"', '"number"'],
    answer: 2,
  },
  {
    question: "Which method adds an element to the end of an array?",
    options: ["push()", "pop()", "shift()", "unshift()"],
    answer: 0,
  },
  {
    question: "What is the result of 2 + '2' in JavaScript?",
    options: ["4", '"22"', "NaN", "TypeError"],
    answer: 1,
  },
  {
    question: "Which operator checks both value and type equality?",
    options: ["==", "=", "===", "!="],
    answer: 2,
  },
  {
    question: "What does Array.prototype.map() return?",
    options: ["The original array", "A new array", "A single value", "undefined"],
    answer: 1,
  },
  {
    question: "Which of these is NOT a primitive type in JavaScript?",
    options: ["string", "boolean", "symbol", "object"],
    answer: 3,
  },
  {
    question: "What does JSON.parse() do?",
    options: [
      "Converts an object to a JSON string",
      "Converts a JSON string to an object",
      "Validates a JSON file on disk",
      "Sends JSON to a server",
    ],
    answer: 1,
  },
  {
    question: "Which function runs code once after a delay?",
    options: ["setInterval()", "setTimeout()", "requestDelay()", "wait()"],
    answer: 1,
  },
  {
    question: "What does the 'this' keyword refer to inside an arrow function?",
    options: [
      "The arrow function itself",
      "The global window only",
      "The enclosing lexical scope's this",
      "Always undefined",
    ],
    answer: 2,
  },
];

const SECONDS_PER_QUESTION = 20;
const STORAGE_KEY = "online-quiz-app:best";

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const screens = { start: $("start"), quiz: $("quiz"), result: $("result") };

const el = {
  best: $("best"),
  bestResult: $("bestResult"),
  counter: $("counter"),
  time: $("time"),
  timeFill: $("timeFill"),
  question: $("question"),
  options: $("options"),
  feedback: $("feedback"),
  nextBtn: $("nextBtn"),
  scoreNum: $("scoreNum"),
  scoreTotal: $("scoreTotal"),
  scoreMsg: $("scoreMsg"),
  review: $("review"),
};

// ---------- State ----------
let order = [];        // shuffled question order
let index = 0;         // current position in `order`
let score = 0;
let answers = [];      // { picked: number|null, correct: boolean } per question
let timeLeft = 0;
let timerId = null;
let locked = false;    // true once the current question is answered or timed out

// ---------- Helpers ----------
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function show(name) {
  Object.entries(screens).forEach(([key, node]) => { node.hidden = key !== name; });
}

function getBest() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === null ? null : Number(v);
  } catch (e) {
    return null;
  }
}

function saveBest(value) {
  try { localStorage.setItem(STORAGE_KEY, String(value)); } catch (e) { /* ignore */ }
}

function renderBest(node) {
  const best = getBest();
  node.textContent = best === null ? "" : `Best score: ${best} / ${QUESTIONS.length}`;
}

// ---------- Timer ----------
function startTimer() {
  stopTimer();
  timeLeft = SECONDS_PER_QUESTION;
  updateTimerUI(true);
  timerId = setInterval(() => {
    timeLeft -= 1;
    updateTimerUI(false);
    if (timeLeft <= 0) {
      stopTimer();
      handleTimeout();
    }
  }, 1000);
}

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

function updateTimerUI(reset) {
  el.time.textContent = `${Math.max(timeLeft, 0)}s`;
  const low = timeLeft <= 5;
  el.time.classList.toggle("low", low);
  el.timeFill.classList.toggle("low", low);

  if (reset) {
    // Jump back to full width without animating, then let it shrink each second.
    el.timeFill.style.transition = "none";
    el.timeFill.style.width = "100%";
    void el.timeFill.offsetWidth; // force reflow
    el.timeFill.style.transition = "";
  } else {
    el.timeFill.style.width = `${(Math.max(timeLeft, 0) / SECONDS_PER_QUESTION) * 100}%`;
  }
}

// ---------- Quiz flow ----------
function startQuiz() {
  order = shuffle(QUESTIONS.map((_, i) => i));
  index = 0;
  score = 0;
  answers = [];
  show("quiz");
  renderQuestion();
}

function renderQuestion() {
  const q = QUESTIONS[order[index]];
  locked = false;

  el.counter.textContent = `Question ${index + 1} of ${QUESTIONS.length}`;
  el.question.textContent = q.question;
  el.feedback.textContent = "";
  el.feedback.className = "feedback";
  el.nextBtn.disabled = true;
  el.nextBtn.textContent = index === QUESTIONS.length - 1 ? "See results" : "Next question";

  el.options.innerHTML = "";
  q.options.forEach((text, i) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option-btn";
    btn.dataset.index = String(i);

    const key = document.createElement("span");
    key.className = "key";
    key.textContent = `${i + 1}.`;
    const label = document.createElement("span");
    label.textContent = text;

    btn.append(key, label);
    btn.addEventListener("click", () => selectOption(i));
    li.appendChild(btn);
    el.options.appendChild(li);
  });

  startTimer();
}

function revealAnswer(picked) {
  const q = QUESTIONS[order[index]];
  [...el.options.querySelectorAll(".option-btn")].forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.answer) btn.classList.add("correct");
    else if (i === picked) btn.classList.add("wrong");
  });
  el.nextBtn.disabled = false;
  el.nextBtn.focus();
}

function selectOption(i) {
  if (locked) return;
  locked = true;
  stopTimer();

  const q = QUESTIONS[order[index]];
  const correct = i === q.answer;
  if (correct) score += 1;
  answers.push({ picked: i, correct });

  el.feedback.textContent = correct ? "Correct!" : "Incorrect.";
  el.feedback.classList.add(correct ? "good" : "bad");
  revealAnswer(i);
}

function handleTimeout() {
  if (locked) return;
  locked = true;
  answers.push({ picked: null, correct: false });
  el.feedback.textContent = "Time's up.";
  el.feedback.classList.add("timeout");
  revealAnswer(null);
}

function nextQuestion() {
  if (!locked) return;
  if (index < QUESTIONS.length - 1) {
    index += 1;
    renderQuestion();
  } else {
    showResult();
  }
}

// ---------- Result ----------
function showResult() {
  stopTimer();
  const total = QUESTIONS.length;
  const percent = Math.round((score / total) * 100);

  const best = getBest();
  const isNewBest = best === null || score > best;
  if (isNewBest) saveBest(score);

  el.scoreNum.textContent = String(score);
  el.scoreTotal.textContent = String(total);

  let msg;
  if (percent === 100) msg = "Perfect score!";
  else if (percent >= 70) msg = `${percent}% - well done.`;
  else if (percent >= 40) msg = `${percent}% - decent start. Review the answers below.`;
  else msg = `${percent}% - keep practising and try again.`;
  el.scoreMsg.textContent = msg;

  el.bestResult.textContent = isNewBest ? "New best score!" : `Best score: ${best} / ${total}`;

  // Review list
  el.review.innerHTML = "";
  order.forEach((qi, pos) => {
    const q = QUESTIONS[qi];
    const a = answers[pos];
    const li = document.createElement("li");

    const title = document.createElement("div");
    title.className = "q";
    title.textContent = q.question;

    const yours = document.createElement("div");
    yours.className = a.correct ? "ok" : "no";
    yours.textContent = a.picked === null
      ? "Your answer: no answer (time ran out)"
      : `Your answer: ${q.options[a.picked]}`;

    li.append(title, yours);

    if (!a.correct) {
      const right = document.createElement("div");
      right.textContent = `Correct answer: ${q.options[q.answer]}`;
      li.appendChild(right);
    }
    el.review.appendChild(li);
  });

  show("result");
}

// ---------- Events ----------
$("startBtn").addEventListener("click", startQuiz);
$("restartBtn").addEventListener("click", () => {
  renderBest(el.best);
  show("start");
});
el.nextBtn.addEventListener("click", nextQuestion);

// Keyboard: 1-4 to answer, Enter to continue
document.addEventListener("keydown", (e) => {
  if (screens.quiz.hidden) return;
  const n = Number(e.key);
  if (!locked && n >= 1 && n <= QUESTIONS[order[index]].options.length) {
    selectOption(n - 1);
  }
});

renderBest(el.best);
