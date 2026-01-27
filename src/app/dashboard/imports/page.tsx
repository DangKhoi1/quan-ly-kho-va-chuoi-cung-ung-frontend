'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { importsApi, warehousesApi, suppliersApi, productsApi } from '@/services/api';
import { ImportReceipt, ImportStatus } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, FileText, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface ProductLine {
    productId: string;
    quantity: number;
    unitPrice: number;
}

export default function ImportsPage() {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [viewReceipt, setViewReceipt] = useState<ImportReceipt | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        description: string;
        action: () => void;
    }>({ open: false, title: '', description: '', action: () => { } });
    const [formData, setFormData] = useState({
        importDate: new Date().toISOString().split('T')[0],
        warehouseId: '',
        supplierId: '',
        notes: '',
    });
    const [productLines, setProductLines] = useState<ProductLine[]>([
        { productId: '', quantity: 1, unitPrice: 0 },
    ]);

    const { data: imports, isLoading } = useQuery({
        queryKey: ['imports'],
        queryFn: async () => {
            const response = await importsApi.getAll();
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

    const { data: suppliers } = useQuery({
        queryKey: ['suppliers'],
        queryFn: async () => {
            const response = await suppliersApi.getActive();
            return response.data;
        },
    });

    const { data: products } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const response = await productsApi.getActive();
            return response.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: Omit<ImportReceipt, 'id' | 'receiptNumber' | 'status' | 'totalAmount' | 'createdAt' | 'updatedAt' | 'createdBy' | 'createdById' | 'warehouse' | 'supplier' | 'details'> & { details: { productId: string; quantity: number; unitPrice: number }[] }) => importsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['imports'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            toast.success('Tạo phiếu nhập thành công!');
            handleCloseDialog();
        },
        onError: (error: any) => {
            console.error('Create import error:', error);
            const message = error?.response?.data?.message;
            if (Array.isArray(message)) {
                message.forEach((msg) => toast.error(msg));
            } else {
                toast.error(message || 'Có lỗi xảy ra!');
            }
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            importsApi.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['imports'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            toast.success('Cập nhật trạng thái thành công!');
            setViewReceipt(null);
        },
        onError: () => toast.error('Có lỗi xảy ra!'),
    });

    const handleCloseDialog = () => {
        setIsCreateDialogOpen(false);
        setFormData({
            importDate: new Date().toISOString().split('T')[0],
            warehouseId: '',
            supplierId: '',
            notes: '',
        });
        setProductLines([{ productId: '', quantity: 1, unitPrice: 0 }]);
    };

    const handleAddLine = () => {
        setProductLines([...productLines, { productId: '', quantity: 1, unitPrice: 0 }]);
    };

    const handleRemoveLine = (index: number) => {
        setProductLines(productLines.filter((_, i) => i !== index));
    };

    const handleLineChange = (index: number, field: keyof ProductLine, value: string | number) => {
        const newLines = [...productLines];
        newLines[index] = { ...newLines[index], [field]: value };
        setProductLines(newLines);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.importDate) {
            toast.error('Vui lòng chọn ngày nhập!');
            return;
        }
        if (!formData.warehouseId) {
            toast.error('Vui lòng chọn kho nhập!');
            return;
        }

        const validLines = productLines.filter((line) => line.productId && line.quantity > 0);
        if (validLines.length === 0) {
            toast.error('Vui lòng thêm ít nhất một sản phẩm!');
            return;
        }

        const data = {
            ...formData,
            importDate: new Date(formData.importDate).toISOString(), // Convert to ISO string for IsDateString validation
            supplierId: formData.supplierId || undefined, // Send undefined if empty to skip IsUUID validation
            status: ImportStatus.PENDING,
            details: validLines.map((line) => ({
                productId: line.productId,
                quantity: Number(line.quantity),
                unitPrice: Number(line.unitPrice),
            })),
        };

        createMutation.mutate(data);
    };

    const handleUpdateStatus = (id: string, status: ImportStatus) => {
        if (confirm(`Bạn có chắc chắn muốn chuyển sang trạng thái "${status}"?`)) {
            updateStatusMutation.mutate({ id, status });
        }
    };

    const totalAmount = productLines.reduce(
        (sum, line) => sum + line.quantity * line.unitPrice,
        0
    );

    const filteredImports = imports?.filter((imp) =>
        statusFilter === 'all' ? true : imp.status === statusFilter
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Phiếu nhập kho"
                description="Quản lý các phiếu nhập hàng vào kho"
                action={{
                    label: 'Tạo phiếu nhập',
                    onClick: () => setIsCreateDialogOpen(true),
                }}
            />

            <Card className="p-4">
                <div className="flex gap-4">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả trạng thái</SelectItem>
                            <SelectItem value="pending">Chờ duyệt</SelectItem>
                            <SelectItem value="approved">Đã duyệt</SelectItem>
                            <SelectItem value="completed">Hoàn thành</SelectItem>
                            <SelectItem value="cancelled">Đã hủy</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </Card>

            <div className="grid gap-4">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-48" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-full" />
                            </CardContent>
                        </Card>
                    ))
                ) : filteredImports?.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-8">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground">Chưa có phiếu nhập nào</p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredImports?.map((receipt) => (
                        <Card key={receipt.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="flex items-center gap-2">
                                            {receipt.receiptNumber}
                                            <StatusBadge status={receipt.status} />
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1 truncate">
                                            {format(new Date(receipt.importDate), 'dd/MM/yyyy')} •{' '}
                                            {receipt.warehouse.name} •{' '}
                                            {receipt.supplier?.name || 'Không có NCC'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-primary">
                                            {formatCurrency(receipt.totalAmount)}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {receipt.details.length} sản phẩm
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setViewReceipt(receipt)}
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Xem chi tiết
                                    </Button>
                                    {receipt.status === ImportStatus.PENDING && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleUpdateStatus(receipt.id, ImportStatus.COMPLETED)}
                                        >
                                            Hoàn thành
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Tạo phiếu nhập kho</DialogTitle>
                        <DialogDescription>Nhập thông tin phiếu nhập và danh sách sản phẩm</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="importDate">Ngày nhập *</Label>
                                        <Input
                                            id="importDate"
                                            type="date"
                                            value={formData.importDate}
                                            onChange={(e) => setFormData({ ...formData, importDate: e.target.value })}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="warehouseId">Kho nhập *</Label>
                                        <Select
                                            value={formData.warehouseId}
                                            onValueChange={(value) => setFormData({ ...formData, warehouseId: value })}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Chọn kho nhập hàng" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {warehouses?.map((wh) => (
                                                    <SelectItem key={wh.id} value={wh.id}>
                                                        {wh.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="supplierId">Nhà cung cấp</Label>
                                    <Select
                                        value={formData.supplierId}
                                        onValueChange={(value) => setFormData({ ...formData, supplierId: value })}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Chọn nhà cung cấp (nếu có)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {suppliers?.map((sup) => (
                                                <SelectItem key={sup.id} value={sup.id}>
                                                    {sup.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Danh sách sản phẩm *</Label>
                                <div className="border rounded-lg p-4 space-y-4">
                                    <div className="grid grid-cols-12 gap-4 border-b pb-2">
                                        <div className="col-span-5 font-medium text-sm">Sản phẩm</div>
                                        <div className="col-span-2 font-medium text-sm">Số lượng</div>
                                        <div className="col-span-3 font-medium text-sm">Đơn giá</div>
                                        <div className="col-span-2 font-medium text-sm">Thao tác</div>
                                    </div>
                                    {productLines.map((line, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-4 items-center">
                                            <div className="col-span-5">
                                                <Select
                                                    value={line.productId}
                                                    onValueChange={(value) => handleLineChange(index, 'productId', value)}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Chọn sản phẩm" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {products?.map((prod) => (
                                                            <SelectItem key={prod.id} value={prod.id}>
                                                                <span className="truncate block max-w-[300px]" title={prod.name}>
                                                                    {prod.name} ({prod.sku})
                                                                </span>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-2">
                                                <Input
                                                    type="number"
                                                    value={line.quantity}
                                                    onChange={(e) =>
                                                        handleLineChange(index, 'quantity', Number(e.target.value))
                                                    }
                                                    min={1}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <Input
                                                    type="number"
                                                    value={line.unitPrice}
                                                    onChange={(e) =>
                                                        handleLineChange(index, 'unitPrice', Number(e.target.value))
                                                    }
                                                    min={0}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div className="col-span-2 flex gap-2">
                                                {index === productLines.length - 1 && (
                                                    <Button type="button" size="icon" variant="ghost" onClick={handleAddLine}>
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {productLines.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => handleRemoveLine(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-end">
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Tổng tiền</p>
                                        <p className="text-2xl font-bold text-primary">
                                            {formatCurrency(totalAmount)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Ghi chú</Label>
                                <Input
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Nhập ghi chú thêm về phiếu nhập (tùy chọn)..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending}>
                                Tạo phiếu nhập
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            {viewReceipt && (
                <Dialog open={!!viewReceipt} onOpenChange={() => setViewReceipt(null)}>
                    <DialogContent className="sm:max-w-7xl">
                        <DialogHeader>
                            <DialogTitle>Chi tiết phiếu nhập #{viewReceipt.receiptNumber}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Ngày nhập</p>
                                    <p className="font-medium">{format(new Date(viewReceipt.importDate), 'dd/MM/yyyy')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Trạng thái</p>
                                    <StatusBadge status={viewReceipt.status} />
                                </div>
                                <div className="group relative">
                                    <p className="text-sm text-muted-foreground">Kho nhập</p>
                                    <p className="font-medium truncate" title={viewReceipt.warehouse.name}>
                                        {viewReceipt.warehouse.name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Nhà cung cấp</p>
                                    <p className="font-medium truncate" title={viewReceipt.supplier?.name || '-'}>
                                        {viewReceipt.supplier?.name || '-'}
                                    </p>
                                </div>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="py-3 px-4">Sản phẩm</TableHead>
                                            <TableHead className="text-right w-[120px] py-3 px-4">Số lượng</TableHead>
                                            <TableHead className="text-right w-[180px] py-3 px-4">Đơn giá</TableHead>
                                            <TableHead className="text-right w-[180px] py-3 px-4">Thành tiền</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {viewReceipt.details.map((detail) => (
                                            <TableRow key={detail.id} className="hover:bg-transparent">
                                                <TableCell className="font-medium py-3 px-4">
                                                    <div className="break-words" title={detail.product.name}>
                                                        {detail.product.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-3 px-4">{detail.quantity}</TableCell>
                                                <TableCell className="text-right py-3 px-4">{formatCurrency(detail.unitPrice)}</TableCell>
                                                <TableCell className="text-right font-medium py-3 px-4">
                                                    {formatCurrency(detail.totalPrice)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-muted/30 border-t-2">
                                            <TableCell colSpan={3} className="text-right font-bold py-4 px-4 text-base">
                                                Tổng cộng
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-primary text-xl py-4 px-4">
                                                {formatCurrency(viewReceipt.totalAmount)}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>

                            {viewReceipt.notes && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Ghi chú</p>
                                    <p>{viewReceipt.notes}</p>
                                </div>
                            )}

                            <div className="flex gap-2">
                                {viewReceipt.status === ImportStatus.PENDING && (
                                    <>
                                        <Button
                                            onClick={() => handleUpdateStatus(viewReceipt.id, ImportStatus.APPROVED)}
                                        >
                                            Duyệt phiếu
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleUpdateStatus(viewReceipt.id, ImportStatus.COMPLETED)}
                                        >
                                            Hoàn thành
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={() => handleUpdateStatus(viewReceipt.id, ImportStatus.CANCELLED)}
                                        >
                                            Hủy phiếu
                                        </Button>
                                    </>
                                )}
                                {viewReceipt.status === ImportStatus.APPROVED && (
                                    <Button
                                        onClick={() => handleUpdateStatus(viewReceipt.id, ImportStatus.COMPLETED)}
                                    >
                                        Hoàn thành nhập kho
                                    </Button>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{confirmDialog.title}</DialogTitle>
                        <DialogDescription>{confirmDialog.description}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>
                            Hủy
                        </Button>
                        <Button
                            variant={confirmDialog.title.includes('Hủy') ? 'destructive' : 'default'}
                            onClick={confirmDialog.action}
                            disabled={updateStatusMutation.isPending}
                        >
                            {updateStatusMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
