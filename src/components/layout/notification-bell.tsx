'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/services/api';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);

    
    const { data: lowStockItems, isLoading } = useQuery({
        queryKey: ['low-stock-alerts'],
        queryFn: async () => {
            const response = await inventoryApi.getLowStock();
            return response.data;
        },
        refetchInterval: 60000, 
    });

    const alertCount = lowStockItems?.length || 0;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    {alertCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b">
                    <h4 className="font-semibold leading-none">Thông báo</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                        {alertCount > 0
                            ? `Bạn có ${alertCount} cảnh báo tồn kho`
                            : 'Không có thông báo mới'}
                    </p>
                </div>
                <ScrollArea className="h-[300px]">
                    {isLoading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Đang tải...
                        </div>
                    ) : alertCount === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            Tất cả hàng hóa đều ở mức an toàn
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {lowStockItems?.map((item) => (
                                <Link
                                    key={item.id}
                                    href="/dashboard/inventory"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors border-b last:border-0"
                                >
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none text-red-600">
                                            Sắp hết hàng: {item.product.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.warehouse.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge variant="outline" className="text-xs border-red-200 bg-red-50 text-red-700">
                                                Tồn: {item.quantity}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                (Định mức min: {item.product.minStock})
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                {alertCount > 0 && (
                    <div className="p-2 border-t text-center">
                        <Link
                            href="/dashboard/inventory"
                            className="text-xs font-medium text-primary hover:underline"
                            onClick={() => setIsOpen(false)}
                        >
                            Xem tất cả tồn kho
                        </Link>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
