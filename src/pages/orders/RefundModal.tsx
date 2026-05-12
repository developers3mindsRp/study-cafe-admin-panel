import React from "react";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { orderStatusAllowsRefund, refundOrder, type OrderRecord } from "../../api/orders";

interface RefundModalProps {
  order: OrderRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RefundModal({ order, isOpen, onClose, onSuccess }: RefundModalProps) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    amount: "",
    remarks: "",
  });

  React.useEffect(() => {
    if (order) {
      setFormData({
        amount: String(order.amount || ""),
        remarks: "",
      });
    }
  }, [order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (!orderStatusAllowsRefund(order.status)) {
      alert("Only paid orders can be refunded.");
      return;
    }

    setLoading(true);
    try {
      await refundOrder(order.id, {
        amount: Number(formData.amount),
        remarks: formData.remarks,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Refund failed", err);
      alert(err?.response?.data?.error || "Failed to process refund");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="p-6">
        <h3 className="mb-4 text-xl font-bold text-gray-800 dark:text-white/90">
          Process Refund
        </h3>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Refunding order <span className="font-mono font-medium text-gray-900 dark:text-white">{order?.order_id}</span>. This will update the status to "refunded" and record the refund details.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label>Refund Amount ({order?.currency || 'INR'})</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label>Remarks / Reason</Label>
            <textarea
              className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 focus:border-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:text-white/90"
              rows={3}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              placeholder="e.g. Requested by customer, Batch cancelled"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-error-600 hover:bg-error-700">
              {loading ? "Processing..." : "Confirm Refund"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
