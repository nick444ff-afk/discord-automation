import React from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050c1f]">
      {children}
    </div>
  );
}
