import { useState, useCallback, useRef, useEffect } from "react";
import { fetchCourseBatches, type Course, type UserEnrollmentRecord } from "../../../api/courses";

export function useAssignCoursesState() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
    const [batchesMap, setBatchesMap] = useState<Record<number, { id: number; name: string }[]>>({});
    const [selectedBatches, setSelectedBatches] = useState<Record<number, number>>({});
    const [batchesLoading, setBatchesLoading] = useState<Record<number, boolean>>({});
    // Per-course order details entered by the admin. Keyed by courseId.
    const [coursePrices, setCoursePrices] = useState<Record<number, string>>({});
    const [coursePaymentIds, setCoursePaymentIds] = useState<Record<number, string>>({});
    /**
     * Courses the user already had that the admin has deselected. Removing a chip only
     * marks the course here — nothing is deallotted until save, so the change can still
     * be undone by re-selecting it (which drops it back out of this set).
     *
     * Only courses that were loaded from the server belong here: deselecting a course
     * that was added in this same editing session has nothing to undo on the server.
     */
    const [removedCourseIds, setRemovedCourseIds] = useState<number[]>([]);
    const persistedCourseIdsRef = useRef<Set<number>>(new Set());
    /**
     * Batch per course exactly as the server reported it on load, so save can send only
     * what the admin actually changed. Re-asserting every selected course on every save
     * is not free: for any course whose enrollment rows are missing, course-service
     * reports a first enrollment and admin-service mints a ₹0 order and emails the
     * learner. A deallot save must touch nothing but the removed course.
     */
    const persistedBatchesRef = useRef<Record<number, number>>({});

    const selectedCourseIdsRef = useRef(selectedCourseIds);
    useEffect(() => {
        selectedCourseIdsRef.current = selectedCourseIds;
    }, [selectedCourseIds]);

    const handleCourseSelectionChange = useCallback((ids: string[]) => {
        const newIds = [
            ...new Set(
                ids
                    .map((s) => Number(s))
                    .filter((n) => Number.isFinite(n) && n > 0),
            ),
        ];
        const prev = selectedCourseIdsRef.current;
        const removed = prev.filter((id) => !newIds.includes(id));
        const added = newIds.filter((id) => !prev.includes(id));

        setSelectedCourseIds(newIds);

        // Deselecting a course the user actually holds is a deallotment request; re-adding
        // it before saving cancels that request. Courses added in this session were never
        // persisted, so they never enter the set.
        setRemovedCourseIds((prev) => {
            const next = new Set(prev);
            removed.forEach((id) => {
                if (persistedCourseIdsRef.current.has(id)) next.add(id);
            });
            added.forEach((id) => next.delete(id));
            return [...next];
        });

        if (removed.length) {
            setSelectedBatches((prevB) => {
                const next = { ...prevB };
                removed.forEach((id) => {
                    delete next[id];
                });
                return next;
            });
            setCoursePrices((prevP) => {
                const next = { ...prevP };
                removed.forEach((id) => delete next[id]);
                return next;
            });
            setCoursePaymentIds((prevP) => {
                const next = { ...prevP };
                removed.forEach((id) => delete next[id]);
                return next;
            });
        }

        added.forEach((courseId) => {
            setBatchesLoading((p) => ({ ...p, [courseId]: true }));
            fetchCourseBatches(courseId)
                .then((batches) => {
                    setBatchesMap((prevM) => ({ ...prevM, [courseId]: batches }));
                    setSelectedBatches((prevB) => {
                        if (batches.length === 0) return prevB;
                        if (prevB[courseId]) return prevB;
                        return { ...prevB, [courseId]: batches[0].id };
                    });
                })
                .catch((err) => console.error("Failed to fetch batches", err))
                .finally(() => {
                    setBatchesLoading((p) => ({ ...p, [courseId]: false }));
                });
        });
    }, []);

    const hydrateFromEnrollments = useCallback(async (enrollments: UserEnrollmentRecord[]) => {
        const preferredBatchByCourse = new Map<number, number>();
        const courseIds: number[] = [];
        const seenCourse = new Set<number>();
        for (const e of enrollments) {
            if (e.course_id == null) continue;
            // A purchase whose access grant was removed is a past order, not a current
            // allotment. Listing it here would re-add the chip after every deallot — and
            // saving would silently re-enroll the user. Older APIs omit the flag, so only
            // an explicit `false` excludes the course.
            if (e.has_access_grant === false) continue;
            if (!seenCourse.has(e.course_id)) {
                seenCourse.add(e.course_id);
                courseIds.push(e.course_id);
            }
            if (e.batch_id != null && !preferredBatchByCourse.has(e.course_id)) {
                preferredBatchByCourse.set(e.course_id, e.batch_id);
            }
        }
        // Rebuilt on every hydrate (including the refresh after a save) so the set always
        // reflects what the server currently holds, never a stale pre-removal list.
        persistedCourseIdsRef.current = new Set(courseIds);
        setRemovedCourseIds([]);
        setSelectedCourseIds(courseIds);
        if (courseIds.length === 0) return;

        const nextMap: Record<number, { id: number; name: string }[]> = {};
        const nextSel: Record<number, number> = {};

        await Promise.all(
            courseIds.map(async (courseId) => {
                const preferredBatchId = preferredBatchByCourse.get(courseId);
                try {
                    const batches = await fetchCourseBatches(courseId);
                    nextMap[courseId] = batches;
                    const match =
                        preferredBatchId != null
                            ? batches.find((b) => b.id === preferredBatchId)
                            : undefined;
                    /**
                     * Only ever preselect a batch that actually exists on this course.
                     *
                     * `preferredBatchId` comes off the order, and an order outlives what it
                     * points at: a deleted course keeps its order, whose batch id now
                     * matches nothing. Seeding it made save call set-batch with a dead
                     * batch, which course-service rejects with "Batch not found for this
                     * course" — so every save on such a user failed, permanently.
                     *
                     * With no batch selected the save simply skips the course (it filters
                     * on batchId > 0), which is right: there is no batch to assign it to.
                     * A course with real batches is unaffected.
                     */
                    const chosen = match ? match.id : batches[0]?.id;
                    if (chosen != null) {
                        nextSel[courseId] = chosen;
                    }
                } catch {
                    // fetchCourseBatches swallows its own errors and returns [], so this is
                    // unreachable today. Kept deliberately empty for the same reason as
                    // above: never seed a batch id we have not confirmed exists.
                    nextMap[courseId] = [];
                }
            }),
        );

        setBatchesMap((prev) => ({ ...prev, ...nextMap }));
        // Snapshot the server's view before merging it into the editable selection, so
        // "changed" is always measured against what was actually loaded.
        persistedBatchesRef.current = { ...nextSel };
        setSelectedBatches((prev) => ({ ...prev, ...nextSel }));
    }, []);

    /**
     * True when saving this course would change something on the server: it was added
     * in this session, or its batch differs from the one loaded. Unchanged courses are
     * skipped by save entirely.
     */
    const isBatchAssignmentChanged = useCallback((courseId: number, batchId: number) => {
        return persistedBatchesRef.current[courseId] !== batchId;
    }, []);

    const onBatchChange = useCallback((courseId: number, batchId: number) => {
        setSelectedBatches((prev) => ({ ...prev, [courseId]: batchId }));
    }, []);

    const onPriceChange = useCallback((courseId: number, price: string) => {
        setCoursePrices((prev) => ({ ...prev, [courseId]: price }));
    }, []);

    const onPaymentIdChange = useCallback((courseId: number, paymentId: string) => {
        setCoursePaymentIds((prev) => ({ ...prev, [courseId]: paymentId }));
    }, []);

    return {
        courses,
        setCourses,
        selectedCourseIds,
        setSelectedCourseIds,
        batchesMap,
        setBatchesMap,
        selectedBatches,
        setSelectedBatches,
        batchesLoading,
        coursePrices,
        coursePaymentIds,
        removedCourseIds,
        isBatchAssignmentChanged,
        handleCourseSelectionChange,
        hydrateFromEnrollments,
        onBatchChange,
        onPriceChange,
        onPaymentIdChange,
    };
}
