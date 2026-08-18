import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = (
  process.env.CAPACITOR_SERVER_URL?.trim() ||
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  "https://shanah-city.vercel.app"
).replace(/\/$/, "");

const config: CapacitorConfig = {
  appId: "org.shanahcity.app",
  appName: "Shanah City",
  webDir: "mobile/www",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#faf8f5",
      showSpinner: false,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#1a2332",
    },
  },
};

export default config;
