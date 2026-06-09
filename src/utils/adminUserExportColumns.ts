import type { AdminPanelUser } from "../api/adminUsers";
import type { ExcelColumn } from "./exportToExcel";
import { exportStr } from "./exportHelpers";

/** Admin panel staff export columns. */
export const ADMIN_PANEL_USER_EXPORT_COLUMNS: ExcelColumn<AdminPanelUser>[] = [
  { header: "Email", accessor: (r) => exportStr(r.email) },
  { header: "Name", accessor: (r) => exportStr(r.name) },
  { header: "Role", accessor: (r) => exportStr(r.role) },
  {
    header: "Status",
    accessor: (r) => (r.is_active === false ? "Inactive" : r.is_active === true ? "Active" : ""),
  },
  { header: "ID", accessor: (r) => exportStr(r.id) },
];
