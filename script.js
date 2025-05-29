let sloka = [];
let audio;
let currentWord = 0;
let slokaData = [];
let currentLessonIndex = 0;
let currentMode = "learn"; // "learn", "recite", "meaning"

let repetitions = 0;
const maxReps = 5;
let timer;
let wordsDOM = [];
let isWaitingForStudent = false;

document.addEventListener("DOMContentLoaded", () => {
  audio = document.getElementById("sloka-audio");

  // Mode switching
  document.querySelectorAll(".mode-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      currentMode = btn.dataset.mode;
      resetAll();
      loadLesson(currentLessonIndex);
      highlightModeButton();
    });
  });

  // Control buttons
  document.getElementById("play-btn").addEventListener("click", onPlay);
  document.getElementById("stop-btn").addEventListener("click", onStop);

  // Lesson navigation
  document.getElementById("prev-btn").addEventListener("click", () => {
    if (currentLessonIndex > 0) {
      currentLessonIndex--;
      resetAll();
      loadLesson(currentLessonIndex);
    }
  });

  document.getElementById("next-btn").addEventListener("click", () => {
    if (currentLessonIndex < slokaData.length - 1) {
      currentLessonIndex++;
      resetAll();
      loadLesson(currentLessonIndex);
    }
  });

  // Load lesson data
  fetch("sloka.json")
    .then(res => res.json())
    .then(data => {
      slokaData = data.lessons;
      loadLesson(0);
    });

  setControls("initial");
});

function setControls(state) {
  const playBtn = document.getElementById("play-btn");
  const stopBtn = document.getElementById("stop-btn");

  if (currentMode === "meaning") {
    playBtn.disabled = true;
    stopBtn.disabled = true;
  } else {
    playBtn.disabled = state !== "initial";
    stopBtn.disabled = state === "initial";
  }
}

function highlightModeButton() {
  document.querySelectorAll(".mode-btn").forEach(btn => {
    btn.classList.toggle("active-mode", btn.dataset.mode === currentMode);
  });
}

function loadLesson(index) {
  const lesson = slokaData[index];
  sloka = lesson.words;

  if (currentMode === "learn") audio.src = lesson.learnAudio;
  else if (currentMode === "recite") audio.src = lesson.reciteAudio;
  else if (currentMode === "meaning") audio.src = lesson.meaningAudio;

  const container = document.getElementById("sloka-text");
  container.innerHTML = "";
  wordsDOM = [];

  if (currentMode === "meaning") {
    container.textContent = lesson.meaningText;
  } else {
    sloka.forEach((word, idx) => {
  const span = document.createElement("span");
  span.textContent = word.text;
  if (currentMode !== "recite") {
    span.addEventListener("click", () => jumpTo(idx));
  }
  container.appendChild(span);
  wordsDOM.push(span);
});
  }

  document.getElementById("lesson-title").textContent = lesson.name;
  setControls("initial");
  updateRepetitionTrack();
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
  audio.play();
  setControls("playing");
  highlightWord(index);
  monitorAudio();
}

function simulateStudentRepeat(duration, callback) {
  isWaitingForStudent = true;
  setTimeout(() => {
    isWaitingForStudent = false;
    callback();
  }, duration * 1000);
}

function monitorAudio() {
  clearInterval(timer);
  timer = setInterval(() => {
    if (audio.paused || isWaitingForStudent) return;

    const t = audio.currentTime;
    if (currentWord < sloka.length) {
      const word = sloka[currentWord];
      if (t >= word.end) {
        audio.pause();
        clearInterval(timer);
        simulateStudentRepeat(word.end - word.start, () => {
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

function finishCycle() {
  repetitions++;
  updateRepetitionTrack();

  confetti({
    particleCount: 100,
    spread: 60,
    origin: { y: 0.6 }
  });

  if (repetitions < maxReps) {
    currentWord = 0;
    audio.currentTime = sloka[0].start;
    highlightWord(0);
    audio.play();
    monitorAudio();
  } else {
    setControls("initial");
  }
}

function updateRepetitionTrack() {
  const track = document.getElementById("repetition-track");
  track.innerHTML = "";

  for (let i = 0; i < maxReps; i++) {
    const circle = document.createElement("div");
    circle.classList.add("repetition-circle");
    if (i < repetitions) circle.classList.add("completed");
    circle.textContent = i + 1;
    track.appendChild(circle);

    if (i < maxReps - 1) {
      const line = document.createElement("div");
      line.classList.add("repetition-line");
      track.appendChild(line);
    }
  }
}

function resetAll() {
  audio.pause();
  clearInterval(timer);
  isWaitingForStudent = false;
  currentWord = 0;
  repetitions = 0;
  highlightWord(-1);
  updateRepetitionTrack();
  setControls("initial");
}

function monitorReciteAudio() {
  clearInterval(timer);
  timer = setInterval(() => {
    const t = audio.currentTime;
    if (currentWord < sloka.length) {
      const word = sloka[currentWord];
      if (t >= word.end) {
        currentWord++;
        if (currentWord < sloka.length) {
          audio.currentTime = sloka[currentWord].start;
        } else {
          clearInterval(timer);
          finishCycle();
        }
      }
    }
  }, 100);
}

function onPlay() {
  if (!sloka.length || currentMode === "meaning") return;

  currentWord = 0;
  repetitions = 0;
  highlightWord(-1); // No highlight for recite or meaning
  updateRepetitionTrack();

  audio.currentTime = sloka[0]?.start || 0;

  if (currentMode === "recite") {
    audio.play();
  } else {
    highlightWord(0);
    audio.play();
    monitorAudio(); // normal logic for learn mode
  }

  setControls("playing");
}


function onStop() {
  clearInterval(timer);
  audio.pause();
  audio.currentTime = 0;
  currentWord = 0;
  repetitions = 0;
  highlightWord(-1);
  updateRepetitionTrack();
  setControls("initial");
}
