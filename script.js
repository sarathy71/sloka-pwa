document.addEventListener("DOMContentLoaded", () => {
  let sloka = [];
  let audio = document.getElementById("sloka-audio");
  let currentWord = 0;
  let slokaData = [];
  let currentLessonIndex = 0;

  let repetitions = 0;
  const maxReps = 5;
  let timer;
  let wordsDOM = [];
  let isPaused = false;
  let isWaitingForStudent = false;

  const playBtn = document.getElementById("play-btn");
  const pauseBtn = document.getElementById("pause-btn");
  const resumeBtn = document.getElementById("resume-btn");
  const stopBtn = document.getElementById("stop-btn");

  function setControls(state) {
    playBtn.disabled = state !== "initial";
    pauseBtn.disabled = state !== "playing";
    resumeBtn.disabled = state !== "paused";
    stopBtn.disabled = state === "initial";
  }

  async function loadLessons() {
  const res = await fetch("sloka.json");
  slokaData = await res.json();
  loadLesson(0); // load the first lesson
}

function loadLesson(index) {
  const lesson = slokaData[index];
  sloka = lesson.words;
  audio.src = lesson.audioFile;

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

  document.getElementById("lesson-title").textContent = lesson.lessonName;
}


  function highlightWord(index) {
    wordsDOM.forEach((w, i) => {
      w.classList.toggle("active", i === index);
    });
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

 function finishCycle() {
  repetitions++;
  updateRepetitionTrack();

  // 🎉 Confetti effect when a repetition completes
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });

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

  playBtn.addEventListener("click", () => {
    isPaused = false;
    loadSloka().then(() => {
      currentWord = 0;
      repetitions = 0;
      audio.currentTime = sloka[0].start;
      audio.play();
      highlightWord(0);
      updateRepetitionTrack();
      monitorAudio();
      setControls("playing");
    });
  });

  pauseBtn.addEventListener("click", () => {
    isPaused = true;
    audio.pause();
    clearInterval(timer);
    setControls("paused");
  });

  resumeBtn.addEventListener("click", () => {
    isPaused = false;
    if (!isWaitingForStudent) {
      audio.play();
    }
    monitorAudio();
    setControls("playing");
  });

  stopBtn.addEventListener("click", () => {
    isPaused = false;
    clearInterval(timer);
    audio.pause();
    audio.currentTime = 0;
    currentWord = 0;
    repetitions = 0;
    highlightWord(-1);
    updateRepetitionTrack();
    setControls("initial");
  });

  setControls("initial");
});
