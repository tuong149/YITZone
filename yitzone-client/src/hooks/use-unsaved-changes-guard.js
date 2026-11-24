import { useEffect } from "react";
import { create } from "zustand";

export const useUnsavedGuardStore = create((set, get) => ({
  dirtySources: {},
  setDirty: (key, label) => {
    set((state) => {
      const next = { ...state.dirtySources };
      if (label) {
        next[key] = label;
      } else {
        delete next[key];
      }
      return { dirtySources: next };
    });
  },
  hasUnsavedChanges: () => Object.keys(get().dirtySources).length > 0,
  getDirtyLabels: () => Object.values(get().dirtySources)
}));

/**
 * Warns the user before closing/refreshing the tab when a form or exam has unsaved progress,
 * and registers the dirty state globally so ContextSwitcher/Logout can prompt before discarding.
 */
export function useUnsavedChangesGuard(
  isDirty,
  sourceKey,
  label = "dữ liệu chưa lưu"
) {
  const setDirty = useUnsavedGuardStore((s) => s.setDirty);

  useEffect(() => {
    setDirty(sourceKey, isDirty ? label : null);
    return () => {
      setDirty(sourceKey, null);
    };
  }, [isDirty, sourceKey, label, setDirty]);

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);
}
