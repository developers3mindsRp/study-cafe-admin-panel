import { useMemo, Fragment } from "react";
import {
  MODULE_LEVELS,
  PERMISSION_NAV_GROUPS,
  getLevelForModule,
  getModulePermissionKeys,
  getModuleAvailableActions,
  getPermissionModuleLabel,
  getUngroupedPermissionModules,
  isActionChecked,
  actionToModuleLevel,
  levelAfterTurningActionOff,
  maxLevelForModule,
  moduleLevelRank,
  type ModuleLevel,
  type ModuleActionKey,
} from "../../constants/permissionLevels";

const ACTION_COLUMNS: { key: ModuleActionKey; label: string }[] = [
  { key: "view", label: "View" },
  { key: "edit", label: "Edit" },
  { key: "add", label: "Add" },
  { key: "delete", label: "Delete" },
];

const COL_SPAN = ACTION_COLUMNS.length + 2;

export interface PermissionMatrixProps {
  value: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
}

export function withAdminAccess(perms: string[]): string[] {
  return perms.includes("admin:access") ? perms : ["admin:access", ...perms];
}

/** Max permissions for every module + standalone perms. */
export function computeAllModulePermissions(): string[] {
  const allPerms: string[] = ["admin:access", "newsletter:send", "users:course_allotment"];
  MODULE_LEVELS.forEach((m) => {
    const maxLevel = maxLevelForModule(m.key);
    const levelOption = m.levels.find((l) => l.value === maxLevel);
    if (levelOption) allPerms.push(...levelOption.permissions);
  });
  return [...new Set(allPerms)];
}

export function PermissionMatrix({ value, onChange, disabled = false }: PermissionMatrixProps) {
  const permissions = value ?? [];

  const levelByModule = useMemo(() => {
    const out: Record<string, ModuleLevel> = {};
    MODULE_LEVELS.forEach((m) => {
      out[m.key] = getLevelForModule(m.key, permissions);
    });
    return out;
  }, [permissions]);

  const applyModuleLevel = (moduleKey: string, level: ModuleLevel) => {
    const config = MODULE_LEVELS.find((m) => m.key === moduleKey);
    if (!config) return;
    const levelOption = config.levels.find((l) => l.value === level);
    const newPerms = levelOption ? levelOption.permissions : [];
    const moduleKeys = getModulePermissionKeys(moduleKey);
    const base = permissions.filter((p) => !moduleKeys.includes(p));
    onChange([...base, ...newPerms]);
  };

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

  const handleRowAllChange = (moduleKey: string, checked: boolean) => {
    applyModuleLevel(moduleKey, checked ? maxLevelForModule(moduleKey) : "none");
  };

  const handleSelectAll = (checked: boolean) => {
    onChange(checked ? computeAllModulePermissions() : ["admin:access"]);
  };

  const toggleSinglePerm = (perm: string, checked: boolean) => {
    if (checked) {
      onChange(permissions.includes(perm) ? permissions : [...permissions, perm]);
    } else {
      onChange(permissions.filter((p) => p !== perm));
    }
  };

  const isGlobalAllChecked = useMemo(() => {
    const modulesAllMax = MODULE_LEVELS.every(
      (m) => moduleLevelRank(levelByModule[m.key] ?? "none") >= moduleLevelRank(maxLevelForModule(m.key))
    );
    return modulesAllMax && permissions.includes("newsletter:send");
  }, [levelByModule, permissions]);

  const isRowAllChecked = (moduleKey: string) => {
    const max = maxLevelForModule(moduleKey);
    return moduleLevelRank(levelByModule[moduleKey] ?? "none") >= moduleLevelRank(max);
  };

  const renderModuleRow = (moduleKey: string, label?: string, rowKey?: string) => {
    const module = MODULE_LEVELS.find((m) => m.key === moduleKey);
    if (!module) return null;
    const available = getModuleAvailableActions(moduleKey);
    const level = levelByModule[moduleKey] ?? "none";
    const displayName = getPermissionModuleLabel(moduleKey, label);

    return (
      <tr
        key={rowKey ?? moduleKey}
        className="bg-white transition-colors hover:bg-gray-50/60 dark:bg-transparent dark:hover:bg-gray-800/40"
      >
        <td className="py-2.5 pl-6 pr-2">
          <span className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">
            {displayName}
          </span>
        </td>
        {ACTION_COLUMNS.map((col) => {
          const exists = available.includes(col.key);
          const checked = exists && isActionChecked(moduleKey, col.key, level);
          return (
            <td key={col.key} className="px-3 py-2.5 text-center">
              {exists ? (
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={(e) => handleActionChange(moduleKey, col.key, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  aria-label={`${displayName} ${col.label}`}
                />
              ) : (
                <span className="text-gray-300 dark:text-gray-600">—</span>
              )}
            </td>
          );
        })}
        <td className="px-3 py-2.5 text-center">
          <input
            type="checkbox"
            checked={isRowAllChecked(moduleKey)}
            disabled={disabled}
            onChange={(e) => handleRowAllChange(moduleKey, e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            aria-label={`${displayName} select all`}
          />
        </td>
      </tr>
    );
  };

  const renderStandaloneRow = (perm: string, label: string) => (
    <tr
      key={perm}
      className="bg-white transition-colors hover:bg-gray-50/60 dark:bg-transparent dark:hover:bg-gray-800/40"
    >
      <td className="py-2.5 pl-6 pr-2">
        <span className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      </td>
      <td className="px-3 py-2.5 text-center">
        <input
          type="checkbox"
          checked={permissions.includes(perm)}
          disabled={disabled}
          onChange={(e) => toggleSinglePerm(perm, e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          aria-label={label}
        />
      </td>
      <td colSpan={ACTION_COLUMNS.length + 1} />
    </tr>
  );

  const ungrouped = getUngroupedPermissionModules();

  return (
    <div className="max-h-[70vh] overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="sticky top-0 z-10 bg-gray-50 py-2.5 pl-4 pr-2 text-left text-theme-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="perm_select_all"
                  checked={isGlobalAllChecked}
                  disabled={disabled}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <label htmlFor="perm_select_all" className="cursor-pointer select-none">
                  Module
                </label>
              </div>
            </th>
            {ACTION_COLUMNS.map((col) => (
              <th
                key={col.key}
                className="sticky top-0 z-10 bg-gray-50 px-3 py-2.5 text-center text-theme-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              >
                {col.label}
              </th>
            ))}
            <th className="sticky top-0 z-10 bg-gray-50 px-3 py-2.5 text-center text-theme-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              All
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {PERMISSION_NAV_GROUPS.map((group) => (
            <Fragment key={group.name}>
              <tr className="bg-gray-100/90 dark:bg-gray-800/80">
                <td
                  colSpan={COL_SPAN}
                  className="py-2.5 pl-4 pr-2 text-theme-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300"
                >
                  {group.name}
                </td>
              </tr>
              {group.modules.map(({ key, label }, index) =>
                renderModuleRow(key, label, `${group.name}:${key}:${label ?? index}`),
              )}
              {group.standalone?.map(({ perm, label }) => renderStandaloneRow(perm, label))}
            </Fragment>
          ))}
          {ungrouped.length > 0 && (
            <Fragment key="other">
              <tr className="bg-gray-100/90 dark:bg-gray-800/80">
                <td
                  colSpan={COL_SPAN}
                  className="py-2.5 pl-4 pr-2 text-theme-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300"
                >
                  Other
                </td>
              </tr>
              {ungrouped.map((module) => renderModuleRow(module.key))}
            </Fragment>
          )}
        </tbody>
      </table>
    </div>
  );
}
