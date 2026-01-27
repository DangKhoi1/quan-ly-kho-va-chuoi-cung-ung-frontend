import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
    status: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const statusConfig: Record<string, { label: string; variant: any; className: string }> = {
    pending: { label: 'Chờ', variant: 'outline', className: 'border-yellow-500 text-yellow-700' },
    approved: { label: 'Đã duyệt', variant: 'secondary', className: 'bg-blue-100 text-blue-700' },
    completed: { label: 'Hoàn thành', variant: 'default', className: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Hủy', variant: 'destructive', className: 'bg-red-100 text-red-700' },
    active: { label: 'Hoạt động', variant: 'default', className: 'bg-green-100 text-green-700' },
    inactive: { label: 'Ngừng', variant: 'outline', className: 'border-gray-400 text-gray-600' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
    const config = statusConfig[status.toLowerCase()] || { label: status, variant: 'outline', className: '' };

    return (
        <Badge variant={config.variant} className={cn('capitalize', config.className)}>
            {config.label}
        </Badge>
    );
}
