'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, inventoryApi } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Warehouse, AlertCircle, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
    const { data: dashboardData } = useQuery({
        queryKey: ['dashboard'],
        queryFn: async () => {
            const response = await reportsApi.getDashboard();
            return response.data;
        },
    });

    const { data: lowStockItems } = useQuery({
        queryKey: ['low-stock-count'],
        queryFn: async () => {
            const response = await inventoryApi.getLowStock();
            return response.data;
        },
    });

    const stats = [
        {
            title: 'Tổng sản phẩm',
            value: dashboardData?.totalProducts || '0',
            icon: Package,
            description: 'Sản phẩm đang quản lý',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            href: '/dashboard/products',
        },
        {
            title: 'Kho hàng',
            value: dashboardData?.totalWarehouses || '0',
            icon: Warehouse,
            description: 'Kho đang hoạt động',
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            href: '/dashboard/warehouses',
        },
        {
            title: 'Cảnh báo tồn kho',
            value: lowStockItems?.length || '0',
            icon: AlertCircle,
            description: 'Sản phẩm sắp hết',
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            href: '/dashboard/inventory/alerts',
        },
        {
            title: 'Giá trị tồn kho',
            value: new Intl.NumberFormat('vi-VN', {
                notation: 'compact',
                maximumFractionDigits: 1,
            }).format(dashboardData?.totalInventoryValue || 0) + ' ₫',
            icon: TrendingUp,
            description: 'Tổng giá trị hàng tồn',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            href: '/dashboard/inventory',
        },
    ];

    const recentActivities = [
        {
            title: 'Phiếu nhập mới',
            count: dashboardData?.recentImports || 0,
            trend: 'up',
            href: '/dashboard/imports',
        },
        {
            title: 'Phiếu xuất mới',
            count: dashboardData?.recentExports || 0,
            trend: 'down',
            href: '/dashboard/exports',
        },
    ];

    return (
        <div className="space-y-6">
            {}
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                    Tổng quan hệ thống quản lý kho
                </p>
            </div>

            {}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Link key={stat.title} href={stat.href}>
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {stat.title}
                                    </CardTitle>
                                    <div className={`${stat.bgColor} p-2 rounded-lg`}>
                                        <Icon className={`h-4 w-4 ${stat.color}`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stat.value}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {stat.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            {}
            <div className="grid gap-4 md:grid-cols-2">
                {recentActivities.map((activity) => (
                    <Link key={activity.title} href={activity.href}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center justify-between">
                                    {activity.title}
                                    {activity.trend === 'up' ? (
                                        <ArrowUpRight className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <ArrowDownRight className="h-5 w-5 text-blue-500" />
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{activity.count}</div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Trong 7 ngày qua
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {}
            <Card>
                <CardHeader>
                    <CardTitle>Thao tác nhanh</CardTitle>
                    <CardDescription>Các tác vụ thường dùng</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-4">
                    <Link href="/dashboard/imports">
                        <Button variant="outline" className="w-full justify-start">
                            <Package className="mr-2 h-4 w-4" />
                            Tạo phiếu nhập
                        </Button>
                    </Link>
                    <Link href="/dashboard/exports">
                        <Button variant="outline" className="w-full justify-start">
                            <Package className="mr-2 h-4 w-4" />
                            Tạo phiếu xuất
                        </Button>
                    </Link>
                    <Link href="/dashboard/products">
                        <Button variant="outline" className="w-full justify-start">
                            <Package className="mr-2 h-4 w-4" />
                            Thêm sản phẩm
                        </Button>
                    </Link>
                    <Link href="/dashboard/inventory/alerts">
                        <Button variant="outline" className="w-full justify-start">
                            <AlertCircle className="mr-2 h-4 w-4" />
                            Xem cảnh báo
                        </Button>
                    </Link>
                </CardContent>
            </Card>


        </div>
    );
}
