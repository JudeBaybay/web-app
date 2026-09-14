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

  /*
   * IMPORTANT FOR iOS SAFARI:
   *
   * ticket is inside .ticket-wrapper, and .ticket-wrapper is itself scaled
   * to fit short viewports. html2canvas can inherit that ancestor transform
   * even when we explicitly set the ticket element to 340x560. On an iPhone
   * this can make the captured ticket occupy only part of the 340x560 canvas,
   * leaving a large blank area and making the typography appear distorted.
   *
   * During image generation we therefore temporarily remove ALL transforms
   * from the ticket's ancestor wrapper and force the artwork to its canonical
   * 340x560 CSS size. The generated PNG is always 1020x1680 (3x).
   */
  const wrapper = ticket.closest('.ticket-wrapper');
  const phoneScreen = ticket.closest('.phone-screen');

  const saved = {
    ticketWidth: ticket.style.width,
    ticketHeight: ticket.style.height,
    ticketMinWidth: ticket.style.minWidth,
    ticketMinHeight: ticket.style.minHeight,
    ticketMaxWidth: ticket.style.maxWidth,
    ticketMaxHeight: ticket.style.maxHeight,
    ticketTransform: ticket.style.transform,
    wrapperWidth: wrapper ? wrapper.style.width : '',
    wrapperHeight: wrapper ? wrapper.style.height : '',
    wrapperMinWidth: wrapper ? wrapper.style.minWidth : '',
    wrapperMinHeight: wrapper ? wrapper.style.minHeight : '',
    wrapperMaxWidth: wrapper ? wrapper.style.maxWidth : '',
    wrapperMaxHeight: wrapper ? wrapper.style.maxHeight : '',
    wrapperFlex: wrapper ? wrapper.style.flex : '',
    wrapperTransform: wrapper ? wrapper.style.transform : '',
    wrapperScale: wrapper ? wrapper.style.getPropertyValue('--ticket-scale') : '',
    phoneTransform: phoneScreen ? phoneScreen.style.transform : '',
    phoneTicketScale: phoneScreen ? phoneScreen.style.getPropertyValue('--ticket-scale') : '',
  };

  // Prevent a visible transition/flicker while the capture-only layout is set.
  document.documentElement.classList.add('ticket-capturing');

  ticket.style.width = '340px';
  ticket.style.height = '560px';
  ticket.style.minWidth = '340px';
  ticket.style.minHeight = '560px';
  ticket.style.maxWidth = '340px';
  ticket.style.maxHeight = '560px';
  ticket.style.transform = 'none';

  if (wrapper) {
    wrapper.style.width = '340px';
    wrapper.style.height = '560px';
    wrapper.style.minWidth = '340px';
    wrapper.style.minHeight = '560px';
    wrapper.style.maxWidth = '340px';
    wrapper.style.maxHeight = '560px';
    wrapper.style.flex = '0 0 560px';
    wrapper.style.transform = 'none';
    wrapper.style.setProperty('--ticket-scale', '1');
  }

  // The page-level .phone-screen also has a responsive transform in the
  // stylesheet. html2canvas captures that ancestor transform, which can
  // shrink the entire ticket even though #ticket itself is 340x560.
  // Neutralize it for the capture as well.
  if (phoneScreen) {
    phoneScreen.style.transform = 'none';
    phoneScreen.style.setProperty('--ticket-scale', '1');
  }

  let canvas;

  try {
    // Wait one animation frame so Safari has applied the capture-only layout
    // before html2canvas measures any element.
    await new Promise((resolve) => requestAnimationFrame(resolve));

    canvas = await html2canvas(ticket, {
      scale: 3,
      width: 340,
      height: 560,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ebe9df',
      logging: false,
      onclone: (clonedDocument) => {
        // Belt-and-suspenders protection: html2canvas creates a cloned DOM.
        // Neutralize any inherited transform in the clone as well.
        const clonedTicket = clonedDocument.getElementById('ticket');
        if (clonedTicket) {
          clonedTicket.style.width = '340px';
          clonedTicket.style.height = '560px';
          clonedTicket.style.minWidth = '340px';
          clonedTicket.style.minHeight = '560px';
          clonedTicket.style.maxWidth = '340px';
          clonedTicket.style.maxHeight = '560px';
          clonedTicket.style.transform = 'none';
        }

        const clonedPhoneScreen = clonedTicket?.closest('.phone-screen');
        if (clonedPhoneScreen) {
          clonedPhoneScreen.style.transform = 'none';
          clonedPhoneScreen.style.setProperty('--ticket-scale', '1');
        }

        const clonedWrapper = clonedTicket?.closest('.ticket-wrapper');
        if (clonedWrapper) {
          clonedWrapper.style.width = '340px';
          clonedWrapper.style.height = '560px';
          clonedWrapper.style.minWidth = '340px';
          clonedWrapper.style.minHeight = '560px';
          clonedWrapper.style.maxWidth = '340px';
          clonedWrapper.style.maxHeight = '560px';
          clonedWrapper.style.flex = '0 0 560px';
          clonedWrapper.style.transform = 'none';
          clonedWrapper.style.setProperty('--ticket-scale', '1');
        }
      },
    });
  } finally {
    ticket.style.width = saved.ticketWidth;
    ticket.style.height = saved.ticketHeight;
    ticket.style.minWidth = saved.ticketMinWidth;
    ticket.style.minHeight = saved.ticketMinHeight;
    ticket.style.maxWidth = saved.ticketMaxWidth;
    ticket.style.maxHeight = saved.ticketMaxHeight;
    ticket.style.transform = saved.ticketTransform;

    if (wrapper) {
      wrapper.style.width = saved.wrapperWidth;
      wrapper.style.height = saved.wrapperHeight;
      wrapper.style.minWidth = saved.wrapperMinWidth;
      wrapper.style.minHeight = saved.wrapperMinHeight;
      wrapper.style.maxWidth = saved.wrapperMaxWidth;
      wrapper.style.maxHeight = saved.wrapperMaxHeight;
      wrapper.style.flex = saved.wrapperFlex;
      wrapper.style.transform = saved.wrapperTransform;
      if (saved.wrapperScale) {
        wrapper.style.setProperty('--ticket-scale', saved.wrapperScale);
      } else {
        wrapper.style.removeProperty('--ticket-scale');
      }
    }

    if (phoneScreen) {
      phoneScreen.style.transform = saved.phoneTransform;
      if (saved.phoneTicketScale) {
        phoneScreen.style.setProperty('--ticket-scale', saved.phoneTicketScale);
      } else {
        phoneScreen.style.removeProperty('--ticket-scale');
      }
    }

    document.documentElement.classList.remove('ticket-capturing');
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Unable to create the ticket image.'));
    }, 'image/png');
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
