import { useEffect, useRef, useState } from "react";
import { Modal } from "../../../components/ui/modal";
import Label from "../../../components/form/Label";
import { CsvEmailUpload } from "./CsvEmailUpload";
import {
  fetchCourses,
  fetchCourseBatches,
  bulkEnrollByEmails,
  type Course,
  type BulkEnrollResult,
} from "../../../api/courses";

interface CourseAllotmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "form" | "results";

const STATUS_STYLES: Record<BulkEnrollResult["status"], string> = {
  enrolled: "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400",
  already_enrolled: "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400",
  user_not_found: "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400",
  error: "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400",
};

const STATUS_LABEL: Record<BulkEnrollResult["status"], string> = {
  enrolled: "Enrolled",
  already_enrolled: "Already enrolled",
  user_not_found: "User not found",
  error: "Error",
};

export function CourseAllotmentModal({ isOpen, onClose }: CourseAllotmentModalProps) {
  const [step, setStep] = useState<Step>("form");

  // Form state
  const [emailsRaw, setEmailsRaw] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");
  const [batches, setBatches] = useState<{ id: number; name: string }[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<number | "">("");
  const [price, setPrice] = useState("");
  const [paymentId, setPaymentId] = useState("");

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<BulkEnrollResult[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load courses when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setCoursesLoading(true);
    fetchCourses()
      .then(setCourses)
      .catch(() => setCourses([]))
      .finally(() => setCoursesLoading(false));
  }, [isOpen]);

  // Load batches when course changes
  useEffect(() => {
    if (!selectedCourseId) {
      setBatches([]);
      setSelectedBatchId("");
      return;
    }
    setBatchesLoading(true);
    fetchCourseBatches(Number(selectedCourseId))
      .then((b) => {
        setBatches(b);
        setSelectedBatchId(b[0]?.id ?? "");
      })
      .catch(() => setBatches([]))
      .finally(() => setBatchesLoading(false));
  }, [selectedCourseId]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("form");
        setEmailsRaw("");
        setSelectedCourseId("");
        setBatches([]);
        setSelectedBatchId("");
        setPrice("");
        setPaymentId("");
        setResults([]);
        setSubmitError(null);
      }, 300);
    }
  }, [isOpen]);

  const parsedEmails = emailsRaw
    .split(/[\n,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  const uniqueEmails = [...new Set(parsedEmails)];

  const canSubmit =
    uniqueEmails.length > 0 &&
    selectedCourseId !== "" &&
    selectedBatchId !== "" &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await bulkEnrollByEmails(Number(selectedBatchId), uniqueEmails, {
        price: price.trim() || undefined,
        paymentId: paymentId.trim() || undefined,
        courseId: selectedCourseId,
      });
      setResults(res);
      setStep("results");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to allot courses. Please try again.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const enrolled = results.filter((r) => r.status === "enrolled").length;
  const failed = results.filter((r) => r.status === "user_not_found" || r.status === "error").length;
  const skipped = results.filter((r) => r.status === "already_enrolled").length;

  const selectedCourse = courses.find((c) => c.id === Number(selectedCourseId));
  const selectedBatch = batches.find((b) => b.id === Number(selectedBatchId));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton
      className="max-w-xl w-full"
    >
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Course Allotment
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Enroll multiple users into a course batch by entering their email addresses.
          </p>
        </div>

        {step === "form" && (
          <div className="space-y-5">
            {/* Email input */}
            <div>
              <Label htmlFor="allotment-emails">
                Email Addresses
                {uniqueEmails.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    ({uniqueEmails.length} unique)
                  </span>
                )}
              </Label>
              <div className="mt-1.5 space-y-2">
                <CsvEmailUpload
                  onEmails={(extracted) =>
                    setEmailsRaw((prev) => (prev.trim() ? `${prev.trim()}\n${extracted}` : extracted))
                  }
                />
                <textarea
                  id="allotment-emails"
                  ref={textareaRef}
                  value={emailsRaw}
                  onChange={(e) => setEmailsRaw(e.target.value)}
                  rows={4}
                  placeholder={"user1@example.com\nuser2@example.com, user3@example.com"}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Or type/paste emails separated by newlines, commas, or semicolons.
              </p>
            </div>

            {/* Course select */}
            <div>
              <Label htmlFor="allotment-course">Course</Label>
              {coursesLoading ? (
                <p className="mt-1.5 text-sm text-gray-400">Loading courses…</p>
              ) : (
                <select
                  id="allotment-course"
                  value={selectedCourseId}
                  onChange={(e) =>
                    setSelectedCourseId(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="mt-1.5 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                >
                  <option value="">Select a course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title || `Course #${c.id}`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Batch select */}
            {selectedCourseId !== "" && (
              <div>
                <Label htmlFor="allotment-batch">Batch</Label>
                {batchesLoading ? (
                  <p className="mt-1.5 text-sm text-gray-400">Loading batches…</p>
                ) : batches.length === 0 ? (
                  <p className="mt-1.5 text-sm text-gray-400 italic">
                    No batches available for this course.
                  </p>
                ) : (
                  <select
                    id="allotment-batch"
                    value={selectedBatchId}
                    onChange={(e) =>
                      setSelectedBatchId(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="mt-1.5 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                  >
                    <option value="">Select a batch</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Price */}
            <div>
              <Label htmlFor="allotment-price">Price</Label>
              <p className="mb-1.5 text-xs text-brand-500 italic">
                Only Enter The Price If Its Different Than The Selling Price of Course.
              </p>
              <input
                id="allotment-price"
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 12979"
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>

            {/* RazorPay Payment ID */}
            <div>
              <Label htmlFor="allotment-payment-id">RazorPay Payment ID</Label>
              <input
                id="allotment-payment-id"
                type="text"
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
                placeholder="e.g. pay_SqLNksiHVGuUeJ"
                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>

            {submitError && (
              <p className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
                {submitError}
              </p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Enrolling…"
                  : `Enroll ${uniqueEmails.length > 0 ? uniqueEmails.length : ""} User${uniqueEmails.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-5">
            {/* Summary strip */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-white/[0.02]">
              <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedCourse?.title}
                {selectedBatch && (
                  <span className="ml-1 font-normal text-gray-400">· {selectedBatch.name}</span>
                )}
              </p>
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                <span className="text-success-600 dark:text-success-400 font-medium">
                  {enrolled} enrolled
                </span>
                {skipped > 0 && (
                  <span className="text-warning-600 dark:text-warning-400 font-medium">
                    {skipped} already enrolled
                  </span>
                )}
                {failed > 0 && (
                  <span className="text-error-600 dark:text-error-400 font-medium">
                    {failed} failed
                  </span>
                )}
              </div>
            </div>

            {/* Per-email results */}
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {results.map((r) => (
                <div
                  key={r.email}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white px-4 py-2.5 dark:border-gray-800 dark:bg-gray-900/40"
                >
                  <span className="truncate text-sm text-gray-800 dark:text-gray-200">
                    {r.email}
                  </span>
                  <span
                    className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status]}`}
                  >
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setEmailsRaw("");
                  setPrice("");
                  setPaymentId("");
                  setResults([]);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Allot More
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
