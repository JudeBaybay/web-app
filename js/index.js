const envelopeIntro = document.getElementById("envelopeIntro");

const landingCard = document.querySelector(".landing-card");

function openEnvelope() {
  if (!envelopeIntro || envelopeIntro.classList.contains("opened")) {
    return;
  }

  envelopeIntro.classList.add("opened");

  // Reveal the question after the envelope flap/letter animation.
  window.setTimeout(function () {
    envelopeIntro.classList.add("hidden");
    if (landingCard) {
      landingCard.classList.remove("question-card-hidden");
      landingCard.classList.add("question-card-visible");
    }
  }, 850);
}

if (envelopeIntro) {
  envelopeIntro.addEventListener("click", openEnvelope);

  envelopeIntro.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openEnvelope();
    }
  });
}

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

function getVisibleViewport() {
  // Use the visual viewport when available so the button stays inside the
  // portion of the page the user can actually see (important on mobile when
  // browser UI, zoom, or orientation changes the visual viewport).
  const vv = window.visualViewport;
  if (vv) {
    return {
      left: Math.max(0, vv.offsetLeft),
      top: Math.max(0, vv.offsetTop),
      right: Math.max(0, vv.offsetLeft + vv.width),
      bottom: Math.max(0, vv.offsetTop + vv.height)
    };
  }

  return {
    left: 0,
    top: 0,
    right: document.documentElement.clientWidth || window.innerWidth,
    bottom: document.documentElement.clientHeight || window.innerHeight
  };
}

function placeNoButtonSafely(rotationDegrees) {
  if (!noButton) return false;

  const viewport = getVisibleViewport();
  const margin = 12;

  // The button is position:fixed and left/top represent its untransformed
  // top-left corner. Calculate the rotated bounding-box size so every corner
  // remains inside the visible viewport.
  const width = noButton.offsetWidth;
  const height = noButton.offsetHeight;
  const radians = Math.abs(rotationDegrees) * Math.PI / 180;
  const rotatedWidth = Math.abs(width * Math.cos(radians)) + Math.abs(height * Math.sin(radians));
  const rotatedHeight = Math.abs(width * Math.sin(radians)) + Math.abs(height * Math.cos(radians));

  const minLeft = viewport.left + margin + (rotatedWidth - width) / 2;
  const maxLeft = viewport.right - margin - (rotatedWidth + width) / 2;
  const minTop = viewport.top + margin + (rotatedHeight - height) / 2;
  const maxTop = viewport.bottom - margin - (rotatedHeight + height) / 2;

  if (maxLeft < minLeft || maxTop < minTop) {
    return false;
  }

  const left = minLeft + Math.random() * (maxLeft - minLeft);
  const top = minTop + Math.random() * (maxTop - minTop);

  noButton.style.left = `${left}px`;
  noButton.style.top = `${top}px`;
  noButton.style.transform = `rotate(${rotationDegrees}deg)`;
  return true;
}

function moveNoButtonRandomly() {
  if (!noButton) return;

  noButton.classList.add("floating");

  // Temporarily remove the CSS transition while choosing the new position.
  // This prevents an animated path between two safe positions from briefly
  // crossing outside the viewport.
  noButton.style.transition = "none";

  let rotation = Math.round((Math.random() * 50 - 25) * 10) / 10;
  if (!placeNoButtonSafely(rotation)) {
    rotation = 0;
    placeNoButtonSafely(0);
  }

  // Force layout so the browser has applied the exact position/rotation.
  // Then use the actual rendered rectangle for a final safety correction.
  void noButton.offsetWidth;
  keepNoButtonInsideViewport();
}

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

function getViewportBounds(rotationDegrees = 0) {
  // The NO button uses position: fixed, so its coordinates are relative to
  // the layout viewport. Use the layout viewport dimensions for placement
  // rather than visualViewport.width/height, which can be smaller or offset
  // on mobile browsers and during zoom/toolbar changes.
  const width = Math.max(0, document.documentElement.clientWidth || window.innerWidth);
  const height = Math.max(0, document.documentElement.clientHeight || window.innerHeight);
  const edgeMargin = Math.max(12, Math.min(24, Math.min(width, height) * 0.035));

  const buttonWidth = noButton.offsetWidth;
  const buttonHeight = noButton.offsetHeight;

  // A rotated rectangle extends outside its normal box. Reserve the exact
  // amount needed around its center so the visible button remains inside the
  // viewport.
  const radians = Math.abs(rotationDegrees) * Math.PI / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const rotatedWidth = buttonWidth * cos + buttonHeight * sin;
  const rotatedHeight = buttonWidth * sin + buttonHeight * cos;
  const extraX = Math.max(0, (rotatedWidth - buttonWidth) / 2);
  const extraY = Math.max(0, (rotatedHeight - buttonHeight) / 2);

  const minX = edgeMargin + extraX;
  const minY = edgeMargin + extraY;
  const maxX = Math.max(minX, width - edgeMargin - buttonWidth - extraX);
  const maxY = Math.max(minY, height - edgeMargin - buttonHeight - extraY);

  return {
    minX,
    minY,
    maxX,
    maxY,
    canRotate: maxX >= minX && maxY >= minY
  };
}

function getSafeRandomPosition(rotationDegrees) {
  let bounds = getViewportBounds(rotationDegrees);

  // If the button cannot fit at the requested rotation, remove rotation.
  if (!bounds.canRotate) {
    rotationDegrees = 0;
    bounds = getViewportBounds(0);
  }

  const randomX = bounds.minX + Math.random() * Math.max(0, bounds.maxX - bounds.minX);
  const randomY = bounds.minY + Math.random() * Math.max(0, bounds.maxY - bounds.minY);

  return { x: randomX, y: randomY, rotation: rotationDegrees };
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
    window.location.href = "pages/yey.html";
  });
}

function keepNoButtonInsideViewport() {
  if (!noButton || !noButton.classList.contains("floating")) return;

  const viewport = getVisibleViewport();
  const margin = 12;
  const rect = noButton.getBoundingClientRect();

  let dx = 0;
  let dy = 0;

  if (rect.left < viewport.left + margin) {
    dx = viewport.left + margin - rect.left;
  } else if (rect.right > viewport.right - margin) {
    dx = viewport.right - margin - rect.right;
  }

  if (rect.top < viewport.top + margin) {
    dy = viewport.top + margin - rect.top;
  } else if (rect.bottom > viewport.bottom - margin) {
    dy = viewport.bottom - margin - rect.bottom;
  }

  if (dx !== 0 || dy !== 0) {
    const left = parseFloat(noButton.style.left) || 0;
    const top = parseFloat(noButton.style.top) || 0;
    noButton.style.left = `${left + dx}px`;
    noButton.style.top = `${top + dy}px`;
  }
}

window.addEventListener("resize", keepNoButtonInsideViewport);
window.addEventListener("orientationchange", keepNoButtonInsideViewport);

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", keepNoButtonInsideViewport);
  window.visualViewport.addEventListener("scroll", keepNoButtonInsideViewport);
}
