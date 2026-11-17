import React from "react";

export const metadata = {
  title: "Society ERP SaaS",
  description: "Multi-tenant, India-first property and society management ERP",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
