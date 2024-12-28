import Navbar from "@/components/ui/navbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16">
        {children}
      </main>
    </>
  );
} 