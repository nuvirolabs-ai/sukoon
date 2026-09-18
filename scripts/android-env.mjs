import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";

export function loadAndroidEnv(root = process.cwd()) {
  loadEnv({ path: resolve(root, ".env.android.local") });
  loadEnv({ path: resolve(root, ".env") });
}

function ipv4Origin(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  const ip = result.stdout?.trim().split(/\s+/)[0];
  if (result.status === 0 && ip && /^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip)) return `http://${ip}:3100`;
  return undefined;
}

export function detectReachableDevOrigin() {
  if (process.env.SUKOON_ANDROID_SERVER_URL) return process.env.SUKOON_ANDROID_SERVER_URL;
  if (process.env.NEXT_PUBLIC_SUKOON_API_BASE_URL) return process.env.NEXT_PUBLIC_SUKOON_API_BASE_URL;
  // Phones on the same Wi-Fi can reach the Mac LAN address. Tailscale only works if the phone also runs Tailscale.
  return ipv4Origin("ipconfig", ["getifaddr", "en0"]) || ipv4Origin("tailscale", ["ip", "-4"]);
}

export function toolchainEnv() {
  const home = process.env.HOME || "";
  const repoJdk = resolve(process.cwd(), "android/.jdk/temurin-21");
  const studioJbr = "/Applications/Android Studio.app/Contents/jbr/Contents/Home";
  const javaHome = existsSync(resolve(repoJdk, "bin/java"))
    ? repoJdk
    : process.env.JAVA_HOME || (existsSync(studioJbr) ? studioJbr : "/opt/homebrew/opt/openjdk@17");
  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || resolve(home, "Library/Android/sdk");
  return {
    ...process.env,
    JAVA_HOME: javaHome,
    ANDROID_HOME: androidHome,
    ANDROID_SDK_ROOT: androidHome,
    PATH: `${javaHome}/bin:${androidHome}/platform-tools:${androidHome}/cmdline-tools/latest/bin:${process.env.PATH || ""}`,
  };
}

export function sdkDir() {
  return toolchainEnv().ANDROID_HOME;
}

export function readText(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}
