"use client";

// Who may edit a class's student list, and who may mark its attendance.
//
// Rule (from the class-list doc): each class has one incharge — the staff member with
// edit access to that class. Admins can edit all classes. Everyone else is read-only.
//
// Attendance is a *separate* power with a wider audience: admins and coordinators may
// mark every class, faculty only the classes they are the incharge of, and assets
// managers none.
//
// Both decisions are made server-side and arrive as `canEdit` / `canMarkAttendance` on
// each row from /getClasses, so there is exactly one implementation of each rule (see
// vonishaServer/config/class_incharges.js). This module is the client-side accessor
// for them, and the same guards run again on every write.

import { useEffect, useMemo } from "react";

import { useClassesStore } from "@/stores/classes";
import type { ClassRow } from "@/types/classes";

/**
 * The class list, loaded once per session. Every class dropdown should use this
 * rather than the static fallback in lib/constants.ts.
 */
export function useClasses() {
  const classes = useClassesStore((s) => s.classes);
  const loading = useClassesStore((s) => s.loading);
  const loaded = useClassesStore((s) => s.loaded);
  const degraded = useClassesStore((s) => s.degraded);
  const load = useClassesStore((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  const ids = useMemo(() => classes.map((c) => c.id), [classes]);
  const editable = useMemo(
    () => classes.filter((c) => c.canEdit).map((c) => c.id),
    [classes],
  );
  const markable = useMemo(
    () => classes.filter((c) => c.canMarkAttendance).map((c) => c.id),
    [classes],
  );

  return {
    classes,
    /** All class names, in dropdown order. */
    ids,
    /** Names of the classes this user may edit — an incharge's own classes. */
    editable,
    /**
     * Names of the classes this user may mark attendance for. Every class for an
     * admin or coordinator; an incharge's own classes for faculty.
     */
    markable,
    loading: loading || !loaded,
    degraded,
    byId: (id: string): ClassRow | undefined => classes.find((c) => c.id === id),
    canEdit: (id: string): boolean => classes.find((c) => c.id === id)?.canEdit ?? false,
    canMark: (id: string): boolean =>
      classes.find((c) => c.id === id)?.canMarkAttendance ?? false,
    inchargeFor: (id: string) => classes.find((c) => c.id === id)?.incharge,
  };
}
