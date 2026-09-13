// Vercel serverless endpoint for sending the generated ticket as a PNG attachment.
// Set these environment variables in your Vercel project:
// RESEND_API_KEY, TICKET_TO_EMAIL, TICKET_FROM_EMAIL

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.status(200).json({ success: true });
    return;
  }

  if (request.method !== "POST") {
    response.status(405).json({ success: false, error: "Method not allowed." });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.TICKET_TO_EMAIL;
  const fromEmail = process.env.TICKET_FROM_EMAIL;

  if (!apiKey || !toEmail || !fromEmail) {
    response.status(500).json({
      success: false,
      error: "The email service is not configured yet. Add the required server environment variables.",
    });
    return;
  }

  try {
    const body = request.body || {};
    const dataUrl = String(body.ticket_image || "");
    const date = String(body.date || "");
    const time = String(body.time || "");

    if (!dataUrl.startsWith("data:image/png;base64,")) {
      response.status(400).json({ success: false, error: "Invalid ticket image." });
      return;
    }

    const base64 = dataUrl.substring("data:image/png;base64,".length);
    if (!base64 || base64.length > 15_000_000) {
      response.status(400).json({ success: false, error: "Ticket image is too large." });
      return;
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: "A date ticket has been sent to you",
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6">
            <h2>Someone sent you a date ticket!</h2>
            <p><strong>Date:</strong> ${escapeHtml(date)}</p>
            <p><strong>Time:</strong> ${escapeHtml(time)}</p>
            <p>The generated ticket is attached to this email.</p>
          </div>
        `,
        attachments: [
          {
            filename: "your-date-ticket.png",
            content: base64,
            content_type: "image/png",
          },
        ],
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend API error:", errorText);
      response.status(502).json({ success: false, error: "The email service could not send the ticket." });
      return;
    }

    response.status(200).json({ success: true });
    return;
  } catch (error) {
    console.error("Ticket email error:", error);
    response.status(500).json({ success: false, error: "Unable to send the ticket right now." });
    return;
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, function (character) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    }[character];
  });
}
