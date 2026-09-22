/** Stored lifecycle state. Expiry is NOT one of these — it is computed from `expires_at`. */
export type CertificateLinkStatus = "draft" | "active" | "disabled";

/**
 * What the API computes from status + expires_at + max_claims, so the UI switches on one field
 * instead of re-deriving the rule in every component.
 */
export type CertificateLinkEffectiveStatus =
  | "draft"
  | "active"
  | "expired"
  | "disabled"
  | "full"
  | "deleted";

export interface CertificateLink {
  id: number | string;
  /** Secret in the public URL. Only present on admin reads. */
  token: string;
  course_id: number | string;
  title: string;
  description: string | null;
  status: CertificateLinkStatus;
  /** ISO datetime. Required on every link. */
  expires_at: string;
  /** YYYY-MM-DD printed on the certificate; null means the claim date is used. */
  certificate_date: string | null;
  max_claims: number | null;
  /** Certificates issued through this link. Drives the cap. */
  claims_count: number;
  send_email: boolean;
  created_by: number | null;
  deleted_at: string | null;
  created_at?: string;
  updated_at?: string;
  effective_status: CertificateLinkEffectiveStatus;
  course_title: string | null;
  /** False when the course has certificates switched off — claims would be rejected. */
  course_certificate_enabled: boolean | null;
}

/** One lead: a person who claimed through a given link. */
export interface CertificateLinkClaim {
  id: number | string;
  link_id: number | string;
  public_certificate_id: number | string;
  course_id: number | string;
  serial: number;
  certificate_number: string | null;
  name: string;
  email: string;
  phone: string | null;
  ip: string | null;
  user_agent: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  download_count: number;
  last_claimed_at: string;
  created_at: string;
  link_title: string;
}

export interface CertificateLinkFormValues {
  course_id: string;
  title: string;
  description: string;
  status: CertificateLinkStatus;
  /** ISO datetime string, as the datetime-local input round-trips it. */
  expires_at: string;
  /** YYYY-MM-DD, or "" to print the claim date. */
  certificate_date: string;
  /** "" means unlimited. */
  max_claims: string;
  send_email: boolean;
}
