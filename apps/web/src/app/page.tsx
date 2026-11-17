import React from "react";

export default function HomePage() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Society ERP SaaS</h1>
      <p>Multi-tenant, India-first society management ERP platform.</p>
      <div
        style={{
          marginTop: "1.5rem",
          padding: "1rem",
          background: "#f4f4f5",
          borderRadius: "8px",
        }}
      >
        <h3>Core Traceability Flow:</h3>
        <code>
          Resident &rarr; Complaint &rarr; Task &rarr; Worker/Vendor &rarr;
          Asset &rarr; Inventory &rarr; Completion &rarr; Expense &rarr;
          Accounting &rarr; TallyPrime
        </code>
      </div>
    </main>
  );
}
