/**
 * Compare sidebar menu permissions with what the role permission matrix can grant.
 */
import { mainNavItemsConfig } from "../layout/sidebarMenu";
import { MODULE_LEVELS, PERMISSION_NAV_GROUPS } from "./permissionLevels";

export function collectSidebarPermissionKeys(): string[] {
  const keys = new Set<string>();
  for (const item of mainNavItemsConfig) {
    (item.requiredPermission ?? []).forEach((p) => keys.add(p));
    (item.subItems ?? []).forEach((sub) =>
      (sub.requiredPermission ?? []).forEach((p) => keys.add(p)),
    );
  }
  return [...keys].sort();
}

export function collectMatrixGrantablePermissionKeys(): string[] {
  const keys = new Set<string>();
  for (const module of MODULE_LEVELS) {
    for (const level of module.levels) {
      level.permissions.forEach((p) => keys.add(p));
    }
  }
  for (const group of PERMISSION_NAV_GROUPS) {
    group.standalone?.forEach((s) => keys.add(s.perm));
  }
  return [...keys].sort();
}

/** Sidebar permissions that cannot be assigned via the role permission matrix. */
export function getSidebarPermissionsMissingFromMatrix(): string[] {
  const matrix = new Set(collectMatrixGrantablePermissionKeys());
  return collectSidebarPermissionKeys().filter((p) => !matrix.has(p));
}
