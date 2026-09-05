import type { OrderRecord } from "../api/orders";
import type { ExcelColumn } from "./exportToExcel";
import { exportNum, exportPhone, exportStr } from "./exportHelpers";
import { orderGatewayLabel } from "./orderGateway";

const str = exportStr;
const num = exportNum;

/** All list/API fields suitable for admin order export. */
export const ORDER_EXPORT_COLUMNS: ExcelColumn<OrderRecord>[] = [
  { header: "ID", accessor: (r) => r.id },
  { header: "Order ID", accessor: (r) => str(r.order_id) },
  { header: "User ID", accessor: (r) => (r.user_id != null ? r.user_id : "") },
  { header: "Type", accessor: (r) => str(r.type) },
  { header: "Entity ID", accessor: (r) => str(r.entity_id) },
  { header: "Entity name", accessor: (r) => str(r.entity_name) },
  { header: "Amount", accessor: (r) => num(r.amount) },
  { header: "Currency", accessor: (r) => str(r.currency) },
  { header: "Status", accessor: (r) => str(r.status) },
  { header: "Buyer name", accessor: (r) => str(r.buyer_name) },
  { header: "Buyer email", accessor: (r) => str(r.buyer_email) },
  { header: "Buyer mobile", accessor: (r) => exportPhone(r.buyer_mobile) },
  { header: "Buyer GST", accessor: (r) => str(r.buyer_gst) },
  { header: "Affiliate", accessor: (r) => str(r.affiliate) },
  { header: "Coupon code", accessor: (r) => str(r.coupon_code) },
  { header: "Coupon discount", accessor: (r) => num(r.coupon_discount) },
  { header: "Original amount", accessor: (r) => num(r.original_amount) },
  { header: "Gateway", accessor: (r) => orderGatewayLabel(r.gateway) },
  { header: "Batch ID", accessor: (r) => (r.batch_id != null ? r.batch_id : "") },
  { header: "Created at", accessor: (r) => str(r.created_at) },
  { header: "Payment ID", accessor: (r) => str(r.payment_id) },
  { header: "Refund amount", accessor: (r) => num(r.refund_amount) },
  { header: "Refund remarks", accessor: (r) => str(r.refund_remarks) },
  { header: "UTM source", accessor: (r) => str(r.utm?.source) },
  { header: "UTM medium", accessor: (r) => str(r.utm?.medium) },
  { header: "UTM campaign", accessor: (r) => str(r.utm?.campaign) },
  { header: "UTM content", accessor: (r) => str(r.utm?.content) },
  { header: "UTM term", accessor: (r) => str(r.utm?.term) },
];
