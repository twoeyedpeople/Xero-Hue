import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream, watch } from "node:fs";
import { copyFile, mkdir, readdir, stat } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "assets/rive/xerocon.riv");
const destination = resolve(root, "public/rive/xerocon.riv");
const imagesSource = resolve(root, "assets/images");
const imagesDestination = resolve(root, "public/images");
const nextBin = resolve(root, "node_modules/.bin/next");
const sourceName = basename(source);

let syncTimer = null;
let syncing = false;
let syncAgain = false;
let lastSyncedSourceSignature = null;

function hashFile(path) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(path);

    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

async function getFileSignature(path) {
  const stats = await stat(path);

  return `${stats.size}:${stats.mtimeMs}`;
}

async function filesMatch() {
  try {
    const [sourceStats, destinationStats] = await Promise.all([stat(source), stat(destination)]);

    if (sourceStats.size !== destinationStats.size) {
      return false;
    }

    const [sourceHash, destinationHash] = await Promise.all([hashFile(source), hashFile(destination)]);
    return sourceHash === destinationHash;
  } catch {
    return false;
  }
}

async function syncRive() {
  if (syncing) {
    syncAgain = true;
    return;
  }

  syncing = true;

  try {
    const sourceSignature = await getFileSignature(source);

    if (sourceSignature === lastSyncedSourceSignature && (await filesMatch())) {
      return;
    }

    await mkdir(dirname(destination), { recursive: true });

    if (await filesMatch()) {
      lastSyncedSourceSignature = sourceSignature;
      return;
    }

    await copyFile(source, destination);
    lastSyncedSourceSignature = sourceSignature;
    console.log("[rive] synced assets/rive/xerocon.riv -> public/rive/xerocon.riv");
  } finally {
    syncing = false;

    if (syncAgain) {
      syncAgain = false;
      await syncRive();
    }
  }
}

async function syncImages() {
  await mkdir(imagesDestination, { recursive: true });
  const files = await readdir(imagesSource);

  await Promise.all(
    files.map((file) => copyFile(resolve(imagesSource, file), resolve(imagesDestination, file))),
  );
}

function queueSync() {
  if (syncTimer) {
    clearTimeout(syncTimer);
  }

  syncTimer = setTimeout(() => {
    syncTimer = null;
    void syncRive();
  }, 120);
}

await Promise.all([syncRive(), syncImages()]);

const watcher = watch(dirname(source), (eventType, filename) => {
  if (filename === sourceName) {
    queueSync();
  }
});
const imageWatcher = watch(imagesSource, () => {
  void syncImages();
});
const next = spawn(nextBin, ["dev", "--turbopack"], {
  cwd: root,
  env: process.env,
  stdio: "inherit",
});

function shutdown(signal) {
  watcher.close();
  imageWatcher.close();

  if (!next.killed) {
    next.kill(signal);
  }
}

next.on("exit", (code) => {
  watcher.close();
  imageWatcher.close();
  process.exit(code ?? 0);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
