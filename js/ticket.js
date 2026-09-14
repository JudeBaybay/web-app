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
  await waitForTicketAssets();

  // Temporarily force the artwork to its canonical 340x560 dimensions while
  // capturing. This prevents responsive viewport rules from changing the
  // YOUR TICKET! / SEE YOU! typography on iOS Safari.
  const previousWidth = ticket.style.width;
  const previousHeight = ticket.style.height;
  const previousMinWidth = ticket.style.minWidth;
  const previousMinHeight = ticket.style.minHeight;
  const previousMaxWidth = ticket.style.maxWidth;
  const previousMaxHeight = ticket.style.maxHeight;
  const previousTransform = ticket.style.transform;

  ticket.style.width = "340px";
  ticket.style.height = "560px";
  ticket.style.minWidth = "340px";
  ticket.style.minHeight = "560px";
  ticket.style.maxWidth = "340px";
  ticket.style.maxHeight = "560px";
  ticket.style.transform = "none";

  let canvas;

  try {
    canvas = await html2canvas(ticket, {
      // Render the ticket at its canonical 340x560 CSS size. This keeps the PNG
      // independent of the iPhone viewport and device-pixel ratio.
      scale: 3,
      width: 340,
      height: 560,
      windowWidth: 340,
      windowHeight: 560,
    useCORS: true,
    allowTaint: false,
    backgroundColor: "#ebe9df",
      logging: false,
    });
  } finally {
    ticket.style.width = previousWidth;
    ticket.style.height = previousHeight;
    ticket.style.minWidth = previousMinWidth;
    ticket.style.minHeight = previousMinHeight;
    ticket.style.maxWidth = previousMaxWidth;
    ticket.style.maxHeight = previousMaxHeight;
    ticket.style.transform = previousTransform;
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Unable to create the ticket image."));
    }, "image/png");
  });
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
