import { useRef } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { DataTable, type DataTableRef } from "../../components/tables/data-table/DataTable";
import { EyeIcon } from "../../icons";
import { withClientPagination } from "../../utils/dataTableUtils";
import { fetchContactInquiries, type ContactInquiry } from "../../api/contactInquiries";

const fetchContactInquiriesPaginated = withClientPagination(
  fetchContactInquiries,
  ["first_name", "last_name", "email", "mobile_number", "subject", "status"]
);

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

export default function ContactInquiryList() {
  const dataTableRef = useRef<DataTableRef>(null);

  const columns = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (row: ContactInquiry) => (
        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {`${row.first_name} ${row.last_name}`.trim() || "-"}
        </span>
      ),
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      render: (row: ContactInquiry) => (
        <span className="text-gray-600 text-theme-sm dark:text-gray-300">{row.email || "-"}</span>
      ),
    },
    {
      key: "mobile_number",
      header: "Phone",
      sortable: false,
      render: (row: ContactInquiry) => (
        <span className="text-gray-600 text-theme-sm dark:text-gray-300">{row.mobile_number || "-"}</span>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      sortable: true,
      render: (row: ContactInquiry) => (
        <span className="text-gray-600 text-theme-sm dark:text-gray-300">{row.subject || "-"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row: ContactInquiry) => (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClasses(row.status)}`}>
          {row.status || "new"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Submitted On",
      sortable: true,
      render: (row: ContactInquiry) => (
        <span className="text-gray-500 text-theme-sm dark:text-gray-400">{formatDate(row.created_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "end" as const,
      sortable: false,
      render: (row: ContactInquiry) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/contact-inquiries/${row.id}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            title="View"
          >
            <EyeIcon className="size-4 shrink-0 fill-current" />
            View
          </Link>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageMeta
        title="Contact Inquiries | StudyCafe Admin"
        description="Review contact form inquiries submitted by users."
      />
      <PageBreadcrumb pageTitle="Contact Inquiries" />
      <div className="space-y-6">
        <DataTable<ContactInquiry>
          ref={dataTableRef}
          columns={columns}
          fetchData={fetchContactInquiriesPaginated}
          initialPageSize={10}
          pageSizeOptions={[10, 20, 50, 100]}
          enableSearch
          enableSorting
          enablePagination
          searchPlaceholder="Search inquiries..."
          emptyMessage="No contact inquiries found."
        />
      </div>
    </>
  );
}
