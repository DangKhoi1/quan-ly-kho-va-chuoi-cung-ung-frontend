'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partnersApi } from '@/services/api';
import { Partner, PartnerType } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Edit, Trash2, Search, Truck, MoreHorizontal, Ban, RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel } from '@/components/ui/dropdown-menu';


export default function PartnersPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
    const [viewingPartner, setViewingPartner] = useState<Partner | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        description: string;
        action: () => void;
        confirmText?: string;
        variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'warning';
    }>({ open: false, title: '', description: '', action: () => { }, confirmText: 'Xóa', variant: 'destructive' });
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        type: PartnerType.SHIPPING,
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
    });

    const { data: partners, isLoading } = useQuery({
        queryKey: ['partners'],
        queryFn: async () => {
            const response = await partnersApi.getAll();
            return response.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: Partial<Partner>) => partnersApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['partners'] });
            toast.success('Tạo đối tác thành công!');
            handleCloseDialog();
        },
        onError: () => toast.error('Có lỗi xảy ra!'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Partner> }) =>
            partnersApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['partners'] });
            toast.success('Cập nhật thành công!');
            handleCloseDialog();
        },
        onError: () => toast.error('Có lỗi xảy ra!'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => partnersApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['partners'] });
            toast.success('Xóa đối tác thành công!');
        },
        onError: () => toast.error('Không thể xóa đối tác này!'),
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
            partnersApi.update(id, { isActive }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['partners'] });
            toast.success('Cập nhật trạng thái thành công!');
        },
        onError: () => toast.error('Có lỗi xảy ra!'),
    });

    const handleOpenDialog = (partner?: Partner) => {
        if (partner) {
            setEditingPartner(partner);
            setFormData({
                code: partner.code,
                name: partner.name,
                type: partner.type,
                contactPerson: partner.contactPerson || '',
                email: partner.email || '',
                phone: partner.phone || '',
                address: partner.address || '',
                notes: partner.notes || '',
            });
        } else {
            setEditingPartner(null);
            setFormData({
                code: '',
                name: '',
                type: PartnerType.SHIPPING,
                contactPerson: '',
                email: '',
                phone: '',
                address: '',
                notes: '',
            });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingPartner(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPartner) {
            updateMutation.mutate({ id: editingPartner.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = (id: string) => {
        setConfirmDialog({
            open: true,
            title: 'Xóa đối tác',
            description: 'Bạn có chắc chắn muốn xóa đối tác này? Hành động này không thể hoàn tác.',
            action: () => {
                deleteMutation.mutate(id);
                setConfirmDialog((prev) => ({ ...prev, open: false }));
            },
            confirmText: 'Xóa',
            variant: 'destructive',
        });
    };

    const handleToggleStatus = (partner: Partner) => {
        const newStatus = !partner.isActive;
        const actionText = newStatus ? 'kích hoạt' : 'ngừng hợp tác';
        setConfirmDialog({
            open: true,
            title: newStatus ? 'Kích hoạt lại' : 'Ngừng hợp tác',
            description: `Bạn có chắc chắn muốn ${actionText} với đối tác "${partner.name}"?`,
            action: () => {
                toggleStatusMutation.mutate({ id: partner.id, isActive: newStatus });
                setConfirmDialog((prev) => ({ ...prev, open: false }));
            },
            confirmText: 'Đồng ý',
            variant: newStatus ? 'default' : 'warning',
        });
    };

    const handleViewDetail = (partner: Partner) => {
        setViewingPartner(partner);
    };

    const filteredPartners = partners
        ?.filter((p) => {
            if (statusFilter === 'active') return p.isActive;
            if (statusFilter === 'inactive') return !p.isActive;
            return true;
        })
        ?.filter((p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.code.toLowerCase().includes(search.toLowerCase())
        );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Quản lý Đối tác"
                description="Quản lý đối tác vận chuyển và phân phối"
                action={{
                    label: 'Thêm đối tác',
                    onClick: () => handleOpenDialog(),
                }}
            />

            <Card className="p-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 flex-1">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm theo mã hoặc tên đối tác..."
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
                            <TableHead>Mã đối tác</TableHead>
                            <TableHead>Tên đối tác</TableHead>
                            <TableHead>Loại</TableHead>
                            <TableHead>Người liên hệ</TableHead>
                            <TableHead>Điện thoại</TableHead>
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
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredPartners?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-muted-foreground">Chưa có đối tác nào</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredPartners?.map((partner) => (
                                <TableRow
                                    key={partner.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleViewDetail(partner)}
                                >
                                    <TableCell className="font-mono">{partner.code}</TableCell>
                                    <TableCell className="font-medium">{partner.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {partner.type === PartnerType.SHIPPING ? 'Vận chuyển' : 'Phân phối'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{partner.contactPerson || '-'}</TableCell>
                                    <TableCell>{partner.phone || '-'}</TableCell>
                                    <TableCell>
                                        <StatusBadge status={partner.isActive ? 'active' : 'inactive'} />
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
                                                <DropdownMenuItem onClick={() => handleViewDetail(partner)}>
                                                    <Search className="mr-2 h-4 w-4" />
                                                    Xem chi tiết
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleOpenDialog(partner)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Sửa thông tin
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleToggleStatus(partner)}>
                                                    {partner.isActive ? (
                                                        <>
                                                            <Ban className="mr-2 h-4 w-4 text-orange-500" />
                                                            Ngừng hợp tác
                                                        </>
                                                    ) : (
                                                        <>
                                                            <RotateCcw className="mr-2 h-4 w-4 text-green-500" />
                                                            Kích hoạt lại
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(partner.id)}
                                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Xóa đối tác
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
                            {editingPartner ? 'Cập nhật đối tác' : 'Thêm đối tác mới'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingPartner ? 'Cập nhật thông tin đối tác' : 'Nhập thông tin đối tác mới'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Mã đối tác *</Label>
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Tên đối tác *</Label>
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
                                    <Label htmlFor="type">Loại đối tác *</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(value: PartnerType) => setFormData({ ...formData, type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={PartnerType.SHIPPING}>Vận chuyển</SelectItem>
                                            <SelectItem value={PartnerType.DISTRIBUTION}>Phân phối</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                                    <Label htmlFor="contactPerson">Người liên hệ</Label>
                                    <Input
                                        id="contactPerson"
                                        value={formData.contactPerson}
                                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                    />
                                </div>
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
                            <div className="space-y-2">
                                <Label htmlFor="address">Địa chỉ</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
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
                                {editingPartner ? 'Cập nhật' : 'Tạo mới'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewingPartner} onOpenChange={(open) => !open && setViewingPartner(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Chi tiết đối tác</DialogTitle>
                    </DialogHeader>
                    {viewingPartner && (
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Thông tin chung</h4>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-3 text-sm">
                                            <span className="text-muted-foreground">Mã đối tác:</span>
                                            <span className="col-span-2 font-mono">{viewingPartner.code}</span>
                                        </div>
                                        <div className="grid grid-cols-3 text-sm">
                                            <span className="text-muted-foreground">Tên:</span>
                                            <span className="col-span-2 font-medium">{viewingPartner.name}</span>
                                        </div>
                                        <div className="grid grid-cols-3 text-sm">
                                            <span className="text-muted-foreground">Loại:</span>
                                            <span className="col-span-2">
                                                <Badge variant="outline">
                                                    {viewingPartner.type === PartnerType.SHIPPING ? 'Vận chuyển' : 'Phân phối'}
                                                </Badge>
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 text-sm">
                                            <span className="text-muted-foreground">Trạng thái:</span>
                                            <span className="col-span-2">
                                                <StatusBadge status={viewingPartner.isActive ? 'active' : 'inactive'} />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Liên hệ</h4>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-3 text-sm">
                                            <span className="text-muted-foreground">Người LH:</span>
                                            <span className="col-span-2">{viewingPartner.contactPerson || '-'}</span>
                                        </div>
                                        <div className="grid grid-cols-3 text-sm">
                                            <span className="text-muted-foreground">Điện thoại:</span>
                                            <span className="col-span-2">{viewingPartner.phone || '-'}</span>
                                        </div>
                                        <div className="grid grid-cols-3 text-sm">
                                            <span className="text-muted-foreground">Email:</span>
                                            <span className="col-span-2">{viewingPartner.email || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground mb-1">Địa chỉ</h4>
                                <p className="text-sm">{viewingPartner.address}</p>
                            </div>

                            {viewingPartner.notes && (
                                <div>
                                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Ghi chú</h4>
                                    <p className="text-sm bg-muted/50 p-2 rounded-md">{viewingPartner.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setViewingPartner(null)}>Đóng</Button>
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
