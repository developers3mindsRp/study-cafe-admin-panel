import { useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { RequirePermission } from "../../components/auth/RequirePermission";
import { PERM_ROLES_CREATE } from "../../constants/permissions";
import { rolesApi } from "../../api/roles";
import RoleForm from "./RoleForm";

export default function RoleCreate() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <RequirePermission permissions={[PERM_ROLES_CREATE]}>
      <PageMeta title="Create Role | StudyCafe Admin" description="Create a new role" />
      <PageBreadcrumb pageTitle="Create Role" items={[{ label: "Roles", path: "/roles" }]} compact />
      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
          {error}
        </div>
      )}
      <RoleForm
        mode="create"
        isSubmitting={submitting}
        onSubmit={async (data) => {
          setError(null);
          setSubmitting(true);
          try {
            await rolesApi.create(data);
            navigate("/roles");
          } catch (err: unknown) {
            const msg =
              (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
              "Failed to create role";
            setError(msg);
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </RequirePermission>
  );
}
