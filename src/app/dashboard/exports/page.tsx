'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exportsApi, warehousesApi, productsApi, inventoryApi } from '@/services/api';
import { ExportReceipt, ExportStatus, ExportType } from '@/types';
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
import { Plus, Trash2, FileText, Eye, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface ProductLine {
    productId: string;
    quantity: number;
    unitPrice: number;
    availableStock?: number;
}

export default function ExportsPage() {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [viewReceipt, setViewReceipt] = useState<ExportReceipt | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        description: string;
        action: () => void;
    }>({ open: false, title: '', description: '', action: () => { } });
    const [formData, setFormData] = useState({
        exportDate: new Date().toISOString().split('T')[0],
        warehouseId: '',
        exportType: ExportType.SALE,
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        notes: '',
    });
    const [productLines, setProductLines] = useState<ProductLine[]>([
        { productId: '', quantity: 1, unitPrice: 0 },
    ]);

    const { data: exports, isLoading } = useQuery({
        queryKey: ['exports'],
        queryFn: async () => {
            const response = await exportsApi.getAll();
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

    const { data: products } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const response = await productsApi.getActive();
            return response.data;
        },
    });

    const { data: inventory } = useQuery({
        queryKey: ['inventory'],
        queryFn: async () => {
            const response = await inventoryApi.getAll();
            return response.data;
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => exportsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exports'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            toast.success('Tạo phiếu xuất thành công!');
            handleCloseDialog();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            exportsApi.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exports'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            toast.success('Cập nhật trạng thái thành công!');
            setViewReceipt(null);
            setConfirmDialog(prev => ({ ...prev, open: false }));
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Có lỗi xảy ra!';
            toast.error(Array.isArray(message) ? message[0] : message);
        },
    });

    const handleCloseDialog = () => {
        setIsCreateDialogOpen(false);
        setFormData({
            exportDate: new Date().toISOString().split('T')[0],
            warehouseId: '',
            exportType: ExportType.SALE,
            customerName: '',
            customerPhone: '',
            customerAddress: '',
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

    const handleLineChange = (index: number, field: keyof ProductLine, value: any) => {
        const newLines = [...productLines];
        newLines[index] = { ...newLines[index], [field]: value };


        if (field === 'productId') {
            const product = products?.find((p) => p.id === value);
            if (product) {
                // If SALE -> Selling Price, Otherwise (Transfer/Return) -> Cost Price
                newLines[index].unitPrice = Number(formData.exportType === ExportType.SALE
                    ? product.sellingPrice
                    : product.costPrice);
            }

            if (formData.warehouseId) {
                const stock = inventory?.find(
                    (inv) => inv.productId === value && inv.warehouseId === formData.warehouseId
                );
                newLines[index].availableStock = stock?.quantity || 0;
            }
        }

        setProductLines(newLines);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();


        if (!formData.exportDate) {
            toast.error('Vui lòng chọn ngày xuất!');
            return;
        }
        if (!formData.warehouseId) {
            toast.error('Vui lòng chọn kho xuất!');
            return;
        }
        if (!formData.exportType) {
            toast.error('Vui lòng chọn loại xuất!');
            return;
        }

        const validLines = productLines.filter((line) => line.productId && line.quantity > 0);
        if (validLines.length === 0) {
            toast.error('Vui lòng thêm ít nhất một sản phẩm!');
            return;
        }


        for (const line of validLines) {
            if (line.availableStock !== undefined && line.quantity > line.availableStock) {
                const product = products?.find((p) => p.id === line.productId);
                toast.error(`Không đủ tồn kho cho sản phẩm "${product?.name}"! Tồn: ${line.availableStock}, Xuất: ${line.quantity}`);
                return;
            }
        }

        const data = {
            ...formData,
            status: ExportStatus.PENDING,
            details: validLines.map((line) => ({
                productId: line.productId,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
            })),
        };

        createMutation.mutate(data);
    };

    const handleUpdateStatus = (id: string, status: ExportStatus) => {
        let title = '';
        let description = '';

        switch (status) {
            case ExportStatus.APPROVED:
                title = 'Duyệt phiếu xuất';
                description = 'Bạn có chắc chắn muốn duyệt phiếu xuất này? Trạng thái sẽ chuyển thành "Đã duyệt".';
                break;
            case ExportStatus.COMPLETED:
                title = 'Hoàn thành xuất kho';
                description = 'Xác nhận hàng đã thực tế xuất kho. Hành động này sẽ cập nhật số lượng tồn kho và không thể hoàn tác.';
                break;
            case ExportStatus.CANCELLED:
                title = 'Hủy phiếu xuất';
                description = 'Bạn có chắc chắn muốn hủy phiếu xuất này? Trạng thái sẽ chuyển thành "Đã hủy".';
                break;
        }

        setConfirmDialog({
            open: true,
            title,
            description,
            action: () => updateStatusMutation.mutate({ id, status }),
        });
    };

    const totalAmount = productLines.reduce(
        (sum, line) => sum + line.quantity * line.unitPrice,
        0
    );

    const filteredExports = exports?.filter((exp) =>
        statusFilter === 'all' ? true : exp.status === statusFilter
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };


    const handleWarehouseChange = (warehouseId: string) => {
        setFormData({ ...formData, warehouseId });

        const updatedLines = productLines.map((line) => {
            if (line.productId) {
                const stock = inventory?.find(
                    (inv) => inv.productId === line.productId && inv.warehouseId === warehouseId
                );
                return { ...line, availableStock: stock?.quantity || 0 };
            }
            return line;
        });
        setProductLines(updatedLines);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Phiếu xuất kho"
                description="Quản lý các phiếu xuất hàng ra khỏi kho"
                action={{
                    label: 'Tạo phiếu xuất',
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
                ) : filteredExports?.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-8">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground">Chưa có phiếu xuất nào</p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredExports?.map((receipt) => (
                        <Card key={receipt.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="flex items-center gap-2 flex-wrap">
                                            <span>{receipt.receiptNumber}</span>
                                            <StatusBadge status={receipt.status} />
                                            <Badge variant="outline">
                                                {receipt.exportType === ExportType.SALE ? 'Bán hàng' :
                                                    receipt.exportType === ExportType.TRANSFER ? 'Chuyển kho' :
                                                        receipt.exportType === ExportType.RETURN ? 'Trả hàng' : 'Khác'}
                                            </Badge>
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1 truncate">
                                            {format(new Date(receipt.exportDate), 'dd/MM/yyyy')} •{' '}
                                            {receipt.warehouse.name}
                                            {receipt.customerName && ` • ${receipt.customerName}`}
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
                                    {receipt.status === ExportStatus.PENDING && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleUpdateStatus(receipt.id, ExportStatus.COMPLETED)}
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

            { }
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[1100px] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                    <DialogHeader className="px-6 py-4 border-b shrink-0">
                        <DialogTitle>Tạo phiếu xuất kho</DialogTitle>
                        <DialogDescription>Nhập thông tin phiếu xuất và danh sách sản phẩm</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="exportDate">Ngày xuất *</Label>
                                    <Input
                                        id="exportDate"
                                        type="date"
                                        value={formData.exportDate}
                                        onChange={(e) => setFormData({ ...formData, exportDate: e.target.value })}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="warehouseId">Kho xuất *</Label>
                                    <Select
                                        value={formData.warehouseId}
                                        onValueChange={handleWarehouseChange}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Chọn kho" />
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
                                <div className="space-y-1.5">
                                    <Label htmlFor="exportType">Loại xuất *</Label>
                                    <Select
                                        value={formData.exportType}
                                        onValueChange={(value: ExportType) => {
                                            setFormData({ ...formData, exportType: value });
                                            // Recalculate prices for existing lines based on new type
                                            const newLines = productLines.map(line => {
                                                if (!line.productId) return line;
                                                const product = products?.find(p => p.id === line.productId);
                                                if (!product) return line;
                                                const price = value === ExportType.SALE ? product.sellingPrice : product.costPrice;
                                                return {
                                                    ...line,
                                                    unitPrice: Number(price)
                                                };
                                            });
                                            setProductLines(newLines);
                                        }}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={ExportType.SALE}>Bán hàng</SelectItem>
                                            <SelectItem value={ExportType.RETURN}>Trả hàng cho NCC</SelectItem>
                                            <SelectItem value={ExportType.OTHER}>Khác (Hủy/Thanh lý)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="notes">Ghi chú</Label>
                                    <Input
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Nhập ghi chú..."
                                        className="h-9"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="customerName">Tên khách hàng</Label>
                                    <Input
                                        id="customerName"
                                        value={formData.customerName}
                                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                        placeholder="Tên người/đơn vị nhận"
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="customerPhone">Số điện thoại</Label>
                                    <Input
                                        id="customerPhone"
                                        value={formData.customerPhone}
                                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                                        className="h-9"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="customerAddress">Địa chỉ</Label>
                                    <Input
                                        id="customerAddress"
                                        value={formData.customerAddress}
                                        onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                                        className="h-9"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 border-t pt-4">
                                <div className="flex justify-between items-center">
                                    <Label>Danh sách sản phẩm *</Label>
                                    {!formData.warehouseId && (
                                        <span className="text-xs text-yellow-600 flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" />
                                            Chọn kho trước để kiểm tra tồn kho
                                        </span>
                                    )}
                                </div>

                                <div className="border rounded-lg overflow-hidden flex flex-col">
                                    <div className="grid grid-cols-12 gap-2 bg-muted/50 p-2 text-xs font-medium border-b">
                                        <div className="col-span-4 pl-2">Sản phẩm</div>
                                        <div className="col-span-2">Số lượng</div>
                                        <div className="col-span-3">Đơn giá</div>
                                        <div className="col-span-2">Thành tiền</div>
                                        <div className="col-span-1"></div>
                                    </div>
                                    <div className="max-h-[30vh] overflow-y-auto p-2 space-y-2">
                                        {productLines.map((line, index) => (
                                            <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                                <div className="col-span-4">
                                                    <Select
                                                        value={line.productId}
                                                        onValueChange={(value) => handleLineChange(index, 'productId', value)}
                                                        disabled={!formData.warehouseId}
                                                    >
                                                        <SelectTrigger className="h-8 text-sm">
                                                            <SelectValue placeholder="Chọn SP" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {products?.filter(prod => {
                                                                const stock = inventory?.find(
                                                                    (inv) => inv.productId === prod.id && inv.warehouseId === formData.warehouseId
                                                                );
                                                                return stock && stock.quantity > 0;
                                                            })?.map((prod) => (
                                                                <SelectItem key={prod.id} value={prod.id}>
                                                                    <span className="truncate block max-w-[200px]" title={prod.name}>
                                                                        {prod.name}
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
                                                        max={line.availableStock}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <Input
                                                        type="number"
                                                        value={line.unitPrice}
                                                        readOnly
                                                        className="h-8 text-sm bg-muted font-medium"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-sm font-medium truncate">
                                                        {formatCurrency(line.quantity * line.unitPrice)}
                                                    </p>
                                                </div>
                                                <div className="col-span-1 flex justify-end gap-1">
                                                    {index === productLines.length - 1 && (
                                                        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={handleAddLine}>
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {productLines.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => handleRemoveLine(index)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-muted/20 p-2 border-t flex justify-end">
                                        <div className="text-right flex items-center gap-4">
                                            <span className="text-sm text-muted-foreground">Tổng tiền:</span>
                                            <span className="text-lg font-bold text-primary">
                                                {formatCurrency(totalAmount)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="px-6 py-4 border-t shrink-0">
                            <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                Hủy
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending}>
                                Tạo phiếu xuất
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            { }
            {viewReceipt && (
                <Dialog open={!!viewReceipt} onOpenChange={() => setViewReceipt(null)}>
                    <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                        <DialogHeader className="p-6 pb-2 shrink-0">
                            <DialogTitle>Chi tiết phiếu xuất #{viewReceipt.receiptNumber}</DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Ngày xuất</p>
                                    <p className="font-medium">{format(new Date(viewReceipt.exportDate), 'dd/MM/yyyy')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Trạng thái</p>
                                    <StatusBadge status={viewReceipt.status} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Kho xuất</p>
                                    <p className="font-medium truncate" title={viewReceipt.warehouse.name}>
                                        {viewReceipt.warehouse.name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Loại xuất</p>
                                    <Badge variant="outline">
                                        {viewReceipt.exportType === ExportType.SALE ? 'Bán hàng' :
                                            viewReceipt.exportType === ExportType.TRANSFER ? 'Chuyển kho' :
                                                viewReceipt.exportType === ExportType.RETURN ? 'Trả hàng' : 'Khác'}
                                    </Badge>
                                </div>
                                {viewReceipt.customerName && (
                                    <>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Khách hàng</p>
                                            <p className="font-medium truncate" title={viewReceipt.customerName}>
                                                {viewReceipt.customerName}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Điện thoại</p>
                                            <p className="font-medium truncate" title={viewReceipt.customerPhone || '-'}>
                                                {viewReceipt.customerPhone || '-'}
                                            </p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-sm text-muted-foreground">Địa chỉ</p>
                                            <p className="font-medium truncate" title={viewReceipt.customerAddress}>
                                                {viewReceipt.customerAddress || '-'}
                                            </p>
                                        </div>
                                    </>
                                )}
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
                        </div>

                        <div className="p-6 pt-2 shrink-0 flex gap-2 justify-end">
                            {viewReceipt.status === ExportStatus.PENDING && (
                                <>
                                    <Button
                                        onClick={() => handleUpdateStatus(viewReceipt.id, ExportStatus.APPROVED)}
                                    >
                                        Duyệt phiếu
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleUpdateStatus(viewReceipt.id, ExportStatus.COMPLETED)}
                                    >
                                        Hoàn thành
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => handleUpdateStatus(viewReceipt.id, ExportStatus.CANCELLED)}
                                    >
                                        Hủy phiếu
                                    </Button>
                                </>
                            )}
                            {viewReceipt.status === ExportStatus.APPROVED && (
                                <Button
                                    onClick={() => handleUpdateStatus(viewReceipt.id, ExportStatus.COMPLETED)}
                                >
                                    Hoàn thành xuất kho
                                </Button>
                            )}
                            <Button variant="outline" onClick={() => setViewReceipt(null)}>
                                Đóng
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            { }
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
