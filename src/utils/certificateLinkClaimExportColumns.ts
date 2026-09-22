import type { CertificateLinkClaim } from "../types/certificateLink";
import type { CsvColumn } from "./exportToCsv";
import { exportNum, exportPhone, exportStr } from "./exportHelpers";
import { formatDateTimeExport } from "./formatDate";

const str = exportStr;
const num = exportNum;

/**
 * Lead export for one certificate link.
 *
 * `Name` is what that person typed on this link; the name actually printed on the certificate is
 * frozen at their first claim, so the two can differ if someone re-submitted under a new name.
 * Both matter to whoever works the list, so IP and downloads stay in as well.
 */
export const CERTIFICATE_LINK_CLAIM_EXPORT_COLUMNS: CsvColumn<CertificateLinkClaim>[] = [
  { header: "Name", accessor: (r) => str(r.name) },
  { header: "Email", accessor: (r) => str(r.email) },
  { header: "Phone", accessor: (r) => exportPhone(r.phone) },
  { header: "Certificate No.", accessor: (r) => str(r.certificate_number) },
  { header: "Claimed at", accessor: (r) => formatDateTimeExport(r.created_at) },
  { header: "Last claimed at", accessor: (r) => formatDateTimeExport(r.last_claimed_at) },
  { header: "Downloads", accessor: (r) => num(r.download_count) },
  { header: "Link title", accessor: (r) => str(r.link_title) },
  { header: "Course ID", accessor: (r) => str(r.course_id) },
  { header: "IP", accessor: (r) => str(r.ip) },
  { header: "UTM source", accessor: (r) => str(r.utm_source) },
  { header: "UTM medium", accessor: (r) => str(r.utm_medium) },
  { header: "UTM campaign", accessor: (r) => str(r.utm_campaign) },
];
