'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/services/api';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface EditLocationDialogProps {
    inventoryId: string;
    currentLocation?: string;
    productName: string;
}

export function EditLocationDialog({ inventoryId, currentLocation, productName }: EditLocationDialogProps) {
    const [open, setOpen] = useState(false);
    const [location, setLocation] = useState(currentLocation || '');
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (newLocation: string) => {
            await inventoryApi.updateLocation(inventoryId, newLocation);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            toast.success('Cập nhật vị trí thành công');
            setOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        },
    });

    const handleSave = () => {
        mutation.mutate(location);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Cập nhật vị trí lưu kho</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Sản phẩm</Label>
                        <p className="font-medium">{productName}</p>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="location" className="text-right">
                            Vị trí
                        </Label>
                        <Input
                            id="location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Ví dụ: Kệ A, Tầng 2..."
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
                    <Button onClick={handleSave} disabled={mutation.isPending}>
                        {mutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
