#!/usr/bin/env node
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";

const root = resolve(import.meta.dirname, "..");
const android = resolve(root, "android");
const asset = resolve(android, "app/src/main/assets/capacitor.config.json");
const apk = resolve(android, "app/build/outputs/apk/debug/app-debug.apk");
const output = resolve(root, "output/client-review/Sukoon-Client-Review.apk");
loadEnv({ path: resolve(root, ".env.client-review.local") });
loadEnv({ path: resolve(root, ".env") });
const origin = process.env.SUKOON_CLIENT_REVIEW_ORIGIN?.trim();
if (!origin || !/^https:\/\/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.ts\.net\/$/i.test(`${origin}/`)) throw new Error("CLIENT_REVIEW_FUNNEL_ORIGIN_REQUIRED");
const temp = resolve(os.tmpdir(), `sukoon-client-review-${process.pid}`);
const priorAsset = resolve(temp, "capacitor.config.json");
const priorApk = resolve(temp, "app-debug.apk");
mkdirSync(temp, { recursive: true, mode: 0o700 });
if (existsSync(asset)) copyFileSync(asset, priorAsset);
if (existsSync(apk)) copyFileSync(apk, priorApk);

const env = {
  ...process.env,
  APP_ENV: "local",
  NODE_ENV: "development",
  SUKOON_RUNTIME_PROFILE: "CLIENT_REVIEW",
  SUKOON_CLIENT_REVIEW_ORIGIN: origin,
  SUKOON_ANDROID_SERVER_URL: origin,
  NEXT_PUBLIC_SUKOON_API_BASE_URL: origin,
  NEXT_PUBLIC_SUKOON_RUNTIME_PROFILE: "CLIENT_REVIEW",
  SUKOON_TRUSTED_ORIGINS: origin,
  BETTER_AUTH_TRUSTED_ORIGINS: origin,
};

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`CLIENT_REVIEW_ANDROID_STEP_FAILED:${command}`);
}

try {
  run(process.execPath, [resolve(root, "scripts/sync-android.mjs")]);
  run(process.execPath, [resolve(root, "scripts/build-android-apk.mjs")]);
  if (!existsSync(apk)) throw new Error("CLIENT_REVIEW_APK_NOT_CREATED");
  mkdirSync(resolve(output, ".."), { recursive: true, mode: 0o700 });
  copyFileSync(apk, output);
  const bytes = readFileSync(output);
  console.log(`CLIENT_REVIEW_APK_PATH=${output}`);
  console.log(`CLIENT_REVIEW_APK_BYTES=${statSync(output).size}`);
  console.log(`CLIENT_REVIEW_APK_SHA256=${createHash("sha256").update(bytes).digest("hex")}`);
  console.log("CLIENT_REVIEW_APK_SIGNING=existing Android debug signing only");
} finally {
  if (existsSync(priorAsset)) copyFileSync(priorAsset, asset);
  else if (existsSync(asset)) rmSync(asset, { force: true });
  if (existsSync(priorApk)) copyFileSync(priorApk, apk);
  else if (existsSync(apk)) rmSync(apk, { force: true });
  rmSync(temp, { recursive: true, force: true });
}
