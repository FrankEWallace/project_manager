import { db, auditLogs } from "@repo/db";

type AuditEntity = typeof auditLogs.$inferInsert["entity"];
type AuditAction = typeof auditLogs.$inferInsert["action"];

interface AuditParams {
  workspaceId: string;
  userId?: string;
  entity: AuditEntity;
  entityId: string;
  action: AuditAction;
  diff?: { before?: unknown; after?: unknown };
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(params: AuditParams): Promise<void> {
  await db.insert(auditLogs).values({
    workspaceId: params.workspaceId,
    userId: params.userId ?? null,
    entity: params.entity,
    entityId: params.entityId,
    action: params.action,
    diff: params.diff ?? null,
    metadata: params.metadata ?? null,
  });
}
