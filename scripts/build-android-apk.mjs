#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { sdkDir, toolchainEnv } from "./android-env.mjs";

const sync = spawnSync("node", ["scripts/sync-android.mjs"], { stdio: "inherit", env: process.env });
if (sync.status) process.exit(sync.status);

const android = resolve("android");
if (!existsSync(android)) {
  console.error("android/ is missing. Run npx cap add android first.");
  process.exit(1);
}
writeFileSync(resolve(android, "local.properties"), `sdk.dir=${sdkDir()}\n`);
const env = toolchainEnv();
const gradleCandidates = [
  resolve(android, ".gradle-dist/gradle-8.14.3/bin/gradle"),
  "/tmp/gradle-8.14.3/gradle-8.14.3/bin/gradle",
  resolve(android, "gradlew"),
];
const gradle = gradleCandidates.find((path) => existsSync(path));
if (!gradle) {
  console.error("Gradle 8.14.3 was not found. Download it with curl (Java's wrapper download times out on some Macs) and retry.");
  process.exit(1);
}
const args = gradle.endsWith("gradlew") ? ["assembleDebug", "--no-daemon"] : ["assembleDebug", "--no-daemon"];
const build = spawnSync(gradle, args, { cwd: android, stdio: "inherit", env });
if (build.status) process.exit(build.status);

const apk = resolve(android, "app/build/outputs/apk/debug/app-debug.apk");
if (!existsSync(apk)) {
  console.error("Debug APK was not produced.");
  process.exit(1);
}
const bytes = readFileSync(apk);
const sha256 = createHash("sha256").update(bytes).digest("hex");
console.log(`APK_PATH=${apk}`);
console.log(`APK_BYTES=${statSync(apk).size}`);
console.log(`APK_SHA256=${sha256}`);
