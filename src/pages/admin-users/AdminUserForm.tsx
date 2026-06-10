import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { adminUsersApi, type AdminUserLookupResult, type Role } from "../../api/adminUsers";

export interface AdminUserFormData {
  email: string;
  password: string;
  name: string;
  role_id: number;
  is_active: boolean;
  promoteExisting?: boolean;
}

interface AdminUserFormProps {
  mode: "create" | "edit";
  roles: Role[];
  defaultValues?: Partial<AdminUserFormData>;
  onSubmit: (data: AdminUserFormData) => void;
  isSubmitting?: boolean;
}

const emptyFormData: AdminUserFormData = {
  email: "",
  password: "",
  name: "",
  role_id: 0,
  is_active: true,
};

const FULL_ACCESS_ROLES = ["super_admin"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminUserForm({
  mode,
  roles,
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: AdminUserFormProps) {
  const adminPanelRoles = roles;

  const initialRoleId = defaultValues?.role_id ?? adminPanelRoles[0]?.id ?? 0;

  const [formData, setFormData] = useState<AdminUserFormData>({
    ...emptyFormData,
    ...defaultValues,
    role_id: initialRoleId,
  });

  const [lookupState, setLookupState] = useState<"idle" | "loading" | "done">("idle");
  const [lookupResult, setLookupResult] = useState<AdminUserLookupResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const lookupRequestId = useRef(0);

  const promoteExisting =
    mode === "create" && lookupResult?.exists === true && lookupResult.can_promote === true;

  const lockIdentityFields = promoteExisting;

  /** Name of the currently selected role. */
  const selectedRoleName = useMemo(() => {
    return roles.find((r) => r.id === formData.role_id)?.name ?? "";
  }, [roles, formData.role_id]);

  /** Full-access roles skip all permission selection. */
  const isFullAccessRole = FULL_ACCESS_ROLES.includes(selectedRoleName);

  useEffect(() => {
    if (mode !== "create") return;

    const email = formData.email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      setLookupState("idle");
      setLookupResult(null);
      setLookupError(null);
      return;
    }

    setLookupState("loading");
    setLookupError(null);
    const requestId = ++lookupRequestId.current;

    const timer = window.setTimeout(async () => {
      try {
        const result = await adminUsersApi.lookupByEmail(email);
        if (requestId !== lookupRequestId.current) return;

        setLookupResult(result);
        setLookupState("done");

        if (result.exists && result.can_promote) {
          setFormData((prev) => ({
            ...prev,
            name: result.name || prev.name,
            password: "",
          }));
        }
      } catch {
        if (requestId !== lookupRequestId.current) return;
        setLookupResult(null);
        setLookupState("done");
        setLookupError("Could not verify this email. You can still create a new admin user.");
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [formData.email, mode]);

  /** When role changes, permissions come from the role template only. */
  const handleRoleChange = (newRoleId: number) => {
    setFormData((prev) => ({ ...prev, role_id: newRoleId }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.role_id && roles.length) {
      setFormData((prev) => ({ ...prev, role_id: roles[0].id }));
    }
    onSubmit({
      ...formData,
      role_id: formData.role_id || roles[0]?.id || 0,
      promoteExisting,
    });
  };

  const submitLabel = promoteExisting
    ? "Grant Admin Access"
    : mode === "create"
      ? "Create Admin User"
      : "Update Admin User";

  const isSubmitDisabled =
    isSubmitting ||
    !formData.email ||
    (lookupResult?.exists && lookupResult.can_promote === false) ||
    (mode === "create" && !promoteExisting && !formData.password);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="space-y-4">
          {/* Email */}
          <div>
            <Label>
              Email <span className="text-error-500">*</span>
            </Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="admin@example.com"
              disabled={mode === "edit"}
            />
            {mode === "create" && lookupState === "loading" && (
              <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">Checking account…</p>
            )}
            {mode === "create" && lookupError && (
              <p className="mt-1 text-theme-xs text-amber-600 dark:text-amber-400">{lookupError}</p>
            )}
            {mode === "create" && lookupResult?.exists && lookupResult.message && (
              <p
                className={`mt-1 text-theme-xs ${
                  lookupResult.can_promote
                    ? "text-brand-600 dark:text-brand-400"
                    : "text-error-600 dark:text-error-400"
                }`}
              >
                {lookupResult.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <Label>
              {mode === "create" ? "Password" : "New password (leave blank to keep current)"}{" "}
              {mode === "create" && !promoteExisting && <span className="text-error-500">*</span>}
            </Label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              placeholder={
                promoteExisting
                  ? "Unchanged — existing password is kept"
                  : mode === "edit"
                    ? "Leave blank to keep"
                    : "Min 6 characters"
              }
              disabled={lockIdentityFields}
            />
          </div>

          {/* Display name */}
          <div>
            <Label>Display name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Full name"
              disabled={lockIdentityFields}
            />
          </div>

          {/* Role */}
          <div>
            <Label>
              Role <span className="text-error-500">*</span>
            </Label>
            <select
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              value={formData.role_id}
              onChange={(e) => handleRoleChange(parseInt(e.target.value, 10))}
            >
              {adminPanelRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            {isFullAccessRole ? (
              <p className="mt-1 text-theme-xs text-green-600 dark:text-green-400">
                <strong>{selectedRoleName}</strong> has full access to all modules.
              </p>
            ) : (
              <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                Permissions are inherited from the selected role. Edit the role under Roles to change its permissions.
              </p>
            )}
          </div>

          {/* Active toggle (edit only) */}
          {mode === "edit" && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, is_active: e.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <Label htmlFor="is_active" className="!mb-0 cursor-pointer">
                Active (user can sign in)
              </Label>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
        >
          {submitLabel}
        </button>
        <Link to="/admin-users">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
