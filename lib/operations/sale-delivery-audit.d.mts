export type OperationalSale={
 status:string;
 paidAt:string|null;
 priceMinor:number|null;
 buyerEmail:string;
 accessEmailAccepted:boolean;
 contactedAt:string|null;
};

export declare function historicalApprovalNeedsReview(sale:OperationalSale):boolean;
export declare function accessNeedsReview(sale:OperationalSale):boolean;
export declare function saleAttentionPriority(sale:OperationalSale):number;
export declare function operationalSaleCounts(sales:OperationalSale[]):Readonly<{
 approved:number;
 pending:number;
 accessReview:number;
 historicalReview:number;
 total:number;
}>;
