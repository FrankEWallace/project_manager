import "dotenv/config";
import { db, workspaceMembers } from "@repo/db";
import { eq } from "drizzle-orm";

const members = await db.query.workspaceMembers.findMany({
  where: eq(workspaceMembers.userId, "1bfTKVGgczVMPxeFT9xjMFqEFUbbS4a3"),
});
console.log(JSON.stringify(members, null, 2));
process.exit(0);
