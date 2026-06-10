import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import AdminUserForm, { type AdminUserFormData } from "./AdminUserForm";
import { adminUsersApi } from "../../api/adminUsers";
import { RequirePermission } from "../../components/auth/RequirePermission";
import { PERM_ADMIN_USERS_CREATE } from "../../constants/permissions";

export default function AdminUserCreate() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminUsersApi
      .getRoles()
      .then(setRoles)
      .catch(() => setError("Failed to load roles"))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (formData: AdminUserFormData) => {
    setError(null);
    setSubmitting(true);
    try {
      const payload: Parameters<typeof adminUsersApi.create>[0] = {
        email: formData.email.trim(),
        role_id: formData.role_id,
        permission_overrides: [],
      };

      if (formData.promoteExisting) {
        // Existing site user — only role/permissions change; password and profile stay as-is.
      } else {
        payload.password = formData.password;
        if (formData.name.trim()) payload.name = formData.name.trim();
      }

      await adminUsersApi.create(payload);
      navigate("/admin-users");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to create user";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RequirePermission permissions={[PERM_ADMIN_USERS_CREATE]}>
      <PageMeta
        title="Create Admin User | StudyCafe Admin"
        description="Add a new admin panel user"
      />
      <PageBreadcrumb
        pageTitle="Create Admin User"
        items={[{ label: "Admin Users", path: "/admin-users" }]}
        compact
      />
      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}
      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading roles...</p>
      ) : (
        <AdminUserForm
          mode="create"
          roles={roles}
          onSubmit={handleSubmit}
          isSubmitting={submitting}
        />
      )}
    </RequirePermission>
  );
}
