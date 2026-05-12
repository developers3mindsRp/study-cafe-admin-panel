import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { OrdersTable } from "../../components/tables";
import Button from "../../components/ui/button/Button";
import { PlusIcon } from "../../icons";
import { Link } from "react-router";

export default function OrderList() {
  return (
    <>
      <PageMeta title="Orders | StudyCafe Admin" description="View orders" />
      <PageBreadcrumb
        pageTitle="Orders"
        actions={
          <Link to="/orders/create">
            <Button startIcon={<PlusIcon className="w-5 h-5" />}>
              Create Order
            </Button>
          </Link>
        }
      />
      <div className="space-y-6">
        <OrdersTable />
      </div>
    </>
  );
}
