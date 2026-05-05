import { useCallback, useRef } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { DataTable, type DataTableRef } from "../../components/tables/data-table/DataTable";
import { EyeIcon } from "../../icons";
import { fetchContactInquiries, type ContactInquiry } from "../../api/contactInquiries";
import type { DataTableFetchParams, DataTableFetchResult } from "../../components/tables/data-table/DataTable.types";
import { FilterBar, useFilterState } from "../../components/filters";
import type { FilterFieldDef } from "../../components/filters";

const contactFilterFields: FilterFieldDef[] = [
  {
    type: "select",
    id: "status",
    label: "Status",
    placeholder: "All statuses",
    options: [
      { value: "new", label: "New" },
      { value: "in_progress", label: "In Progress" },
      { value: "resolved", label: "Resolved" },
    ],
  },
  {
    type: "text",
    id: "email",
    label: "Email",
    placeholder: "Filter by email…",
  },
  {
    type: "text",
    id: "phone",
    label: "Phone",
    placeholder: "Filter by phone…",
  },
  {
    type: "date-range",
    id: "submitted",
    label: "Submitted",
    fromId: "submitted_from",
    toId: "submitted_to",
  },
];

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

function toMeta(
  total: number,
  page: number,
  limit: number
): DataTableFetchResult<ContactInquiry>["meta"] {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

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

export default function ContactInquiryList() {
  const dataTableRef = useRef<DataTableRef>(null);
  const { values, set, reset, hasActive } = useFilterState();

  const fetchData = useCallback(
    async (params: DataTableFetchParams): Promise<DataTableFetchResult<ContactInquiry>> => {
      const all = await fetchContactInquiries();
      const search = (params.search ?? "").trim().toLowerCase();

      let filtered = all;

      if (search) {
        filtered = filtered.filter((r) =>
          [`${r.first_name} ${r.last_name}`, r.email, r.mobile_number, r.subject, r.status]
            .some((v) => v && v.toLowerCase().includes(search))
        );
      }

      if (values.status) {
        const s = values.status.toLowerCase();
        filtered = filtered.filter((r) => (r.status || "new").toLowerCase() === s);
      }

      if (values.email) {
        const e = values.email.toLowerCase();
        filtered = filtered.filter((r) => r.email && r.email.toLowerCase().includes(e));
      }

      if (values.phone) {
        const p = values.phone.toLowerCase();
        filtered = filtered.filter((r) => r.mobile_number && r.mobile_number.toLowerCase().includes(p));
      }

      if (values.submitted_from) {
        const from = new Date(values.submitted_from).getTime();
        filtered = filtered.filter((r) => !Number.isNaN(from) && new Date(r.created_at).getTime() >= from);
      }

      if (values.submitted_to) {
        // Include the entire "to" day
        const to = new Date(values.submitted_to);
        to.setHours(23, 59, 59, 999);
        filtered = filtered.filter((r) => new Date(r.created_at).getTime() <= to.getTime());
      }

      // Sorting
      if (params.sortBy) {
        const { sortBy, sortOrder } = params;
        filtered = [...filtered].sort((a, b) => {
          const va = (a as Record<string, unknown>)[sortBy];
          const vb = (b as Record<string, unknown>)[sortBy];
          if (typeof va === "string" && typeof vb === "string") {
            return sortOrder === "DESC" ? vb.localeCompare(va) : va.localeCompare(vb);
          }
          if (va == null) return 1;
          if (vb == null) return -1;
          return sortOrder === "DESC" ? (va < vb ? 1 : -1) : va < vb ? -1 : 1;
        });
      }

      const { page, limit } = params;
      const start = (page - 1) * limit;
      return {
        data: filtered.slice(start, start + limit),
        meta: toMeta(filtered.length, page, limit),
      };
    },
    [values]
  );

  const filterKey = Object.values(values).join("|");

  return (
    <>
      <PageMeta
        title="Contact Inquiries | StudyCafe Admin"
        description="Review contact form inquiries submitted by users."
      />
      <PageBreadcrumb pageTitle="Contact Inquiries" />
      <div className="space-y-6">
        <FilterBar
          fields={contactFilterFields}
          values={values}
          onChange={set}
          onReset={reset}
          hasActive={hasActive}
        />
        <DataTable<ContactInquiry>
          key={filterKey}
          ref={dataTableRef}
          columns={columns}
          fetchData={fetchData}
          initialPageSize={10}
          initialSortBy="created_at"
          initialSortOrder="DESC"
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
