'use client';

import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/services/api';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown, Package, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function AlertsPage() {
    const { data: lowStockItems, isLoading, refetch } = useQuery({
        queryKey: ['low-stock'],
        queryFn: async () => {
            const response = await inventoryApi.getLowStock();
            return response.data;
        },
        refetchInterval: 30000, // Auto-refresh every 30 seconds
    });

    return (
        <div className="space-y-6">
            <PageHeader
                title="Cảnh báo Tồn kho"
                description="Danh sách sản phẩm có tồn kho thấp cần nhập thêm"
                action={{
                    label: 'Làm mới',
                    onClick: () => refetch(),
                    icon: <RefreshCw className="mr-2 h-4 w-4" />,
                }}
            />

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tồn kho thấp</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {lowStockItems?.length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Sản phẩm cần nhập thêm
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Giá trị tồn thấp</CardTitle>
                        <TrendingDown className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                                notation: 'compact',
                            }).format(
                                lowStockItems?.reduce(
                                    (sum, item) => sum + item.quantity * item.product.costPrice,
                                    0
                                ) || 0
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Cần đầu tư thêm
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Auto-refresh</CardTitle>
                        <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">30s</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Cập nhật tự động
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-3">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <Skeleton className="h-6 w-full" />
                            </CardContent>
                        </Card>
                    ))
                ) : lowStockItems?.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <Package className="h-16 w-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Tồn kho ổn định!</h3>
                            <p className="text-muted-foreground">
                                Tất cả sản phẩm đều có đủ tồn kho
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    lowStockItems?.map((item) => {
                        const deficit = item.product.minStock - item.quantity;
                        const suggestedReorder = Math.max(
                            deficit,
                            Math.floor((item.product.maxStock - item.quantity) / 2)
                        );

                        return (
                            <Card key={item.id} className="border-l-4 border-l-red-500">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                                {item.product.name}
                                            </CardTitle>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                SKU: {item.product.sku} • {item.warehouse.name}
                                            </p>
                                        </div>
                                        <Badge className="bg-red-100 text-red-700">
                                            Tồn thấp
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Tồn hiện tại</p>
                                            <p className="text-2xl font-bold text-red-600">{item.quantity}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Mức tối thiểu</p>
                                            <p className="text-2xl font-bold">{item.product.minStock}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Thiếu hụt</p>
                                            <p className="text-2xl font-bold text-orange-600">
                                                {deficit > 0 ? deficit : 0}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Đề xuất nhập</p>
                                            <p className="text-2xl font-bold text-blue-600">
                                                {suggestedReorder}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex gap-2">
                                        <Link href="/dashboard/imports">
                                            <Button size="sm">
                                                <Package className="h-4 w-4 mr-2" />
                                                Tạo phiếu nhập
                                            </Button>
                                        </Link>
                                        <Button size="sm" variant="outline">
                                            Xem chi tiết
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            <Card className="border-yellow-500/50 bg-yellow-50/50">
                <CardContent className="p-6">
                    <div className="flex gap-4">
                        <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold mb-1">Lưu ý quan trọng</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Trang này tự động làm mới mỗi 30 giây</li>
                                <li>• Sản phẩm xuất hiện khi tồn kho ≤ mức tối thiểu</li>
                                <li>• Đề xuất nhập = (max - hiện tại) / 2 hoặc thiếu hụt (lấy giá trị lớn hơn)</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
