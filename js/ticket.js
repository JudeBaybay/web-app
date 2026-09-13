const ticketDate = document.getElementById("ticketDate");
const ticketTime = document.getElementById("ticketTime");
const downloadButton = document.getElementById("downloadButton");
const sendTicketButton = document.getElementById("sendTicketButton");
const sendTicketStatus = document.getElementById("sendTicketStatus");
const backToDateButton = document.getElementById("backToDateButton");
const ticket = document.getElementById("ticket");

const SEND_TICKET_ENDPOINT = "/api/send-ticket";

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
  if (hour === 0) hour = 12;

  ticketTime.textContent = `${hour}:${String(minute).padStart(2, "0")} ${period}`;
}

function createTicketCanvas() {
  return html2canvas(ticket, {
    scale: 3,
    useCORS: true,
    allowTaint: false,
    backgroundColor: "#f7f4ea",
    logging: false,
  });
}

function canvasToBlob(canvas) {
  return new Promise(function (resolve, reject) {
    canvas.toBlob(function (blob) {
      if (blob) resolve(blob);
      else reject(new Error("The ticket image could not be created."));
    }, "image/png");
  });
}

function setSendStatus(message, isError) {
  if (!sendTicketStatus) return;
  sendTicketStatus.textContent = message;
  sendTicketStatus.classList.toggle("error", Boolean(isError));
}

if (downloadButton) {
  downloadButton.addEventListener("click", async function () {
    const originalText = downloadButton.textContent;
    downloadButton.textContent = "Creating image...";
    downloadButton.disabled = true;

    try {
      const canvas = await createTicketCanvas();
      const blob = await canvasToBlob(canvas);
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
    } catch (error) {
      console.error("Ticket image generation failed:", error);
      downloadButton.textContent = "Try Again";
      downloadButton.disabled = false;
    }
  });
}

if (sendTicketButton) {
  sendTicketButton.addEventListener("click", async function () {
    const originalText = sendTicketButton.textContent;
    sendTicketButton.textContent = "Sending ticket...";
    sendTicketButton.disabled = true;
    setSendStatus("Preparing your ticket...", false);

    try {
      // This is intentionally the same html2canvas render used by Download as IMAGE.
      const canvas = await createTicketCanvas();
      const blob = await canvasToBlob(canvas);

      const reader = new FileReader();
      const dataUrl = await new Promise(function (resolve, reject) {
        reader.onload = function () { resolve(reader.result); };
        reader.onerror = function () { reject(new Error("Could not prepare the ticket image.")); };
        reader.readAsDataURL(blob);
      });

      const response = await fetch(SEND_TICKET_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_image: dataUrl,
          date: ticketDate ? ticketDate.textContent : selectedDate,
          time: ticketTime ? ticketTime.textContent : selectedTime,
        }),
      });

      let result = {};
      try { result = await response.json(); } catch (_) {}

      if (!response.ok || !result.success) {
        throw new Error(result.error || "The ticket could not be sent.");
      }

      setSendStatus("Ticket sent successfully!", false);
      sendTicketButton.textContent = "Ticket sent!";
    } catch (error) {
      console.error("Sending ticket failed:", error);
      setSendStatus(error.message || "Unable to send the ticket. Please try again.", true);
      sendTicketButton.textContent = "Try Again";
      sendTicketButton.disabled = false;
      return;
    }

    sendTicketButton.disabled = false;
    sendTicketButton.textContent = originalText;
  });
}
