import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const profileImageTypes = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

const maxProfileSize = 2 * 1024 * 1024;

function getStorageRoot() {
  return path.resolve(process.cwd(), "storage");
}

async function ensureDirectory(relativeDirectory: string) {
  const directoryPath = path.join(getStorageRoot(), relativeDirectory);
  await mkdir(directoryPath, { recursive: true });
  return directoryPath;
}

export async function saveProfileImage(file: File) {
  const extension = profileImageTypes.get(file.type);

  if (!extension) {
    throw new Error("Profile image must be a JPG, PNG, or WEBP file.");
  }

  if (file.size > maxProfileSize) {
    throw new Error("Profile image must be smaller than 2MB.");
  }

  const directory = await ensureDirectory("profile-pictures");
  const filename = `${randomUUID()}${extension}`;
  const absolutePath = path.join(directory, filename);
  const relativePath = `profile-pictures/${filename}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(absolutePath, buffer);

  return relativePath;
}

export async function deleteStoredFile(relativePath?: string | null) {
  if (!relativePath) {
    return;
  }

  const absolutePath = path.join(getStorageRoot(), relativePath);
  await unlink(absolutePath).catch(() => undefined);
}

export async function readStoredFile(relativePath: string) {
  const normalizedRoot = getStorageRoot();
  const absolutePath = path.resolve(normalizedRoot, relativePath);

  if (!absolutePath.startsWith(normalizedRoot)) {
    throw new Error("Invalid file path.");
  }

  return readFile(absolutePath);
}
