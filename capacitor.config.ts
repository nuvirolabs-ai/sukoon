import { config as loadEnv } from "dotenv";
import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize } from "@capacitor/keyboard";
import { androidServerUrl, resolveSukoonRuntimeProfile } from "./lib/runtime-profile";

loadEnv({ path: ".env.android.local" });
loadEnv();

const profile = resolveSukoonRuntimeProfile();
const serverUrl = androidServerUrl();
const serverScheme = serverUrl ? new URL(serverUrl).protocol : undefined;
const allowNavigation = serverUrl ? [new URL(serverUrl).host] : [];
const appLinkHost = profile === "CLIENT_REVIEW" ? undefined : process.env.SUKOON_APP_LINK_HOST?.trim();

const config: CapacitorConfig = {
  appId: "com.nuvirolabs.sukoon",
  appName: "Sukoon",
  webDir: "native-shell",
  backgroundColor: "#f7f3eb",
  loggingBehavior: profile === "CLIENT_REVIEW" ? "none" : "debug",
  server: {
    // A live HTTP debug origin must remain HTTP in the WebView. With an HTTP
    // server URL, forcing the WebView scheme to HTTPS sends Capacitor's error
    // page to https://localhost instead of the configured USB reverse target.
    // Hosted profiles stay HTTPS-only through androidServerUrl().
    androidScheme: serverScheme === "http:" ? "http" : "https",
    // Capacitor builds the native fallback URL from `server.hostname`. Keep
    // that host aligned with the configured live origin so a retry stays in
    // the app WebView instead of being handed to the external browser.
    ...(serverUrl ? { hostname: new URL(serverUrl).hostname } : {}),
    errorPath: "error.html",
    ...(serverUrl ? {
      url: serverUrl,
      cleartext: new URL(serverUrl).protocol === "http:",
      allowNavigation,
    } : {}),
  },
  plugins: {
    SystemBars: {
      insetsHandling: "css",
      style: "LIGHT",
      hidden: false,
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
    SplashScreen: {
      launchShowDuration: 400,
      launchAutoHide: true,
      backgroundColor: "#f7f3eb",
      androidScaleType: "CENTER",
      showSpinner: false,
    },
    CapacitorCookies: { enabled: false },
    CapacitorHttp: { enabled: false },
    Camera: {
      presentationStyle: "fullScreen",
    },
  },
  android: {
    path: "android",
    allowMixedContent: false,
    webContentsDebuggingEnabled: profile !== "PRODUCTION" && profile !== "CLIENT_REVIEW",
    backgroundColor: "#f7f3eb",
  },
};

if (appLinkHost) {
  config.server = {
    ...config.server,
    allowNavigation: [...new Set([...(config.server?.allowNavigation ?? []), appLinkHost])],
  };
}

export default config;
