const waterfallEmojis = ["🌷", "🍫", "🐱", "🍉", "🐰", "💗"];

const waterfallContainer = document.querySelector(".emoji-waterfall");

function createFallingEmoji() {
  if (!waterfallContainer) {
    return;
  }

  const emoji = document.createElement("span");

  emoji.className = "falling-emoji";

  emoji.textContent =
    waterfallEmojis[Math.floor(Math.random() * waterfallEmojis.length)];

  const size = Math.pow(Math.random(), 1.8) * 68 + 8;

  const section = Math.floor(Math.random() * 12);
  const sectionWidth = 100 / 12;
  const left = section * sectionWidth + Math.random() * sectionWidth;

  const duration = Math.random() * 5 + 7;
  const delay = Math.random() * -10;
  const drift = Math.floor(Math.random() * 160) - 80;
  const rotation = Math.floor(Math.random() * 1080) - 540;

  emoji.style.left = `${left}%`;
  emoji.style.fontSize = `${size}px`;
  emoji.style.animationDuration = `${duration}s`;
  emoji.style.animationDelay = `${delay}s`;
  emoji.style.setProperty("--drift", `${drift}px`);
  emoji.style.setProperty("--rotation", `${rotation}deg`);

  waterfallContainer.appendChild(emoji);

  setTimeout(
    () => {
      emoji.remove();
    },
    (duration + 11) * 1000,
  );
}

function startEmojiWaterfall() {
  if (!waterfallContainer) {
    return;
  }

  const initialEmojis = 35;

  for (let i = 0; i < initialEmojis; i++) {
    createFallingEmoji();
  }

  setInterval(() => {
    createFallingEmoji();
  }, 450);
}

document.addEventListener("DOMContentLoaded", startEmojiWaterfall);
