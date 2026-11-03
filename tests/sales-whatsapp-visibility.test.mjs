import test from "node:test";
import assert from "node:assert/strict";
import {
  hideSalesWhatsappOnRoute,
  salesContextForRoute,
  buyerAlreadyOwnsSalesContext,
} from "../lib/marketing/sales-whatsapp-visibility.ts";

test("full versions of all four games have no WhatsApp sales CTA",()=>{
  for(const route of [
    "/juegos/pack/completo",
    "/juegos/pack/completo/",
    "/juegos/trazo-complice/completo",
    "/juegos/entre-dos/completo",
    "/juegos/complices/completo",
    "/juegos/meme-match/completo",
    "/juegos/meme-match/jugar",
  ])assert.equal(hideSalesWhatsappOnRoute(route),true,route);
});

test("finished gifts and personal account never advertise another purchase",()=>{
  for(const route of [
    "/mis-regalos","/mis-regalos/","/mis-regalos/editar",
    "/r/e8a179b15c7e434ff9","/r/e8a179b15c7e434ff9/dia/7/abc",
    "/sorpresa/e8a179b15c7e434ff9",
    "/pedido/012345","/experiencias/sticker-bomb-amistad/editar",
    "/escape-r/ab123","/voz",
  ])assert.equal(hideSalesWhatsappOnRoute(route),true,route);
});

test("public demos and commercial catalogue still work for new visitors",()=>{
  for(const route of [
    "/","/experiencias/pareja","/experiencias/dragon-ball-pareja",
    "/juegos/pack","/juegos/trazo-complice",
    "/comprar/pack-juegos","/crear","/coleccion/pareja",
  ])assert.equal(hideSalesWhatsappOnRoute(route),false,route);
});

test("already-purchased experience hides the same experience demo's CTA",()=>{
  const target=salesContextForRoute("/experiencias/dragon-ball-pareja");
  assert.ok(target);
  assert.equal(buyerAlreadyOwnsSalesContext([{experienceSlug:"dragon-ball-pareja"}],target),true);
  assert.equal(buyerAlreadyOwnsSalesContext([{experienceSlug:"pareja"}],target),false);
});

test("4-game pack suppresses CTA in every associated game, including pack sales page",()=>{
  const owned=[{experienceSlug:"pack-juegos"}];
  for(const route of ["/juegos/pack","/juegos/complices","/juegos/trazo-complice","/juegos/entre-dos","/juegos/meme-match"]){
    const context=salesContextForRoute(route);
    assert.ok(context,route);
    assert.equal(buyerAlreadyOwnsSalesContext(owned,context),true,route);
  }
});

test("standalone game buyer only suppresses its own sales offer",()=>{
  const owned=[{experienceSlug:"trazo-complice"}];
  assert.equal(buyerAlreadyOwnsSalesContext(owned,salesContextForRoute("/juegos/trazo-complice")),true);
  assert.equal(buyerAlreadyOwnsSalesContext(owned,salesContextForRoute("/juegos/pack")),false);
});

test("private routes cannot be mistaken for public marketing contexts",()=>{
  for(const route of ["/juegos/pack/completo","/r/e8a179b15c7e434ff9","/experiencias/sticker-bomb-amistad/editar"]){
    assert.equal(salesContextForRoute(route),null,route);
  }
});
