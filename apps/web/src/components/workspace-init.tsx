"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { apiRequest } from "@/lib/api";
import { setWorkspaceId, getWorkspaceId } from "@/lib/workspace";

// Fetches the user's workspace and stores the ID in localStorage
export function WorkspaceInit() {
  const { data: session } = useSession();
  const token = session?.session?.token;

  useEffect(() => {
    if (!token || getWorkspaceId()) return;

    apiRequest<{ data: { workspaceId: string }[] }>("/api/workspaces/me", { token })
      .then((res) => {
        const id = res.data[0]?.workspaceId;
        if (id) setWorkspaceId(id);
      })
      .catch(() => {});
  }, [token]);

  return null;
}
