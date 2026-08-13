"use client";

import Link from "next/link";
import { useState } from "react";
import { site } from "@/lib/site";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-night-900/5 bg-sand-50/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-night-900 text-sm font-semibold text-sand-100 transition group-hover:bg-night-800">
            SC
          </span>
          <div>
            <p className="font-display text-lg font-semibold tracking-tight text-night-900">
              {site.name}
            </p>
            <p className="text-xs text-night-500">Church</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {site.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-night-600 transition hover:text-night-900"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={site.visitCTA.href}
            className={`rounded-full bg-gradient-to-r ${site.visitCTA.gradient} px-4 py-2 text-sm font-medium text-white shadow-sm transition ${site.visitCTA.hoverGradient}`}
          >
            Plan a Visit
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-night-700 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="text-2xl leading-none">{open ? "×" : "☰"}</span>
        </button>
      </div>

      {open && (
        <div className="border-t border-night-900/5 px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {site.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-night-700 hover:bg-sand-100"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
