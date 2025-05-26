let sloka = [];
let audio = document.getElementById("sloka-audio");
let currentWord = 0;
let repetitions = 0;
let maxReps = 5;
let timer;
let wordsDOM = [];
let isPaused = false;

// Button references
const playBtn = document.getElementById("play-btn");
const pauseBtn = document.getElementById("pause-btn");
const resumeBtn = document.getElementById("resume-btn");
const stopBtn = document.getElementById("stop-btn");
const resetBtn = document.getElementById("reset-btn");

updateButtonStates("initial");

async function loadSloka() {
  const res = await fetch("sloka.json");
  sloka = await res.json();
  const container = document.getElementById("sloka-text");
  container.innerHTML = "";
  wordsDOM = [];

  sloka.forEach((word, idx) => {
    const span = document.createElement("span");
    span.textContent = word.text;
    span.addEventListener("click", () => jumpTo(idx));
    container.appendChild(span);
    wordsDOM.push(span);
  });
}

function highlightWord(index) {
  wordsDOM.forEach((w, i) =>
    w.classList.toggle("active", i === index)
  );
}

function jumpTo(index) {
  clearInterval(timer);
  currentWord = index;
  audio.currentTime = sloka[index].start;
  isPaused = false;
  audio.play();
  highlightWord(index);
  updateButtonStates("playing");
  monitorAudio();
}

function monitorAudio() {
  timer = setInterval(() => {
    if (isPaused || audio.paused) return;

    const t = audio.currentTime;
    if (currentWord < sloka.length) {
      const word = sloka[currentWord];
      if (t >= word.end) {
        audio.pause();
        clearInterval(timer);
        simulateMicPause(() => {
          if (isPaused) return;
          currentWord++;
          if (currentWord < sloka.length) {
            audio.currentTime = sloka[currentWord].start;
            audio.play();
            highlightWord(currentWord);
            monitorAudio();
          } else {
            finishCycle();
          }
        });
      } else {
        highlightWord(currentWord);
      }
    }
  }, 100);
}

function simulateMicPause(callback) {
  setTimeout(callback, 2000); // Simulated student repeat time
}

function finishCycle() {
  repetitions++;
  updateCoins();
  if (repetitions < maxReps) {
    currentWord = 0;
    audio.currentTime = sloka[0].start;
    audio.play();
    highlightWord(0);
    monitorAudio();
  } else {
    console.log("✨ All repetitions done!");
    updateButtonStates("stopped");
  }
}

function updateCoins() {
  const track = document.getElementById("progress-coins");
  track.innerHTML = "";
  for (let i = 0; i < maxReps; i++) {
    const img = document.createElement("img");
    img.src = "goldCoin.png";
    if (i < repetitions) img.classList.add("collected");
    track.appendChild(img);
  }
}

function updateButtonStates(state) {
  playBtn.disabled   = !(state === "initial");
  pauseBtn.disabled  = !(state === "playing");
  resumeBtn.disabled = !(state === "paused");
  stopBtn.disabled   = !(state === "playing" || state === "paused");
  resetBtn.disabled  = !(state !== "initial");
}

// === BUTTON EVENTS ===

playBtn.addEventListener("click", () => {
  isPaused = false;
  loadSloka().then(() => {
    currentWord = 0;
    repetitions = 0;
    audio.currentTime = sloka[0].start;
    audio.play();
    highlightWord(0);
    updateCoins();
    updateButtonStates("playing");
    monitorAudio();
  });
});

pauseBtn.addEventListener("click", () => {
  isPaused = true;
  audio.pause();
  clearInterval(timer);
  updateButtonStates("paused");
});

resumeBtn.addEventListener("click", () => {
  isPaused = false;
  audio.play();
  updateButtonStates("playing");
  monitorAudio();
});

stopBtn.addEventListener("click", () => {
  isPaused = false;
  audio.pause();
  audio.currentTime = 0;
  currentWord = 0;
  highlightWord(-1);
  clearInterval(timer);
  updateButtonStates("stopped");
});

resetBtn.addEventListener("click", () => {
  isPaused = false;
  audio.pause();
  audio.currentTime = 0;
  currentWord = 0;
  repetitions = 0;
  highlightWord(-1);
  updateCoins();
  clearInterval(timer);
  updateButtonStates("initial");
});
