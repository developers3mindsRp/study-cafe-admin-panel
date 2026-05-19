/**
 * Lightweight client for fetching distinct state values from user profiles.
 *
 * Uses /admin/users/distinct-states which returns the actual state strings
 * stored in the users table — not the platform CMS states table.
 */

import { api } from "./axios";

export interface StateRecord {
  /** The state string exactly as stored in users.state */
  name: string;
}

export async function fetchStates(): Promise<StateRecord[]> {
  try {
    const res = await api.get<string[]>("/admin/users/distinct-states");
    const list = Array.isArray(res.data) ? res.data : [];
    return list.map((name) => ({ name }));
  } catch {
    return [];
  }
}
