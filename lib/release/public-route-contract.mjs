/**
 * Permanent public URLs, independent of where we deploy or how games are
 * implemented internally. Never reuse a purchased URL for another product.
 */
export const PURCHASED_ROUTE_CONTRACT=Object.freeze({
  myGifts:"/mis-regalos",
  giftPrefix:"/r/",
  pack:"/juegos/pack/completo",
  standaloneDrawing:"/juegos/trazo-complice/completo",
  legacyPackReceipt:"/juegos/pack/pedido",
  guestVoices:"/voz",
});

export const GAME_ENTRY_ROUTES=Object.freeze([
  PURCHASED_ROUTE_CONTRACT.pack,
  PURCHASED_ROUTE_CONTRACT.standaloneDrawing,
]);

export const LEGACY_PACK_GAME_ROUTES=Object.freeze([
  "/juegos/entre-dos/completo",
  "/juegos/complices/completo",
  "/juegos/meme-match/completo",
]);
