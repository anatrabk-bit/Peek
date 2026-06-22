import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl =
  process.env.CAPACITOR_SERVER_URL?.trim() ||
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  "https://peek-eta.vercel.app";

const isLocalDev = serverUrl.startsWith("http://");

const config: CapacitorConfig = {
  appId: "com.peeketa.app",
  appName: "Peek",
  webDir: "www",
  server: {
    url: serverUrl,
    cleartext: isLocalDev,
    androidScheme: "https",
    allowNavigation: [
      "peek-eta.vercel.app",
      "*.vercel.app",
      "*.supabase.co",
      "accounts.google.com",
      "localhost",
      "127.0.0.1",
      "10.0.2.2"
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0284C7",
      showSpinner: false
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#0284C7"
    }
  }
};

export default config;
