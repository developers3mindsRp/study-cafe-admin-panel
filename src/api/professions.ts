import { api } from "./axios";

export interface Profession {
    id: number;
    title: string;
    status: "active" | "inactive";
    created_at?: string;
    updated_at?: string;
}

export const fetchProfessions = async (): Promise<Profession[]> => {
    const res = await api.get<Profession[]>("/admin/platform/professions");
    const data = res.data;
    return Array.isArray(data) ? data : [];
};

export const fetchProfession = async (id: number): Promise<Profession> => {
    const res = await api.get<Profession>(`/admin/platform/professions/${id}`);
    return res.data;
};

export const createProfession = async (
    payload: Omit<Profession, "id" | "created_at" | "updated_at">
): Promise<Profession> => {
    const res = await api.post<Profession>("/admin/platform/professions", payload);
    return res.data;
};

export const updateProfession = async (
    id: number,
    payload: Partial<Omit<Profession, "id" | "created_at" | "updated_at">>
): Promise<Profession> => {
    const res = await api.put<Profession>(`/admin/platform/professions/${id}`, payload);
    return res.data;
};

export const deleteProfession = async (id: number): Promise<void> => {
    await api.delete(`/admin/platform/professions/${id}`);
};
