'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/services/api';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, Package, Warehouse, BarChart3, PieChart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Pie,
    Cell
} from 'recharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

export default function ReportsPage() {
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    const { data: inventoryReport, isLoading: isInventoryLoading } = useQuery({
        queryKey: ['inventory-report'],
        queryFn: async () => {
            const response = await reportsApi.getInventory();
            return response.data;
        },
    });

    const { data: importExportReport, isLoading: isImportExportLoading } = useQuery({
        queryKey: ['import-export-report', dateRange],
        queryFn: async () => {
            const response = await reportsApi.getImportExport(dateRange.startDate, dateRange.endDate);
            return response.data;
        },
    });

    // Data for Charts
    const importExportData = [
        {
            name: 'Tổng quan',
            "Nhập kho": importExportReport?.totalImports || 0,
            "Xuất kho": importExportReport?.totalExports || 0,
        }
    ];

    const amountData = [
        {
            name: 'Giá trị (VNĐ)',
            "Nhập kho": importExportReport?.importAmount || 0,
            "Xuất kho": importExportReport?.exportAmount || 0,
        }
    ];

    const stockHealthData = [
        { name: 'Tồn kho thấp', value: inventoryReport?.lowStockCount || 0 },
        { name: 'Bình thường', value: (inventoryReport?.totalProducts || 0) - (inventoryReport?.lowStockCount || 0) },
    ];
    const COLORS = ['#ef4444', '#22c55e'];

    const handleExportExcel = () => {
        try {
            const wb = XLSX.utils.book_new();

            // Sheet 1: Tổng quan
            const overviewData = [
                ['Báo cáo Tổng quan', ''],
                ['Ngày xuất', new Date().toLocaleDateString()],
                ['', ''],
                ['Chỉ số', 'Giá trị'],
                ['Tổng số sản phẩm', inventoryReport?.totalProducts],
                ['Tổng số kho', inventoryReport?.totalWarehouses],
                ['Tổng giá trị tồn kho', inventoryReport?.totalValue],
                ['Cảnh báo tồn thấp', inventoryReport?.lowStockCount],
            ];
            const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
            XLSX.utils.book_append_sheet(wb, wsOverview, "Tổng quan");

            // Sheet 2: Nhập xuất
            const importExportSheetData = [
                ['Báo cáo Nhập Xuất', ''],
                ['Từ ngày', dateRange.startDate],
                ['Đến ngày', dateRange.endDate],
                ['', ''],
                ['Loại', 'Số lượng phiếu', 'Tổng giá trị'],
                ['Nhập kho', importExportReport?.totalImports, importExportReport?.importAmount],
                ['Xuất kho', importExportReport?.totalExports, importExportReport?.exportAmount],
            ];
            const wsImportExport = XLSX.utils.aoa_to_sheet(importExportSheetData);
            XLSX.utils.book_append_sheet(wb, wsImportExport, "Nhập Xuất");

            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

            saveAs(data, `Bao_cao_kho_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success('Xuất báo cáo thành công!');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Có lỗi khi xuất file Excel');
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Báo cáo & Phân tích"
                description="Theo dõi và phân tích hoạt động kho hàng"
                action={{
                    label: 'Xuất Excel',
                    onClick: handleExportExcel,
                    icon: <Download className="mr-2 h-4 w-4" />
                }}
            />

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                    <TabsTrigger value="inventory">Nhập-Xuất-Tồn</TabsTrigger>
                    <TabsTrigger value="analytics">Phân tích</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Tổng nhập</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                {isImportExportLoading ? (
                                    <Skeleton className="h-8 w-24" />
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold text-green-600">
                                            {importExportReport?.totalImports || 0}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Phiếu nhập trong kỳ
                                        </p>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Tổng xuất</CardTitle>
                                <TrendingUp className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                {isImportExportLoading ? (
                                    <Skeleton className="h-8 w-24" />
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold text-blue-600">
                                            {importExportReport?.totalExports || 0}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Phiếu xuất trong kỳ
                                        </p>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Giá trị tồn kho</CardTitle>
                                <Package className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                {isInventoryLoading ? (
                                    <Skeleton className="h-8 w-32" />
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold">
                                            {new Intl.NumberFormat('vi-VN', {
                                                style: 'currency',
                                                currency: 'VND',
                                                notation: 'compact',
                                            }).format(inventoryReport?.totalValue || 0)}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Tổng giá trị hàng tồn
                                        </p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Biểu đồ Nhập - Xuất (Số lượng)</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={importExportData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="Nhập kho" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="Xuất kho" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Sức khỏe tồn kho</CardTitle>
                                <CardDescription>Tỷ lệ sản phẩm sắp hết hàng</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPieChart>
                                            <Pie
                                                data={stockHealthData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {stockHealthData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="inventory" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Báo cáo Nhập-Xuất-Tồn</CardTitle>
                            <CardDescription>Chọn khoảng thời gian để xem báo cáo</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Từ ngày</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={dateRange.startDate}
                                        onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endDate">Đến ngày</Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={dateRange.endDate}
                                        onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 grid md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="font-semibold mb-4">Thống kê theo số lượng phiếu</h4>
                                    <div className="h-[250px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={importExportData} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis type="number" allowDecimals={false} />
                                                <YAxis dataKey="name" type="category" width={100} />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="Nhập kho" fill="#22c55e" radius={[0, 4, 4, 0]} />
                                                <Bar dataKey="Xuất kho" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-4">Thống kê theo giá trị</h4>
                                    <div className="h-[250px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={amountData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value))} />
                                                <Legend />
                                                <Bar dataKey="Nhập kho" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="Xuất kho" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Phân tích Chi tiết</CardTitle>
                            <CardDescription>Các chỉ số hoạt động kho</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <Warehouse className="h-5 w-5 text-muted-foreground" />
                                            <span className="font-medium">Tổng số kho hàng</span>
                                        </div>
                                        <span className="text-2xl font-bold">{inventoryReport?.totalWarehouses || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <Package className="h-5 w-5 text-muted-foreground" />
                                            <span className="font-medium">Tổng mã sản phẩm</span>
                                        </div>
                                        <span className="text-2xl font-bold">{inventoryReport?.totalProducts || 0}</span>
                                    </div>
                                </div>
                                <div className="h-[200px] flex items-center justify-center border rounded-lg bg-muted/10">
                                    <p className="text-muted-foreground text-sm">Biểu đồ chi tiết sản phẩm sẽ được cập nhật trong phiên bản sau</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
