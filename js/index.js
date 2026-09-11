const yesButton = document.getElementById("yesButton");

const noButton = document.getElementById("noButton");

const sadCatBox = document.getElementById("sadCatBox");

const sadCatImage = document.getElementById("sadCatImage");

const sadCatImages = [
  "assets/sad-cat-1.jpg",

  "assets/sad-cat-2.gif",

  "assets/sad-cat-3.gif",

  "assets/sad-cat-4.gif",

  "assets/sad-cat-5.gif",

  "assets/sad-cat-6.jpg",

  "assets/sad-cat-7.png",

  "assets/sad-cat-8.gif",
];

let sadCatIndex = 0;

let noClickCount = 0;

let yesScale = 1;

function showSadCat() {
  sadCatBox.classList.remove("hidden");
}

function changeSadCatImage() {
  if (sadCatImages.length === 0) {
    return;
  }

  sadCatIndex++;

  if (sadCatIndex >= sadCatImages.length) {
    sadCatIndex = 0;
  }

  sadCatImage.style.opacity = "0";

  setTimeout(function () {
    sadCatImage.src = sadCatImages[sadCatIndex];

    sadCatImage.style.opacity = "1";
  }, 120);
}

function growYesButton() {
  noClickCount++;

  yesScale = 1 + noClickCount * 0.12;

  yesButton.style.transform = `scale(${yesScale})`;
}

function moveNoButtonRandomly() {
  if (!noButton.classList.contains("floating")) {
    noButton.classList.add("floating");
  }

  const buttonWidth = noButton.offsetWidth;

  const buttonHeight = noButton.offsetHeight;

  const margin = 10;

  const maxX = window.innerWidth - buttonWidth - margin;

  const maxY = window.innerHeight - buttonHeight - margin;

  const randomX = margin + Math.random() * Math.max(0, maxX - margin);

  const randomY = margin + Math.random() * Math.max(0, maxY - margin);

  const rotation = Math.random() * 20 - 10;

  noButton.style.left = `${randomX}px`;

  noButton.style.top = `${randomY}px`;

  noButton.style.transform = `rotate(${rotation}deg)`;
}

if (noButton) {
  noButton.addEventListener("click", function () {
    showSadCat();

    changeSadCatImage();

    growYesButton();

    moveNoButtonRandomly();
  });
}

if (yesButton) {
  yesButton.addEventListener("click", function () {
    window.location.href = "pages/date.html";
  });
}

window.addEventListener("resize", function () {
  if (!noButton || !noButton.classList.contains("floating")) {
    return;
  }

  const buttonWidth = noButton.offsetWidth;

  const buttonHeight = noButton.offsetHeight;

  let currentX = parseFloat(noButton.style.left);

  let currentY = parseFloat(noButton.style.top);

  if (Number.isNaN(currentX)) {
    currentX = 10;
  }

  if (Number.isNaN(currentY)) {
    currentY = 10;
  }

  const maxX = window.innerWidth - buttonWidth - 10;

  const maxY = window.innerHeight - buttonHeight - 10;

  currentX = Math.max(10, Math.min(currentX, maxX));

  currentY = Math.max(10, Math.min(currentY, maxY));

  noButton.style.left = `${currentX}px`;

  noButton.style.top = `${currentY}px`;
});
