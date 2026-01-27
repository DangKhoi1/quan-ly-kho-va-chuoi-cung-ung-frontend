'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi, warehousesApi } from '@/services/api';
import { PageHeader } from '@/components/layout/page-header';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, AlertCircle, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function InventoryPage() {
    const [search, setSearch] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState<string>('all');

    const { data: inventory, isLoading } = useQuery({
        queryKey: ['inventory'],
        queryFn: async () => {
            const response = await inventoryApi.getAll();
            return response.data;
        },
    });

    const { data: warehouses } = useQuery({
        queryKey: ['warehouses'],
        queryFn: async () => {
            const response = await warehousesApi.getActive();
            return response.data;
        },
    });

    const filteredInventory = inventory?.filter((item) => {
        const matchesSearch =
            item.product.name.toLowerCase().includes(search.toLowerCase()) ||
            item.product.sku.toLowerCase().includes(search.toLowerCase());
        const matchesWarehouse = warehouseFilter === 'all' || item.warehouseId === warehouseFilter;
        return matchesSearch && matchesWarehouse;
    });

    const getStockStatus = (quantity: number, minStock: number, maxStock: number) => {
        if (quantity <= minStock) {
            return { label: 'Tồn thấp', color: 'bg-red-100 text-red-700', icon: AlertCircle };
        } else if (quantity >= maxStock) {
            return { label: 'Tồn cao', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle };
        }
        return { label: 'Bình thường', color: 'bg-green-100 text-green-700', icon: Package };
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Tồn kho"
                description="Theo dõi số lượng hàng tồn kho theo sản phẩm và kho"
            />

            <Card className="p-4">
                <div className="flex gap-4">
                    <div className="flex-1 flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm theo tên hoặc SKU sản phẩm..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Kho" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả kho</SelectItem>
                            {warehouses?.map((wh) => (
                                <SelectItem key={wh.id} value={wh.id}>
                                    {wh.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </Card>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>SKU</TableHead>
                            <TableHead>Sản phẩm</TableHead>
                            <TableHead>Kho</TableHead>
                            <TableHead className="text-right">Tồn kho</TableHead>
                            <TableHead className="text-right">Min</TableHead>
                            <TableHead className="text-right">Max</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Cập nhật</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredInventory?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8">
                                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-muted-foreground">Chưa có tồn kho nào</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredInventory?.map((item) => {
                                const status = getStockStatus(item.quantity, item.product.minStock, item.product.maxStock);
                                const StatusIcon = status.icon;

                                return (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-mono">{item.product.sku}</TableCell>
                                        <TableCell className="font-medium">{item.product.name}</TableCell>
                                        <TableCell>{item.warehouse.name}</TableCell>
                                        <TableCell className="text-right font-bold">{item.quantity}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            {item.product.minStock}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">
                                            {item.product.maxStock}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={status.color}>
                                                <StatusIcon className="h-3 w-3 mr-1" />
                                                {status.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {new Date(item.updatedAt).toLocaleDateString('vi-VN')}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
