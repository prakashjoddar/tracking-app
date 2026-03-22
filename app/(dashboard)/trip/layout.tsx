"use client";

export default function TripsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full">
      {children}
    </div>
  )
}

