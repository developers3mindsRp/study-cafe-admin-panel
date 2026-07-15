import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { RequirePermission } from "../../components/auth/RequirePermission";
import { PERM_ROLES_EDIT } from "../../constants/permissions";
import { rolesApi, type RoleRecord } from "../../api/roles";
import RoleForm from "./RoleForm";

export default function RoleEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [role, setRole] = useState<RoleRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const num = Number(id);
    if (!Number.isFinite(num)) return;
    rolesApi
      .getOne(num)
      .then(setRole)
      .catch(() => setError("Failed to load role"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-gray-500">Loading…</p>;
  if (!role) return <p className="text-error-500">{error || "Role not found"}</p>;

  const isSuperAdmin = role.name === "super_admin";

  return (
    <RequirePermission permissions={[PERM_ROLES_EDIT]}>
      <PageMeta title={`Edit ${role.name} | StudyCafe Admin`} description="Edit role permissions" />
      <PageBreadcrumb
        pageTitle={`Edit role: ${role.name}`}
        items={[{ label: "Roles", path: "/roles" }]}
        compact
      />
      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
          {error}
        </div>
      )}
      <RoleForm
        mode="edit"
        isSystem={role.is_system}
        readOnlyPermissions={isSuperAdmin}
        defaultValues={{
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          is_admin_panel: role.is_admin_panel,
        }}
        isSubmitting={submitting}
        onSubmit={async (data) => {
          setError(null);
          setSubmitting(true);
          try {
            await rolesApi.update(role.id, data);
            alert("Role updated successfully!");
            navigate(`/roles/${role.id}/edit`);
          } catch (err: unknown) {
            const msg =
              (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
              "Failed to update role";
            setError(msg);
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </RequirePermission>
  );
}
