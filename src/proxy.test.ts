import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

function request(path: string, cookie?: string) {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  return new NextRequest(new URL(path, "http://localhost:3000"), { headers });
}

describe("proxy auth gates", () => {
  it("redirects logged-out /seller to login", () => {
    const response = proxy(request("/seller/inventory"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain(
      "/login?next=%2Fseller%2Finventory",
    );
  });

  it("redirects logged-out /admin to login", () => {
    const response = proxy(request("/admin"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login?next=%2Fadmin");
  });

  it("allows logged-in /seller through and marks seller surface", () => {
    const response = proxy(
      request("/seller/catalogue", "aspera_session=test-token"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("x-robots-tag")).toContain("noindex");
  });
});
