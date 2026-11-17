import React from "react";

export const metadata = {
  title: "Platform Admin — Society ERP",
  description: "SaaS Super Admin and Operations Panel",
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
