import { handle } from "hono/vercel";
import { Hono } from "hono";

export const config = {
  runtime: "nodejs",
};

let handler: ReturnType<typeof handle>;

try {
  const { default: app } = await import("../src/app.ts");
  handler = handle(app);
} catch (err: unknown) {
  const errApp = new Hono();
  const msg = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : "";
  errApp.all("*", (c) => c.json({ initError: msg, stack }, 500));
  handler = handle(errApp);
}

export default handler;
