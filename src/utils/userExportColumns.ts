import type { User } from "../api/users";
import type { ExcelColumn } from "./exportToExcel";
import { exportStr } from "./exportHelpers";

function roleLabel(row: User & { Role?: { name?: string } }): string {
  return exportStr(row.Role?.name ?? row.role);
}

/** Admin users list export — columns align with CSV import template. */
export const USER_EXPORT_COLUMNS: ExcelColumn<User>[] = [
  { header: "Email", accessor: (r) => exportStr(r.email) },
  {
    header: "Password",
    accessor: () => "",
  },
  { header: "Name", accessor: (r) => exportStr(r.name) },
  { header: "First name", accessor: (r) => exportStr(r.first_name) },
  { header: "Last name", accessor: (r) => exportStr(r.last_name) },
  { header: "Phone", accessor: (r) => exportStr(r.phone) },
  { header: "Role", accessor: (r) => roleLabel(r as User & { Role?: { name?: string } }) },
  { header: "Status", accessor: (r) => exportStr(r.status) },
  {
    header: "Membership",
    accessor: (r) => exportStr(r.plan ?? r.membership ?? ""),
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
