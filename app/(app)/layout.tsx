import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import QueryProvider from "@/components/providers/QueryProvider";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import { Toaster } from "react-hot-toast";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <CurrencyProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <TopBar />
            <main className="flex-1 p-6 overflow-auto">{children}</main>
          </div>
        </div>
        <Toaster position="top-right" />
      </CurrencyProvider>
    </QueryProvider>
  );
}
