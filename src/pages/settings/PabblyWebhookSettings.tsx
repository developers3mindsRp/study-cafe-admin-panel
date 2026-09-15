import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import { Modal } from "../../components/ui/modal";
import { useAuth } from "../../context/AuthContext";
import { CourseCatMultiSelect } from "../courses/components/CourseCatMultiSelect";
import { fetchCourseCats, type CourseCat } from "../../api/courses";
import {
  fetchPabblyWebhooks,
  createPabblyWebhook,
  updatePabblyWebhook,
  deletePabblyWebhook,
  testPabblyWebhook,
  type PabblyWebhook,
} from "../../api/pabblyWebhooks";

function describeTestResult(result: { success: boolean; status: number | null; response: unknown }): string {
  const responseText =
    typeof result.response === "string" ? result.response : JSON.stringify(result.response);
  if (result.success) {
    return `✅ Webhook reached successfully (HTTP ${result.status}).\n\nResponse: ${responseText}`;
  }
  if (result.status != null) {
    return `❌ Webhook responded with an error (HTTP ${result.status}).\n\nResponse: ${responseText}`;
  }
  return `❌ Could not reach the webhook URL.\n\n${responseText}`;
}

export default function PabblyWebhookSettings() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("global_settings:edit") || hasPermission("admin:access");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<PabblyWebhook[]>([]);
  const [categories, setCategories] = useState<CourseCat[]>([]);

  // Modal & form state
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PabblyWebhook | null>(null);

  const [name, setName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  // Catch-all vs. specific categories is an explicit choice. Ticking every category is
  // NOT the same rule: order-service intersects the course's own category ids, so an
  // explicit list misses courses with no category set and categories added later. Only
  // an empty list matches every course.
  const [matchAll, setMatchAll] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [testingRowId, setTestingRowId] = useState<number | null>(null);
  const [testingModal, setTestingModal] = useState(false);

  const catMap = new Map<number, CourseCat>(categories.map((c) => [c.id, c]));

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [webhooks, cats] = await Promise.all([fetchPabblyWebhooks(), fetchCourseCats()]);
      setItems(webhooks);
      setCategories(cats);
    } catch (err) {
      console.error("Failed to load Pabbly webhooks", err);
      setItems([]);
      setLoadError("Failed to load Pabbly webhooks. Please refresh or sign in again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    if (!canEdit) return;
    setEditingItem(null);
    setName("");
    setWebhookUrl("");
    setCategoryIds([]);
    setMatchAll(true);
    setIsActive(true);
    setIsOpen(true);
  };

  const openEditModal = (item: PabblyWebhook) => {
    if (!canEdit) return;
    setEditingItem(item);
    setName(item.name);
    setWebhookUrl(item.webhook_url);
    setCategoryIds(item.category_ids);
    setMatchAll(item.category_ids.length === 0);
    setIsActive(item.is_active);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    if (!name.trim()) return alert("Name is required");
    if (!webhookUrl.trim()) return alert("Webhook URL is required");
    if (!matchAll && categoryIds.length === 0) {
      return alert("Pick at least one category, or choose All courses.");
    }

    const payload = {
      name: name.trim(),
      webhook_url: webhookUrl.trim(),
      category_ids: matchAll ? [] : categoryIds,
      is_active: isActive,
    };

    setSaving(true);
    try {
      if (editingItem) {
        await updatePabblyWebhook(editingItem.id, payload);
      } else {
        await createPabblyWebhook(payload);
      }
      setIsOpen(false);
      await loadData();
      alert(editingItem ? "Webhook updated successfully!" : "Webhook created successfully!");
    } catch (err: any) {
      console.error("Failed to save Pabbly webhook", err);
      alert(err.response?.data?.message || "Failed to save webhook");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: PabblyWebhook) => {
    if (!canEdit) return;
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      setLoading(true);
      await deletePabblyWebhook(item.id);
      await loadData();
    } catch (err: any) {
      console.error("Failed to delete Pabbly webhook", err);
      alert(err.response?.data?.message || "Failed to delete webhook");
    } finally {
      setLoading(false);
    }
  };

  const handleTestRow = async (item: PabblyWebhook) => {
    setTestingRowId(item.id);
    try {
      const result = await testPabblyWebhook(item.webhook_url);
      alert(describeTestResult(result));
    } catch (err: any) {
      console.error("Failed to test Pabbly webhook", err);
      alert(err.response?.data?.message || "Failed to test webhook");
    } finally {
      setTestingRowId(null);
    }
  };

  const handleTestModal = async () => {
    if (!webhookUrl.trim()) return alert("Enter a webhook URL first");
    setTestingModal(true);
    try {
      const result = await testPabblyWebhook(webhookUrl.trim());
      alert(describeTestResult(result));
    } catch (err: any) {
      console.error("Failed to test Pabbly webhook", err);
      alert(err.response?.data?.message || "Failed to test webhook");
    } finally {
      setTestingModal(false);
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center p-20">
        <p className="text-gray-500 dark:text-gray-400">Loading webhooks…</p>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Pabbly Webhooks | StudyCafe Admin"
        description="Category-based Pabbly automation webhooks fired on course purchase"
      />
      <PageBreadcrumb pageTitle="Pabbly Webhooks" />

      <div className="space-y-6">
        {!canEdit && (
          <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
            You have view-only access. Ask a super admin to grant <span className="font-mono text-xs">global_settings:edit</span> to change these values.
          </p>
        )}

        {loadError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-500/10 dark:text-red-300">
            {loadError}
          </p>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Pabbly Webhook Rules</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                On every successful course purchase, every active rule whose categories match the purchased course
                fires its webhook. A rule with no categories selected matches every course.
              </p>
            </div>
            {canEdit && (
              <Button type="button" size="sm" onClick={openAddModal}>
                Add Webhook
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
              <p className="text-gray-500 dark:text-gray-400 text-sm">No Pabbly webhook rules configured yet.</p>
              {canEdit && (
                <button onClick={openAddModal} className="mt-3 text-xs text-brand-600 hover:text-brand-800 font-medium dark:text-brand-400">
                  Create your first webhook
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm align-middle">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-left text-gray-400 dark:text-gray-500 font-medium">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Matches</th>
                    <th className="py-3 px-4">Webhook URL</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {[...items]
                    .sort((a, b) => a.priority - b.priority)
                    .map((item) => (
                      <tr key={item.id} className="text-gray-800 dark:text-white/90 hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                        <td className="py-3.5 px-4 font-medium">{item.name}</td>
                        <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400">
                          {item.category_ids.length === 0
                            ? "All categories (catch-all)"
                            : item.category_ids.map((id) => catMap.get(id)?.name || `#${id}`).join(", ")}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                          <span className="block max-w-xs truncate" title={item.webhook_url}>
                            {item.webhook_url}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {item.is_active ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleTestRow(item)}
                              disabled={testingRowId === item.id}
                              className="text-xs text-brand-600 hover:text-brand-800 font-medium dark:text-brand-400 disabled:opacity-50"
                            >
                              {testingRowId === item.id ? "Testing…" : "Test"}
                            </button>
                            {canEdit && (
                              <button
                                onClick={() => openEditModal(item)}
                                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              >
                                Edit
                              </button>
                            )}
                            {canEdit && (
                              <button
                                onClick={() => handleDelete(item)}
                                className="text-xs font-medium text-red-500 hover:text-red-700 dark:text-red-400"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Dialog Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} className="max-w-md p-6">
        <div className="mb-4 pr-10 sm:pr-12">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
            {editingItem ? "Edit Pabbly Webhook" : "Add Pabbly Webhook"}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Fires this webhook on a successful course purchase matching the selected categories.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="pw-name">Name</Label>
            <Input
              id="pw-name"
              type="text"
              placeholder="e.g. GST Course Leads"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="pw-url">Pabbly Webhook URL</Label>
              <button
                type="button"
                onClick={handleTestModal}
                disabled={testingModal || !webhookUrl.trim()}
                className="text-xs text-brand-600 hover:text-brand-800 font-medium dark:text-brand-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testingModal ? "Testing…" : "Test"}
              </button>
            </div>
            <Input
              id="pw-url"
              type="url"
              placeholder="https://connect.pabbly.com/webhook-listener/webhook/…"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Sends a sample purchase payload to check the URL is reachable before saving.
            </p>
          </div>

          <div>
            <Label>Which course purchases fire this?</Label>
            <div className="mt-1 space-y-2">
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="radio"
                  name="pw-match"
                  className="mt-0.5 h-4 w-4 border-gray-300 text-brand-600 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900"
                  checked={matchAll}
                  onChange={() => setMatchAll(true)}
                />
                <span className="select-none text-sm text-gray-700 dark:text-white/80">
                  All courses
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    Catch-all — also covers courses with no category set, and categories added later.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="radio"
                  name="pw-match"
                  className="mt-0.5 h-4 w-4 border-gray-300 text-brand-600 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900"
                  checked={!matchAll}
                  onChange={() => setMatchAll(false)}
                />
                <span className="select-none text-sm text-gray-700 dark:text-white/80">
                  Only these categories
                </span>
              </label>
            </div>

            {!matchAll && (
              <div className="mt-2">
                <CourseCatMultiSelect
                  categories={categories}
                  value={categoryIds}
                  onChange={setCategoryIds}
                  placeholder="Select categories…"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Only courses linked to one of these categories fire this webhook. A course with no
                  category set will not match — pick All courses for that.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              id="pw-active"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <label htmlFor="pw-active" className="text-sm font-medium text-gray-700 dark:text-white/80 select-none cursor-pointer">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving…" : editingItem ? "Update Webhook" : "Create Webhook"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
