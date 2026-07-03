import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import { Modal } from "../../components/ui/modal";
import { useAuth } from "../../context/AuthContext";
import {
  fetchPaymentGatewayKeys,
  createPaymentGatewayKeys,
  updatePaymentGatewayKeys,
  deletePaymentGatewayKeys,
  PaymentGatewayKeys,
  isMaskedCredential,
} from "../../api/paymentGateway";

export default function PaymentGatewaySettings() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("global_settings:edit");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<PaymentGatewayKeys[]>([]);

  // Modal & Form state
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PaymentGatewayKeys | null>(null);
  
  const [name, setName] = useState("");
  const [gatewayName, setGatewayName] = useState("razorpay");
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [isActive, setIsActive] = useState(false);

  // Field masking states
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await fetchPaymentGatewayKeys();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load payment gateway configurations", err);
      setItems([]);
      setLoadError("Failed to load payment gateway configurations. Please refresh or sign in again.");
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
    setGatewayName("razorpay");
    setKeyId("");
    setKeySecret("");
    setWebhookSecret("");
    setIsActive(false);
    setShowKeySecret(false);
    setShowWebhookSecret(false);
    setIsOpen(true);
  };

  const openEditModal = (item: PaymentGatewayKeys) => {
    if (!canEdit) return;
    setEditingItem(item);
    setName(item.name);
    setGatewayName(item.gateway_name);
    // Never pre-fill secrets or masked placeholders — leave blank to keep existing values.
    setKeyId(item.key_id_locked || isMaskedCredential(item.key_id) ? "" : item.key_id);
    setKeySecret("");
    setWebhookSecret("");
    setIsActive(item.is_active === 1);
    setShowKeySecret(false);
    setShowWebhookSecret(false);
    setIsOpen(true);
  };

  const buildUpdatePayload = (): Partial<PaymentGatewayKeys> => {
    const payload: Partial<PaymentGatewayKeys> = {
      name: name.trim(),
      gateway_name: gatewayName,
      is_active: isActive ? 1 : 0,
    };

    const trimmedKeyId = keyId.trim();
    if (trimmedKeyId && !isMaskedCredential(trimmedKeyId)) {
      payload.key_id = trimmedKeyId;
    }

    const trimmedSecret = keySecret.trim();
    if (trimmedSecret) {
      payload.key_secret = trimmedSecret;
    }

    const trimmedWebhook = webhookSecret.trim();
    if (trimmedWebhook) {
      payload.webhook_secret = trimmedWebhook;
    }

    return payload;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    if (!name.trim()) return alert("Label Name is required");
    if (!editingItem) {
      if (!keyId.trim()) return alert("Key ID is required");
      if (!keySecret.trim()) return alert("Key Secret is required for new configurations");
    }

    setSaving(true);
    try {
      if (editingItem) {
        await updatePaymentGatewayKeys(editingItem.id, buildUpdatePayload());
      } else {
        const payload: Partial<PaymentGatewayKeys> = {
          name: name.trim(),
          gateway_name: gatewayName,
          key_id: keyId.trim(),
          key_secret: keySecret.trim(),
          is_active: isActive ? 1 : 0,
        };
        const trimmedWebhook = webhookSecret.trim();
        if (trimmedWebhook) {
          payload.webhook_secret = trimmedWebhook;
        }
        await createPaymentGatewayKeys(payload);
      }

      setIsOpen(false);
      await loadData();
      alert(editingItem ? "Configuration updated successfully!" : "Configuration added successfully!");
    } catch (err: any) {
      console.error("Failed to save payment gateway keys", err);
      alert(err.response?.data?.error || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (item: PaymentGatewayKeys) => {
    if (!canEdit) return;
    try {
      setLoading(true);
      await updatePaymentGatewayKeys(item.id, { is_active: 1 });
      await loadData();
      alert(`"${item.name}" has been activated successfully!`);
    } catch (err: any) {
      console.error("Failed to activate payment gateway keys", err);
      alert(err.response?.data?.error || "Failed to activate configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: PaymentGatewayKeys) => {
    if (!canEdit) return;
    if (item.is_active === 1) {
      return alert("Cannot delete the currently active configuration. Please activate another configuration first.");
    }
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      setLoading(true);
      await deletePaymentGatewayKeys(item.id);
      await loadData();
      alert("Configuration deleted successfully!");
    } catch (err: any) {
      console.error("Failed to delete payment gateway configuration", err);
      alert(err.response?.data?.error || "Failed to delete configuration");
    } finally {
      setLoading(false);
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center p-20">
        <p className="text-gray-500 dark:text-gray-400">Loading configurations…</p>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Payment Gateway Settings | StudyCafe Admin" description="Site-wide dynamic payment keys management" />
      <PageBreadcrumb pageTitle="Payment Gateway" />

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
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Dynamic Payment Gateways</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage multiple sets of credentials and keys. Active keys will take precedence over local .env variables.</p>
            </div>
            {canEdit && (
              <Button type="button" size="sm" onClick={openAddModal}>
                Add Configuration
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
              <p className="text-gray-500 dark:text-gray-400 text-sm">No payment gateway configurations found.</p>
              {canEdit && (
                <button onClick={openAddModal} className="mt-3 text-xs text-brand-600 hover:text-brand-800 font-medium dark:text-brand-400">
                  Create your first credentials set
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm align-middle">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-left text-gray-400 dark:text-gray-500 font-medium">
                    <th className="py-3 px-4">Label Name</th>
                    <th className="py-3 px-4">Gateway</th>
                    <th className="py-3 px-4">Key ID</th>
                    <th className="py-3 px-4">Webhook Secret</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {items.map((item) => (
                    <tr key={item.id} className="text-gray-800 dark:text-white/90 hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                      <td className="py-3.5 px-4 font-medium">{item.name}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                          {item.gateway_name.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                        {item.key_id}
                        {item.key_id_locked ? (
                          <span className="ml-2 text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-400">
                            locked
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-gray-400">
                        {item.has_webhook_secret ? "••••••••••••" : <span className="text-gray-300 dark:text-gray-600">None</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        {item.is_active === 1 ? (
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
                          {canEdit && item.is_active !== 1 && (
                            <button
                              onClick={() => handleActivate(item)}
                              className="text-xs text-emerald-600 hover:text-emerald-800 font-medium dark:text-emerald-400"
                            >
                              Activate
                            </button>
                          )}
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
                              disabled={item.is_active === 1}
                              onClick={() => handleDelete(item)}
                              className={`text-xs font-medium ${
                                item.is_active === 1
                                  ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                  : "text-red-500 hover:text-red-700 dark:text-red-400"
                              }`}
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
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white/90">
            {editingItem ? "Edit Gateway Keys" : "Add Gateway Keys"}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Configure dynamic credentials for study-cafe payments.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="lbl-name">Label Name</Label>
            <Input
              id="lbl-name"
              type="text"
              placeholder="e.g. Sandbox Test Keys"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="gate-name">Gateway Partner</Label>
            <select
              id="gate-name"
              className="h-11 w-full rounded-lg border border-gray-300 appearance-none bg-transparent px-4 py-2.5 text-sm focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              value={gatewayName}
              onChange={(e) => setGatewayName(e.target.value)}
              disabled
            >
              <option value="razorpay">Razorpay (Active)</option>
            </select>
          </div>

          <div>
            <Label htmlFor="rp-key">RAZORPAY_KEY_ID</Label>
            {editingItem ? (
              <p className="mb-1.5 text-xs text-gray-500 dark:text-gray-400">
                Current:{" "}
                {editingItem.key_id_locked
                  ? "saved (cannot display — re-enter only if replacing keys)"
                  : editingItem.key_id}
              </p>
            ) : null}
            <Input
              id="rp-key"
              type="text"
              placeholder={editingItem ? "Leave blank to keep current Key ID" : "rzp_test_..."}
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              required={!editingItem}
            />
          </div>

          <div>
            <div className="flex justify-between items-center">
              <Label htmlFor="rp-secret">RAZORPAY_KEY_SECRET</Label>
              <button
                type="button"
                className="text-xs text-brand-600 hover:text-brand-700 font-medium dark:text-brand-400"
                onClick={() => setShowKeySecret(!showKeySecret)}
              >
                {showKeySecret ? "Hide" : "Show"}
              </button>
            </div>
            <Input
              id="rp-secret"
              type={showKeySecret ? "text" : "password"}
              placeholder={editingItem ? "•••••••••••• (Leave blank to keep current)" : "Enter key secret"}
              value={keySecret}
              onChange={(e) => setKeySecret(e.target.value)}
              required={!editingItem}
            />
          </div>

          <div>
            <div className="flex justify-between items-center">
              <Label htmlFor="rp-webhook">RAZORPAY_WEBHOOK_SECRET</Label>
              <button
                type="button"
                className="text-xs text-brand-600 hover:text-brand-700 font-medium dark:text-brand-400"
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
              >
                {showWebhookSecret ? "Hide" : "Show"}
              </button>
            </div>
            <Input
              id="rp-webhook"
              type={showWebhookSecret ? "text" : "password"}
              placeholder={editingItem ? "•••••••••••• (Leave blank to keep current)" : "Enter webhook secret (optional)"}
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              id="is-act"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <label htmlFor="is-act" className="text-sm font-medium text-gray-700 dark:text-white/80 select-none cursor-pointer">
              Set as currently active keys configuration
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save Configurations"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
