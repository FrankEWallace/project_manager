"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { getWorkspaceId } from "@/lib/workspace";
import { apiRequest } from "@/lib/api";

export function useApi<T>(path: string, deps: unknown[] = []) {
  const { data: session } = useSession();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = session?.session?.token;
  const workspaceId = getWorkspaceId();

  const fetch = useCallback(async () => {
    if (!token || !workspaceId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await apiRequest<{ data: T }>(path, { token, workspaceId });
      setData(result.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, token, workspaceId, ...deps]);

  useEffect(() => { fetch(); }, [fetch]);

  // Refetch when the tab regains focus so stale data is never shown
  useEffect(() => {
    const onFocus = () => { if (token && workspaceId) fetch(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetch, token, workspaceId]);

  return { data, loading, error, refetch: fetch };
}

export function useMutation<TBody, TResult>(path: string, method = "POST") {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = session?.session?.token;
  const workspaceId = getWorkspaceId();

  const mutate = useCallback(async (body: TBody): Promise<TResult | null> => {
    if (!token || !workspaceId) return null;
    setLoading(true);
    setError(null);
    try {
      const result = await apiRequest<{ data: TResult }>(path, {
        method,
        body: JSON.stringify(body),
        token,
        workspaceId,
      });
      return result.data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      return null;
    } finally {
      setLoading(false);
    }
  }, [path, method, token, workspaceId]);

  return { mutate, loading, error };
}
