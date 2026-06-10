import { useState } from "react";
import { Link } from "react-router";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import {
  PermissionMatrix,
  withAdminAccess,
} from "../../components/permissions/PermissionMatrix";

export interface RoleFormData {
  name: string;
  description: string;
  permissions: string[];
  is_admin_panel: boolean;
}

interface RoleFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<RoleFormData>;
  isSystem?: boolean;
  readOnlyPermissions?: boolean;
  onSubmit: (data: RoleFormData) => void;
  isSubmitting?: boolean;
}

const empty: RoleFormData = {
  name: "",
  description: "",
  permissions: withAdminAccess([]),
  is_admin_panel: true,
};

export default function RoleForm({
  mode,
  defaultValues,
  isSystem = false,
  readOnlyPermissions = false,
  onSubmit,
  isSubmitting = false,
}: RoleFormProps) {
  const [form, setForm] = useState<RoleFormData>({
    ...empty,
    ...defaultValues,
    permissions: withAdminAccess(defaultValues?.permissions ?? []),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      name: form.name.trim(),
      permissions: withAdminAccess(form.permissions),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="space-y-4">
          <div>
            <Label>
              Role name <span className="text-error-500">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. content_editor"
              disabled={mode === "edit" && isSystem}
            />
            {isSystem && (
              <p className="mt-1 text-theme-xs text-gray-500">System role names cannot be changed.</p>
            )}
          </div>
          <div>
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Optional description"
              disabled={readOnlyPermissions}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_admin_panel"
              checked={form.is_admin_panel}
              disabled={isSystem || readOnlyPermissions}
              onChange={(e) => setForm((p) => ({ ...p, is_admin_panel: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <Label htmlFor="is_admin_panel" className="!mb-0 cursor-pointer">
              Assignable to admin panel users
            </Label>
          </div>
          {!readOnlyPermissions && (
            <div>
              <Label>
                Permissions <span className="text-error-500">*</span>
              </Label>
              <p className="mb-3 text-theme-xs text-gray-500 dark:text-gray-400">
                Permissions are grouped by admin sidebar module. Check actions per sub-module.
              </p>
              <PermissionMatrix
                value={form.permissions}
                onChange={(permissions) => setForm((p) => ({ ...p, permissions }))}
                disabled={isSubmitting}
              />
            </div>
          )}
          {readOnlyPermissions && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              This role has implicit full access and cannot be edited.
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting || !form.name.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
        >
          {mode === "create" ? "Create Role" : "Save Role"}
        </button>
        <Link to="/roles">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
