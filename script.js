let sloka = [];
let audio;
let currentWord = 0;
let slokaData = [];
let currentLessonIndex = 0;
let currentMode = "learn";
let studentTimeout = null;
let currentLang = "english";

let repetitions = 0;
const maxReps = 5;
let timer;
let wordsDOM = [];
let isWaitingForStudent = false;
let isStopped = false;

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

  

  // Lesson selector dropdown
  document.getElementById("lesson-select").addEventListener("change", (e) => {
    const selectedLesson = e.target.value;

    const fileMap = {
      "slokashri2": "lessons/slokashri2.json",
      "suprabhatham": "lessons/suprabhatham.json",
      "baala-mukunda": "lessons/baalamukundaashtakam.json",
      "guruvaashtakam": "lessons/guruvaashtakam.json"
    };

    const filePath = fileMap[selectedLesson];

    if (filePath) {
      fetch(filePath)
        .then(res => res.json())
        .then(data => {
          slokaData = data.lessons;
          currentLessonIndex = 0;
          resetAll();
          loadLesson(0);
        })
        .catch(err => {
          console.error("Error loading lesson:", err);
        });
    }
  });

  // Default load
  fetch("lessons/suprabhatham.json")
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

// function loadLesson(index) {
//   const lesson = slokaData[index];
//   sloka = lesson.words;

//   if (currentMode === "learn") audio.src = lesson.learnAudio;
//   else if (currentMode === "recite") audio.src = lesson.reciteAudio;
//   else if (currentMode === "meaning") audio.src = lesson.meaningAudio;

//   const container = document.getElementById("sloka-text");
//   container.innerHTML = "";
//   wordsDOM = [];

//   const displayName = currentLang === "english" ? lesson.name : lesson?.lang?.[currentLang]?.name || lesson.name;
//   const displayMeaning = currentLang === "english" ? lesson.meaningText : lesson?.lang?.[currentLang]?.meaningText || lesson.meaningText;
//   const displayWords = currentLang === "english" ? lesson.words.map(w => w.text) : (lesson?.lang?.[currentLang]?.words || []).map(w => w.text);

//   if (currentMode === "meaning") {
//     container.textContent = displayMeaning;
//   } else {
//     sloka.forEach((word, idx) => {
//       const span = document.createElement("span");
//       span.textContent = displayWords[idx] || word.text;
//       if (currentMode !== "recite") {
//         span.addEventListener("click", () => jumpTo(idx));
//       }
//       container.appendChild(span);
//       wordsDOM.push(span);
//     });
//   }

//   document.getElementById("lesson-title").textContent = displayName;
//   setControls("initial");
//   updateRepetitionTrack();
// }
function loadLesson(index) {
  const lesson = slokaData[index];
  sloka = lesson.words;

  // Set the right audio file
  if (currentMode === "learn") audio.src = lesson.learnAudio;
  else if (currentMode === "recite") audio.src = lesson.reciteAudio;
  else if (currentMode === "meaning") audio.src = lesson.meaningAudio;

  const container = document.getElementById("sloka-text");
  container.innerHTML = "";
  wordsDOM = [];

  const displayName = currentLang === "english" ? lesson.name : lesson?.lang?.[currentLang]?.name || lesson.name;
  const displayMeaning = currentLang === "english" ? lesson.meaningText : lesson?.lang?.[currentLang]?.meaningText || lesson.meaningText;
  const displayWords = currentLang === "english" ? lesson.words.map(w => w.text) : (lesson?.lang?.[currentLang]?.words || []).map(w => w.text);

  if (currentMode === "meaning") {
    container.textContent = displayMeaning;
  } else {
    sloka.forEach((word, idx) => {
      const wrapper = document.createElement("span");
      wrapper.className = "word-wrapper";

      const wordSpan = document.createElement("span");
      wordSpan.textContent = displayWords[idx] || word.text;

      if (currentMode !== "recite") {
        wordSpan.addEventListener("click", () => jumpTo(idx));
      }

      wrapper.appendChild(wordSpan);

      // Optional tooltip, only if meaning is defined
      const meaningText = word.meaning || lesson?.lang?.[currentLang]?.words?.[idx]?.meaning;
      if (meaningText) {
        const tooltip = document.createElement("div");
        tooltip.className = "meaning-tooltip";
        tooltip.textContent = meaningText;
        wrapper.appendChild(tooltip);
      }

      container.appendChild(wrapper);
      wordsDOM.push(wrapper);
    });
  }

  document.getElementById("lesson-title").textContent = displayName;
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
  studentTimeout = setTimeout(() => {
    if (isStopped) return;
    isWaitingForStudent = false;
    callback();
  }, duration * 1000);
}

function monitorAudio() {
  clearInterval(timer);
  timer = setInterval(() => {
    if (isStopped || audio.paused || isWaitingForStudent) return;

    const t = audio.currentTime;
    if (currentWord < sloka.length) {
      const word = sloka[currentWord];
      if (t >= word.end) {
        audio.pause();
        clearInterval(timer);
        simulateStudentRepeat(word.end - word.start, () => {
          if (isStopped) return;
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
    particleCount: 150,
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
  isStopped = true;
  currentWord = 0;
  repetitions = 0;

  if (studentTimeout) {
    clearTimeout(studentTimeout);
    studentTimeout = null;
  }

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

  isStopped = false;
  currentWord = 0;
  repetitions = 0;
  highlightWord(-1);
  updateRepetitionTrack();

  audio.currentTime = sloka[0]?.start || 0;

  if (currentMode === "recite") {
    audio.play();
  } else {
    highlightWord(0);
    audio.play();
    monitorAudio();
  }

  setControls("playing");
}

function onStop() {
  clearInterval(timer);
  if (studentTimeout) {
    clearTimeout(studentTimeout);
    studentTimeout = null;
  }

  audio.pause();
  audio.currentTime = 0;
  currentWord = 0;
  repetitions = 0;
  highlightWord(-1);
  updateRepetitionTrack();
  setControls("initial");
}
