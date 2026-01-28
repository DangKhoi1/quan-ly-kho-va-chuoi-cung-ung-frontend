'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import {
    LayoutDashboard,
    Package,
    Warehouse,
    Users,
    FileText,
    TrendingUp,
    Truck,
    LogOut,
    ShoppingCart,
    PackageOpen,
    ArrowRightLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { NotificationBell } from '@/components/layout/notification-bell';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Warehouse, label: 'Kho hàng', href: '/dashboard/warehouses' },
    { icon: Package, label: 'Sản phẩm', href: '/dashboard/products' },
    { icon: Users, label: 'Nhà cung cấp', href: '/dashboard/suppliers' },
    { icon: PackageOpen, label: 'Nhập kho', href: '/dashboard/imports' },
    { icon: ShoppingCart, label: 'Xuất kho', href: '/dashboard/exports' },
    { icon: FileText, label: 'Tồn kho', href: '/dashboard/inventory' },
    { icon: ArrowRightLeft, label: 'Chuyển kho', href: '/dashboard/transfers' },
    { icon: Truck, label: 'Đối tác', href: '/dashboard/partners' },
    { icon: TrendingUp, label: 'Báo cáo', href: '/dashboard/reports' },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, user, logout, hasHydrated } = useAuthStore();

    useEffect(() => {

        if (hasHydrated && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, hasHydrated, router]);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };


    if (!hasHydrated) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Đang tải...</p>
                </div>
            </div>
        );
    }


    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="flex h-screen bg-muted/20">
            { }
            <aside className="w-64 border-r bg-card">
                <div className="flex h-full flex-col">
                    { }
                    <div className="flex h-16 items-center border-b px-6">
                        <Link href="/dashboard" className="flex items-center gap-2 flex-1 hover:opacity-80 transition-opacity">
                            <Package className="h-6 w-6 text-primary" />
                            <span className="font-semibold text-lg flex-1 whitespace-nowrap">Warehouse Manager</span>
                        </Link>
                    </div>

                    { }
                    <nav className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                                            isActive
                                                ? 'bg-primary text-primary-foreground'
                                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>

                    { }
                    <div className="border-t p-4">
                        <Link href="/dashboard/profile">
                            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3 hover:bg-muted transition-colors cursor-pointer border border-transparent hover:border-primary/20">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground overflow-hidden">
                                    {user?.avatar ? (
                                        <img
                                            src={`http://localhost:3001${user.avatar}`}
                                            alt={user.fullName}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        user?.fullName.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-medium truncate">{user?.fullName}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                                </div>
                            </div>
                        </Link>
                        <Separator className="my-3" />
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-muted-foreground"
                            onClick={handleLogout}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Đăng xuất
                        </Button>
                    </div>
                </div>
            </aside>

            { }
            {/* Main content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-background px-6 justify-end shrink-0">
                    <NotificationBell />
                </header>
                <main className="flex-1 overflow-y-auto">
                    <div className="container mx-auto p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
