import Label from "../../../components/form/Label";
import MultiSelect from "../../../components/form/MultiSelect";
import type { Course } from "../../../api/courses";

export interface CourseBatchAssignSectionProps {
    courses: Course[];
    selectedCourseIds: number[];
    onCourseSelectionChange: (selectedIds: string[]) => void;
    batchesMap: Record<number, { id: number; name: string }[]>;
    selectedBatches: Record<number, number>;
    onBatchChange: (courseId: number, batchId: number) => void;
    batchesLoading: Record<number, boolean>;
    coursePrices: Record<number, string>;
    coursePaymentIds: Record<number, string>;
    onPriceChange: (courseId: number, price: string) => void;
    onPaymentIdChange: (courseId: number, paymentId: string) => void;
    title?: string;
    description?: string;
    multiselectLabel?: string;
}

export function CourseBatchAssignSection({
    courses,
    selectedCourseIds,
    onCourseSelectionChange,
    batchesMap,
    selectedBatches,
    onBatchChange,
    batchesLoading,
    coursePrices,
    coursePaymentIds,
    onPriceChange,
    onPaymentIdChange,
    title = "Assign Courses",
    description,
    multiselectLabel = "Courses",
}: CourseBatchAssignSectionProps) {
    const options = courses.map((c) => ({
        value: String(c.id),
        text: c.title || `Course #${c.id}`,
    }));

    const sortedSelectedIds = [...selectedCourseIds].sort((a, b) => {
        const ta = courses.find((c) => c.id === a)?.title ?? "";
        const tb = courses.find((c) => c.id === b)?.title ?? "";
        return ta.localeCompare(tb);
    });

    return (
        <div>
            <h4 className="mb-1 text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-1 h-6 bg-brand-500 rounded-full inline-block" />
                {title}
            </h4>
            {description && (
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{description}</p>
            )}

            {courses.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No courses available.</p>
            ) : (
                <div className="space-y-6">
                    <MultiSelect
                        label={multiselectLabel}
                        options={options}
                        value={selectedCourseIds.map(String)}
                        onChange={onCourseSelectionChange}
                        showSearch
                        searchPlaceholder="Search courses by name…"
                        placeholder="Click to search and select one or more courses"
                        triggerClassName="min-h-14"
                        dropdownListClassName="max-h-[min(28rem,70vh)]"
                    />

                    {sortedSelectedIds.length > 0 && (
                        <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-white/[0.02]">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                Batch for each course
                            </p>
                            {sortedSelectedIds.map((courseId) => {
                                const course = courses.find((c) => c.id === courseId);
                                const batches = batchesMap[courseId] ?? [];
                                const isLoading = batchesLoading[courseId];

                                return (
                                    <div
                                        key={courseId}
                                        className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/40"
                                    >
                                        <p className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                                            {course?.title ?? `Course #${courseId}`}
                                        </p>
                                        <Label>Select Batch</Label>
                                        {isLoading ? (
                                            <p className="mt-1 text-sm text-gray-400">Loading batches…</p>
                                        ) : batches.length === 0 ? (
                                            <p className="mt-1 text-sm text-gray-400 italic">
                                                No batches available for this course.
                                            </p>
                                        ) : (
                                            <select
                                                value={selectedBatches[courseId] ?? ""}
                                                onChange={(e) =>
                                                    onBatchChange(courseId, Number(e.target.value))
                                                }
                                                className="mt-1 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                                            >
                                                <option value="">Select a batch</option>
                                                {batches.map((batch) => (
                                                    <option key={batch.id} value={batch.id}>
                                                        {batch.name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}

                                        {/* Order details — recorded as a paid purchase for this user. */}
                                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <Label>Price</Label>
                                                <p className="mb-1 text-xs text-brand-500 italic">
                                                    Only if different from the course selling price.
                                                </p>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={coursePrices[courseId] ?? ""}
                                                    onChange={(e) => onPriceChange(courseId, e.target.value)}
                                                    placeholder="e.g. 12979"
                                                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
                                                />
                                            </div>
                                            <div>
                                                <Label>RazorPay Payment ID</Label>
                                                <input
                                                    type="text"
                                                    value={coursePaymentIds[courseId] ?? ""}
                                                    onChange={(e) => onPaymentIdChange(courseId, e.target.value)}
                                                    placeholder="Payment ID"
                                                    className="mt-[22px] w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
