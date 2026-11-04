/**
 * Read-only operational triage for Mercado Pago rows returned by admin-api.
 * Approved does not imply a complete, actionable historical payment record.
 * Email accepted by Resend is not proof of delivery to the recipient inbox.
 * Never cause a retry or change any payment/gift status from this module.
 */
export function historicalApprovalNeedsReview(sale){
  if(sale?.status!=="approved")return false;
  return !sale.paidAt || !Number.isSafeInteger(sale.priceMinor) || sale.priceMinor<=0;
}

export function accessNeedsReview(sale){
  if(sale?.status!=="approved" || historicalApprovalNeedsReview(sale))return false;
  return !String(sale.buyerEmail||"").trim() || sale.accessEmailAccepted!==true;
}

export function saleAttentionPriority(sale){
  if(accessNeedsReview(sale))return 3;
  if(historicalApprovalNeedsReview(sale))return 2;
  if(sale?.status==="approved"&&!sale.contactedAt)return 1;
  return 0;
}

export function operationalSaleCounts(sales){
  const rows=Array.isArray(sales)?sales:[];
  return Object.freeze({
    approved:rows.filter(s=>s.status==="approved").length,
    pending:rows.filter(s=>s.status==="pending").length,
    accessReview:rows.filter(accessNeedsReview).length,
    historicalReview:rows.filter(historicalApprovalNeedsReview).length,
    total:rows.length,
  });
}
