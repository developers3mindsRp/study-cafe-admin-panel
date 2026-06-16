import type { User } from "../api/users";
import type { CsvColumn } from "./exportToCsv";
import { exportStr } from "./exportHelpers";
import { USER_CSV_EXPORT_HEADERS } from "../pages/users/utils/userCsvColumns";

/** Row shape from list API may include nested Role. */
export type UserExportRow = User & { Role?: { id?: number; name?: string } };

export function membershipDisplay(row: User): string {
  return exportStr(row.membership_plan_name ?? row.membership_name ?? "Free");
}

function membershipStatusDisplay(row: User): string {
  return exportStr(row.membership_status ?? "Free");
}

function formatMembershipDate(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 19).replace("T", " ");
}

function paymentIdDisplay(row: User): string {
  return exportStr(row.membership_payment_id ?? "");
}

function planPurchasedDisplay(row: User): string {
  return formatMembershipDate(row.membership_plan_purchased);
}

function planExpiryDisplay(row: User): string {
  return formatMembershipDate(row.membership_plan_expiry ?? row.membership_expires_at);
}

function planPriceDisplay(row: User): string {
  return exportStr(row.membership_plan_price ?? "");
}

function roleLabel(row: User & { Role?: { name?: string } }): string {
  return exportStr(row.Role?.name ?? row.role);
}

/** Users list CSV export — membership columns mirror user_memberships. */
export const USER_EXPORT_COLUMNS: CsvColumn<User>[] = [
  { header: USER_CSV_EXPORT_HEADERS[0], accessor: (r) => exportStr(r.email) },
  { header: USER_CSV_EXPORT_HEADERS[1], accessor: () => "" },
  { header: USER_CSV_EXPORT_HEADERS[2], accessor: (r) => exportStr(r.name) },
  { header: USER_CSV_EXPORT_HEADERS[3], accessor: (r) => exportStr(r.first_name) },
  { header: USER_CSV_EXPORT_HEADERS[4], accessor: (r) => exportStr(r.last_name) },
  { header: USER_CSV_EXPORT_HEADERS[5], accessor: (r) => exportStr(r.phone) },
  {
    header: USER_CSV_EXPORT_HEADERS[6],
    accessor: (r) => roleLabel(r as User & { Role?: { name?: string } }),
  },
  { header: USER_CSV_EXPORT_HEADERS[7], accessor: (r) => exportStr(r.status) },
  { header: USER_CSV_EXPORT_HEADERS[8], accessor: (r) => membershipDisplay(r) },
  { header: USER_CSV_EXPORT_HEADERS[9], accessor: (r) => membershipStatusDisplay(r) },
  { header: USER_CSV_EXPORT_HEADERS[10], accessor: (r) => planPriceDisplay(r) },
  { header: USER_CSV_EXPORT_HEADERS[11], accessor: (r) => paymentIdDisplay(r) },
  { header: USER_CSV_EXPORT_HEADERS[12], accessor: (r) => planPurchasedDisplay(r) },
  { header: USER_CSV_EXPORT_HEADERS[13], accessor: (r) => planExpiryDisplay(r) },
  { header: USER_CSV_EXPORT_HEADERS[14], accessor: (r) => exportStr(r.designation) },
  { header: USER_CSV_EXPORT_HEADERS[15], accessor: (r) => exportStr(r.profession) },
  { header: USER_CSV_EXPORT_HEADERS[16], accessor: (r) => exportStr(r.company) },
  { header: USER_CSV_EXPORT_HEADERS[17], accessor: (r) => exportStr(r.city) },
  { header: USER_CSV_EXPORT_HEADERS[18], accessor: (r) => exportStr(r.state) },
  { header: USER_CSV_EXPORT_HEADERS[19], accessor: (r) => exportStr(r.country) },
  { header: USER_CSV_EXPORT_HEADERS[20], accessor: (r) => exportStr(r.bio) },
];
