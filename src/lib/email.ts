import { Resend } from "resend";
import { BookingRequest, BookingSubmissionMeta } from "./types";
import { SERVICE_HEALTH_FORMS, SERVICES } from "./constants";

const serviceLabels: Record<string, string> = {
  lashLift: "הרמת ריסים",
  browLiftFull: "הרמת גבות (כולל עיצוב)",
  lashBrowLift: "משולב – הרמת ריסים והרמת גבות",
  browShape: "עיצוב גבות",
  browMustache: "עיצוב גבות + שפם",
  lashLiftBrowShape: "הרמת ריסים + עיצוב גבות",
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildList(items: string[]) {
  if (items.length === 0) {
    return "<p style='margin:0;color:#7a5a66'>לא סומן</p>";
  }

  return `<ul style="margin:0;padding-right:18px;">${items.map((item) => `<li style="margin-bottom:6px;">${item}</li>`).join("")}</ul>`;
}

export async function sendBookingEmail(
  booking: BookingRequest,
  meta?: BookingSubmissionMeta,
) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFICATION_EMAIL;

  if (!apiKey || !to) {
    console.warn("Email skipped: missing RESEND_API_KEY or NOTIFICATION_EMAIL");
    return;
  }

  const resend = new Resend(apiKey);
  const service = (SERVICES as Record<string, { id: string; durationMinutes: number }>)[booking.serviceId];
  if (!service) return;
  const adminPhone = process.env.ADMIN_PHONE_NUMBER ?? "";
  const whatsappLink = `https://wa.me/${adminPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi Natasha, I'd like to confirm my appointment request.\nName: ${booking.fullName}\nPhone: ${booking.phoneNumber}`)}`;

  const form = SERVICE_HEALTH_FORMS[booking.serviceId as keyof typeof SERVICE_HEALTH_FORMS];
  const medicalMap = new Map((form?.medicalOptions ?? []).map((item) => [item.id, item]));
  const consentMap = new Map((form?.consentOptions ?? []).map((item) => [item.id, item]));

  const medicalItems = booking.healthItems
    .filter((id) => medicalMap.has(id))
    .map((id) => {
      const option = medicalMap.get(id)!;
      const details = meta?.healthDetails?.[id]?.trim();
      return details
        ? `${escapeHtml(option.label)}<br/><span style="color:#7a5a66;">פירוט: ${escapeHtml(details)}</span>`
        : escapeHtml(option.label);
    });

  const consentItems = booking.healthItems
    .filter((id) => consentMap.has(id))
    .map((id) => `אושר: ${escapeHtml(consentMap.get(id)!.label)}`);

  const formattedDate = new Date(booking.startsAt).toLocaleString("he-IL");
  const signatureMatch = meta?.signatureDataUrl?.match(
    /^data:(image\/png);base64,([A-Za-z0-9+/=]+)$/,
  );
  const signatureCid = "client-signature";

  await resend.emails.send({
    from: "Tash Lashes <onboarding@resend.dev>",
    to,
    subject: `בקשת תור חדשה - ${booking.fullName}`,
    attachments: signatureMatch
      ? [
          {
            filename: "signature.png",
            content: signatureMatch[2],
            contentType: signatureMatch[1],
            contentId: signatureCid,
          },
        ]
      : undefined,
    html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;background:#fff7fb;padding:24px;color:#3a2d34">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #f4d7e3;border-radius:18px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#f9e7ef,#fff);padding:18px 22px;border-bottom:1px solid #f0d4df">
            <h2 style="margin:0;font-size:22px;">בקשת תור חדשה ממתינה לאישור</h2>
            <p style="margin:8px 0 0 0;color:#7a5a66;">Tash Lashes</p>
          </div>
          <div style="padding:18px 22px;">
            <h3 style="margin:0 0 10px 0;">פרטי לקוחה</h3>
            <p><strong>שם מלא:</strong> ${booking.fullName}</p>
            <p><strong>טלפון:</strong> ${booking.phoneNumber}</p>
            <p><strong>גיל:</strong> ${booking.age}</p>
            <p><strong>תעודת זהות:</strong> ${booking.idNumber}</p>
            <hr style="border:none;border-top:1px solid #f1e1e8;margin:16px 0;" />
            <h3 style="margin:0 0 10px 0;">פרטי טיפול</h3>
            <p><strong>שירות:</strong> ${serviceLabels[service.id] ?? service.id}</p>
            <p><strong>משך טיפול:</strong> ${service.durationMinutes} דקות</p>
            <p><strong>תאריך ושעה:</strong> ${formattedDate}</p>
            <hr style="border:none;border-top:1px solid #f1e1e8;margin:16px 0;" />
            <h3 style="margin:0 0 10px 0;">שאלון רפואי</h3>
            ${buildList(medicalItems)}
            <hr style="border:none;border-top:1px solid #f1e1e8;margin:16px 0;" />
            <h3 style="margin:0 0 10px 0;">הצהרה ואישור טיפול</h3>
            ${buildList(consentItems)}
            <p><strong>אישור נהלים:</strong> אושר</p>
            ${
              signatureMatch
                ? `<hr style="border:none;border-top:1px solid #f1e1e8;margin:16px 0;" />
                   <h3 style="margin:0 0 10px 0;">חתימת לקוחה</h3>
                   <img src="cid:${signatureCid}" alt="חתימת לקוחה" style="display:block;max-width:100%;height:auto;border:1px solid #f0d4df;border-radius:12px;background:#fff;" />`
                : ""
            }
            <div style="margin-top:20px;">
              <a href="${whatsappLink}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:10px 16px;border-radius:999px;font-weight:700;">פתיחת וואטסאפ לאישור תור</a>
            </div>
          </div>
        </div>
      </div>
    `,
  });
}
