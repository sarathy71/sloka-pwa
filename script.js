let sloka = [];
let audio = document.getElementById("sloka-audio");
let currentWord = 0;
let repetitions = 0;
let maxReps = 5;
let timer;
let wordsDOM = [];
let isPaused = false;

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
  audio.play();
  highlightWord(index);
  monitorAudio();
}

function monitorAudio() {
  timer = setInterval(() => {
    if (!audio.paused) {
      const t = audio.currentTime;
      if (currentWord < sloka.length) {
        const word = sloka[currentWord];
        if (t >= word.end) {
          audio.pause();
          clearInterval(timer);
          simulateMicPause(() => {
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

document.getElementById("play-btn").addEventListener("click", () => {
  loadSloka().then(() => {
    currentWord = 0;
    repetitions = 0;
    audio.currentTime = sloka[0].start;
    audio.play();
    highlightWord(0);
    updateCoins();
    monitorAudio();
  });
});

document.getElementById("pause-btn").addEventListener("click", () => {
  isPaused = true;
  audio.pause();
  clearInterval(timer);
});

document.getElementById("stop-btn").addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;
  currentWord = 0;
  repetitions = 0;
  updateCoins();
  clearInterval(timer);
});
