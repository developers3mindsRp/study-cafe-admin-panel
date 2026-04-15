import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { WithdrawalRequestsTable } from "../../components/tables/WithdrawalRequestsTable";
import { CreateWithdrawalModal } from "../../components/affiliate/CreateWithdrawalModal";
import { UpdateWithdrawalModal } from "../../components/affiliate/UpdateWithdrawalModal";
import { PlusIcon } from "../../icons";
import Button from "../../components/ui/button/Button";
import type { WithdrawalRequest } from "../../api/affiliate";

export default function WithdrawalRequests() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUpdateClick = (request: WithdrawalRequest) => {
    setSelectedRequest(request);
    setIsUpdateModalOpen(true);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <>
      <PageMeta 
        title="Withdrawal Requests | StudyCafe Admin" 
        description="Manage affiliate payout requests" 
      />
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <PageBreadcrumb pageTitle="Withdrawal Requests" />
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2"
          size="sm"
        >
          <PlusIcon className="size-4" />
          Create Request
        </Button>
      </div>

      <div className="space-y-6">
        <WithdrawalRequestsTable 
          key={refreshKey}
          onUpdateStatus={handleUpdateClick} 
        />
      </div>

      <CreateWithdrawalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleRefresh}
      />

      <UpdateWithdrawalModal
        request={selectedRequest}
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setSelectedRequest(null);
        }}
        onSuccess={handleRefresh}
      />
    </>
  );
}
