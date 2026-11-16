// CERCA: no cachear endpoints privados ni datos de menores.
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",event=>event.waitUntil(self.clients.claim()));
self.addEventListener("push",event=>{
 let payload={title:"CERCA",body:"Hay un pequeño momento esperando por vos.",url:"/"};
 try{payload={...payload,...event.data.json()}}catch{}
 event.waitUntil(self.registration.showNotification(payload.title,{body:payload.body,icon:"/icon.svg",data:{url:"/"},tag:"cerca-reminder"}));
});
self.addEventListener("notificationclick",event=>{event.notification.close();event.waitUntil(self.clients.openWindow("/"))});
