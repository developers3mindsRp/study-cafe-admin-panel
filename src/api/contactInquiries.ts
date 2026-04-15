import { api } from "./axios";

export interface ContactInquiry {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  country_code?: string;
  subject?: string | null;
  message: string;
  status?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Temporary defensive fallback:
 * return empty array if backend list endpoint is not available yet.
 */
export const fetchContactInquiries = async (): Promise<ContactInquiry[]> => {
  try {
    const res = await api.get<ContactInquiry[]>("/admin/platform/contact-inquiries");
    const data = res.data;
    return Array.isArray(data) ? data : [];
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) return [];
    throw err;
  }
};
