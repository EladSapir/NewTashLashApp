import { Resend } from "resend";
import { BookingRequest } from "./types";
import { SERVICES } from "./constants";

const healthLabels: Record<string, string> = {
  pregnant: "בהריון או בהנקה",
  skinCondition: "מצב עור פעיל באזור העיניים/הגבות",
  allergy: "אלרגיה ידועה לחומרים קוסמטיים",
  eyeInfection: "גירוי או דלקת עיניים לאחרונה",
  medication: "שימוש בתרופות המשפיעות על רגישות העור",
  none: "ללא",
};

const serviceLabels: Record<string, string> = {
  lashLift: "הרמת ריסים",
  browLiftFull: "הרמת גבות (כולל עיצוב)",
  lashBrowLift: "משולב – הרמת ריסים והרמת גבות",
  browShape: "עיצוב גבות",
  browMustache: "עיצוב גבות + שפם",
  lashLiftBrowShape: "הרמת ריסים + עיצוב גבות",
};

export async function sendBookingEmail(booking: BookingRequest) {
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

  const healthSummary = booking.healthItems
    .map((item) => healthLabels[item] ?? item)
    .join(" | ");

  const formattedDate = new Date(booking.startsAt).toLocaleString("he-IL");

  await resend.emails.send({
    from: "Tash Lashes <onboarding@resend.dev>",
    to,
    subject: `בקשת תור חדשה - ${booking.fullName}`,
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
            <h3 style="margin:0 0 10px 0;">הצהרת בריאות</h3>
            <p>${healthSummary}</p>
            <p><strong>אישור נהלים:</strong> אושר</p>
            <div style="margin-top:20px;">
              <a href="${whatsappLink}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:10px 16px;border-radius:999px;font-weight:700;">פתיחת וואטסאפ לאישור תור</a>
            </div>
          </div>
        </div>
      </div>
    `,
  });
}
