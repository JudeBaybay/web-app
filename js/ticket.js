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
