import { api } from "./axios";

export interface AffiliateRecord {
  id: number;
  user_id: number;
  buyer_name: string;
  affiliate_id: number;
  affiliate_name: string;
  course_id: number;
  course_title: string;
  commission_amount: number | string;
  created_at: string;
}

export interface WithdrawalRequest {
  id: number;
  affiliate_id: number;
  affiliate_name: string;
  affiliate_email: string;
  amount: number | string;
  status: "pending" | "approved" | "rejected";
  remarks?: string;
  created_at: string;
  updated_at?: string;
}

export interface AffiliateBalance {
  affiliate_id: number;
  total_earned: number | string;
  total_withdrawn: number | string;
  current_balance: number | string;
}

/**
 * Fetch all affiliate referral history.
 */
export async function fetchAffiliateHistory(): Promise<AffiliateRecord[]> {
  const res = await api.get<AffiliateRecord[]>("/admin/affiliate/history");
  return res.data;
}

/**
 * Fetch all withdrawal requests.
 */
export async function fetchWithdrawalRequests(): Promise<WithdrawalRequest[]> {
  const res = await api.get<WithdrawalRequest[]>("/admin/affiliate/withdrawals");
  return res.data;
}

/**
 * Create a new withdrawal request (Admin side).
 */
export async function createWithdrawalRequest(data: { affiliate_id: number; amount: number }): Promise<WithdrawalRequest> {
  const res = await api.post<WithdrawalRequest>("/admin/affiliate/withdrawals", data);
  return res.data;
}

/**
 * Update the status of a withdrawal request.
 */
export async function updateWithdrawalStatus(id: number, status: "approved" | "rejected", remarks?: string): Promise<WithdrawalRequest> {
  const res = await api.patch<WithdrawalRequest>(`/admin/affiliate/withdrawals/${id}`, { status, remarks });
  return res.data;
}

/**
 * Fetch a user's affiliate balance.
 */
export async function fetchUserEarnings(userId: number): Promise<AffiliateBalance> {
  const res = await api.get<AffiliateBalance>(`/admin/affiliate/balance/${userId}`);
  return res.data;
}
