import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Badge from "../../components/ui/badge/Badge";
import { ConfirmDeleteModal } from "../../components/ui/modal/ConfirmDeleteModal";
import { useModal } from "../../hooks/useModal";
import { RequirePermission } from "../../components/auth/RequirePermission";
import {
  PERM_MEMBERSHIPS_CREATE,
  PERM_MEMBERSHIPS_EDIT,
  PERM_MEMBERSHIPS_DELETE,
} from "../../constants/permissions";
import { plansApi, type Plan, type MembershipFeatures } from "../../api/plans";
import { usersApi, type User } from "../../api/users";
import { planIsLifetime, planWebsiteUrl } from "./membershipUtils";
import { CopyUrlButton } from "../../components/media/CopyUrlButton";
import { MembershipUpgradeModal } from "../../components/membership/MembershipUpgradeModal";

function FeaturesDisplay({ features }: { features: Plan["features"] }) {
  let included: string[] = [];
  let excluded: string[] = [];
  let mrp = 0;

  if (features && !Array.isArray(features) && typeof features === "object") {
    const f = features as MembershipFeatures;
    included = f.included ?? [];
    excluded = f.excluded ?? [];
    mrp = f.mrp ?? 0;
  } else if (Array.isArray(features)) {
    included = features as string[];
  }

  if (included.length === 0 && excluded.length === 0) {
    return <p className="text-gray-500 italic text-sm">No features listed</p>;
  }

  return (
    <div className="space-y-4">
      {mrp > 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          MRP: <span className="line-through text-gray-400">₹{mrp}</span>
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {included.length > 0 && (
          <div className="rounded-lg border border-green-100 bg-green-50 dark:border-green-900/40 dark:bg-green-900/10 p-4">
            <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-2">
              ✅ Included ({included.length})
            </p>
            <ol className="space-y-1 text-sm text-gray-800 dark:text-white/90 list-decimal pl-4">
              {included.map((f, i) => <li key={i}>{f}</li>)}
            </ol>
          </div>
        )}
        {excluded.length > 0 && (
          <div className="rounded-lg border border-red-100 bg-red-50 dark:border-red-900/40 dark:bg-red-900/10 p-4">
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-2">
              ❌ Excluded ({excluded.length})
            </p>
            <ol className="space-y-1 text-sm text-gray-500 dark:text-gray-400 list-decimal pl-4">
              {excluded.map((f, i) => <li key={i}>{f}</li>)}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

const formatDuration = (days: number) => {
  if (days >= 365)
    return `${(days / 365).toFixed(1).replace(/\.0$/, "")} year${days >= 730 ? "s" : ""}`;
  if (days >= 30)
    return `${(days / 30).toFixed(1).replace(/\.0$/, "")} month${days >= 60 ? "s" : ""}`;
  return `${days} day${days !== 1 ? "s" : ""}`;
};

export default function MembershipView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [membership, setMembership] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<User[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [addCandidates, setAddCandidates] = useState<User[]>([]);
  const [addCandidatesLoading, setAddCandidatesLoading] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeTargetPlan, setUpgradeTargetPlan] = useState<Plan | null>(null);
  const {
    isOpen: isDeleteModalOpen,
    openModal: openDeleteModal,
    closeModal: closeDeleteModal,
  } = useModal();

  const openUpgradeModal = (plan: Plan) => {
    setUpgradeTargetPlan(plan);
    setUpgradeModalOpen(true);
  };

  const loadPlan = useCallback(
    async (planId: string) => {
      try {
        setLoading(true);
        const data = await plansApi.get(planId);
        setMembership(data);
      } catch (err) {
        console.error("Failed to load membership", err);
        navigate("/memberships");
      } finally {
        setLoading(false);
      }
    },
    [navigate],
  );

  const loadStudents = useCallback(async () => {
    if (!membership?.slug) return;
    try {
      setStudentsLoading(true);
      const res = await usersApi.list({
        membership: membership.slug,
        limit: 500,
      });
      setStudents(res.data || []);
    } catch (err) {
      console.error("Failed to load students", err);
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  }, [membership?.slug]);

  useEffect(() => {
    if (id) loadPlan(id);
  }, [id, loadPlan]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleDeleteConfirm = async () => {
    if (!membership) return;
    try {
      await plansApi.delete(membership.id);
      closeDeleteModal();
      navigate("/memberships");
    } catch (err) {
      console.error("Failed to delete membership", err);
      alert("Failed to delete membership");
    }
  };

  const handleRemoveFromPlan = async (user: User) => {
    if (!user.id) return;
    try {
      await usersApi.update(String(user.id), { membership: null } as {
        membership?: string | null;
      });
      await loadStudents();
    } catch (err) {
      console.error("Failed to remove from plan", err);
      alert("Failed to remove member");
    }
  };

  const handleAddToPlan = async (user: User) => {
    if (!membership?.slug || !user.id) return;
    try {
      await usersApi.update(String(user.id), { membership: membership.slug });
      setAddModalOpen(false);
      await loadStudents();
    } catch (err) {
      console.error("Failed to add to plan", err);
      alert("Failed to add member");
    }
  };

  const openAddModal = () => {
    setAddModalOpen(true);
    setAddSearch("");
    setAddCandidates([]);
  };

  const searchAddCandidates = async () => {
    try {
      setAddCandidatesLoading(true);
      const res = await usersApi.list({
        search: addSearch || undefined,
        limit: 50,
      });
      const inPlan = new Set(students.map((s) => String(s.id)));
      const list = (res.data || []).filter((u) => !inPlan.has(String(u.id)));
      setAddCandidates(list);
    } catch (err) {
      console.error("Failed to search users", err);
      setAddCandidates([]);
    } finally {
      setAddCandidatesLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!membership)
    return <div className="p-6 text-center">Membership not found</div>;

  const websiteUrl = planWebsiteUrl(membership);

  return (
    <>
      <PageMeta
        title={`${membership.name} | StudyCafe Admin`}
        description="View membership details for studycafe.in"
      />
      <PageBreadcrumb
        pageTitle={membership.name}
        actions={
          <div className="flex items-center gap-2">
            <RequirePermission
              permissions={[PERM_MEMBERSHIPS_EDIT]}
              fallback={null}
            >
              <Link
                to={`/memberships/${id}/edit`}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600"
              >
                Edit
              </Link>
            </RequirePermission>
            <RequirePermission
              permissions={[PERM_MEMBERSHIPS_CREATE]}
              fallback={null}
            >
              <Link
                to={`/memberships/create?duplicateFrom=${encodeURIComponent(String(id))}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition bg-white ring-1 ring-inset ring-gray-300 shadow-theme-xs hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300"
              >
                Duplicate
              </Link>
            </RequirePermission>
            <RequirePermission
              permissions={[PERM_MEMBERSHIPS_DELETE]}
              fallback={null}
            >
              <button
                type="button"
                onClick={openDeleteModal}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-error-500 shadow-theme-xs hover:bg-error-600"
              >
                Delete
              </button>
            </RequirePermission>
          </div>
        }
      />

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Membership Details
              </h3>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge
                  size="sm"
                  color={membership.is_active ? "success" : "error"}
                >
                  {membership.is_active ? "Active" : "Inactive"}
                </Badge>
                {membership.hide_from_public ? (
                  <Badge size="sm" color="warning">
                    Unlisted
                  </Badge>
                ) : null}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Name
              </p>
              <p className="text-gray-800 dark:text-white/90">
                {membership.name}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Slug
              </p>
              <p className="text-gray-800 dark:text-white/90 font-mono text-sm">
                {membership.slug}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Website Link
              </p>
              {websiteUrl ? (
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all font-mono text-sm text-brand-500 hover:underline"
                  >
                    {websiteUrl}
                  </a>
                  <CopyUrlButton url={websiteUrl} />
                </div>
              ) : (
                <p className="text-sm text-gray-400">Inactive — no public link</p>
              )}
              {membership.hide_from_public && websiteUrl ? (
                <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                  Unlisted: not shown on the Plans page, only reachable through this link.
                </p>
              ) : null}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Description
              </p>
              {membership.description ? (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-white/90"
                  dangerouslySetInnerHTML={{ __html: membership.description }}
                />
              ) : (
                <p className="text-gray-800 dark:text-white/90">-</p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Price
                </p>
                <p className="text-gray-800 dark:text-white/90">
                  {membership.currency} {membership.price}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Duration
                </p>
                <p className="text-gray-800 dark:text-white/90">
                  {planIsLifetime(membership)
                    ? "Lifetime"
                    : formatDuration(Number(membership.duration_days) || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Affiliate commission
                </p>
                <p className="text-gray-800 dark:text-white/90">
                  {membership.affiliate_commission != null && membership.affiliate_commission !== ""
                    ? `${membership.affiliate_commission}%`
                    : "0%"}
                </p>
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                Features
              </p>
              <FeaturesDisplay features={membership.features} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Students in this plan
            </h3>
            <RequirePermission
              permissions={[PERM_MEMBERSHIPS_EDIT]}
              fallback={null}
            >
              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600"
              >
                Add members
              </button>
            </RequirePermission>
          </div>
          {studentsLoading ? (
            <p className="text-gray-500 py-4">Loading students...</p>
          ) : students.length === 0 ? (
            <p className="text-gray-500 py-4">No students in this plan yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 pr-4 font-medium text-gray-600 dark:text-gray-400">
                      Name
                    </th>
                    <th className="py-2 pr-4 font-medium text-gray-600 dark:text-gray-400">
                      Email
                    </th>
                    <th className="py-2 w-24 font-medium text-gray-600 dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((u) => (
                    <tr
                      key={String(u.id)}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="py-2 pr-4 text-gray-800 dark:text-white/90">
                        {u.name || u.display_name || "-"}
                      </td>
                      <td className="py-2 pr-4 text-gray-800 dark:text-white/90">
                        {u.email}
                      </td>
                      <td className="py-2">
                        <RequirePermission
                          permissions={[PERM_MEMBERSHIPS_EDIT]}
                          fallback={null}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => membership && openUpgradeModal(membership)}
                              className="text-brand-500 hover:underline text-sm"
                            >
                              Upgrade
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveFromPlan(u)}
                              className="text-error-500 hover:underline text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </RequirePermission>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {addModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setAddModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Add member to plan
              </h4>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white/90"
                />
                <button
                  type="button"
                  onClick={searchAddCandidates}
                  disabled={addCandidatesLoading}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50"
                >
                  {addCandidatesLoading ? "Searching..." : "Search"}
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {addCandidates.length === 0 && !addCandidatesLoading && (
                <p className="text-gray-500 text-sm">
                  Search for users to add. Those already in this plan are
                  excluded.
                </p>
              )}
              <ul className="space-y-2">
                {addCandidates.map((u) => (
                  <li
                    key={String(u.id)}
                    className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                  >
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white/90">
                        {u.name || u.display_name || u.email}
                      </p>
                      <p className="text-sm text-gray-500">{u.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddToPlan(u)}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600"
                    >
                      Add to plan
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        title="Delete Membership"
        itemName={membership.name}
      />

      <MembershipUpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        onSuccess={() => {
          setUpgradeModalOpen(false);
          loadStudents();
        }}
        targetPlan={upgradeTargetPlan}
      />
    </>
  );
}
