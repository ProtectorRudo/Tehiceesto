import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Socios · Te Hice Esto",
  robots: { index: false, follow: false, nocache: true },
};

export default function AffiliatesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
