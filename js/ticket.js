const ticketDate = document.getElementById("ticketDate");

const ticketTime = document.getElementById("ticketTime");

const downloadButton = document.getElementById("downloadButton");
const backToDateButton = document.getElementById("backToDateButton");

const ticket = document.getElementById("ticket");

if (backToDateButton) {
  backToDateButton.addEventListener("click", function () {
    window.location.href = "date.html";
  });
}

const selectedDate = localStorage.getItem("selectedDate");

const selectedTime = localStorage.getItem("selectedTime");

if (!selectedDate || !selectedTime) {
  window.location.href = "date.html";
} else {
  const date = new Date(selectedDate + "T00:00:00");

  ticketDate.textContent = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const parts = selectedTime.split(":");

  let hour = parseInt(parts[0], 10);

  const minute = parseInt(parts[1], 10);

  const period = hour >= 12 ? "PM" : "AM";

  hour = hour % 12;

  if (hour === 0) {
    hour = 12;
  }

  ticketTime.textContent = `${hour}:${String(minute).padStart(2, "0")} ${period}`;
}

async function waitForTicketAssets() {
  // iOS Safari can give html2canvas fallback font metrics if capture starts
  // before the web fonts are ready. Wait for the exact ticket fonts and image.
  if (document.fonts) {
    await Promise.all([
      document.fonts.load('700 italic 50px "Playfair Display"'),
      document.fonts.load('400 30px "Patrick Hand"'),
      document.fonts.load('700 30px "Patrick Hand"'),
      document.fonts.ready,
    ]);
  }

  const images = Array.from(ticket.querySelectorAll("img"));
  await Promise.all(images.map((img) => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise((resolve) => {
      img.addEventListener("load", resolve, { once: true });
      img.addEventListener("error", resolve, { once: true });
    });
  }));
}

async function createTicketBlob() {
  /*
   * V25 — DEVICE-INDEPENDENT TICKET EXPORT
   *
   * Do NOT capture the responsive #ticket element directly.
   *
   * The visible ticket is intentionally responsive and can be scaled by
   * .ticket-wrapper/.phone-screen depending on the device. html2canvas can
   * inherit those responsive transforms and iOS Safari viewport metrics,
   * which causes the exported PNG to be compressed, clipped, or laid out
   * incorrectly.
   *
   * Instead, create a completely independent 340x560 export artwork with
   * fixed pixel coordinates. It is then rendered at 3x = 1020x1680.
   *
   * The exported artwork therefore has exactly the same dimensions and
   * composition on every phone, tablet, laptop, and desktop.
   */
  await waitForTicketAssets();

  const sourceCat = document.getElementById("happyCatImage");
  if (!sourceCat || !sourceCat.src) {
    throw new Error("The ticket image could not be found.");
  }

  const exportCard = document.createElement("div");

  // No ticket-page/ticket-wrapper/ticket-card classes are used here.
  // This prevents the large responsive CSS file from changing the export.
  Object.assign(exportCard.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: "340px",
    height: "560px",
    boxSizing: "border-box",
    overflow: "hidden",
    background: "#ebe9df",
    border: "3px solid #2b2823",
    borderRadius: "11px",
    boxShadow: "3px 3px 0 #2b2823",
    margin: "0",
    padding: "0",
    transform: "none",
    display: "block",
    zIndex: "-1",
  });

  // The export is deliberately composed with absolute coordinates. This
  // avoids flex/grid/viewport-dependent text measurement during html2canvas.
  const title = document.createElement("div");
  Object.assign(title.style, {
    position: "absolute",
    left: "0",
    top: "17px",
    width: "334px",
    height: "92px",
    margin: "0",
    padding: "0",
    fontFamily: '"Playfair Display", Georgia, serif',
    fontStyle: "italic",
    fontWeight: "700",
    fontSize: "50px",
    lineHeight: "0.92",
    textAlign: "center",
    color: "#2b2823",
    whiteSpace: "nowrap",
  });
  title.innerHTML = "YOUR<br>TICKET !";

  const firstLine = document.createElement("div");
  Object.assign(firstLine.style, {
    position: "absolute",
    left: "30px",
    top: "127px",
    width: "280px",
    height: "1px",
    margin: "0",
    padding: "0",
    background: "#000000",
  });

  const dateLine = document.createElement("div");
  Object.assign(dateLine.style, {
    position: "absolute",
    left: "0",
    top: "188px",
    width: "334px",
    height: "38px",
    margin: "0",
    padding: "0",
    display: "flex",
    alignItems: "baseline",
    justifyContent: "center",
    gap: "4px",
    fontFamily: '"Patrick Hand", cursive',
    fontSize: "30px",
    lineHeight: "1.1",
    color: "#2b2823",
    whiteSpace: "nowrap",
  });

  const dateLabel = document.createElement("strong");
  dateLabel.textContent = "Date:";
  Object.assign(dateLabel.style, {
    display: "inline-block",
    fontWeight: "700",
    flex: "0 0 auto",
  });

  const dateValue = document.createElement("span");
  dateValue.textContent = ticketDate.textContent;
  Object.assign(dateValue.style, {
    display: "inline-block",
    fontWeight: "400",
    flex: "0 0 auto",
  });

  dateLine.append(dateLabel, dateValue);

  const timeLine = document.createElement("div");
  Object.assign(timeLine.style, {
    position: "absolute",
    left: "0",
    top: "255px",
    width: "334px",
    height: "38px",
    margin: "0",
    padding: "0",
    display: "flex",
    alignItems: "baseline",
    justifyContent: "center",
    gap: "4px",
    fontFamily: '"Patrick Hand", cursive',
    fontSize: "30px",
    lineHeight: "1.1",
    color: "#2b2823",
    whiteSpace: "nowrap",
  });

  const timeLabel = document.createElement("strong");
  timeLabel.textContent = "Time:";
  Object.assign(timeLabel.style, {
    display: "inline-block",
    fontWeight: "700",
    flex: "0 0 auto",
  });

  const timeValue = document.createElement("span");
  timeValue.textContent = ticketTime.textContent;
  Object.assign(timeValue.style, {
    display: "inline-block",
    fontWeight: "400",
    flex: "0 0 auto",
  });

  timeLine.append(timeLabel, timeValue);

  const secondLine = document.createElement("div");
  Object.assign(secondLine.style, {
    position: "absolute",
    left: "30px",
    top: "335px",
    width: "280px",
    height: "1px",
    margin: "0",
    padding: "0",
    background: "#000000",
  });

  const seeYou = document.createElement("div");
  Object.assign(seeYou.style, {
    position: "absolute",
    left: "30px",
    bottom: "50px",
    width: "145px",
    height: "110px",
    margin: "0",
    padding: "0",
    fontFamily: '"Playfair Display", Georgia, serif',
    fontStyle: "italic",
    fontWeight: "700",
    fontSize: "50px",
    lineHeight: "0.88",
    textAlign: "left",
    color: "#2b2823",
    whiteSpace: "nowrap",
  });
  seeYou.innerHTML = "SEE<br>YOU!";

  const cat = document.createElement("div");
  Object.assign(cat.style, {
    position: "absolute",
    right: "17px",
    bottom: "32px",
    width: "145px",
    height: "145px",
    margin: "0",
    padding: "0",
    boxSizing: "border-box",
    border: "2.5px solid #2b2823",
    borderRadius: "9px",
    overflow: "hidden",
    background: "#ebe7dc",
  });

  const catImage = document.createElement("img");
  catImage.src = sourceCat.currentSrc || sourceCat.src;
  catImage.alt = "";
  Object.assign(catImage.style, {
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "cover",
    margin: "0",
    padding: "0",
  });
  cat.appendChild(catImage);

  exportCard.append(
    title,
    firstLine,
    dateLine,
    timeLine,
    secondLine,
    seeYou,
    cat
  );

  document.body.appendChild(exportCard);

  try {
    // Wait for the export image itself as well as the already-loaded source.
    if (!catImage.complete || catImage.naturalWidth === 0) {
      await new Promise((resolve) => {
        catImage.addEventListener("load", resolve, { once: true });
        catImage.addEventListener("error", resolve, { once: true });
      });
    }

    // Make absolutely sure the fonts are ready before html2canvas measures text.
    if (document.fonts) {
      await Promise.all([
        document.fonts.load('700 italic 50px "Playfair Display"'),
        document.fonts.load('400 30px "Patrick Hand"'),
        document.fonts.load('700 30px "Patrick Hand"'),
        document.fonts.ready,
      ]);
    }

    // Give Safari one layout pass after the export DOM is inserted.
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const canvas = await html2canvas(exportCard, {
      scale: 3,
      width: 340,
      height: 560,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 340,
      windowHeight: 560,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ebe9df",
      logging: false,
    });

    return await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Unable to create the ticket image."));
        }
      }, "image/png");
    });
  } finally {
    exportCard.remove();
  }
}

downloadButton.addEventListener("click", async function () {
  const originalText = downloadButton.textContent;

  downloadButton.textContent = "Creating image...";
  downloadButton.disabled = true;

  try {
    const blob = await createTicketBlob();
    const imageUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = imageUrl;
    link.download = "your-date-ticket.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(function () {
      URL.revokeObjectURL(imageUrl);
    }, 1000);
  } catch (error) {
    console.error("Ticket image generation failed:", error);
    downloadButton.textContent = "Try Again";
    return;
  } finally {
    downloadButton.disabled = false;
    if (downloadButton.textContent === "Creating image...") {
      downloadButton.textContent = originalText;
    }
  }
});


const SEND_TICKET_API_URL = "https://web-app-nine-amber.vercel.app/api/send-ticket";

const sendTicketButton = document.getElementById("sendTicketButton");
const sendTicketStatus = document.getElementById("sendTicketStatus");

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unable to prepare the ticket image."));
        return;
      }
      resolve(result.split(",")[1]);
    };
    reader.onerror = () => reject(new Error("Unable to read the ticket image."));
    reader.readAsDataURL(blob);
  });
}

if (sendTicketButton) {
  sendTicketButton.addEventListener("click", async function () {
    const originalText = sendTicketButton.textContent;
    sendTicketButton.disabled = true;
    sendTicketButton.textContent = "Sending...";
    if (sendTicketStatus) sendTicketStatus.textContent = "Preparing your ticket...";

    try {
      if (SEND_TICKET_API_URL.includes("YOUR-VERCEL-PROJECT")) {
        throw new Error("Set SEND_TICKET_API_URL in js/ticket.js to your deployed Vercel API URL first.");
      }

      const blob = await createTicketBlob();
      const imageBase64 = await blobToBase64(blob);

      if (sendTicketStatus) sendTicketStatus.textContent = "Sending ticket...";

      const response = await fetch(SEND_TICKET_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageBase64,
          filename: "your-date-ticket.png",
          date: ticketDate.textContent,
          time: ticketTime.textContent,
        }),
      });

      let result = {};
      try { result = await response.json(); } catch (_) {}

      if (!response.ok) {
        throw new Error(result.error || "The ticket could not be sent.");
      }

      if (sendTicketStatus) sendTicketStatus.textContent = "Ticket sent successfully!";
      sendTicketButton.textContent = "Ticket Sent!";
    } catch (error) {
      console.error("Ticket sending failed:", error);
      if (sendTicketStatus) sendTicketStatus.textContent = error.message || "Unable to send the ticket.";
      sendTicketButton.textContent = "Try Again";
    } finally {
      sendTicketButton.disabled = false;
      setTimeout(() => {
        if (sendTicketButton.textContent !== "Ticket Sent!") {
          sendTicketButton.textContent = originalText;
        }
      }, 2500);
    }
  });
}
