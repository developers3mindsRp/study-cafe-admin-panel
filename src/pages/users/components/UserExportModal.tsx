import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import Label from "../../../components/form/Label";
import { USER_MEMBERSHIP_FILTER_OPTIONS } from "../constants/userMembershipOptions";
import { fetchCourses, type Course } from "../../../api/courses";
import { fetchStates, type StateRecord } from "../../../api/states";

export type UserExportCategory = "membership" | "course" | "state";

export interface UserExportSelection {
  category: UserExportCategory;
  /** The selected value for the chosen category (membership slug, course id, or state name). */
  value: string;
  /** Human-friendly label, used in the filename. */
  label: string;
}

export interface UserExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selection: UserExportSelection) => void | Promise<void>;
  isExporting?: boolean;
}

const CATEGORY_TABS: { id: UserExportCategory; label: string; helper: string }[] = [
  {
    id: "membership",
    label: "Membership wise",
    helper: "Export every user with an active membership of the selected plan.",
  },
  {
    id: "course",
    label: "Course wise",
    helper: "Export every user enrolled in (or granted access to) the selected course.",
  },
  {
    id: "state",
    label: "State wise",
    helper: "Export every user whose profile state matches the selected state.",
  },
];

export function UserExportModal({
  isOpen,
  onClose,
  onConfirm,
  isExporting = false,
}: UserExportModalProps) {
  const [category, setCategory] = useState<UserExportCategory>("membership");
  const [membership, setMembership] = useState("");
  const [courseId, setCourseId] = useState("");
  const [state, setState] = useState("");

  const [courses, setCourses] = useState<Course[]>([]);
  const [states, setStates] = useState<StateRecord[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);

  // Refs track whether a fetch has already been kicked off for this modal session
  // so changing `loadingCourses`/`loadingStates` state doesn't re-trigger the effect.
  const coursesFetchStarted = useRef(false);
  const statesFetchStarted = useRef(false);

  const requestClose = () => {
    if (!isExporting) onClose();
  };

  // Reset everything when the modal opens
  useEffect(() => {
    if (!isOpen) return;
    setCategory("membership");
    setMembership("");
    setCourseId("");
    setState("");
    setCourses([]);
    setStates([]);
    coursesFetchStarted.current = false;
    statesFetchStarted.current = false;
  }, [isOpen]);

  // Lazy-load courses the first time the "course" tab is shown
  useEffect(() => {
    if (!isOpen || category !== "course" || coursesFetchStarted.current) return;
    coursesFetchStarted.current = true;
    setLoadingCourses(true);
    fetchCourses()
      .then((data) => {
        setCourses(
          [...data].sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""))
        );
      })
      .finally(() => setLoadingCourses(false));
  }, [isOpen, category]);

  // Lazy-load states the first time the "state" tab is shown
  useEffect(() => {
    if (!isOpen || category !== "state" || statesFetchStarted.current) return;
    statesFetchStarted.current = true;
    setLoadingStates(true);
    fetchStates()
      .then((data) => setStates(data))
      .finally(() => setLoadingStates(false));
  }, [isOpen, category]);

  const activeTab = useMemo(
    () => CATEGORY_TABS.find((t) => t.id === category) ?? CATEGORY_TABS[0],
    [category]
  );

  const membershipLabelFor = (slug: string): string =>
    USER_MEMBERSHIP_FILTER_OPTIONS.find((o) => o.value === slug)?.label ?? slug;

  const courseLabelFor = (id: string): string =>
    courses.find((c) => String(c.id) === id)?.title ?? id;

  const canSubmit = (() => {
    if (isExporting) return false;
    if (category === "membership") return Boolean(membership);
    if (category === "course") return Boolean(courseId);
    if (category === "state") return Boolean(state);
    return false;
  })();

  const handleConfirm = () => {
    if (!canSubmit) return;
    if (category === "membership") {
      void onConfirm({
        category,
        value: membership,
        label: membershipLabelFor(membership),
      });
      return;
    }
    if (category === "course") {
      void onConfirm({
        category,
        value: courseId,
        label: courseLabelFor(courseId),
      });
      return;
    }
    void onConfirm({ category, value: state, label: state });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={requestClose}
      className="m-4 max-w-[540px]"
      showCloseButton={!isExporting}
    >
      <div className="p-6 sm:p-8">
        <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
          Export users
        </h3>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Pick a filter dimension, then choose the value to export.
        </p>

        <div
          role="tablist"
          aria-label="Export filter"
          className="mb-5 flex flex-wrap gap-2 rounded-lg bg-gray-100 p-1 dark:bg-gray-800"
        >
          {CATEGORY_TABS.map((tab) => {
            const active = tab.id === category;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                disabled={isExporting}
                onClick={() => setCategory(tab.id)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  active
                    ? "bg-white text-brand-600 shadow-sm dark:bg-gray-900 dark:text-brand-400"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">{activeTab.helper}</p>

        <div className="space-y-4">
          {category === "membership" && (
            <div>
              <Label htmlFor="export-membership">Membership</Label>
              <select
                id="export-membership"
                value={membership}
                onChange={(e) => setMembership(e.target.value)}
                disabled={isExporting}
                className="mt-1.5 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="">Select a membership…</option>
                {USER_MEMBERSHIP_FILTER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {category === "course" && (
            <div>
              <Label htmlFor="export-course">Course</Label>
              <select
                id="export-course"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                disabled={isExporting || loadingCourses}
                className="mt-1.5 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="">
                  {loadingCourses
                    ? "Loading courses…"
                    : courses.length === 0
                      ? "No courses found"
                      : "Select a course…"}
                </option>
                {courses.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {category === "state" && (
            <div>
              <Label htmlFor="export-state">State</Label>
              <select
                id="export-state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                disabled={isExporting || loadingStates}
                className="mt-1.5 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="">
                  {loadingStates
                    ? "Loading states…"
                    : states.length === 0
                      ? "No states found"
                      : "Select a state…"}
                </option>
                {states.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={requestClose} disabled={isExporting}>
            Cancel
          </Button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isExporting ? "Exporting…" : "Download Excel"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
