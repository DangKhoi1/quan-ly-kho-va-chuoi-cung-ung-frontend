'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehousesApi } from '@/services/api';
import { Warehouse, WarehouseType } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/ui/status-badge';
import { toast } from 'sonner';
import { Edit, Trash2, Search, Warehouse as WarehouseIcon, Ban, RotateCcw, MoreHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function WarehousesPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
    const [formData, setFormData] = useState<{
        name: string;
        type: WarehouseType;
        address: string;
        phone: string;
        manager: string;
        description: string;
    }>({
        name: '',
        type: WarehouseType.BRANCH,
        address: '',
        phone: '',
        manager: '',
        description: '',
    });

    const { data: warehouses, isLoading } = useQuery({
        queryKey: ['warehouses'],
        queryFn: async () => {
            const response = await warehousesApi.getAll();
            return response.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: Partial<Warehouse>) => warehousesApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warehouses'] });
            toast.success('Tạo kho thành công!');
            handleCloseDialog();
        },
        onError: () => toast.error('Có lỗi xảy ra!'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Warehouse> }) =>
            warehousesApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warehouses'] });
            toast.success('Cập nhật thành công!');
            handleCloseDialog();
        },
        onError: () => toast.error('Có lỗi xảy ra!'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => warehousesApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warehouses'] });
            toast.success('Xóa kho hàng thành công!');
        },
        onError: () => toast.error('Không thể xóa kho hàng này!'),
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
            warehousesApi.update(id, { isActive }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['warehouses'] });
            toast.success('Cập nhật trạng thái thành công!');
        },
        onError: () => toast.error('Có lỗi xảy ra!'),
    });

    const handleOpenDialog = (warehouse?: Warehouse) => {
        if (warehouse) {
            setEditingWarehouse(warehouse);
            setFormData({
                name: warehouse.name,
                type: warehouse.type,
                address: warehouse.address,
                phone: warehouse.phone || '',
                manager: warehouse.manager || '',
                description: warehouse.description || '',
            });
        } else {
            setEditingWarehouse(null);
            setFormData({
                name: '',
                type: WarehouseType.BRANCH,
                address: '',
                phone: '',
                manager: '',
                description: '',
            });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingWarehouse(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingWarehouse) {
            updateMutation.mutate({ id: editingWarehouse.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        description: string;
        action: () => void;
        confirmText?: string;
        variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'warning';
    }>({ open: false, title: '', description: '', action: () => { }, confirmText: 'Xóa', variant: 'destructive' });

    const handleDelete = (id: string) => {
        setConfirmDialog({
            open: true,
            title: 'Xóa kho hàng',
            description: 'Bạn có chắc chắn muốn xóa kho hàng này? Hành động này không thể hoàn tác.',
            action: () => {
                deleteMutation.mutate(id);
                setConfirmDialog((prev) => ({ ...prev, open: false }));
            },
            confirmText: 'Xóa',
            variant: 'destructive',
        });
    };

    const handleToggleStatus = (warehouse: Warehouse) => {
        const newStatus = !warehouse.isActive;
        const actionText = newStatus ? 'kích hoạt' : 'ngừng hoạt động';
        setConfirmDialog({
            open: true,
            title: newStatus ? 'Kích hoạt lại' : 'Ngừng hoạt động',
            description: `Bạn có chắc chắn muốn ${actionText} kho hàng "${warehouse.name}"?`,
            action: () => {
                toggleStatusMutation.mutate({ id: warehouse.id, isActive: newStatus });
                setConfirmDialog((prev) => ({ ...prev, open: false }));
            },
            confirmText: 'Đồng ý',
            variant: newStatus ? 'default' : 'warning',
        });
    };

    const filteredWarehouses = warehouses
        ?.filter((w) => {
            if (statusFilter === 'active') return w.isActive;
            if (statusFilter === 'inactive') return !w.isActive;
            return true;
        })
        ?.filter((w) =>
            w.name.toLowerCase().includes(search.toLowerCase()) ||
            w.address.toLowerCase().includes(search.toLowerCase())
        );

    const [viewingWarehouse, setViewingWarehouse] = useState<Warehouse | null>(null);

    const handleViewDetail = (warehouse: Warehouse) => {
        setViewingWarehouse(warehouse);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Quản lý Kho hàng"
                description="Quản lý thông tin các kho hàng trong hệ thống"
                action={{
                    label: 'Thêm kho mới',
                    onClick: () => handleOpenDialog(),
                }}
            />

            <Card className="p-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 flex-1">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm theo tên hoặc địa chỉ..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                    <div className="w-[200px]">
                        <Select
                            value={statusFilter}
                            onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="active">Đang hoạt động</SelectItem>
                                <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tên kho</TableHead>
                            <TableHead>Loại</TableHead>
                            <TableHead>Địa chỉ</TableHead>
                            <TableHead>Quản lý</TableHead>
                            <TableHead>Điện thoại</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredWarehouses?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    <WarehouseIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-muted-foreground">Chưa có kho nào</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredWarehouses?.map((warehouse) => (
                                <TableRow
                                    key={warehouse.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleViewDetail(warehouse)}
                                >
                                    <TableCell className="font-medium">{warehouse.name}</TableCell>
                                    <TableCell>
                                        <StatusBadge status={warehouse.type === 'main' ? 'Kho chính' : 'Chi nhánh'} />
                                    </TableCell>
                                    <TableCell>{warehouse.address}</TableCell>
                                    <TableCell>{warehouse.manager || '-'}</TableCell>
                                    <TableCell>{warehouse.phone || '-'}</TableCell>
                                    <TableCell>
                                        <StatusBadge status={warehouse.isActive ? 'active' : 'inactive'} />
                                    </TableCell>
                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleViewDetail(warehouse)}>
                                                    <Search className="mr-2 h-4 w-4" />
                                                    Xem chi tiết
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleOpenDialog(warehouse)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Sửa thông tin
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleToggleStatus(warehouse)}>
                                                    {warehouse.isActive ? (
                                                        <>
                                                            <Ban className="mr-2 h-4 w-4 text-orange-500" />
                                                            Ngừng hoạt động
                                                        </>
                                                    ) : (
                                                        <>
                                                            <RotateCcw className="mr-2 h-4 w-4 text-green-500" />
                                                            Kích hoạt lại
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(warehouse.id)}
                                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Xóa kho hàng
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingWarehouse ? 'Cập nhật kho' : 'Thêm kho mới'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingWarehouse ? 'Cập nhật thông tin kho hàng' : 'Nhập thông tin kho hàng mới'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Tên kho *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Loại kho *</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(value: WarehouseType) =>
                                            setFormData({ ...formData, type: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="main">Kho chính</SelectItem>
                                            <SelectItem value="branch">Chi nhánh</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Địa chỉ *</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="manager">Quản lý</Label>
                                    <Input
                                        id="manager"
                                        value={formData.manager}
                                        onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Điện thoại</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Mô tả</Label>
                                <Input
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                {editingWarehouse ? 'Cập nhật' : 'Tạo mới'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewingWarehouse} onOpenChange={(open) => !open && setViewingWarehouse(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Chi tiết kho hàng</DialogTitle>
                    </DialogHeader>
                    {viewingWarehouse && (
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Thông tin chung</h4>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-3 text-sm">
                                            <span className="text-muted-foreground">Tên kho:</span>
                                            <span className="col-span-2 font-medium">{viewingWarehouse.name}</span>
                                        </div>
                                        <div className="grid grid-cols-3 text-sm">
                                            <span className="text-muted-foreground">Loại kho:</span>
                                            <span className="col-span-2">
                                                <StatusBadge status={viewingWarehouse.type === 'main' ? 'Kho chính' : 'Chi nhánh'} />
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 text-sm">
                                            <span className="text-muted-foreground">Trạng thái:</span>
                                            <span className="col-span-2">
                                                <StatusBadge status={viewingWarehouse.isActive ? 'active' : 'inactive'} />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Quản lý & Liên hệ</h4>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-3 text-sm">
                                            <span className="text-muted-foreground">Quản lý:</span>
                                            <span className="col-span-2">{viewingWarehouse.manager || '-'}</span>
                                        </div>
                                        <div className="grid grid-cols-3 text-sm">
                                            <span className="text-muted-foreground">Điện thoại:</span>
                                            <span className="col-span-2">{viewingWarehouse.phone || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground mb-1">Địa chỉ</h4>
                                <p className="text-sm">{viewingWarehouse.address}</p>
                            </div>

                            {viewingWarehouse.description && (
                                <div>
                                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Mô tả</h4>
                                    <p className="text-sm bg-muted/50 p-2 rounded-md">{viewingWarehouse.description}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setViewingWarehouse(null)}>Đóng</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{confirmDialog.title}</DialogTitle>
                        <DialogDescription className="py-2">
                            {confirmDialog.description}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
                        >
                            Hủy
                        </Button>
                        <Button
                            variant={confirmDialog.variant || 'destructive'}
                            onClick={confirmDialog.action}
                        >
                            {confirmDialog.confirmText || 'Xóa'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
