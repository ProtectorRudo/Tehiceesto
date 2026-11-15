import './globals.css';
import './paired-redesign.css';
export const metadata={title:'Cómplices · Una historia para dos',description:'Un lugar privado para seguir eligiéndose cada día',robots:{index:false,follow:false},manifest:"/manifest.webmanifest",icons:{icon:"/icon.svg",apple:"/icon.svg"}};
export const viewport={width:'device-width',initialScale:1,themeColor:'#fff8f8'};
export default function RootLayout({children}){return <html lang='es'><body>{children}</body></html>}
