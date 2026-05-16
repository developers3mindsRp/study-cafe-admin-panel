import type { Plan } from "../../../api/plans";
import type { ParsedUserImportRow } from "./parseUsersCsv";

export type UserImportFieldError = {
  field: string;
  message: string;
};

export type UserImportRowValidation = {
  rowNumber: number;
  email: string;
  valid: boolean;
  errors: UserImportFieldError[];
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STATUS = new Set(["active", "inactive"]);
const VALID_ROLES = new Set(["student", "instructor", "admin"]);

export function validateUserImportRows(
  rows: ParsedUserImportRow[],
  options: {
    planSlugs: Set<string>;
    requiresMembershipDates?: boolean;
    startsAt?: string;
    expiresAt?: string;
  },
): UserImportRowValidation[] {
  const seenEmails = new Map<string, number>();

  return rows.map((row) => {
    const errors: UserImportFieldError[] = [];
    const email = (row.email || "").trim().toLowerCase();
    const rowNumber = row.rowNumber ?? 0;

    if (!email) {
      errors.push({ field: "email", message: "Email is required" });
    } else if (!EMAIL_RE.test(email)) {
      errors.push({ field: "email", message: "Invalid email format" });
    } else if (seenEmails.has(email)) {
      errors.push({
        field: "email",
        message: `Duplicate email (also on row ${seenEmails.get(email)})`,
      });
    } else {
      seenEmails.set(email, rowNumber);
    }

    if (row.password != null && String(row.password).trim() !== "") {
      if (String(row.password).trim().length < 6) {
        errors.push({ field: "password", message: "Password must be at least 6 characters" });
      }
    }

    const membershipSlug = row.membership?.trim().toLowerCase() || "";
    if (membershipSlug) {
      if (!options.planSlugs.has(membershipSlug)) {
        errors.push({
          field: "membership",
          message: `Unknown plan slug "${membershipSlug}" — must match premium_plans.slug`,
        });
      }
      if (options.requiresMembershipDates) {
        if (!options.startsAt || !options.expiresAt) {
          errors.push({
            field: "membership",
            message: "Membership start and expiry dates are required",
          });
        } else if (options.expiresAt <= options.startsAt) {
          errors.push({
            field: "membership",
            message: "Membership expiry must be after start date",
          });
        }
      }
    }

    if (row.status?.trim()) {
      const s = row.status.trim().toLowerCase();
      if (!VALID_STATUS.has(s)) {
        errors.push({ field: "status", message: 'Status must be "active" or "inactive"' });
      }
    }

    if (row.role?.trim()) {
      const r = row.role.trim().toLowerCase();
      if (!VALID_ROLES.has(r)) {
        errors.push({
          field: "role",
          message: 'Role must be "student", "instructor", or "admin"',
        });
      }
    }

    return {
      rowNumber,
      email: email || row.email || "",
      valid: errors.length === 0,
      errors,
    };
  });
}

export function buildPlanSlugSet(plans: Plan[]): Set<string> {
  const set = new Set<string>();
  for (const p of plans) {
    if (p.is_active && p.slug) set.add(p.slug.toLowerCase());
  }
  return set;
}
