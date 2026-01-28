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
import { EditLocationDialog } from './edit-location-dialog';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Inventory } from '@/types';
import { format } from 'date-fns';

export default function InventoryPage() {
    const [search, setSearch] = useState('');
    const [warehouseFilter, setWarehouseFilter] = useState<string>('all');
    const [viewingInventory, setViewingInventory] = useState<Inventory | null>(null);

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
                            <TableHead>Vị trí</TableHead>
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
                                    <TableRow
                                        key={item.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => setViewingInventory(item)}
                                    >
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
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">
                                                    {item.location || <span className="text-muted-foreground italic">Chưa xếp</span>}
                                                </span>
                                                <EditLocationDialog
                                                    inventoryId={item.id}
                                                    currentLocation={item.location}
                                                    productName={item.product.name}
                                                />
                                            </div>
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

            <Dialog open={!!viewingInventory} onOpenChange={() => setViewingInventory(null)}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Chi tiết tồn kho</DialogTitle>
                    </DialogHeader>
                    {viewingInventory && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Sản phẩm</p>
                                    <p className="font-medium">{viewingInventory.product.name}</p>
                                    <p className="text-xs text-muted-foreground">{viewingInventory.product.sku}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Kho lưu trữ</p>
                                    <p className="font-medium">{viewingInventory.warehouse.name}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 border-t pt-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Số lượng tồn</p>
                                    <p className="text-2xl font-bold text-primary">{viewingInventory.quantity}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Định mức Min</p>
                                    <p className="font-medium">{viewingInventory.product.minStock}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Định mức Max</p>
                                    <p className="font-medium">{viewingInventory.product.maxStock}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Vị trí</p>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium">
                                            {viewingInventory.location || <span className="italic text-muted-foreground">Chưa xếp</span>}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Cập nhật lần cuối</p>
                                    <p className="font-medium">
                                        {format(new Date(viewingInventory.updatedAt), 'HH:mm dd/MM/yyyy')}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-muted/30 p-3 rounded-lg border">
                                <p className="text-sm font-medium mb-1">Trạng thái tồn kho</p>
                                {(() => {
                                    const status = getStockStatus(
                                        viewingInventory.quantity,
                                        viewingInventory.product.minStock,
                                        viewingInventory.product.maxStock
                                    );
                                    const StatusIcon = status.icon;
                                    return (
                                        <div className={`flex items-center gap-2 p-2 rounded ${status.color.replace('bg-', 'bg-opacity-20 ')}`}>
                                            <StatusIcon className="h-4 w-4" />
                                            <span className="font-medium">{status.label}</span>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
