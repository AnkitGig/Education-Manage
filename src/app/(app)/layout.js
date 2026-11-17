import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#F3F8FF]">
      <Sidebar />
      <div className="min-w-0 flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-5 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
