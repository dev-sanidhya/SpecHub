"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface WorkspaceInfo {
  id: string;
  name: string;
  owner_id: string;
  role: "owner" | "editor";
}

interface WorkspaceContextValue {
  workspaces: WorkspaceInfo[];
  activeWorkspace: WorkspaceInfo | null;
  loading: boolean;
  switchWorkspace: (id: string) => void;
  createWorkspace: (name: string) => Promise<WorkspaceInfo | null>;
  refresh: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaces: [],
  activeWorkspace: null,
  loading: true,
  switchWorkspace: () => {},
  createWorkspace: async () => null,
  refresh: () => {},
});

const STORAGE_KEY = "spechub:active-workspace";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/workspaces");
      if (!res.ok) return;
      const data: WorkspaceInfo[] = await res.json();
      setWorkspaces(Array.isArray(data) ? data : []);

      // Restore active from localStorage or pick first
      const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      const valid = stored && data.some((w) => w.id === stored);
      if (valid) {
        setActiveId(stored);
      } else if (data.length > 0) {
        setActiveId(data[0].id);
        if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, data[0].id);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchWorkspaces();
  }, [fetchWorkspaces]);

  const switchWorkspace = useCallback((id: string) => {
    setActiveId(id);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const createWorkspace = useCallback(async (name: string): Promise<WorkspaceInfo | null> => {
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) return null;
      const ws: WorkspaceInfo = await res.json();
      setWorkspaces((prev) => [...prev, { ...ws, role: "owner" }]);
      setActiveId(ws.id);
      if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, ws.id);
      return ws;
    } catch {
      return null;
    }
  }, []);

  const activeWorkspace = workspaces.find((w) => w.id === activeId) ?? workspaces[0] ?? null;

  return (
    <WorkspaceContext.Provider value={{ workspaces, activeWorkspace, loading, switchWorkspace, createWorkspace, refresh: fetchWorkspaces }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
