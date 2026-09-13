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

  ticketDate.textContent = date.toLocaleDateString(undefined, {
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

downloadButton.addEventListener("click", async function () {
  const originalText = downloadButton.textContent;

  downloadButton.textContent = "Creating image...";

  downloadButton.disabled = true;

  try {
    const canvas = await html2canvas(ticket, {
      scale: 3,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#f7f4ea",
      logging: false,
    });

    canvas.toBlob(function (blob) {
      if (!blob) {
        downloadButton.textContent = originalText;

        downloadButton.disabled = false;

        return;
      }

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

      downloadButton.textContent = originalText;

      downloadButton.disabled = false;
    }, "image/png");
  } catch (error) {
    console.error("Ticket image generation failed:", error);

    downloadButton.textContent = "Try Again";

    downloadButton.disabled = false;
  }
});


// =========================================================
// Send ticket to Jude
// =========================================================
// GitHub Pages cannot run /api/send-ticket itself. Set this to the
// public URL of the Vercel serverless function that you deploy from
// the /api folder in this project.
const SEND_TICKET_API_URL = "https://YOUR-VERCEL-PROJECT.vercel.app/api/send-ticket";

const sendTicketButton = document.getElementById("sendTicketButton");
const sendTicketStatus = document.getElementById("sendTicketStatus");

async function createTicketBlob() {
  const canvas = await html2canvas(ticket, {
    scale: 3,
    useCORS: true,
    allowTaint: false,
    backgroundColor: "#f7f4ea",
    logging: false,
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Unable to create the ticket image."));
    }, "image/png");
  });
}

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
