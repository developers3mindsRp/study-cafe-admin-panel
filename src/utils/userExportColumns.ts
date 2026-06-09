import type { User } from "../api/users";
import type { ExcelColumn } from "./exportToExcel";
import { exportStr } from "./exportHelpers";

/** Row shape from list API may include nested Role. */
export type UserExportRow = User & { Role?: { id?: number; name?: string } };

export function membershipDisplay(m: string | null | undefined): string {
  const t = m?.trim();
  return t ? t : "Free";
}

function roleLabel(row: User & { Role?: { name?: string } }): string {
  return exportStr(row.Role?.name ?? row.role);
}

/** Users (students) list export — columns align with CSV import template. */
export const USER_EXPORT_COLUMNS: ExcelColumn<User>[] = [
  { header: "Email", accessor: (r) => exportStr(r.email) },
  {
    header: "Password",
    accessor: () => "",
  },
  { header: "Name", accessor: (r) => exportStr(r.name) },
  { header: "Phone", accessor: (r) => exportStr(r.phone) },
  { header: "Role", accessor: (r) => roleLabel(r as User & { Role?: { name?: string } }) },
  { header: "Status", accessor: (r) => exportStr(r.status) },
  {
    header: "Membership",
    accessor: (r) => membershipDisplay(r.plan ?? r.membership ?? ""),
  },
  { header: "Designation", accessor: (r) => exportStr(r.designation) },
  { header: "Profession", accessor: (r) => exportStr(r.profession) },
  { header: "Company", accessor: (r) => exportStr(r.company) },
  { header: "City", accessor: (r) => exportStr(r.city) },
  { header: "State", accessor: (r) => exportStr(r.state) },
  { header: "Country", accessor: (r) => exportStr(r.country) },
  { header: "LinkedIn", accessor: (r) => exportStr(r.linkedin) },
  { header: "Facebook", accessor: (r) => exportStr(r.facebook) },
  { header: "Twitter", accessor: (r) => exportStr(r.twitter) },
  { header: "Instagram", accessor: (r) => exportStr(r.instagram) },
  { header: "YouTube", accessor: (r) => exportStr(r.youtube) },
  { header: "Bio", accessor: (r) => exportStr(r.bio) },
  { header: "ID", accessor: (r) => exportStr(r.id) },
  {
    header: "Active",
    accessor: (r) => (r.is_active === false ? "No" : r.is_active === true ? "Yes" : ""),
  },
  { header: "Joined", accessor: (r) => exportStr(r.created_at) },
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
