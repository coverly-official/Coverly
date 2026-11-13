import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { requireRole, requireAdmin } from "../src/middleware/auth.js";

describe("Security & Authorization Middleware Tests", () => {
  it("allows access when user possesses the exact required role", () => {
    let nextCalled = false;
    const req: any = {
      user: {
        id: "usr-1",
        email: "buyer@example.com",
        roles: ["buyer"],
        activeRole: "buyer",
      },
    };
    const res: any = {};
    const next = () => { nextCalled = true; };

    const middleware = requireRole("buyer");
    middleware(req, res, next);

    assert.equal(nextCalled, true);
  });

  it("blocks access and returns 403 when user lacks required role", () => {
    let statusCode = 0;
    let responseBody: any = null;
    let nextCalled = false;

    const req: any = {
      user: {
        id: "usr-2",
        email: "buyer@example.com",
        roles: ["buyer"],
        activeRole: "buyer",
      },
    };
    const res: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        responseBody = data;
        return this;
      },
    };
    const next = () => { nextCalled = true; };

    const middleware = requireRole("manufacturer", "wholesaler");
    middleware(req, res, next);

    assert.equal(nextCalled, false);
    assert.equal(statusCode, 403);
    assert.equal(responseBody.success, false);
    assert.match(responseBody.error, /Access denied/);
  });

  it("always grants access to users with 'admin' role", () => {
    let nextCalled = false;
    const req: any = {
      user: {
        id: "adm-1",
        email: "admin@coverly.internal",
        roles: ["admin"],
        activeRole: "admin",
      },
    };
    const res: any = {};
    const next = () => { nextCalled = true; };

    const middleware = requireRole("manufacturer");
    middleware(req, res, next);

    assert.equal(nextCalled, true);
  });

  it("requireAdmin passes for support_admin and verification_admin", () => {
    let verAdminPassed = false;
    let supAdminPassed = false;

    requireAdmin({ user: { roles: ["verification_admin"] } } as any, {} as any, () => {
      verAdminPassed = true;
    });
    requireAdmin({ user: { roles: ["support_admin"] } } as any, {} as any, () => {
      supAdminPassed = true;
    });

    assert.equal(verAdminPassed, true);
    assert.equal(supAdminPassed, true);
  });

  it("requireAdmin rejects unauthenticated or regular users with 403", () => {
    let statusCode = 0;
    const res: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json() { return this; },
    };

    requireAdmin({ user: { roles: ["buyer"] } } as any, res, () => {});
    assert.equal(statusCode, 403);
  });
});
