import { Link, useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import BackLink from "../../components/common/BackLink";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { useModal } from "../../hooks/useModal";
import type { SEOMetadata } from "../../api/seo";
import { RequirePermission } from "../../components/auth/RequirePermission";
import { PERM_SEO_EDIT, PERM_SEO_DELETE } from "../../constants/permissions";

const mockEntry: SEOMetadata & { metaKeywords?: string; canonicalUrl?: string; ogTitle?: string; ogDescription?: string; ogImageUrl?: string } = {
  id: 1,
  pageName: "Home",
  pageSlug: "/",
  metaTitle: "StudyCafe – CA, CS, CWA | GST, Income Tax & Professional Courses",
  metaDescription:
    "Studycafe.in – Your trusted platform for CA, CS, CWA exam preparation, GST, Income Tax, and Business News.",
  robots: "index, follow",
  metaKeywords: "CA, CS, CWA, GST, Income Tax, studycafe",
  canonicalUrl: "https://studycafe.in",
  ogTitle: "StudyCafe – CA, CS, CWA | GST, Income Tax",
  ogDescription: "Your trusted platform for CA, CS, CWA exam preparation.",
  ogImageUrl: "",
};

export default function SEOMetadataView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const entry = mockEntry; // TODO: Fetch by id when API is ready
  const { isOpen: isDeleteModalOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();

  const handleDeleteConfirm = () => {
    // TODO: Integrate with API when backend is ready
    console.log("Delete SEO metadata", id);
    closeDeleteModal();
    navigate("/seo-metadata");
  };

  return (
    <>
      <PageMeta
        title={`${entry.pageName} SEO | StudyCafe Admin`}
        description="View SEO metadata for studycafe.in"
      />
      <PageBreadcrumb
        pageTitle={`${entry.pageName} - SEO Metadata`}
        compact
        actions={
          <div className="flex items-center gap-2">
            <RequirePermission permissions={[PERM_SEO_EDIT]} fallback={null}>
              <Link
                to={`/seo-metadata/${id}/edit`}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600"
              >
                Edit
              </Link>
            </RequirePermission>
            <RequirePermission permissions={[PERM_SEO_DELETE]} fallback={null}>
              <button
                type="button"
                onClick={openDeleteModal}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-error-500 shadow-theme-xs hover:bg-error-600"
              >
                Delete
              </button>
            </RequirePermission>
            <BackLink to="/seo-metadata">Back to SEO Metadata</BackLink>
          </div>
        }
      />

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Page
              </p>
              <p className="text-gray-800 dark:text-white/90">{entry.pageName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {entry.pageSlug}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Meta Title
              </p>
              <p className="text-gray-800 dark:text-white/90">
                {entry.metaTitle}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Meta Description
              </p>
              <p className="text-gray-800 dark:text-white/90">
                {entry.metaDescription}
              </p>
            </div>
            {entry.metaKeywords && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Meta Keywords
                </p>
                <p className="text-gray-800 dark:text-white/90">
                  {entry.metaKeywords}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Robots
              </p>
              <p className="text-gray-800 dark:text-white/90">{entry.robots}</p>
            </div>
            {entry.canonicalUrl && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Canonical URL
                </p>
                <p className="text-gray-800 dark:text-white/90">
                  {entry.canonicalUrl}
                </p>
              </div>
            )}
            {entry.ogTitle && (
              <>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    OG Title
                  </p>
                  <p className="text-gray-800 dark:text-white/90">
                    {entry.ogTitle}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    OG Description
                  </p>
                  <p className="text-gray-800 dark:text-white/90">
                    {entry.ogDescription}
                  </p>
                </div>
                {entry.ogImageUrl && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      OG Image URL
                    </p>
                    <p className="text-gray-800 dark:text-white/90">
                      {entry.ogImageUrl}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        title="Delete SEO Metadata"
        itemName={entry.pageName}
      />
    </>
  );
}
