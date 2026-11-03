export type PurchasedRendererFamily="premium-legacy"|"secret"|"club"|"sticker-bomb"|"jar365"|"seven-days"|"dragon-ball";
export declare const PURCHASED_RENDERERS: Readonly<Record<string, Readonly<Record<string,PurchasedRendererFamily>>>>;
export declare const NON_GIFT_PRODUCTS: readonly string[];
export declare function purchasedRendererFor(slug:string,version:string):PurchasedRendererFamily;
