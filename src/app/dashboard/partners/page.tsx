'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Edit, Trash2, Search, Truck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function PartnersPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
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
        if (confirm('Bạn có chắc chắn muốn xóa đối tác này?')) {
            deleteMutation.mutate(id);
        }
    };

    const filteredPartners = partners
        ?.filter((p) => p.isActive) // Only show active partners
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
                <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm theo mã hoặc tên đối tác..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-sm"
                    />
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
                                <TableRow key={partner.id}>
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
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleOpenDialog(partner)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(partner.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
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
        </div>
    );
}
