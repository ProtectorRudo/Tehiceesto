import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel interno · Te Hice Esto",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
