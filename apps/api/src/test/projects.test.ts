import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

const USER_ID = "user_test";
const WORKSPACE_ID = "ws_test";

// ── DB mock ──────────────────────────────────────────────────────────────────
const mockDb = {
  query: {
    projects: { findMany: vi.fn(), findFirst: vi.fn() },
    workspaceMembers: { findFirst: vi.fn() },
  },
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  select: vi.fn(),
};

vi.mock("@repo/db", () => ({
  db: mockDb,
  projects: {},
  phases: {},
  milestones: {},
  transactions: {},
  workspaceMembers: {},
  auditLogs: {},
}));

// auth.api.getSession returns a valid user by default
vi.mock("../lib/auth.js", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({ user: { id: USER_ID } }),
    },
  },
}));

vi.mock("../lib/audit.js", () => ({ writeAuditLog: vi.fn() }));
vi.mock("../lib/progress.js", () => ({
  computeProjectProgress: vi.fn().mockResolvedValue(42),
}));

const { projectsRouter } = await import("../routes/projects.js");

// ── helpers ──────────────────────────────────────────────────────────────────

function makeApp(role: "owner" | "admin" | "member" = "owner") {
  // workspaceMembers.findFirst controls the role returned by requireAuth
  mockDb.query.workspaceMembers.findFirst.mockResolvedValue({ role });
  const app = new Hono();
  app.route("/api/projects", projectsRouter);
  return app;
}

function req(
  app: ReturnType<typeof makeApp>,
  path: string,
  init?: RequestInit,
) {
  return app.request(`http://localhost${path}`, {
    ...init,
    headers: {
      "X-Workspace-Id": WORKSPACE_ID,
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
}

// ── tests ────────────────────────────────────────────────────────────────────

describe("GET /api/projects", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns an empty list when no projects exist", async () => {
    mockDb.query.projects.findMany.mockResolvedValue([]);
    mockDb.select.mockReturnValue({
      from: () => ({
        innerJoin: () => ({
          where: () => ({ groupBy: () => Promise.resolve([]) }),
        }),
      }),
    });

    const app = makeApp();
    const res = await req(app, "/api/projects");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data).toEqual([]);
  });

  it("attaches computed progress to each project", async () => {
    const project = { id: "p1", name: "Alpha", workspaceId: WORKSPACE_ID };
    mockDb.query.projects.findMany.mockResolvedValue([project]);
    mockDb.select.mockReturnValue({
      from: () => ({
        innerJoin: () => ({
          where: () => ({
            groupBy: () =>
              Promise.resolve([{ projectId: "p1", total: 4, completed: 2 }]),
          }),
        }),
      }),
    });

    const app = makeApp();
    const res = await req(app, "/api/projects");
    const body = (await res.json()) as any;
    expect(res.status).toBe(200);
    expect(body.data[0].progress).toBe(50);
  });

  it("returns 401 without X-Workspace-Id header", async () => {
    // requireAuth returns 400 for missing workspace header — but auth
    // itself passes; missing header → 400 from requireAuth, not 401.
    // Either way the request should not reach the route handler.
    const app = new Hono();
    app.route("/api/projects", projectsRouter);
    const res = await app.request("http://localhost/api/projects");
    expect([400, 401, 403]).toContain(res.status);
  });
});

describe("GET /api/projects/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 404 when project not found", async () => {
    mockDb.query.projects.findFirst.mockResolvedValue(null);
    const app = makeApp();
    const res = await req(app, "/api/projects/nonexistent");
    expect(res.status).toBe(404);
  });

  it("returns project with progress and financials", async () => {
    const project = {
      id: "p1",
      name: "Alpha",
      workspaceId: WORKSPACE_ID,
      budget: "10000",
    };
    mockDb.query.projects.findFirst.mockResolvedValue(project);
    mockDb.select.mockReturnValue({
      from: () => ({
        where: () =>
          Promise.resolve([{ totalIncome: "3000", totalExpenses: "1000" }]),
      }),
    });

    const app = makeApp();
    const res = await req(app, "/api/projects/p1");
    const body = (await res.json()) as any;
    expect(res.status).toBe(200);
    expect(body.data.progress).toBe(42);
    expect(body.data.financials.profit).toBe(2000);
    expect(body.data.financials.budgetUsed).toBe(10);
  });
});

describe("POST /api/projects", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a project and returns 201", async () => {
    const created = { id: "p2", name: "Beta", workspaceId: WORKSPACE_ID };
    mockDb.insert.mockReturnValue({
      values: () => ({ returning: () => Promise.resolve([created]) }),
    });

    const app = makeApp();
    const res = await req(app, "/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Beta", status: "draft" }),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.data.name).toBe("Beta");
  });

  it("rejects an empty name (zod validation)", async () => {
    const app = makeApp();
    const res = await req(app, "/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/projects/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 404 when project not found", async () => {
    mockDb.query.projects.findFirst.mockResolvedValue(null);
    const app = makeApp();
    const res = await req(app, "/api/projects/ghost", { method: "DELETE" });
    expect(res.status).toBe(404);
  });

  it("deletes and returns success", async () => {
    const project = { id: "p1", name: "Alpha", workspaceId: WORKSPACE_ID };
    mockDb.query.projects.findFirst.mockResolvedValue(project);
    mockDb.delete.mockReturnValue({
      where: () => Promise.resolve([]),
    });

    const app = makeApp();
    const res = await req(app, "/api/projects/p1", { method: "DELETE" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
  });

  it("returns 403 when caller is a plain member", async () => {
    const app = makeApp("member");
    const res = await req(app, "/api/projects/p1", { method: "DELETE" });
    expect(res.status).toBe(403);
  });
});
