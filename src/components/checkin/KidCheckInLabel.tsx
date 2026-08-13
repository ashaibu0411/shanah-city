"use client";

import type { KidCheckIn } from "@/lib/member-types";
import { site } from "@/lib/site";

type KidCheckInLabelProps = {
  checkIn: KidCheckIn;
  printId?: string;
};

export function KidCheckInLabel({ checkIn, printId = "kid-checkin-label" }: KidCheckInLabelProps) {
  const checkedInTime = new Date(checkIn.checkedInAt).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      id={printId}
      className="kid-checkin-label mx-auto w-full max-w-sm rounded-2xl border-2 border-dashed border-night-900 bg-white p-5 text-night-900 shadow-sm"
    >
      <div className="border-b border-night-900/10 pb-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sand-600">
          {site.name}
        </p>
        <p className="mt-1 text-sm font-semibold">Kids Ministry Check-in</p>
      </div>

      <div className="py-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-night-500">Child</p>
        <p className="mt-1 font-display text-3xl font-semibold">{checkIn.childName}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-sand-50 p-3">
          <p className="text-xs font-semibold uppercase text-night-500">Room</p>
          <p className="mt-1 font-medium">{checkIn.ageGroup}</p>
        </div>
        <div className="rounded-xl bg-sand-50 p-3">
          <p className="text-xs font-semibold uppercase text-night-500">Service</p>
          <p className="mt-1 font-medium">{checkIn.service}</p>
        </div>
        <div className="col-span-2 rounded-xl bg-sand-50 p-3">
          <p className="text-xs font-semibold uppercase text-night-500">Parent / guardian</p>
          <p className="mt-1 font-medium">{checkIn.parentName}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-night-900 px-4 py-5 text-center text-sand-50">
        <p className="text-xs font-semibold uppercase tracking-wider text-sand-300">
          Pickup security code
        </p>
        <p className="mt-2 font-display text-4xl font-semibold tracking-[0.2em]">
          {checkIn.securityCode ?? "----"}
        </p>
      </div>

      <div className="mt-4 space-y-1 text-center text-xs text-night-500">
        <p>Checked in: {checkedInTime}</p>
        {checkIn.notes && <p>Notes: {checkIn.notes}</p>}
        <p className="pt-2 font-semibold text-night-700">
          Keep this label for pickup. Present the security code to collect your child.
        </p>
      </div>
    </div>
  );
}

export function printKidCheckInLabel(checkIn: KidCheckIn) {
  const checkedInTime = new Date(checkIn.checkedInAt).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const printWindow = window.open("", "_blank", "width=480,height=720");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${checkIn.childName} Check-in Label</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #1a2332; }
          .label { max-width: 360px; margin: 0 auto; border: 2px dashed #1a2332; border-radius: 16px; padding: 20px; }
          .brand { text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 12px; }
          .brand small { letter-spacing: 0.15em; text-transform: uppercase; color: #967652; font-weight: 700; }
          .child { text-align: center; padding: 16px 0; }
          .child h1 { margin: 8px 0 0; font-size: 28px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; }
          .box { background: #faf8f5; border-radius: 10px; padding: 10px; }
          .box.full { grid-column: span 2; }
          .box span { display: block; font-size: 10px; text-transform: uppercase; color: #738aab; font-weight: 700; }
          .code { margin-top: 16px; background: #1a2332; color: white; border-radius: 14px; padding: 16px; text-align: center; }
          .code strong { display: block; font-size: 34px; letter-spacing: 0.2em; margin-top: 8px; }
          .footer { margin-top: 16px; text-align: center; font-size: 11px; color: #526b91; }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="brand">
            <small>${site.name}</small>
            <div>Kids Ministry Check-in</div>
          </div>
          <div class="child">
            <span>CHILD</span>
            <h1>${checkIn.childName}</h1>
          </div>
          <div class="grid">
            <div class="box"><span>Room</span>${checkIn.ageGroup}</div>
            <div class="box"><span>Service</span>${checkIn.service}</div>
            <div class="box full"><span>Parent / guardian</span>${checkIn.parentName}</div>
          </div>
          <div class="code">
            <span>PICKUP SECURITY CODE</span>
            <strong>${checkIn.securityCode ?? "----"}</strong>
          </div>
          <div class="footer">
            <div>Checked in: ${checkedInTime}</div>
            ${checkIn.notes ? `<div>Notes: ${checkIn.notes}</div>` : ""}
            <div style="margin-top:10px;font-weight:700;">Keep this label for pickup.</div>
          </div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}
