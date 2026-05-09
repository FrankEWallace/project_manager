import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db, workspaces, workspaceMembers, authUser, authSession, authAccount, authVerification } from "@repo/db";

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: authUser,
      session: authSession,
      account: authAccount,
      verification: authVerification,
    },
  }),
  baseURL: process.env["BETTER_AUTH_URL"] ?? "http://localhost:3001",
  secret: process.env["BETTER_AUTH_SECRET"],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const name = `${user.name}'s Workspace`;
          const slug = slugify(name);

          const [workspace] = await (db.insert(workspaces).values({ name, slug } as any).returning());

          await (db.insert(workspaceMembers).values({
            workspaceId: workspace!.id,
            userId: user.id,
            role: "owner",
          } as any));
        },
      },
    },
  },
  trustedOrigins: [process.env["WEB_URL"] ?? "http://localhost:3000"],
  plugins: [bearer()],
});

export type Auth = typeof auth;
