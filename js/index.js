// Start each new visit from the landing page with a fresh date/time.
// Values are intentionally kept while navigating between date.html and
// ticket.html, but are cleared whenever the site is entered through index.html.
localStorage.removeItem("selectedDate");
localStorage.removeItem("selectedTime");

const envelopeIntro = document.getElementById("envelopeIntro");
const landingCard = document.querySelector(".landing-card");

function openEnvelope() {
  if (!envelopeIntro || envelopeIntro.classList.contains("opened")) return;
  envelopeIntro.classList.add("opened");
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
  "assets/sad-cat-1.jpg", "assets/sad-cat-2.gif", "assets/sad-cat-3.gif",
  "assets/sad-cat-4.gif", "assets/sad-cat-5.gif", "assets/sad-cat-6.jpg",
  "assets/sad-cat-7.png", "assets/sad-cat-8.gif",
];

let sadCatIndex = 0;
let noClickCount = 0;
let yesScale = 1;

/*
 * The NO button is position:fixed after its first move.  Fixed elements use
 * viewport coordinates, so the safest approach is to use the current layout
 * viewport for placement and then verify the real transformed rectangle.
 * This avoids mixing visualViewport offsets with fixed-position coordinates.
 */
function getNoButtonViewport() {
  // getBoundingClientRect() and position:fixed are expressed in viewport
  // coordinates. Prefer the visual viewport dimensions when available so
  // mobile browser chrome/keyboard changes do not create an offset mismatch.
  const vv = window.visualViewport;
  const width = Math.max(1, (vv && vv.scale === 1 ? vv.width : 0) || window.innerWidth || document.documentElement.clientWidth || 1);
  const height = Math.max(1, (vv && vv.scale === 1 ? vv.height : 0) || window.innerHeight || document.documentElement.clientHeight || 1);
  return { left: 0, top: 0, right: width, bottom: height };
}

function getRotatedBounds(width, height, degrees) {
  const radians = Math.abs(degrees) * Math.PI / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  return {
    width: width * cos + height * sin,
    height: width * sin + height * cos,
  };
}

function getSafeNoPlacement() {
  if (!noButton) return null;

  const viewport = getNoButtonViewport();
  const margin = 12;
  const width = noButton.offsetWidth;
  const height = noButton.offsetHeight;

  // Try a fresh random rotation. If the viewport is too small, reduce the
  // angle until the complete rotated rectangle can fit.
  const candidates = [
    Math.round((Math.random() * 50 - 25) * 10) / 10,
    15, -15, 10, -10, 5, -5, 0,
  ];

  let rotation = 0;
  let bounds = getRotatedBounds(width, height, 0);
  let minLeft = 0, maxLeft = 0, minTop = 0, maxTop = 0;

  for (const candidate of candidates) {
    const b = getRotatedBounds(width, height, candidate);
    const minL = viewport.left + margin + (b.width - width) / 2;
    const maxL = viewport.right - margin - (b.width + width) / 2;
    const minT = viewport.top + margin + (b.height - height) / 2;
    const maxT = viewport.bottom - margin - (b.height + height) / 2;

    if (maxL >= minL && maxT >= minT) {
      rotation = candidate;
      bounds = b;
      minLeft = minL;
      maxLeft = maxL;
      minTop = minT;
      maxTop = maxT;
      break;
    }
  }

  const left = minLeft + Math.random() * Math.max(0, maxLeft - minLeft);
  const top = minTop + Math.random() * Math.max(0, maxTop - minTop);
  return { left, top, rotation, bounds };
}

function clampNoButtonToViewport() {
  if (!noButton || !noButton.classList.contains("floating")) return;

  const viewport = getNoButtonViewport();
  const margin = 12;
  const rect = noButton.getBoundingClientRect();
  let dx = 0;
  let dy = 0;

  if (rect.left < viewport.left + margin) dx = viewport.left + margin - rect.left;
  if (rect.right > viewport.right - margin) dx = Math.min(dx || 0, viewport.right - margin - rect.right);
  if (rect.top < viewport.top + margin) dy = viewport.top + margin - rect.top;
  if (rect.bottom > viewport.bottom - margin) dy = Math.min(dy || 0, viewport.bottom - margin - rect.bottom);

  if (dx || dy) {
    const left = parseFloat(noButton.style.left) || 0;
    const top = parseFloat(noButton.style.top) || 0;
    noButton.style.left = `${left + dx}px`;
    noButton.style.top = `${top + dy}px`;
  }

  // Final correction after the browser has applied the transform.
  const corrected = noButton.getBoundingClientRect();
  let cdx = 0;
  let cdy = 0;
  if (corrected.left < margin) cdx = margin - corrected.left;
  else if (corrected.right > viewport.right - margin) cdx = viewport.right - margin - corrected.right;
  if (corrected.top < margin) cdy = margin - corrected.top;
  else if (corrected.bottom > viewport.bottom - margin) cdy = viewport.bottom - margin - corrected.bottom;

  if (cdx || cdy) {
    noButton.style.left = `${(parseFloat(noButton.style.left) || 0) + cdx}px`;
    noButton.style.top = `${(parseFloat(noButton.style.top) || 0) + cdy}px`;
  }
}

function moveNoButtonRandomly() {
  if (!noButton) return;

  if (noButton.parentElement !== document.body) document.body.appendChild(noButton);
  noButton.classList.add("floating");
  noButton.style.position = "fixed";
  noButton.style.transition = "none";

  const placement = getSafeNoPlacement();
  if (!placement) return;

  noButton.style.left = `${placement.left}px`;
  noButton.style.top = `${placement.top}px`;
  noButton.style.transform = `rotate(${placement.rotation}deg)`;

  // Force layout, then use the actual transformed rectangle as the source of truth.
  void noButton.offsetWidth;
  clampNoButtonToViewport();
}

function showSadCat() {
  if (sadCatBox) sadCatBox.classList.remove("hidden");
}

function changeSadCatImage() {
  if (!sadCatImage || sadCatImages.length === 0) return;
  sadCatIndex = (sadCatIndex + 1) % sadCatImages.length;
  sadCatImage.style.opacity = "0";
  setTimeout(function () {
    sadCatImage.src = sadCatImages[sadCatIndex];
    sadCatImage.style.opacity = "1";
  }, 120);
}

function growYesButton() {
  noClickCount++;

  // Keep the growing YES button inside even after many NO presses.
  const viewport = getNoButtonViewport();
  const baseWidth = yesButton ? yesButton.offsetWidth : 62;
  const baseHeight = yesButton ? yesButton.offsetHeight : 35;
  const maxScale = Math.max(
    1,
    Math.min(
      1.8,
      (viewport.right - viewport.left - 24) / baseWidth,
      (viewport.bottom - viewport.top - 24) / baseHeight
    )
  );

  yesScale = Math.min(1 + noClickCount * 0.12, maxScale);

  if (yesButton) yesButton.style.transform = `scale(${yesScale})`;
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
  clampNoButtonToViewport();
}

window.addEventListener("resize", keepNoButtonInsideViewport, { passive: true });
window.addEventListener("orientationchange", function () {
  requestAnimationFrame(keepNoButtonInsideViewport);
}, { passive: true });

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", function () {
    requestAnimationFrame(keepNoButtonInsideViewport);
  }, { passive: true });
}
