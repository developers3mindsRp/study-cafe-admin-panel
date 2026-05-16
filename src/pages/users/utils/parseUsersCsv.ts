import {
  USER_CSV_HEADER_ALIASES,
  USER_CSV_IMPORT_HEADERS,
  type UserCsvField,
} from "./userCsvColumns";

export type ParsedUserImportRow = {
  rowNumber: number;
  email: string;
  password?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: string;
  status?: string;
  membership?: string;
  designation?: string;
  profession?: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  linkedin?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  bio?: string;
};

function parseCsvLine(line: string, delimiter: string): string[] {
  const cols: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      cols.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  cols.push(cur.trim());
  return cols;
}

function headerIndex(headers: string[], aliases: string[]): number {
  return headers.findIndex((h) => aliases.includes(h));
}

function buildColumnMap(headers: string[]): Partial<Record<UserCsvField, number>> {
  const map: Partial<Record<UserCsvField, number>> = {};
  for (const field of USER_CSV_IMPORT_HEADERS) {
    const idx = headerIndex(headers, USER_CSV_HEADER_ALIASES[field]);
    if (idx !== -1) map[field] = idx;
  }
  return map;
}

function cell(cols: string[], idx: number | undefined): string {
  if (idx == null || idx < 0) return "";
  return (cols[idx] ?? "").replace(/^"|"$/g, "").trim();
}

/**
 * Parse users import CSV. Requires an email column in the header.
 * Returns every data row (including invalid emails) with a rowNumber.
 */
export function parseUsersCsv(text: string): ParsedUserImportRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  const delimiter = lines[0].includes(";") ? ";" : ",";
  const headers = parseCsvLine(lines[0], delimiter).map((h) =>
    h.toLowerCase().replace(/^"|"$/g, "").trim(),
  );

  if (headerIndex(headers, USER_CSV_HEADER_ALIASES.email) === -1) {
    throw new Error('CSV must include an "email" column in the header row.');
  }

  const colMap = buildColumnMap(headers);
  const rows: ParsedUserImportRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i], delimiter);
    const rowNumber = i + 1;

    const row: ParsedUserImportRow = {
      rowNumber,
      email: cell(cols, colMap.email).toLowerCase(),
    };

    const password = cell(cols, colMap.password);
    if (password) row.password = password;

    const name = cell(cols, colMap.name);
    if (name) row.name = name;

    const firstName = cell(cols, colMap.first_name);
    if (firstName) row.first_name = firstName;

    const lastName = cell(cols, colMap.last_name);
    if (lastName) row.last_name = lastName;

    const phone = cell(cols, colMap.phone);
    if (phone) row.phone = phone;

    const role = cell(cols, colMap.role);
    if (role) row.role = role.toLowerCase();

    const status = cell(cols, colMap.status);
    if (status) row.status = status.toLowerCase();

    const membership = cell(cols, colMap.membership);
    if (membership) row.membership = membership.toLowerCase();

    for (const field of [
      "designation",
      "profession",
      "company",
      "city",
      "state",
      "country",
      "linkedin",
      "facebook",
      "twitter",
      "instagram",
      "youtube",
      "bio",
    ] as const) {
      const val = cell(cols, colMap[field]);
      if (val) row[field] = val;
    }

    const isEmpty = USER_CSV_IMPORT_HEADERS.every((f) => {
      if (f === "email") return !row.email;
      const v = row[f as keyof ParsedUserImportRow];
      return v == null || v === "";
    });
    if (isEmpty) continue;

    rows.push(row);
  }

  return rows;
}
