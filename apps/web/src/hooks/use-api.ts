"use client";

import useSWR, { mutate as globalMutate } from "swr";
import { useState, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { getWorkspaceId } from "@/lib/workspace";
import { apiRequest } from "@/lib/api";

function makeFetcher(token: string, workspaceId: string) {
  return (path: string) =>
    apiRequest<{ data: unknown }>(path, { token, workspaceId }).then((r) => r.data);
}

// deps arg accepted for backward compat — SWR invalidates automatically when path changes
export function useApi<T>(path: string, _deps?: unknown[]) {
  const { data: session } = useSession();
  const token = session?.session?.token;
  const workspaceId = getWorkspaceId();

  const ready = !!token && !!workspaceId;
  const key = ready ? path : null;

  const { data, error, isLoading } = useSWR<T>(
    key,
    ready ? (makeFetcher(token!, workspaceId!) as (path: string) => Promise<T>) : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      errorRetryCount: 2,
    }
  );

  const refetch = useCallback(() => {
    if (key) globalMutate(key);
  }, [key]);

  return {
    data: data ?? null,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch,
  };
}

export function useMutation<TBody, TResult>(path: string, method = "POST") {
  const { data: session } = useSession();
  const token = session?.session?.token;
  const workspaceId = getWorkspaceId();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (body: TBody): Promise<TResult | null> => {
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
    },
    [path, method, token, workspaceId]
  );

  return { mutate, loading, error };
}
