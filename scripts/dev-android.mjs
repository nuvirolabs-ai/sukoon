#!/usr/bin/env node
import { spawn } from "node:child_process";
import { detectReachableDevOrigin, loadAndroidEnv } from "./android-env.mjs";

loadAndroidEnv();
const origin = process.env.SUKOON_ANDROID_SERVER_URL || detectReachableDevOrigin();
if (origin) {
  process.env.SUKOON_RUNTIME_PROFILE ||= "ANDROID_DEVICE_DEV";
  process.env.SUKOON_ANDROID_SERVER_URL ||= origin;
  process.env.NEXT_PUBLIC_SUKOON_API_BASE_URL ||= origin;
  const extras = [origin, process.env.SUKOON_TRUSTED_ORIGINS, process.env.BETTER_AUTH_TRUSTED_ORIGINS].filter(Boolean).join(",");
  process.env.SUKOON_TRUSTED_ORIGINS = extras;
  process.env.BETTER_AUTH_TRUSTED_ORIGINS = extras;
}
process.env.APP_ENV ||= "local";
process.env.SUKOON_DATA_DIR ||= ".data";
const child = spawn("npx", ["next", "dev", "--port", "3100", "--hostname", "0.0.0.0"], { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 1));
