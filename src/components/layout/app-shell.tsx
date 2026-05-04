import Link from "next/link";
import { CalendarDays, CakeSlice, ClipboardList, Home, Package, PackageCheck, ShoppingBag } from "lucide-react";
import { mockSession } from "@/lib/auth/session";

const navItems = [
  { href: "/dashboard", label: "儀表板", icon: Home },
  { href: "/products", label: "商品", icon: CakeSlice },
  { href: "/packagings", label: "包材", icon: Package },
  { href: "/inventory/products", label: "商品庫存", icon: PackageCheck },
  { href: "/inventory/packagings", label: "包材庫存", icon: ShoppingBag },
  { href: "/orders", label: "訂單", icon: ClipboardList },
  { href: "/schedule", label: "排程", icon: CalendarDays }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-r bg-card">
        <div className="flex h-16 items-center border-b px-5">
          <Link href="/dashboard" className="font-semibold">
            家庭烘焙訂單系統
          </Link>
        </div>
        <nav className="grid gap-1 p-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div>
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
          <div>
            <p className="text-sm text-muted-foreground">MVP Mock Repository</p>
            <h1 className="font-semibold">訂單建立、排程與明細交付</h1>
          </div>
          <div className="text-sm text-muted-foreground">
            {mockSession.username} / {mockSession.role}
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl p-6">{children}</main>
      </div>
    </div>
  );
}
