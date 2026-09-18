#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { detectReachableDevOrigin, loadAndroidEnv, toolchainEnv } from "./android-env.mjs";

loadAndroidEnv();
const origin = process.env.SUKOON_ANDROID_SERVER_URL || detectReachableDevOrigin();
if (origin && !process.env.SUKOON_ANDROID_SERVER_URL) {
  process.env.SUKOON_ANDROID_SERVER_URL = origin;
  process.env.NEXT_PUBLIC_SUKOON_API_BASE_URL ||= origin;
  writeFileSync(resolve(".env.android.local"), `# Generated for local Android debug. Do not commit.\nSUKOON_RUNTIME_PROFILE=ANDROID_DEVICE_DEV\nSUKOON_ANDROID_SERVER_URL="${origin}"\nNEXT_PUBLIC_SUKOON_API_BASE_URL="${origin}"\nSUKOON_TRUSTED_ORIGINS="${origin}"\nBETTER_AUTH_TRUSTED_ORIGINS="${origin}"\n`);
  console.log(`Wrote gitignored .env.android.local with ${origin}`);
}
if (!process.env.SUKOON_ANDROID_SERVER_URL) {
  console.warn("SUKOON_ANDROID_SERVER_URL is unset. The APK will show the native-shell fallback until you configure a reachable backend.");
}
process.env.SUKOON_RUNTIME_PROFILE ||= "ANDROID_DEVICE_DEV";
const result = spawnSync("npx", ["cap", "sync", "android"], { stdio: "inherit", env: toolchainEnv() });
process.exit(result.status ?? 1);
