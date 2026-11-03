// Mercado Pago Orders v1 limits items[].external_code to 30 characters.
// Keep the historical value intact when it fits; truncate only the random
// purchase-code prefix, preserving a stable "-addon" suffix for every retry.
export function mercadoPagoAddonExternalCode(code) {
  const suffix="-addon";
  const normalized=String(code||"").trim();
  if(!/^[a-f0-9]{18,30}$/.test(normalized))throw new Error("invalid_item_code");
  return normalized.slice(0,30-suffix.length)+suffix;
}
