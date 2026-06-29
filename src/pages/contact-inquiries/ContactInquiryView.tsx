import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { fetchContactInquiries, type ContactInquiry } from "../../api/contactInquiries";
import { formatDateTimeLong as formatDate } from "../../utils/formatDate";

function statusBadgeClasses(status?: string) {
  const value = (status || "").toLowerCase();
  if (value === "resolved") {
    return "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400";
  }
  if (value === "in_progress" || value === "in progress") {
    return "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400";
  }
  return "bg-blue-light-50 text-blue-light-700 dark:bg-blue-light-500/10 dark:text-blue-light-400";
}

export default function ContactInquiryView() {
  const { id } = useParams<{ id: string }>();
  const [inquiry, setInquiry] = useState<ContactInquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchContactInquiries()
      .then((list) => {
        const found = list.find((item) => String(item.id) === id);
        if (!found) setError("Inquiry not found.");
        else setInquiry(found);
      })
      .catch(() => setError("Failed to load inquiry."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <>
      <PageMeta
        title="View Inquiry | Contact Inquiries | StudyCafe Admin"
        description="View contact form inquiry details."
      />
      <PageBreadcrumb
        pageTitle="View Inquiry"
        items={[{ label: "Contact Inquiries", path: "/contact-inquiries" }]}
        actions={
          <Link
            to="/contact-inquiries"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Back to List
          </Link>
        }
      />
      <div className="space-y-6">
        {error && (
          <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}
        {loading && <p className="text-gray-500 dark:text-gray-400">Loading...</p>}
        {inquiry && !loading && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <dl className="grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">First Name</dt>
                <dd className="mt-1 text-theme-sm text-gray-800 dark:text-white/90">{inquiry.first_name || "-"}</dd>
              </div>
              <div>
                <dt className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Last Name</dt>
                <dd className="mt-1 text-theme-sm text-gray-800 dark:text-white/90">{inquiry.last_name || "-"}</dd>
              </div>
              <div>
                <dt className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Email</dt>
                <dd className="mt-1 text-theme-sm text-gray-800 dark:text-white/90">
                  <a href={`mailto:${inquiry.email}`} className="text-brand-500 hover:underline">
                    {inquiry.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Phone</dt>
                <dd className="mt-1 text-theme-sm text-gray-800 dark:text-white/90">
                  {inquiry.country_code ? `+${inquiry.country_code} ` : ""}{inquiry.mobile_number || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Subject</dt>
                <dd className="mt-1 text-theme-sm text-gray-800 dark:text-white/90">{inquiry.subject || "-"}</dd>
              </div>
              <div>
                <dt className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClasses(inquiry.status)}`}>
                    {inquiry.status || "new"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Submitted On</dt>
                <dd className="mt-1 text-theme-sm text-gray-800 dark:text-white/90">{formatDate(inquiry.created_at)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">Message</dt>
                <dd className="mt-1 text-theme-sm text-gray-800 dark:text-white/90 whitespace-pre-wrap">
                  {inquiry.message || "-"}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </>
  );
}
