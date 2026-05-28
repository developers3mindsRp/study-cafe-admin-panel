import { useState, useMemo } from "react";
import { Link } from "react-router";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import type { Role } from "../../api/adminUsers";
import {
  MODULE_LEVELS,
  getLevelForModule,
  getModulePermissionKeys,
  getModuleAvailableActions,
  isActionChecked,
  actionToModuleLevel,
  levelAfterTurningActionOff,
  maxLevelForModule,
  moduleLevelRank,
  type ModuleLevel,
  type ModuleActionKey,
} from "../../constants/permissionLevels";

export interface AdminUserFormData {
  email: string;
  password: string;
  name: string;
  role_id: number;
  is_active: boolean;
  permission_overrides: string[];
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
  permission_overrides: [],
};

const ACTION_COLUMNS: { key: ModuleActionKey; label: string }[] = [
  { key: "view", label: "View" },
  { key: "edit", label: "Edit" },
  { key: "add", label: "Add" },
  { key: "delete", label: "Delete" },
];

/** Only super_admin skips the permission grid (has all permissions implicitly). */
const FULL_ACCESS_ROLES = ["super_admin"];

/** Roles that should start with all permissions pre-checked. */
const ALL_PERMS_DEFAULT_ROLES = ["admin"];

export default function AdminUserForm({
  mode,
  roles,
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: AdminUserFormProps) {
  const adminPanelRoles = roles.filter((r) =>
    ["super_admin", "admin", "editor", "viewer", "editor_articles", "custom"].includes(r.name)
  );

  const initialRoleId = defaultValues?.role_id ?? adminPanelRoles[0]?.id ?? 0;
  const initialRoleName = roles.find((r) => r.id === initialRoleId)?.name ?? "";

  /** Compute all permissions upfront for initial state seeding. */
  const allPermsInitial = (): string[] => {
    const perms: string[] = ["admin:access", "newsletter:send"];
    MODULE_LEVELS.forEach((m) => {
      const maxLevel = maxLevelForModule(m.key);
      const levelOption = m.levels.find((l) => l.value === maxLevel);
      if (levelOption) perms.push(...levelOption.permissions);
    });
    return [...new Set(perms)];
  };

  /** Ensure admin:access is always present in a permissions array. */
  const withAdminAccess = (perms: string[]): string[] =>
    perms.includes("admin:access") ? perms : ["admin:access", ...perms];

  const getInitialPermissions = (): string[] => {
    if (mode === "edit") return withAdminAccess(defaultValues?.permission_overrides ?? []);
    if (ALL_PERMS_DEFAULT_ROLES.includes(initialRoleName)) return allPermsInitial();
    return withAdminAccess(defaultValues?.permission_overrides ?? []);
  };

  const [formData, setFormData] = useState<AdminUserFormData>({
    ...emptyFormData,
    ...defaultValues,
    role_id: initialRoleId,
    permission_overrides: getInitialPermissions(),
  });

  /** Name of the currently selected role. */
  const selectedRoleName = useMemo(() => {
    return roles.find((r) => r.id === formData.role_id)?.name ?? "";
  }, [roles, formData.role_id]);

  /** Full-access roles skip all permission selection. */
  const isFullAccessRole = FULL_ACCESS_ROLES.includes(selectedRoleName);

  const levelByModule = useMemo(() => {
    const perms = formData.permission_overrides ?? [];
    const out: Record<string, ModuleLevel> = {};
    MODULE_LEVELS.forEach((m) => {
      out[m.key] = getLevelForModule(m.key, perms);
    });
    return out;
  }, [formData.permission_overrides]);

  /** Toggle a single action checkbox for a module. */
  const handleActionChange = (moduleKey: string, action: ModuleActionKey, checked: boolean) => {
    const currentLevel = levelByModule[moduleKey] ?? "none";
    let newLevel: ModuleLevel;
    if (checked) {
      const targetLevel = actionToModuleLevel(action);
      newLevel =
        moduleLevelRank(targetLevel) > moduleLevelRank(currentLevel) ? targetLevel : currentLevel;
    } else {
      newLevel = levelAfterTurningActionOff(action);
      const actionLevel = actionToModuleLevel(action);
      if (moduleLevelRank(currentLevel) < moduleLevelRank(actionLevel)) {
        newLevel = currentLevel;
      }
    }
    applyModuleLevel(moduleKey, newLevel);
  };

  /** Toggle the row "All" checkbox for a module. */
  const handleRowAllChange = (moduleKey: string, checked: boolean) => {
    applyModuleLevel(moduleKey, checked ? maxLevelForModule(moduleKey) : "none");
  };

  /** Apply a level to a module, updating permission_overrides. */
  const applyModuleLevel = (moduleKey: string, level: ModuleLevel) => {
    const config = MODULE_LEVELS.find((m) => m.key === moduleKey);
    if (!config) return;
    const levelOption = config.levels.find((l) => l.value === level);
    const newPerms = levelOption ? levelOption.permissions : [];
    const moduleKeys = getModulePermissionKeys(moduleKey);
    setFormData((prev) => {
      const base = (prev.permission_overrides ?? []).filter((p) => !moduleKeys.includes(p));
      return { ...prev, permission_overrides: [...base, ...newPerms] };
    });
  };

  /** Global Select All: apply max level to every module + all standalone perms. */
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allPerms: string[] = ["admin:access", "newsletter:send"];
      MODULE_LEVELS.forEach((m) => {
        const maxLevel = maxLevelForModule(m.key);
        const levelOption = m.levels.find((l) => l.value === maxLevel);
        if (levelOption) allPerms.push(...levelOption.permissions);
      });
      setFormData((prev) => ({ ...prev, permission_overrides: [...new Set(allPerms)] }));
    } else {
      setFormData((prev) => ({ ...prev, permission_overrides: ["admin:access"] }));
    }
  };

  const isGlobalAllChecked = useMemo(() => {
    const perms = formData.permission_overrides ?? [];
    const modulesAllMax = MODULE_LEVELS.every(
      (m) => moduleLevelRank(levelByModule[m.key] ?? "none") >= moduleLevelRank(maxLevelForModule(m.key))
    );
    return modulesAllMax && perms.includes("newsletter:send");
  }, [levelByModule, formData.permission_overrides]);

  const isRowAllChecked = (moduleKey: string) => {
    const max = maxLevelForModule(moduleKey);
    return moduleLevelRank(levelByModule[moduleKey] ?? "none") >= moduleLevelRank(max);
  };

  const toggleSinglePerm = (perm: string, checked: boolean) => {
    setFormData((prev) => {
      const perms = prev.permission_overrides ?? [];
      if (checked) {
        return { ...prev, permission_overrides: perms.includes(perm) ? perms : [...perms, perm] };
      }
      return { ...prev, permission_overrides: perms.filter((p) => p !== perm) };
    });
  };

  /** Compute the full set of all permissions (max level every module + standalone perms). */
  const computeAllPerms = () => {
    const allPerms: string[] = ["admin:access", "newsletter:send"];
    MODULE_LEVELS.forEach((m) => {
      const maxLevel = maxLevelForModule(m.key);
      const levelOption = m.levels.find((l) => l.value === maxLevel);
      if (levelOption) allPerms.push(...levelOption.permissions);
    });
    return [...new Set(allPerms)];
  };

  /** When role changes, set permissions appropriately for the new role. */
  const handleRoleChange = (newRoleId: number) => {
    const newRoleName = roles.find((r) => r.id === newRoleId)?.name ?? "";
    let newPerms: string[];
    if (FULL_ACCESS_ROLES.includes(newRoleName)) {
      // super_admin: no overrides needed
      newPerms = [];
    } else if (ALL_PERMS_DEFAULT_ROLES.includes(newRoleName)) {
      // admin: pre-check everything
      newPerms = computeAllPerms();
    } else {
      newPerms = withAdminAccess(
        formData.permission_overrides.length > 0 ? formData.permission_overrides : []
      );
    }
    setFormData((prev) => ({ ...prev, role_id: newRoleId, permission_overrides: newPerms }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.role_id && roles.length) {
      setFormData((prev) => ({ ...prev, role_id: roles[0].id }));
    }
    onSubmit({
      ...formData,
      role_id: formData.role_id || roles[0]?.id || 0,
    });
  };

  const submitLabel = mode === "create" ? "Create Admin User" : "Update Admin User";

  const isSubmitDisabled =
    isSubmitting ||
    (mode === "create" && (!formData.email || !formData.password));

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
          </div>

          {/* Password */}
          <div>
            <Label>
              {mode === "create" ? "Password" : "New password (leave blank to keep current)"}{" "}
              {mode === "create" && <span className="text-error-500">*</span>}
            </Label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              placeholder={mode === "edit" ? "Leave blank to keep" : "Min 6 characters"}
            />
          </div>

          {/* Display name */}
          <div>
            <Label>Display name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Full name"
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
                <strong>{selectedRoleName}</strong> has full access to all modules — no permission selection needed.
              </p>
            ) : ALL_PERMS_DEFAULT_ROLES.includes(selectedRoleName) ? (
              <p className="mt-1 text-theme-xs text-blue-600 dark:text-blue-400">
                <strong>{selectedRoleName}</strong> starts with all permissions checked. You can uncheck any to restrict access.
              </p>
            ) : (
              <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
                Select which modules and actions this user can access below.
              </p>
            )}
          </div>

          {/* Permissions — only shown for non-full-access roles */}
          {!isFullAccessRole && (
            <div>
              <Label>
                Permissions <span className="text-error-500">*</span>
              </Label>
              <p className="mb-3 text-theme-xs text-gray-500 dark:text-gray-400">
                Check actions per module. Edit implies View; Add implies Edit &amp; View; Delete grants full access for that module.
              </p>

              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                      {/* Global select-all in the Module header cell */}
                      <th className="py-2.5 pl-4 pr-2 text-left text-theme-xs font-semibold text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="select_all"
                            checked={isGlobalAllChecked}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                          />
                          <label htmlFor="select_all" className="cursor-pointer select-none">
                            Module
                          </label>
                        </div>
                      </th>
                      {ACTION_COLUMNS.map((col) => (
                        <th
                          key={col.key}
                          className="px-3 py-2.5 text-center text-theme-xs font-semibold text-gray-600 dark:text-gray-300"
                        >
                          {col.label}
                        </th>
                      ))}
                      <th className="px-3 py-2.5 text-center text-theme-xs font-semibold text-gray-600 dark:text-gray-300">
                        All
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {/* Module rows */}
                    {MODULE_LEVELS.map((module) => {
                      const available = getModuleAvailableActions(module.key);
                      const level = levelByModule[module.key] ?? "none";
                      return (
                        <tr
                          key={module.key}
                          className="bg-white transition-colors hover:bg-gray-50/60 dark:bg-transparent dark:hover:bg-gray-800/40"
                        >
                          <td className="py-2.5 pl-4 pr-2">
                            <span className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                              {module.name}
                            </span>
                          </td>
                          {ACTION_COLUMNS.map((col) => {
                            const exists = available.includes(col.key);
                            const checked = exists && isActionChecked(module.key, col.key, level);
                            return (
                              <td key={col.key} className="px-3 py-2.5 text-center">
                                {exists ? (
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) =>
                                      handleActionChange(module.key, col.key, e.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                                    aria-label={`${module.name} ${col.label}`}
                                  />
                                ) : (
                                  <span className="text-gray-300 dark:text-gray-600">—</span>
                                )}
                              </td>
                            );
                          })}
                          {/* Row All */}
                          <td className="px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={isRowAllChecked(module.key)}
                              onChange={(e) => handleRowAllChange(module.key, e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                              aria-label={`${module.name} select all`}
                            />
                          </td>
                        </tr>
                      );
                    })}

                    {/* newsletter:send row */}
                    <tr className="bg-gray-50/40 transition-colors hover:bg-gray-50/80 dark:bg-gray-800/20 dark:hover:bg-gray-800/50">
                      <td className="py-2.5 pl-4 pr-2">
                        <span className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                          Newsletter Send
                        </span>
                        <p className="text-theme-xs text-gray-400 dark:text-gray-500">newsletter:send</p>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          id="newsletter_send"
                          checked={formData.permission_overrides?.includes("newsletter:send") ?? false}
                          onChange={(e) => toggleSinglePerm("newsletter:send", e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                          aria-label="Newsletter Send"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={formData.permission_overrides?.includes("newsletter:send") ?? false}
                          onChange={(e) => toggleSinglePerm("newsletter:send", e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                          aria-label="Newsletter Send all"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          )}

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
