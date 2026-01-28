import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PageHeaderProps {
    title: string;
    description?: string;
    showBackButton?: boolean;
    children?: ReactNode;
    action?: {
        label: string;
        onClick?: () => void;
        href?: string;
        icon?: ReactNode;
    };
}

export function PageHeader({ title, description, showBackButton, action, children }: PageHeaderProps) {
    const router = useRouter();

    return (
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                {showBackButton && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-2 h-8 text-muted-foreground mb-2"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại
                    </Button>
                )}
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                {description && (
                    <p className="text-muted-foreground">{description}</p>
                )}
            </div>
            {children ? (
                children
            ) : action && (
                action.href ? (
                    <Link href={action.href}>
                        <Button>
                            {action.icon || <Plus className="mr-2 h-4 w-4" />}
                            {action.label}
                        </Button>
                    </Link>
                ) : (
                    <Button onClick={action.onClick}>
                        {action.icon || <Plus className="mr-2 h-4 w-4" />}
                        {action.label}
                    </Button>
                )
            )}
        </div>
    );
}
