// Vercel serverless endpoint for sending the generated ticket as a PNG attachment.
// Set these environment variables in your Vercel project:
// RESEND_API_KEY, TICKET_TO_EMAIL, TICKET_FROM_EMAIL

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export default async function handler(request) {
  if (request.method === "OPTIONS") return json({ success: true });
  if (request.method !== "POST") return json({ success: false, error: "Method not allowed." }, 405);

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.TICKET_TO_EMAIL;
  const fromEmail = process.env.TICKET_FROM_EMAIL;

  if (!apiKey || !toEmail || !fromEmail) {
    return json({
      success: false,
      error: "The email service is not configured yet. Add the required server environment variables.",
    }, 500);
  }

  try {
    const body = await request.json();
    const dataUrl = String(body.ticket_image || "");
    const date = String(body.date || "");
    const time = String(body.time || "");

    if (!dataUrl.startsWith("data:image/png;base64,")) {
      return json({ success: false, error: "Invalid ticket image." }, 400);
    }

    const base64 = dataUrl.substring("data:image/png;base64,".length);
    if (!base64 || base64.length > 15_000_000) {
      return json({ success: false, error: "Ticket image is too large." }, 400);
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
      return json({ success: false, error: "The email service could not send the ticket." }, 502);
    }

    return json({ success: true });
  } catch (error) {
    console.error("Ticket email error:", error);
    return json({ success: false, error: "Unable to send the ticket right now." }, 500);
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
