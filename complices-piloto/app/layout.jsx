import './globals.css';
export const metadata={title:'Cómplices · Nuestro rincón',description:'Un lugar privado para seguir eligiéndose cada día',robots:{index:false,follow:false}};
export const viewport={width:'device-width',initialScale:1,themeColor:'#110d19'};
export default function RootLayout({children}){return <html lang='es'><body>{children}</body></html>}
