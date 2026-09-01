import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";
import { RequirePermission } from "../../components/auth/RequirePermission";
import {
  PERM_MARKETING_PAGES_CREATE,
  PERM_MARKETING_PAGES_EDIT,
} from "../../constants/permissions";
import { fetchMarketingPage, type MarketingPage } from "../../api/marketingPages";

export default function MarketingPageView() {
  const { id } = useParams();
  const [row, setRow] = useState<MarketingPage | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchMarketingPage(Number(id)).then(setRow).catch(() => setRow(null));
  }, [id]);

  if (!row) {
    return <p className="p-6 text-gray-500">Marketing page not found.</p>;
  }

  const previewUrl = `/marketing/${row.slug}`;

  return (
    <>
      <PageMeta title={`Marketing: ${row.slug} | StudyCafe Admin`} description="View marketing page" />
      <PageBreadcrumb
        pageTitle={row.course_title ?? row.slug}
        actions={
          <div className="flex items-center gap-2">
            <RequirePermission permissions={[PERM_MARKETING_PAGES_EDIT]}>
              <Link to={`/marketing-pages/${row.id}/edit`}>
                <Button size="sm">Edit</Button>
              </Link>
            </RequirePermission>
            <RequirePermission permissions={[PERM_MARKETING_PAGES_CREATE]}>
              <Link to={`/marketing-pages/create?duplicateFrom=${encodeURIComponent(String(row.id))}`}>
                <Button size="sm" variant="outline">
                  Duplicate
                </Button>
              </Link>
            </RequirePermission>
          </div>
        }
      />
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-gray-500">Course</dt>
            <dd className="font-medium">{row.course_title}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Slug</dt>
            <dd>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-brand-500 hover:underline"
              >
                {previewUrl}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Status</dt>
            <dd>{row.is_published ? "Published" : "Draft"}</dd>
          </div>
        </dl>
        <p className="text-sm text-gray-500">
          Alumni logos, featured-in logos, and gallery are under Courses → Page Settings. Global FAQs, Google Reviews, and Testimonials (video/image) are under FAQ, Google Reviews, and Testimonials in the sidebar.
        </p>
      </div>
    </>
  );
}
