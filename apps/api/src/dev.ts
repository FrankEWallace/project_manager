import "dotenv/config";
import app from "./app.js";

export default app;

// Local dev server only — skipped on Vercel
if (!process.env["VERCEL"]) {
  const { serve } = await import("@hono/node-server");
  const port = Number(process.env["PORT"] ?? 3001);
  console.log(`API running on http://localhost:${port}`);
  serve({ fetch: app.fetch, port });
}
