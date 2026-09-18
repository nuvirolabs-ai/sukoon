#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { loadAndroidEnv, toolchainEnv } from "./android-env.mjs";

const root = resolve(import.meta.dirname, "..");
process.chdir(root);
loadAndroidEnv(root);
const env = toolchainEnv();
const adb = resolve(env.ANDROID_HOME, "platform-tools/adb");
const serial = process.env.SUKOON_ANDROID_DEVICE_SERIAL || process.argv[2];
const packageId = "com.nuvirolabs.sukoon";
const phonePort = 3100;
const macPort = Number(process.env.SUKOON_ANDROID_MAC_PORT || 3110);
const configuredUrl = process.env.SUKOON_ANDROID_SERVER_URL || "http://127.0.0.1:3100";

function run(command, args, { allowFailure = false } = {}) {
  const result = spawnSync(command, args, { cwd: root, env, encoding: "utf8" });
  if (result.status !== 0 && !allowFailure) {
    throw new Error(`${command} ${args.join(" ")} failed: ${(result.stderr || result.stdout || "").trim()}`);
  }
  return { status: result.status ?? 1, stdout: (result.stdout || "").trim(), stderr: (result.stderr || "").trim() };
}

function fail(message) {
  console.error(`ANDROID_REVIEW_BLOCKED=${message}`);
  process.exit(1);
}

if (!existsSync(adb)) fail(`adb was not found at ${adb}`);
if (!serial) fail("Set SUKOON_ANDROID_DEVICE_SERIAL to the intended USB device serial.");

const devices = run(adb, ["devices", "-l"]).stdout.split("\n").map((line) => line.trim()).filter((line) => line && !line.startsWith("List of devices"));
const selected = devices.find((line) => line.split(/\s+/)[0] === serial);
if (!selected || selected.split(/\s+/)[1] !== "device") fail(`device ${serial} is not connected and ready: ${selected || "not listed"}`);
console.log(`ANDROID_DEVICE=${selected}`);

const url = new URL(configuredUrl);
if (url.protocol !== "http:" || url.hostname !== "127.0.0.1" || url.port !== "3100") {
  fail(`expected the debug APK origin http://127.0.0.1:3100, found ${configuredUrl}`);
}
const assetPath = resolve(root, "android/app/src/main/assets/capacitor.config.json");
if (!existsSync(assetPath)) fail("Capacitor config asset is missing; run npm run android:sync first.");
const capacitorConfig = JSON.parse(readFileSync(assetPath, "utf8"));
if (capacitorConfig.server?.url !== configuredUrl || capacitorConfig.server?.androidScheme !== "http") {
  fail(`installed-source config is not the HTTP USB-reverse profile (${JSON.stringify({ url: capacitorConfig.server?.url, androidScheme: capacitorConfig.server?.androidScheme })})`);
}
console.log(`SUKOON_DEBUG_ORIGIN=${configuredUrl}`);
console.log(`ANDROID_SCHEME=${capacitorConfig.server.androidScheme}`);

const listeners = run("lsof", ["-t", `-iTCP:${macPort}`, "-sTCP:LISTEN"], { allowFailure: true }).stdout.split("\n").filter(Boolean);
if (!listeners.length) fail(`nothing is listening on the configured Sukoon Mac port ${macPort}`);
const processTable = run("ps", ["-axo", "pid=,command="]).stdout;
function processChain(pid) {
  const chain = [];
  let current = pid;
  for (let depth = 0; depth < 6 && current; depth += 1) {
    const row = run("ps", ["-p", current, "-o", "ppid=,command="], { allowFailure: true }).stdout;
    if (!row) break;
    chain.push(row);
    const parent = row.match(/^\s*(\d+)\s+/)?.[1];
    if (!parent || parent === current) break;
    current = parent;
  }
  return chain;
}
const ownerChains = listeners.map(processChain);
const ownedBySukoon = ownerChains.some((chain) => chain.some((row) => row.includes(root)));
if (!ownedBySukoon) fail(`port ${macPort} is owned by another process; refusing to take it over (pids: ${listeners.join(", ")})`);
console.log(`SUKOON_MAC_PORT=${macPort}`);
console.log(`SUKOON_MAC_LISTENER_PIDS=${listeners.join(",")}`);

const rootStatus = run("curl", ["-fsS", "-o", "/dev/null", "-w", "%{http_code}", `http://127.0.0.1:${macPort}/`]).stdout;
const healthStatus = run("curl", ["-fsS", "-o", "/dev/null", "-w", "%{http_code}", `http://127.0.0.1:${macPort}/api/health`]).stdout;
if (rootStatus !== "200" || healthStatus !== "200") fail(`Sukoon prerequisite responses were root=${rootStatus} health=${healthStatus}`);
console.log(`SUKOON_HTTP=root:${rootStatus},health:${healthStatus}`);

const worker = processTable.split("\n").find((line) => line.includes("scripts/run-local-worker.ts"));
if (!worker) fail("the durable local worker is not running; start npm run worker:local first");
console.log(`SUKOON_WORKER=${worker.trim()}`);

const packagePath = run(adb, ["-s", serial, "shell", "pm", "path", packageId]);
if (!packagePath.stdout.includes("package:")) fail(`installed package ${packageId} was not found`);
const packageInfo = run(adb, ["-s", serial, "shell", "dumpsys", "package", packageId]).stdout;
const versionName = packageInfo.match(/versionName=([^\s]+)/)?.[1] || "unknown";
const versionCode = packageInfo.match(/versionCode=([^\s]+)/)?.[1] || "unknown";
console.log(`ANDROID_PACKAGE=${packageId}`);
console.log(`ANDROID_VERSION=${versionName} (${versionCode})`);

run(adb, ["-s", serial, "reverse", `tcp:${phonePort}`, `tcp:${macPort}`]);
const mapping = run(adb, ["-s", serial, "reverse", "--list"]).stdout;
if (!mapping.split("\n").some((line) => line.includes(`tcp:${phonePort} tcp:${macPort}`))) fail(`the expected USB mapping was not applied: ${mapping}`);
console.log(`ANDROID_REVERSE=tcp:${phonePort}->tcp:${macPort}`);
console.log(`ANDROID_REVERSE_LIST=${mapping.replace(/\n/g, " | ")}`);

run(adb, ["-s", serial, "shell", "am", "start", "-n", `${packageId}/.MainActivity`]);
console.log("ANDROID_APP_LAUNCHED=YES");
console.log("REVIEW_NEXT=Use the installed app; disconnect/reconnect by rerunning npm run android:review with the same device serial.");
