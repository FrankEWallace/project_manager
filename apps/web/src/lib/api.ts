const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface RequestOptions extends RequestInit {
  token?: string;
  workspaceId?: string;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, workspaceId, ...init } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(workspaceId && { "X-Workspace-Id": workspaceId }),
  };

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}
