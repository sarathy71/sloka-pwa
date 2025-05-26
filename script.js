document.addEventListener("DOMContentLoaded", () => {
  let sloka = [];
  let audio = document.getElementById("sloka-audio");
  let currentWord = 0;
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
    // state: 'initial', 'playing', 'paused'
    playBtn.disabled = state !== "initial";
    pauseBtn.disabled = state !== "playing";
    resumeBtn.disabled = state !== "paused";
    stopBtn.disabled = state === "initial";
  }

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

  function finishCycle() {
    repetitions++;
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
    setControls("initial");
  });

  // Initialize controls
  setControls("initial");
});
