import { useState, useCallback, useRef, useEffect } from "react";
import { fetchCourseBatches, type Course, type UserEnrollmentRecord } from "../../../api/courses";

export function useAssignCoursesState() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
    const [batchesMap, setBatchesMap] = useState<Record<number, { id: number; name: string }[]>>({});
    const [selectedBatches, setSelectedBatches] = useState<Record<number, number>>({});
    const [batchesLoading, setBatchesLoading] = useState<Record<number, boolean>>({});

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

        if (removed.length) {
            setSelectedBatches((prevB) => {
                const next = { ...prevB };
                removed.forEach((id) => {
                    delete next[id];
                });
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
            if (!seenCourse.has(e.course_id)) {
                seenCourse.add(e.course_id);
                courseIds.push(e.course_id);
            }
            if (e.batch_id != null && !preferredBatchByCourse.has(e.course_id)) {
                preferredBatchByCourse.set(e.course_id, e.batch_id);
            }
        }
        if (courseIds.length === 0) return;

        setSelectedCourseIds(courseIds);

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
                    const chosen = (match ? match.id : batches[0]?.id) ?? preferredBatchId;
                    if (chosen != null) {
                        nextSel[courseId] = chosen;
                    }
                } catch {
                    nextMap[courseId] = [];
                    if (preferredBatchId != null) {
                        nextSel[courseId] = preferredBatchId;
                    }
                }
            }),
        );

        setBatchesMap((prev) => ({ ...prev, ...nextMap }));
        setSelectedBatches((prev) => ({ ...prev, ...nextSel }));
    }, []);

    const onBatchChange = useCallback((courseId: number, batchId: number) => {
        setSelectedBatches((prev) => ({ ...prev, [courseId]: batchId }));
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
        handleCourseSelectionChange,
        hydrateFromEnrollments,
        onBatchChange,
    };
}
