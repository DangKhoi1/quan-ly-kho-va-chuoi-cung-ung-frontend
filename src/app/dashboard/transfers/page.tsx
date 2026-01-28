'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { transfersApi } from '@/services/api';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRightLeft, CheckCircle2, XCircle, Plus, Eye, Package } from 'lucide-react';
import Link from 'next/link';
import { TransferReceipt, TransferStatus } from '@/types';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function TransfersPage() {
    const [viewingTransfer, setViewingTransfer] = useState<TransferReceipt | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        description: string;
        action: () => Promise<void>;
        variant?: 'default' | 'destructive';
    }>({
        open: false,
        title: '',
        description: '',
        action: async () => { },
    });

    const { data: transfers, isLoading, refetch } = useQuery({
        queryKey: ['transfers'],
        queryFn: async () => {
            const response = await transfersApi.getAll();
            return response.data;
        },
    });

    const handleUpdateStatus = (id: string, status: TransferStatus) => {
        const isApprove = status === TransferStatus.COMPLETED;
        setConfirmDialog({
            open: true,
            title: isApprove ? 'Duyệt phiếu chuyển' : 'Hủy phiếu chuyển',
            description: isApprove
                ? 'Bạn có chắc chắn muốn duyệt phiếu chuyển kho này? Hành động này sẽ cập nhật tồn kho và không thể hoàn tác.'
                : 'Bạn có chắc chắn muốn hủy phiếu chuyển kho này? Hành động này không thể hoàn tác.',
            variant: isApprove ? 'default' : 'destructive',
            action: async () => {
                try {
                    await transfersApi.updateStatus(id, status);
                    toast.success(isApprove ? 'Đã duyệt phiếu chuyển!' : 'Đã hủy phiếu chuyển!');
                    refetch();
                } catch (error: any) {
                    toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
                }
            }
        });
    };

    const getStatusBadge = (status: TransferStatus) => {
        switch (status) {
            case TransferStatus.PENDING:
                return { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-700' };
            case TransferStatus.COMPLETED:
                return { label: 'Đã hoàn thành', color: 'bg-green-100 text-green-700' };
            case TransferStatus.CANCELLED:
                return { label: 'Đã hủy', color: 'bg-red-100 text-red-700' };
            default:
                return { label: status, color: 'bg-gray-100 text-gray-700' };
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Chuyển kho nội bộ"
                description="Quản lý việc điều chuyển hàng hóa giữa các kho"
                action={{
                    label: 'Tạo phiếu chuyển',
                    href: '/dashboard/transfers/create',
                    icon: <Plus className="mr-2 h-4 w-4" />
                }}
            />

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mã phiếu</TableHead>
                            <TableHead>Kho xuất</TableHead>
                            <TableHead>Kho nhập</TableHead>
                            <TableHead>Ngày tạo</TableHead>
                            <TableHead>Người tạo</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : transfers?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                    <ArrowRightLeft className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-muted-foreground">Chưa có phiếu chuyển kho nào</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            transfers?.map((transfer) => {
                                const statusInfo = getStatusBadge(transfer.status);
                                return (
                                    <TableRow
                                        key={transfer.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => setViewingTransfer(transfer)}
                                    >
                                        <TableCell className="font-mono font-medium">{transfer.code}</TableCell>
                                        <TableCell>{transfer.exportWarehouse.name}</TableCell>
                                        <TableCell>{transfer.importWarehouse.name}</TableCell>
                                        <TableCell>{new Date(transfer.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                                        <TableCell>{transfer.createdBy?.fullName}</TableCell>
                                        <TableCell>
                                            <Badge className={statusInfo.color}>
                                                {statusInfo.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end gap-2">
                                                {transfer.status === TransferStatus.PENDING && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            onClick={() => handleUpdateStatus(transfer.id, TransferStatus.COMPLETED)}
                                                            title="Duyệt"
                                                        >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleUpdateStatus(transfer.id, TransferStatus.CANCELLED)}
                                                            title="Hủy"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                                { }
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </Card>

            <Dialog open={!!viewingTransfer} onOpenChange={() => setViewingTransfer(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Chi tiết phiếu chuyển kho</DialogTitle>
                    </DialogHeader>
                    {viewingTransfer && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-xs text-muted-foreground uppercase">Mã phiếu</Label>
                                        <div className="font-medium text-lg">{viewingTransfer.code}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase">Ngày tạo</Label>
                                            <div>{new Date(viewingTransfer.createdAt).toLocaleDateString('vi-VN')}</div>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground uppercase">Người tạo</Label>
                                            <div>{viewingTransfer.createdBy?.fullName}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground uppercase">Trạng thái</Label>
                                        <div className="mt-1">
                                            {(() => {
                                                const status = getStatusBadge(viewingTransfer.status);
                                                return (
                                                    <Badge className={status.color}>
                                                        {status.label}
                                                    </Badge>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4 bg-muted/20 p-4 rounded-lg border">
                                    <div>
                                        <Label className="text-xs text-muted-foreground uppercase">Kho xuất (Nguồn)</Label>
                                        <div className="font-medium text-base flex items-center gap-2">
                                            <Package className="h-4 w-4 text-orange-500" />
                                            {viewingTransfer.exportWarehouse?.name}
                                        </div>
                                    </div>
                                    <div className="flex justify-center">
                                        <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground uppercase">Kho nhập (Đích)</Label>
                                        <div className="font-medium text-base flex items-center gap-2">
                                            <Package className="h-4 w-4 text-blue-500" />
                                            {viewingTransfer.importWarehouse?.name}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {viewingTransfer.note && (
                                <div>
                                    <Label className="text-xs text-muted-foreground uppercase">Ghi chú</Label>
                                    <div className="bg-muted p-3 rounded-md text-sm italic">
                                        "{viewingTransfer.note}"
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 className="font-medium mb-3 flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Danh sách sản phẩm
                                </h3>
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead>Mã SP (SKU)</TableHead>
                                                <TableHead>Tên sản phẩm</TableHead>
                                                <TableHead className="text-right">Số lượng chuyển</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {viewingTransfer.items?.map((item, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-mono">{item.product.sku}</TableCell>
                                                    <TableCell>{item.product.name}</TableCell>
                                                    <TableCell className="text-right font-bold">{item.quantity}</TableCell>
                                                </TableRow>
                                            ))}
                                            {(!viewingTransfer.items || viewingTransfer.items.length === 0) && (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                                                        Không có sản phẩm nào
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmDialog.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDialog.action}
                            className={confirmDialog.variant === 'destructive' ? 'bg-destructive text-white hover:bg-destructive/90' : ''}
                        >
                            Xác nhận
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
