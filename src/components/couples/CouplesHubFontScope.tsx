import { Inter, Playfair_Display } from "next/font/google";

const couplesUi = Inter({
  subsets: ["latin"],
  variable: "--font-couples-ui",
  display: "swap",
});

const couplesDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-couples-display",
  display: "swap",
});

/** Scoped typography for Power Couples — does not replace global church fonts. */
export function CouplesHubFontScope({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${couplesUi.variable} ${couplesDisplay.variable} couples-hub-typography min-h-full`}>
      {children}
    </div>
  );
}
