import { useState, useEffect, useRef } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { PencilIcon, TrashBinIcon } from "../../icons";
import { comparisonFeaturesApi, plansApi, type ComparisonFeature, type Plan } from "../../api/plans";
import { api } from "../../api/axios";

interface AvailabilityMap {
  /** featureId -> planId -> available */
  [featureId: number]: { [planId: number]: boolean };
}

export default function ComparisonFeatures() {
  const [features, setFeatures] = useState<ComparisonFeature[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [availability, setAvailability] = useState<AvailabilityMap>({});
  const [loading, setLoading] = useState(true);
  const [savingAvailability, setSavingAvailability] = useState<string | null>(null);

  // Inline add form state
  const [addName, setAddName] = useState("");
  const [addSortOrder, setAddSortOrder] = useState(0);
  const [adding, setAdding] = useState(false);

  // Inline edit state
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editSortOrder, setEditSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const addNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [featData, planData] = await Promise.all([
        comparisonFeaturesApi.list(),
        plansApi.list().then((r) => r.data ?? r),
      ]);
      setFeatures(featData);
      // plansApi.list returns PaginatedResponse shape; handle both
      const planList: Plan[] = Array.isArray(planData) ? planData : (planData as { items?: Plan[] }).items ?? [];
      setPlans(planList);

      // Build initial availability map from plans (if they carry comparison_features)
      // We use the admin axios instance so the correct baseURL is used in both local and production.
      type MembershipWithFeatures = { id: number | string; comparison_features?: Array<{ id: number; available: boolean }> };
      const membershipsRes = await api.get<MembershipWithFeatures[] | { data?: MembershipWithFeatures[] }>('/platform/memberships');
      const memberships: MembershipWithFeatures[] = Array.isArray(membershipsRes.data)
        ? membershipsRes.data
        : ((membershipsRes.data as { data?: MembershipWithFeatures[] }).data ?? []);

      const avMap: AvailabilityMap = {};
      for (const m of memberships) {
        if (!m.comparison_features) continue;
        for (const cf of m.comparison_features) {
          if (!avMap[cf.id]) avMap[cf.id] = {};
          avMap[cf.id][Number(m.id)] = cf.available;
        }
      }
      setAvailability(avMap);
    } catch (err) {
      console.error("Failed to load comparison features", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    const name = addName.trim();
    if (!name) return;
    setAdding(true);
    try {
      const created = await comparisonFeaturesApi.create({ name, sort_order: addSortOrder });
      setFeatures((prev) => [...prev, created].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id));
      setAddName("");
      setAddSortOrder(0);
      addNameRef.current?.focus();
    } catch (err) {
      console.error("Failed to add feature", err);
      alert("Failed to add feature");
    } finally {
      setAdding(false);
    }
  }

  function startEdit(f: ComparisonFeature) {
    setEditId(f.id);
    setEditName(f.name);
    setEditSortOrder(f.sort_order);
  }

  function cancelEdit() {
    setEditId(null);
  }

  async function handleSaveEdit() {
    if (!editId) return;
    setSaving(true);
    try {
      const updated = await comparisonFeaturesApi.update(editId, { name: editName.trim(), sort_order: editSortOrder });
      setFeatures((prev) =>
        prev.map((f) => (f.id === editId ? updated : f)).sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
      );
      setEditId(null);
    } catch (err) {
      console.error("Failed to update feature", err);
      alert("Failed to update feature");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this feature? It will be removed from all plans.")) return;
    setDeletingId(id);
    try {
      await comparisonFeaturesApi.delete(id);
      setFeatures((prev) => prev.filter((f) => f.id !== id));
      setAvailability((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      console.error("Failed to delete feature", err);
      alert("Failed to delete feature");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleAvailability(featureId: number, planId: number) {
    const key = `${featureId}-${planId}`;
    const current = availability[featureId]?.[planId] ?? false;
    setSavingAvailability(key);
    try {
      await comparisonFeaturesApi.setAvailability(featureId, planId, !current);
      setAvailability((prev) => ({
        ...prev,
        [featureId]: { ...(prev[featureId] || {}), [planId]: !current },
      }));
    } catch (err) {
      console.error("Failed to set availability", err);
      alert("Failed to update availability");
    } finally {
      setSavingAvailability(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-500 dark:text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Plan Comparison Features | StudyCafe Admin"
        description="Manage the features shown in the plan comparison table"
      />
      <PageBreadcrumb
        items={[{ label: "Memberships", path: "/memberships" }]}
        pageTitle="Plan Comparison Features"
      />

      <div className="space-y-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          These features appear as rows in the plan comparison table on the public website. Use the checkboxes to toggle which plans include each feature.
        </p>

        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 w-8">#</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Feature Name</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300 w-24">Order</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300 min-w-[100px]">
                    {plan.name}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300 w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {features.map((feature, idx) => (
                <tr key={feature.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-gray-400 dark:text-gray-600">{idx + 1}</td>

                  {editId === feature.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                          autoFocus
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={editSortOrder}
                          onChange={(e) => setEditSortOrder(Number(e.target.value))}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-center text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </td>
                      {plans.map((plan) => (
                        <td key={plan.id} className="px-4 py-3 text-center text-gray-400 dark:text-gray-600">—</td>
                      ))}
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={handleSaveEdit}
                            disabled={saving}
                            className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                          >
                            {saving ? "Saving…" : "Save"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-gray-800 dark:text-white/90 font-medium">{feature.name}</td>
                      <td className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">{feature.sort_order}</td>
                      {plans.map((plan) => {
                        const avail = availability[feature.id]?.[plan.id] ?? false;
                        const key = `${feature.id}-${plan.id}`;
                        const isSaving = savingAvailability === key;
                        return (
                          <td key={plan.id} className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleToggleAvailability(feature.id, plan.id)}
                              disabled={isSaving}
                              title={avail ? "Available — click to remove" : "Not available — click to add"}
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-base transition ${
                                isSaving
                                  ? "opacity-50 cursor-wait"
                                  : avail
                                  ? "bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                                  : "bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-600 dark:hover:bg-gray-700"
                              }`}
                            >
                              {isSaving ? "…" : avail ? "✓" : "✕"}
                            </button>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEdit(feature)}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                            title="Edit"
                          >
                            <PencilIcon className="size-4 fill-current" />
                          </button>
                          <button
                            onClick={() => handleDelete(feature.id)}
                            disabled={deletingId === feature.id}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-error-50 hover:text-error-500 dark:text-gray-400 dark:hover:bg-error-500/10 dark:hover:text-error-400 disabled:opacity-50"
                            title="Delete"
                          >
                            <TrashBinIcon className="size-4 fill-current" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}

              {/* Add new feature row */}
              <tr className="bg-gray-50/70 dark:bg-gray-800/20">
                <td className="px-4 py-2 text-gray-400 dark:text-gray-600">+</td>
                <td className="px-4 py-2">
                  <input
                    ref={addNameRef}
                    type="text"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                    placeholder="New feature name…"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 placeholder-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={addSortOrder}
                    onChange={(e) => setAddSortOrder(Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-center text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-4 py-2 text-center text-gray-300 dark:text-gray-700">—</td>
                ))}
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={handleAdd}
                    disabled={adding || !addName.trim()}
                    className="rounded-lg bg-brand-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {adding ? "Adding…" : "Add"}
                  </button>
                </td>
              </tr>

              {features.length === 0 && (
                <tr>
                  <td colSpan={4 + plans.length} className="px-4 py-8 text-center text-gray-400 dark:text-gray-600 italic">
                    No comparison features yet. Add the first one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
