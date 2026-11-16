import "./globals.css";
export const metadata={
 title:"CERCA · Pequeños momentos, grandes vínculos",
 description:"Tres oportunidades diarias para conectar, comprender y acompañar a cada hijo, sin presiones.",
 applicationName:"CERCA",manifest:"/manifest.webmanifest",
 icons:{icon:"/icon.svg"},robots:{index:false,follow:false}
};
export const viewport={width:"device-width",initialScale:1,themeColor:"#175b53"};
export default function RootLayout({children}){return <html lang="es"><body>{children}</body></html>}
