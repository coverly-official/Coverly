import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { requireRole, requireAdmin } from "../src/middleware/auth.js";
import { requireAdminModule, hasAdminModuleAccess, ALL_ADMIN_MODULES } from "../src/middleware/adminPermissions.js";

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

  it("grants super_admin and admin access to all Admin Control Center modules", () => {
    const superAdmin = { id: "sa-1", email: "sa@coverly.com", full_name: "SA", is_active: true, roles: ["super_admin"], activeRole: "super_admin" };
    const admin = { id: "a-1", email: "a@coverly.com", full_name: "Admin", is_active: true, roles: ["admin"], activeRole: "admin" };

    for (const mod of ALL_ADMIN_MODULES) {
      assert.equal(hasAdminModuleAccess(superAdmin, mod), true);
      assert.equal(hasAdminModuleAccess(admin, mod), true);
    }
  });

  it("restricts operational admin employees to their authorized modules and blocks unauthorized modules with 403", () => {
    const makeRes = () => {
      const state = { status: 0, body: null as any };
      const res: any = {
        status(code: number) {
          state.status = code;
          return this;
        },
        json(payload: any) {
          state.body = payload;
          return this;
        },
      };
      return { res, state };
    };

    // Support executive allowed in support, blocked in finance & system_admin
    let supportPassed = false;
    requireAdminModule("support")(
      { user: { id: "s1", roles: ["support_executive"], activeRole: "support_executive" } } as any,
      {} as any,
      () => { supportPassed = true; }
    );
    assert.equal(supportPassed, true);

    const { res: finRes, state: finState } = makeRes();
    let finNext = false;
    requireAdminModule("finance")(
      { user: { id: "s1", roles: ["support_executive"], activeRole: "support_executive" } } as any,
      finRes,
      () => { finNext = true; }
    );
    assert.equal(finNext, false);
    assert.equal(finState.status, 403);
    assert.equal(finState.body.code, "MODULE_FORBIDDEN");

    // Verification manager allowed in verification & manufacturers, blocked in finance
    let verPassed = false;
    requireAdminModule("verification")(
      { user: { id: "v1", roles: ["verification_manager"], activeRole: "verification_manager" } } as any,
      {} as any,
      () => { verPassed = true; }
    );
    assert.equal(verPassed, true);

    const { res: verFinRes, state: verFinState } = makeRes();
    requireAdminModule("finance")(
      { user: { id: "v1", roles: ["verification_manager"], activeRole: "verification_manager" } } as any,
      verFinRes,
      () => {}
    );
    assert.equal(verFinState.status, 403);

    // Logistics operations manager allowed in logistics & warehouse, blocked in system_admin
    let logPassed = false;
    requireAdminModule("logistics", "warehouse")(
      { user: { id: "l1", roles: ["logistics_operations_manager"], activeRole: "logistics_operations_manager" } } as any,
      {} as any,
      () => { logPassed = true; }
    );
    assert.equal(logPassed, true);

    const { res: logSysRes, state: logSysState } = makeRes();
    requireAdminModule("system_admin")(
      { user: { id: "l1", roles: ["logistics_operations_manager"], activeRole: "logistics_operations_manager" } } as any,
      logSysRes,
      () => {}
    );
    assert.equal(logSysState.status, 403);
  });
});
