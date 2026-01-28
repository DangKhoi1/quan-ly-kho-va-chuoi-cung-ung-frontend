'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersApi } from '@/services/api';
import { Supplier } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Edit, Trash2, Search, Users, Ban, RotateCcw, MoreHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function SuppliersPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        taxCode: '',
        bankAccount: '',
        bankName: '',
        notes: '',
    });

    const { data: suppliers, isLoading } = useQuery({
        queryKey: ['suppliers'],
        queryFn: async () => {
            const response = await suppliersApi.getAll();
            return response.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: Partial<Supplier>) => suppliersApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast.success('Tạo nhà cung cấp thành công!');
            handleCloseDialog();
        },
        onError: () => toast.error('Có lỗi xảy ra!'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Supplier> }) =>
            suppliersApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast.success('Cập nhật thành công!');
            handleCloseDialog();
        },
        onError: () => toast.error('Có lỗi xảy ra!'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => suppliersApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast.success('Xóa nhà cung cấp thành công!');
        },
        onError: () => toast.error('Không thể xóa nhà cung cấp này!'),
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
            suppliersApi.update(id, { isActive }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast.success('Cập nhật trạng thái thành công!');
        },
        onError: () => toast.error('Có lỗi xảy ra!'),
    });

    const handleOpenDialog = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                code: supplier.code,
                name: supplier.name,
                contactPerson: supplier.contactPerson || '',
                email: supplier.email || '',
                phone: supplier.phone || '',
                address: supplier.address || '',
                taxCode: supplier.taxCode || '',
                bankAccount: supplier.bankAccount || '',
                bankName: supplier.bankName || '',
                notes: supplier.notes || '',
            });
        } else {
            setEditingSupplier(null);
            setFormData({
                code: '',
                name: '',
                contactPerson: '',
                email: '',
                phone: '',
                address: '',
                taxCode: '',
                bankAccount: '',
                bankName: '',
                notes: '',
            });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingSupplier(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSupplier) {
            updateMutation.mutate({ id: editingSupplier.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        description: React.ReactNode;
        action: () => void;
        variant?: 'destructive' | 'default' | 'warning';
        confirmText?: string;
    }>({ open: false, title: '', description: '', action: () => { }, variant: 'destructive', confirmText: 'Xóa' });

    const handleDelete = (id: string) => {
        setConfirmDialog({
            open: true,
            title: 'Xóa nhà cung cấp',
            description: 'Bạn có chắc chắn muốn xóa nhà cung cấp này? Hành động này không thể hoàn tác.',
            variant: 'destructive',
            confirmText: 'Xóa',
            action: () => {
                deleteMutation.mutate(id);
                setConfirmDialog((prev) => ({ ...prev, open: false }));
            },
        });
    };

    const handleToggleStatus = (supplier: Supplier) => {
        const newStatus = !supplier.isActive;
        const actionText = newStatus ? 'kích hoạt' : 'ngừng phân phối';
        setConfirmDialog({
            open: true,
            title: newStatus ? 'Kích hoạt lại' : 'Ngừng phân phối',
            description: (
                <span>
                    Bạn có chắc chắn muốn <strong>{actionText}</strong> nhà cung cấp <strong>{supplier.name}</strong>?
                </span>
            ),
            variant: newStatus ? 'default' : 'warning',
            confirmText: 'Đồng ý',
            action: () => {
                toggleStatusMutation.mutate({ id: supplier.id, isActive: newStatus });
                setConfirmDialog((prev) => ({ ...prev, open: false }));
            },
        });
    };

    const filteredSuppliers = suppliers
        ?.filter((s) => {
            if (statusFilter === 'active') return s.isActive;
            if (statusFilter === 'inactive') return !s.isActive;
            return true;
        })
        ?.filter((s) =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.code.toLowerCase().includes(search.toLowerCase()) ||
            s.contactPerson?.toLowerCase().includes(search.toLowerCase())
        );

    const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);

    const handleViewDetail = (supplier: Supplier) => {
        setViewingSupplier(supplier);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Quản lý Nhà cung cấp"
                description="Quản lý thông tin các nhà cung cấp"
                action={{
                    label: 'Thêm nhà cung cấp',
                    onClick: () => handleOpenDialog(),
                }}
            />

            <Card className="p-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 flex-1 relative">
                        <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                            placeholder="Tìm kiếm theo mã, tên, hoặc người liên hệ..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 max-w-sm"
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
                                <SelectItem value="inactive">Ngừng phân phối</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </Card>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mã NCC</TableHead>
                            <TableHead>Tên nhà cung cấp</TableHead>
                            <TableHead>Người liên hệ</TableHead>
                            <TableHead>Điện thoại</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredSuppliers?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-muted-foreground">Chưa có nhà cung cấp nào</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSuppliers?.map((supplier) => (
                                <TableRow
                                    key={supplier.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleViewDetail(supplier)}
                                >
                                    <TableCell className="font-mono">{supplier.code}</TableCell>
                                    <TableCell className="font-medium">{supplier.name}</TableCell>
                                    <TableCell>{supplier.contactPerson || '-'}</TableCell>
                                    <TableCell>{supplier.phone || '-'}</TableCell>
                                    <TableCell>{supplier.email || '-'}</TableCell>
                                    <TableCell>
                                        <StatusBadge status={supplier.isActive ? 'active' : 'inactive'} />
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
                                                <DropdownMenuItem onClick={() => handleViewDetail(supplier)}>
                                                    <Search className="mr-2 h-4 w-4" />
                                                    Xem chi tiết
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleOpenDialog(supplier)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Sửa thông tin
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleToggleStatus(supplier)}>
                                                    {supplier.isActive ? (
                                                        <>
                                                            <Ban className="mr-2 h-4 w-4 text-orange-500" />
                                                            Ngừng phân phối
                                                        </>
                                                    ) : (
                                                        <>
                                                            <RotateCcw className="mr-2 h-4 w-4 text-green-500" />
                                                            Kích hoạt lại
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(supplier.id)}
                                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Xóa nhà cung cấp
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
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingSupplier ? 'Cập nhật nhà cung cấp' : 'Thêm nhà cung cấp mới'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingSupplier ? 'Cập nhật thông tin nhà cung cấp' : 'Nhập thông tin nhà cung cấp mới'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Mã nhà cung cấp *</Label>
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Tên nhà cung cấp *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contactPerson">Người liên hệ</Label>
                                    <Input
                                        id="contactPerson"
                                        value={formData.contactPerson}
                                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
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
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Địa chỉ</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="taxCode">Mã số thuế</Label>
                                    <Input
                                        id="taxCode"
                                        value={formData.taxCode}
                                        onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bankName">Ngân hàng</Label>
                                    <Input
                                        id="bankName"
                                        value={formData.bankName}
                                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bankAccount">Số tài khoản</Label>
                                    <Input
                                        id="bankAccount"
                                        value={formData.bankAccount}
                                        onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Ghi chú</Label>
                                <Input
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                {editingSupplier ? 'Cập nhật' : 'Tạo mới'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewingSupplier} onOpenChange={(open) => !open && setViewingSupplier(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Chi tiết nhà cung cấp</DialogTitle>
                    </DialogHeader>
                    {viewingSupplier && (
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Thông tin chung</h4>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-3 text-sm">
                                            <span className="text-muted-foreground">Mã NCC:</span>
                                            <span className="col-span-2 font-mono">{viewingSupplier.code}</span>
                                        </div>
                                        <div className="grid grid-cols-3 text-sm">
                                            <span className="text-muted-foreground">Tên NCC:</span>
                                            <span className="col-span-2 font-medium">{viewingSupplier.name}</span>
                                        </div>
                                        <div className="grid grid-cols-3 text-sm">
                                            <span className="text-muted-foreground">Trạng thái:</span>
                                            <span className="col-span-2">
                                                <StatusBadge status={viewingSupplier.isActive ? 'active' : 'inactive'} />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Liên hệ</h4>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-3 text-sm">
                                            <span className="text-muted-foreground">Người liên hệ:</span>
                                            <span className="col-span-2">{viewingSupplier.contactPerson || '-'}</span>
                                        </div>
                                        <div className="grid grid-cols-3 text-sm">
                                            <span className="text-muted-foreground">Điện thoại:</span>
                                            <span className="col-span-2">{viewingSupplier.phone || '-'}</span>
                                        </div>
                                        <div className="grid grid-cols-3 text-sm">
                                            <span className="text-muted-foreground">Email:</span>
                                            <span className="col-span-2">{viewingSupplier.email || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground mb-1">Địa chỉ & Tài chính</h4>
                                <div className="space-y-2">
                                    <div className="grid grid-cols-[120px_1fr] text-sm">
                                        <span className="text-muted-foreground">Địa chỉ:</span>
                                        <span>{viewingSupplier.address || '-'}</span>
                                    </div>
                                    <div className="grid grid-cols-[120px_1fr] text-sm">
                                        <span className="text-muted-foreground">Mã số thuế:</span>
                                        <span>{viewingSupplier.taxCode || '-'}</span>
                                    </div>
                                    <div className="grid grid-cols-[120px_1fr] text-sm">
                                        <span className="text-muted-foreground">Ngân hàng:</span>
                                        <span>{viewingSupplier.bankName ? `${viewingSupplier.bankName} - ${viewingSupplier.bankAccount}` : '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {viewingSupplier.notes && (
                                <div>
                                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Ghi chú</h4>
                                    <p className="text-sm bg-muted/50 p-2 rounded-md">{viewingSupplier.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setViewingSupplier(null)}>Đóng</Button>
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
                            variant={confirmDialog.variant || 'default'}
                            onClick={confirmDialog.action}
                        >
                            {confirmDialog.confirmText || 'Xác nhận'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
