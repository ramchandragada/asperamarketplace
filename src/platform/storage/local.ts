import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

export type StoredObject = {
  key: string;
  fileName: string;
  contentType: string;
  byteSize: number;
  checksumSha256: string;
};

export type ObjectStorage = {
  put(input: {
    namespace: string;
    fileName: string;
    contentType: string;
    bytes: Buffer;
  }): Promise<StoredObject>;
  get(key: string): Promise<Buffer>;
};

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

const MAX_BYTES = 5 * 1024 * 1024;

export class LocalObjectStorage implements ObjectStorage {
  constructor(private readonly rootDir: string) {}

  async put(input: {
    namespace: string;
    fileName: string;
    contentType: string;
    bytes: Buffer;
  }): Promise<StoredObject> {
    if (!ALLOWED_TYPES.has(input.contentType)) {
      throw new StorageValidationError(
        "Only PDF, JPEG, and PNG documents are accepted",
      );
    }
    if (input.bytes.byteLength === 0 || input.bytes.byteLength > MAX_BYTES) {
      throw new StorageValidationError("Document must be between 1 byte and 5 MB");
    }

    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
    const key = path.posix.join(
      input.namespace,
      `${randomUUID()}-${safeName}`,
    );
    const absolute = path.join(this.rootDir, key);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, input.bytes, { flag: "wx" });
    const checksumSha256 = createHash("sha256").update(input.bytes).digest("hex");

    return {
      key,
      fileName: safeName,
      contentType: input.contentType,
      byteSize: input.bytes.byteLength,
      checksumSha256,
    };
  }

  async get(key: string): Promise<Buffer> {
    const absolute = path.join(this.rootDir, key);
    const normalizedRoot = path.resolve(this.rootDir);
    const normalizedFile = path.resolve(absolute);
    if (!normalizedFile.startsWith(normalizedRoot + path.sep)) {
      throw new StorageValidationError("Invalid storage key");
    }
    return readFile(normalizedFile);
  }
}

export class StorageValidationError extends Error {
  readonly code = "STORAGE_VALIDATION";

  constructor(message: string) {
    super(message);
    this.name = "StorageValidationError";
  }
}

export function createDocumentStorage(): ObjectStorage {
  const root =
    process.env.DOCUMENT_STORAGE_PATH ??
    path.join(process.cwd(), "uploads", "kyc");
  return new LocalObjectStorage(root);
}
