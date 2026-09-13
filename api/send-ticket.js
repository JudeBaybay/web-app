export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const { image, filename, date, time } = req.body || {};

    if (!image) {
      return res.status(400).json({ error: "Ticket image is required." });
    }

    if (!process.env.RESEND_API_KEY || !process.env.TICKET_TO_EMAIL || !process.env.TICKET_FROM_EMAIL) {
      return res.status(500).json({ error: "Email service is not configured." });
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.TICKET_FROM_EMAIL,
        to: [process.env.TICKET_TO_EMAIL],
        subject: "New Date Ticket",
        html: `<p>A new date ticket was sent from the website.</p><p><strong>Date:</strong> ${escapeHtml(date || "")}</p><p><strong>Time:</strong> ${escapeHtml(time || "")}</p>`,
        attachments: [{
          filename: filename || "your-date-ticket.png",
          content: image,
        }],
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Resend error:", result);
      return res.status(response.status).json({ error: result.message || "Resend could not send the email." });
    }

    return res.status(200).json({ ok: true, id: result.id });
  } catch (error) {
    console.error("Ticket email error:", error);
    return res.status(500).json({ error: "Unable to send ticket." });
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
