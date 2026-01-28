'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { warehousesApi, inventoryApi, transfersApi } from '@/services/api';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function CreateTransferPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        exportWarehouseId: '',
        importWarehouseId: '',
        note: '',
    });
    const [items, setItems] = useState<{ productId: string; quantity: number }[]>([
        { productId: '', quantity: 1 }
    ]);

    const { data: warehouses } = useQuery({
        queryKey: ['warehouses-active'],
        queryFn: async () => {
            const response = await warehousesApi.getActive();
            return response.data;
        },
    });

    const { data: sourceInventory, isLoading: isLoadingInventory } = useQuery({
        queryKey: ['inventory', formData.exportWarehouseId],
        queryFn: async () => {
            if (!formData.exportWarehouseId) return [];
            const response = await inventoryApi.getByWarehouse(formData.exportWarehouseId);
            return response.data;
        },
        enabled: !!formData.exportWarehouseId,
    });

    const handleAddItem = () => {
        setItems([...items, { productId: '', quantity: 1 }]);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleItemChange = (index: number, field: 'productId' | 'quantity', value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleSubmit = async () => {
        if (!formData.exportWarehouseId || !formData.importWarehouseId) {
            toast.error('Vui lòng chọn kho xuất và kho nhập');
            return;
        }

        if (formData.exportWarehouseId === formData.importWarehouseId) {
            toast.error('Kho nhập và kho xuất phải khác nhau');
            return;
        }

        const validItems = items.filter(i => i.productId && i.quantity > 0);
        if (validItems.length === 0) {
            toast.error('Vui lòng chọn ít nhất một sản phẩm');
            return;
        }

        setIsSubmitting(true);
        try {
            await transfersApi.create({
                ...formData,
                items: validItems,
            });
            toast.success('Tạo phiếu chuyển thành công!');
            router.push('/dashboard/transfers');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <PageHeader
                title="Tạo phiếu chuyển kho"
                description="Tạo yêu cầu chuyển hàng giữa các kho"
                showBackButton
            />

            <Card>
                <CardHeader>
                    <CardTitle>Thông tin chung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Kho xuất</Label>
                            <Select
                                value={formData.exportWarehouseId}
                                onValueChange={(val) => setFormData({ ...formData, exportWarehouseId: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn kho xuất" />
                                </SelectTrigger>
                                <SelectContent>
                                    {warehouses?.map((wh) => (
                                        <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Kho nhập</Label>
                            <Select
                                value={formData.importWarehouseId}
                                onValueChange={(val) => setFormData({ ...formData, importWarehouseId: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn kho nhập" />
                                </SelectTrigger>
                                <SelectContent>
                                    {warehouses?.map((wh) => (
                                        <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Ghi chú</Label>
                        <Textarea
                            placeholder="Nhập lý do chuyển kho..."
                            value={formData.note}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, note: e.target.value })}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Danh sách sản phẩm</CardTitle>
                    <Button variant="outline" size="sm" onClick={handleAddItem}>
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm dòng
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {items.map((item, index) => (
                        <div key={index} className="flex gap-4 items-end">
                            <div className="flex-1 space-y-2">
                                <Label>Sản phẩm</Label>
                                <Select
                                    value={item.productId}
                                    onValueChange={(val) => handleItemChange(index, 'productId', val)}
                                    disabled={!formData.exportWarehouseId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={!formData.exportWarehouseId ? "Chọn kho xuất trước" : "Chọn sản phẩm"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sourceInventory?.map((inv) => (
                                            <SelectItem key={inv.product.id} value={inv.product.id}>
                                                {inv.product.name} (Tồn: {inv.quantity})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-32 space-y-2">
                                <Label>Số lượng</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="mb-0.5 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleRemoveItem(index)}
                                disabled={items.length === 1}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => router.back()}>Hủy</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Tạo phiếu chuyển
                </Button>
            </div>
        </div>
    );
}
