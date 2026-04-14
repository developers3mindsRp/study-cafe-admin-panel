import React, { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { fetchUserEarnings, createWithdrawalRequest } from "../../api/affiliate";
import { usersApi, type User } from "../../api/users";

interface CreateWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateWithdrawalModal: React.FC<CreateWithdrawalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [earnings, setEarnings] = useState<any>(null);
  const [amount, setAmount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch some users initially for the dropdown
      usersApi.list({ limit: 50 }).then((res) => setUsers(res.data || []));
    } else {
      // Reset state
      setSelectedUserId("");
      setEarnings(null);
      setAmount(0);
      setError(null);
    }
  }, [isOpen]);

  const handleUserChange = async (userId: string) => {
    setSelectedUserId(userId);
    if (userId) {
      setLoading(true);
      try {
        const data = await fetchUserEarnings(Number(userId));
        setEarnings(data);
        setAmount(Number(data.current_balance));
      } catch (err) {
        console.error("Failed to fetch earnings", err);
      } finally {
        setLoading(false);
      }
    } else {
      setEarnings(null);
      setAmount(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || amount <= 0) {
      setError("Please select a user and enter a valid amount.");
      return;
    }

    if (earnings && amount > Number(earnings.current_balance)) {
      setError("Amount cannot exceed available balance.");
      return;
    }

    setLoading(true);
    try {
      await createWithdrawalRequest({
        affiliate_id: Number(selectedUserId),
        amount,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError("Failed to create withdrawal request.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
          Create Withdrawal Request
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Initiate a payment withdrawal for a user.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Select User
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => handleUserChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800"
            required
          >
            <option value="">Select a user...</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>

        {earnings && (
          <div className="grid grid-cols-3 gap-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
            <div className="text-center">
              <span className="block text-theme-xs text-gray-500 dark:text-gray-400">Total Earned</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-white">₹{earnings.total_earned}</span>
            </div>
            <div className="text-center border-l border-gray-200 dark:border-gray-700 hitman">
              <span className="block text-theme-xs text-gray-500 dark:text-gray-400">Withdrawn</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-white">₹{earnings.total_withdrawn}</span>
            </div>
            <div className="text-center border-l border-gray-200 dark:border-gray-700 luxury">
              <span className="block text-theme-xs text-gray-500 dark:text-gray-400">Balance</span>
              <span className="text-sm font-semibold text-brand-500">₹{earnings.current_balance}</span>
            </div>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Withdrawal Amount (INR)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="0.00"
            className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800"
            required
            min="1"
          />
        </div>

        {error && (
          <p className="text-sm text-error-500 font-medium">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !selectedUserId}>
            {loading ? "Creating..." : "Create Request"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
