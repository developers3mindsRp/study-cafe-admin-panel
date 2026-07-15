import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import AdminUserForm, { type AdminUserFormData } from "./AdminUserForm";
import { adminUsersApi } from "../../api/adminUsers";
import { RequirePermission } from "../../components/auth/RequirePermission";
import { PERM_ADMIN_USERS_EDIT } from "../../constants/permissions";

export default function AdminUserEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [defaultValues, setDefaultValues] = useState<Partial<AdminUserFormData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([adminUsersApi.getRoles(), adminUsersApi.getOne(parseInt(id, 10))])
      .then(([rolesList, user]) => {
        setRoles(rolesList);
        setDefaultValues({
          email: user.email,
          name: user.name || "",
          password: "",
          role_id: user.role_id,
          is_active: user.is_active,
        });
      })
      .catch(() => setError("Failed to load user or roles"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (formData: AdminUserFormData) => {
    if (!id) return;
    setError(null);
    setSubmitting(true);
    try {
      await adminUsersApi.update(parseInt(id, 10), {
        name: formData.name || undefined,
        role_id: formData.role_id,
        is_active: formData.is_active,
        ...(formData.password ? { password: formData.password } : {}),
        permission_overrides: [],
      });
      alert("Admin user updated successfully!");
      navigate(`/admin-users/${id}/edit`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to update user";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RequirePermission permissions={[PERM_ADMIN_USERS_EDIT]}>
      <PageMeta
        title="Edit Admin User | StudyCafe Admin"
        description="Edit admin panel user"
      />
      <PageBreadcrumb
        pageTitle="Edit Admin User"
        items={[{ label: "Admin Users", path: "/admin-users" }]}
        compact
      />
      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </div>
      )}
      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      ) : defaultValues ? (
        <AdminUserForm
          mode="edit"
          roles={roles}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          isSubmitting={submitting}
        />
      ) : (
        <p className="text-gray-500 dark:text-gray-400">User not found.</p>
      )}
    </RequirePermission>
  );
}
