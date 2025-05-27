let sloka = [];
let audio;
let currentWord = 0;
let slokaData = [];
let currentLessonIndex = 0;

let repetitions = 0;
const maxReps = 5;
let timer;
let wordsDOM = [];
let isPaused = false;
let isWaitingForStudent = false;

document.addEventListener("DOMContentLoaded", () => {
  audio = document.getElementById("sloka-audio");

  // Initialize control buttons
  document.getElementById("play-btn").addEventListener("click", onPlay);
  document.getElementById("pause-btn").addEventListener("click", onPause);
  document.getElementById("resume-btn").addEventListener("click", onResume);
  document.getElementById("stop-btn").addEventListener("click", onStop);

  // Lesson navigation buttons
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

  // Load all lessons on startup
  fetch("sloka.json")
    .then(res => res.json())
    .then(data => {
      slokaData = data.lessons;
      loadLesson(0); // Load first lesson
    });

  setControls("initial");
});

function setControls(state) {
  document.getElementById("play-btn").disabled = state !== "initial";
  document.getElementById("pause-btn").disabled = state !== "playing";
  document.getElementById("resume-btn").disabled = state !== "paused";
  document.getElementById("stop-btn").disabled = state === "initial";
}

function loadLesson(index) {
  const lesson = slokaData[index];
  sloka = lesson.words;
  audio.src = lesson.audio;

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
  isPaused = false;
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
    if (isPaused || audio.paused || isWaitingForStudent) return;

    const t = audio.currentTime;
    if (currentWord < sloka.length) {
      const word = sloka[currentWord];
      if (t >= word.end) {
        audio.pause();
        clearInterval(timer);
        simulateStudentRepeat(word.end - word.start, () => {
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

function finishCycle() {
  repetitions++;
  updateRepetitionTrack();

  if (typeof confetti === "function") {
    confetti({
      particleCount: 100,
      spread: 60,
      origin: { y: 0.6 }
    });
  }

  if (repetitions < maxReps) {
    currentWord = 0;
    audio.currentTime = sloka[0].start;
    highlightWord(0);
    audio.play();
    monitorAudio();
  } else {
    console.log("✅ All repetitions done");
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
  isPaused = false;
  isWaitingForStudent = false;
  currentWord = 0;
  repetitions = 0;
  highlightWord(-1);
  updateRepetitionTrack();
  setControls("initial");
}

function onPlay() {
  if (!sloka.length) {
    alert("Please wait for the lesson to load.");
    return;
  }

  isPaused = false;
  currentWord = 0;
  repetitions = 0;
  highlightWord(0);
  updateRepetitionTrack();

  audio.currentTime = sloka[0].start || 0;
  audio.play();
  monitorAudio();
  setControls("playing");
}

function onPause() {
  isPaused = true;
  audio.pause();
  clearInterval(timer);
  setControls("paused");
}

function onResume() {
  isPaused = false;
  if (!isWaitingForStudent) {
    audio.play();
  }
  monitorAudio();
  setControls("playing");
}

function onStop() {
  isPaused = false;
  clearInterval(timer);
  audio.pause();
  audio.currentTime = 0;
  currentWord = 0;
  repetitions = 0;
  highlightWord(-1);
  updateRepetitionTrack();
  setControls("initial");
}
