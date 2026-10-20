import { afterEach, describe, expect, it } from "vitest";
import { defaultDocumentStorageRoot } from "@/platform/storage/local";

const originalPath = process.env.DOCUMENT_STORAGE_PATH;
const originalVercel = process.env.VERCEL;

afterEach(() => {
  if (originalPath === undefined) delete process.env.DOCUMENT_STORAGE_PATH;
  else process.env.DOCUMENT_STORAGE_PATH = originalPath;
  if (originalVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = originalVercel;
});

describe("defaultDocumentStorageRoot", () => {
  it("uses /tmp on Vercel when no storage path is configured", () => {
    delete process.env.DOCUMENT_STORAGE_PATH;
    process.env.VERCEL = "1";
    expect(defaultDocumentStorageRoot()).toBe("/tmp/aspera-uploads");
  });

  it("keeps an explicit storage path", () => {
    process.env.DOCUMENT_STORAGE_PATH = "/var/aspera-docs";
    process.env.VERCEL = "1";
    expect(defaultDocumentStorageRoot()).toBe("/var/aspera-docs");
  });
});
