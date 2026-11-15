self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",event=>event.waitUntil(self.clients.claim()));
self.addEventListener("push",event=>{
 let data={};
 try{data=event.data?.json()||{}}catch{data={}}
 event.waitUntil(self.registration.showNotification(data.title||"Cómplices ❤️",{
  body:data.body||"Tu pareja te dejó algo especial. Entrá para descubrirlo.",
  icon:"/icon.svg",badge:"/icon.svg",tag:"cp-"+Date.now(),renotify:false
 }));
});
self.addEventListener("notificationclick",event=>{
 event.notification.close();
 event.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(clients=>{
  for(const client of clients){if(client.url.startsWith(self.location.origin)&&"focus" in client)return client.focus()}
  return self.clients.openWindow("/");
 }));
});
