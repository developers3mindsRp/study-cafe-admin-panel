import type { User } from "../api/users";
import type { ExcelColumn } from "./exportToExcel";

/** Row shape from list API may include nested Role. */
export type UserExportRow = User & { Role?: { id?: number; name?: string } };

function str(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
  return String(v);
}

export function membershipDisplay(m: string | null | undefined): string {
  const t = m?.trim();
  return t ? t : "Free";
}

function roleDisplay(row: UserExportRow): string {
  return str(row.Role?.name ?? row.role);
}

/** All list fields suitable for admin user export. */
export const USER_EXPORT_COLUMNS: ExcelColumn<UserExportRow>[] = [
  { header: "ID", accessor: (r) => r.id },
  { header: "Name", accessor: (r) => str(r.name) },
  { header: "Email", accessor: (r) => str(r.email) },
  { header: "Phone", accessor: (r) => str(r.phone) },
  { header: "State", accessor: (r) => str(r.state) },
  { header: "City", accessor: (r) => str(r.city) },
  { header: "Country", accessor: (r) => str(r.country) },
  { header: "Membership", accessor: (r) => membershipDisplay(r.membership) },
  { header: "Status", accessor: (r) => str(r.status) },
  { header: "Role", accessor: (r) => roleDisplay(r) },
  { header: "Designation", accessor: (r) => str(r.designation) },
  { header: "Profession", accessor: (r) => str(r.profession) },
  { header: "Company", accessor: (r) => str(r.company) },
  { header: "Joined", accessor: (r) => str(r.created_at) },
];

/** Sheet rows: State | Count (sorted by state label). */
export function usersStateSummaryAoa(rows: UserExportRow[]): (string | number)[][] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const key = r.state?.trim() ? r.state.trim() : "(blank)";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const header: (string | number)[] = ["State", "Count"];
  const body = [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, c]) => [k, c]);
  return [header, ...body];
}

/** Sheet rows: Membership | Count (sorted by membership label). */
export function usersMembershipSummaryAoa(rows: UserExportRow[]): (string | number)[][] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const key = membershipDisplay(r.membership);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const header: (string | number)[] = ["Membership", "Count"];
  const body = [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, c]) => [k, c]);
  return [header, ...body];
}
