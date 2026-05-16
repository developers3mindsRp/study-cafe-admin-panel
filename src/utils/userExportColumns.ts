import type { User } from "../api/users";
import type { ExcelColumn } from "./exportToExcel";
import { exportStr } from "./exportHelpers";

function roleLabel(row: User & { Role?: { name?: string } }): string {
  return exportStr(row.Role?.name ?? row.role);
}

/** Admin users list export columns. */
export const USER_EXPORT_COLUMNS: ExcelColumn<User>[] = [
  { header: "ID", accessor: (r) => exportStr(r.id) },
  { header: "Name", accessor: (r) => exportStr(r.name) },
  { header: "Email", accessor: (r) => exportStr(r.email) },
  { header: "Phone", accessor: (r) => exportStr(r.phone) },
  { header: "Role", accessor: (r) => roleLabel(r as User & { Role?: { name?: string } }) },
  { header: "Status", accessor: (r) => exportStr(r.status) },
  { header: "Active", accessor: (r) => (r.is_active === false ? "No" : r.is_active === true ? "Yes" : "") },
  { header: "Membership", accessor: (r) => exportStr(r.membership ?? r.plan ?? "Free") },
  { header: "Designation", accessor: (r) => exportStr(r.designation) },
  { header: "Profession", accessor: (r) => exportStr(r.profession) },
  { header: "Company", accessor: (r) => exportStr(r.company) },
  { header: "City", accessor: (r) => exportStr(r.city) },
  { header: "State", accessor: (r) => exportStr(r.state) },
  { header: "Country", accessor: (r) => exportStr(r.country) },
  { header: "Joined", accessor: (r) => exportStr(r.created_at) },
  { header: "First name", accessor: (r) => exportStr(r.first_name) },
  { header: "Last name", accessor: (r) => exportStr(r.last_name) },
  { header: "Display name", accessor: (r) => exportStr(r.display_name) },
  { header: "LinkedIn", accessor: (r) => exportStr(r.linkedin) },
  { header: "Facebook", accessor: (r) => exportStr(r.facebook) },
  { header: "Twitter", accessor: (r) => exportStr(r.twitter) },
  { header: "Instagram", accessor: (r) => exportStr(r.instagram) },
  { header: "YouTube", accessor: (r) => exportStr(r.youtube) },
];
