"use client";

// Workspace ID is stored in localStorage after sign-in
// In v2 this becomes a proper context with workspace switching

export function getWorkspaceId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("workspaceId");
}

export function setWorkspaceId(id: string) {
  localStorage.setItem("workspaceId", id);
}
