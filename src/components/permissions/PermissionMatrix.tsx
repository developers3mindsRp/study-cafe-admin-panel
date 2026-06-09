import { useMemo } from "react";
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

const ACTION_COLUMNS: { key: ModuleActionKey; label: string }[] = [
  { key: "view", label: "View" },
  { key: "edit", label: "Edit" },
  { key: "add", label: "Add" },
  { key: "delete", label: "Delete" },
];

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

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <th className="py-2.5 pl-4 pr-2 text-left text-theme-xs font-semibold text-gray-600 dark:text-gray-300">
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
                          disabled={disabled}
                          onChange={(e) => handleActionChange(module.key, col.key, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                          aria-label={`${module.name} ${col.label}`}
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
                    checked={isRowAllChecked(module.key)}
                    disabled={disabled}
                    onChange={(e) => handleRowAllChange(module.key, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    aria-label={`${module.name} select all`}
                  />
                </td>
              </tr>
            );
          })}
          {[
            { perm: "newsletter:send", label: "Newsletter Send" },
            { perm: "users:course_allotment", label: "User course allotment" },
          ].map((row) => (
            <tr
              key={row.perm}
              className="bg-gray-50/40 transition-colors hover:bg-gray-50/80 dark:bg-gray-800/20 dark:hover:bg-gray-800/50"
            >
              <td className="py-2.5 pl-4 pr-2">
                <span className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  {row.label}
                </span>
                <p className="text-theme-xs text-gray-400 dark:text-gray-500">{row.perm}</p>
              </td>
              <td className="px-3 py-2.5 text-center">
                <input
                  type="checkbox"
                  checked={permissions.includes(row.perm)}
                  disabled={disabled}
                  onChange={(e) => toggleSinglePerm(row.perm, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
              </td>
              <td colSpan={4} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
