import type { User } from "../api/users";
import type { CsvColumn } from "./exportToCsv";
import { exportStr } from "./exportHelpers";
import { USER_CSV_IMPORT_HEADERS } from "../pages/users/utils/userCsvColumns";

/** Row shape from list API may include nested Role. */
export type UserExportRow = User & { Role?: { id?: number; name?: string } };

export function membershipDisplay(m: string | null | undefined): string {
  const t = m?.trim();
  return t ? t : "Free";
}

function roleLabel(row: User & { Role?: { name?: string } }): string {
  return exportStr(row.Role?.name ?? row.role);
}

/** Users list export — columns match CSV import template (order + headers). */
export const USER_EXPORT_COLUMNS: CsvColumn<User>[] = [
  { header: USER_CSV_IMPORT_HEADERS[0], accessor: (r) => exportStr(r.email) },
  { header: USER_CSV_IMPORT_HEADERS[1], accessor: () => "" },
  { header: USER_CSV_IMPORT_HEADERS[2], accessor: (r) => exportStr(r.name) },
  { header: USER_CSV_IMPORT_HEADERS[3], accessor: (r) => exportStr(r.first_name) },
  { header: USER_CSV_IMPORT_HEADERS[4], accessor: (r) => exportStr(r.last_name) },
  { header: USER_CSV_IMPORT_HEADERS[5], accessor: (r) => exportStr(r.phone) },
  {
    header: USER_CSV_IMPORT_HEADERS[6],
    accessor: (r) => roleLabel(r as User & { Role?: { name?: string } }),
  },
  { header: USER_CSV_IMPORT_HEADERS[7], accessor: (r) => exportStr(r.status) },
  {
    header: USER_CSV_IMPORT_HEADERS[8],
    accessor: (r) => membershipDisplay(r.plan ?? r.membership ?? ""),
  },
  { header: USER_CSV_IMPORT_HEADERS[9], accessor: () => "" },
  { header: USER_CSV_IMPORT_HEADERS[10], accessor: () => "" },
  { header: USER_CSV_IMPORT_HEADERS[11], accessor: () => "" },
  { header: USER_CSV_IMPORT_HEADERS[12], accessor: () => "" },
  { header: USER_CSV_IMPORT_HEADERS[13], accessor: (r) => exportStr(r.designation) },
  { header: USER_CSV_IMPORT_HEADERS[14], accessor: (r) => exportStr(r.profession) },
  { header: USER_CSV_IMPORT_HEADERS[15], accessor: (r) => exportStr(r.company) },
  { header: USER_CSV_IMPORT_HEADERS[16], accessor: (r) => exportStr(r.city) },
  { header: USER_CSV_IMPORT_HEADERS[17], accessor: (r) => exportStr(r.state) },
  { header: USER_CSV_IMPORT_HEADERS[18], accessor: (r) => exportStr(r.country) },
  { header: USER_CSV_IMPORT_HEADERS[19], accessor: (r) => exportStr(r.linkedin) },
  { header: USER_CSV_IMPORT_HEADERS[20], accessor: (r) => exportStr(r.facebook) },
  { header: USER_CSV_IMPORT_HEADERS[21], accessor: (r) => exportStr(r.twitter) },
  { header: USER_CSV_IMPORT_HEADERS[22], accessor: (r) => exportStr(r.instagram) },
  { header: USER_CSV_IMPORT_HEADERS[23], accessor: (r) => exportStr(r.youtube) },
  { header: USER_CSV_IMPORT_HEADERS[24], accessor: (r) => exportStr(r.bio) },
];
