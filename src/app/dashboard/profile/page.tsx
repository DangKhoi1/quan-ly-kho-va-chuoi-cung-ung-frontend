'use client';

import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/services/api';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Mail, Phone, Shield, Calendar, MapPin, Building2, UserCircle, Camera, Loader2, Edit, Save, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';

export default function ProfilePage() {
    const { user: authUser, setUser } = useAuthStore();
    const [isUploading, setIsUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: profile, isLoading, refetch } = useQuery({
        queryKey: ['user-profile'],
        queryFn: async () => {
            const response = await authApi.getProfile();
            return response.data;
        },
    });

    const userData = profile || authUser;

    useEffect(() => {
        if (userData) {
            setFormData({
                fullName: userData.fullName || '',
                phone: userData.phone || '',
            });
        }
    }, [userData]);

    const handleUpdateProfile = async () => {
        setIsSaving(true);
        try {
            const response = await authApi.updateProfile(formData);
            toast.success('Cập nhật thông tin thành công!');
            setIsEditing(false);
            if (response.data) {
                setUser(response.data);
                refetch();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể cập nhật thông tin.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error('File quá lớn! Vui lòng chọn file dưới 2MB.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setIsUploading(true);
        try {
            const response = await authApi.updateAvatar(formData);
            toast.success('Cập nhật ảnh đại diện thành công!');

            if (response.data) {
                setUser(response.data);
                refetch();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Không thể tải ảnh lên.');
        } finally {
            setIsUploading(false);
        }
    };

    if (isLoading && !userData) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <div className="grid gap-6 md:grid-cols-3">
                    <Skeleton className="h-64 col-span-1" />
                    <Skeleton className="h-64 col-span-2" />
                </div>
            </div>
        );
    }

    const getRoleBadge = (role: string) => {
        switch (role?.toLowerCase()) {
            case 'admin':
                return { label: 'Quản trị viên', color: 'bg-purple-100 text-purple-700' };
            case 'manager':
                return { label: 'Quản lý kho', color: 'bg-blue-100 text-blue-700' };
            default:
                return { label: 'Nhân viên', color: 'bg-gray-100 text-gray-700' };
        }
    };

    const roleInfo = getRoleBadge(userData?.role || '');
    const avatarPath = userData?.avatar ? `http://localhost:3001${userData.avatar}` : null;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Thông tin tài khoản"
                description="Quản lý thông tin cá nhân và thiết lập tài khoản"
            />

            <div className="grid gap-6 md:grid-cols-3">
                {}
                <Card className="col-span-1">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4 relative group">
                            <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold overflow-hidden border-4 border-background shadow-lg">
                                {avatarPath ? (
                                    <img
                                        src={avatarPath}
                                        alt={userData?.fullName}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    userData?.fullName.charAt(0).toUpperCase()
                                )}
                            </div>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="absolute bottom-0 right-1/2 translate-x-12 translate-y-1 p-2 bg-background rounded-full border shadow-sm hover:bg-muted transition-colors transition-transform active:scale-95"
                                title="Thay đổi ảnh đại diện"
                            >
                                {isUploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Camera className="h-4 w-4 text-muted-foreground" />
                                )}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                        <CardTitle>{userData?.fullName}</CardTitle>
                        <CardDescription>{userData?.email}</CardDescription>
                        <div className="flex justify-center mt-2">
                            <Badge className={roleInfo.color}>
                                {roleInfo.label}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Ngày tham gia: {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <span>Trạng thái: </span>
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                Đang hoạt động
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {}
                <Card className="col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <CardTitle>Chi tiết thông tin</CardTitle>
                            <CardDescription>Các thông tin liên lạc và định danh</CardDescription>
                        </div>
                        {!isEditing ? (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Chỉnh sửa
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditing(false)}
                                    disabled={isSaving}
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Hủy
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleUpdateProfile}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                    )}
                                    Lưu thay đổi
                                </Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                                <LabelWithIcon icon={UserCircle} label="Họ và tên" />
                                {isEditing ? (
                                    <Input
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        placeholder="Nhập họ và tên"
                                    />
                                ) : (
                                    <p className="text-sm font-medium p-2 bg-muted/50 rounded-md">{userData?.fullName}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <LabelWithIcon icon={Mail} label="Email liên hệ" />
                                <p className="text-sm font-medium p-2 bg-slate-100/50 text-muted-foreground rounded-md cursor-not-allowed italic" title="Email không thể thay đổi">{userData?.email}</p>
                            </div>
                            <div className="space-y-1">
                                <LabelWithIcon icon={Phone} label="Số điện thoại" />
                                {isEditing ? (
                                    <Input
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="Nhập số điện thoại"
                                    />
                                ) : (
                                    <p className="text-sm font-medium p-2 bg-muted/50 rounded-md">{userData?.phone || 'Chưa cập nhật'}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <LabelWithIcon icon={Shield} label="Vai trò hệ thống" />
                                <p className="text-sm font-medium p-2 bg-muted/50 rounded-md capitalize">{roleInfo.label}</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <h4 className="font-semibold mb-4">Thông tin công việc</h4>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-1">
                                    <LabelWithIcon icon={Building2} label="Phòng ban / Kho" />
                                    <p className="text-sm font-medium p-2 bg-muted/50 rounded-md">Bộ phận quản lý Kho</p>
                                </div>
                                <div className="space-y-1">
                                    <LabelWithIcon icon={MapPin} label="Cơ sở làm việc" />
                                    <p className="text-sm font-medium p-2 bg-muted/50 rounded-md">Kho Tổng Miền Bắc</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function LabelWithIcon({ icon: Icon, label }: { icon: any, label: string }) {
    return (
        <div className="flex items-center gap-2 mb-1">
            <Icon className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
    );
}
