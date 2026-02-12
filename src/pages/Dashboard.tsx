import { useMemo, useState, useEffect, useRef } from 'react';
import { API_URL } from '../config';
import {
    DollarSign,
    ShoppingCart,
    AlertTriangle,
    TrendingUp,
    ArrowRight,
    Package,
    Calendar,
    TrendingDown,
    Eye,
    Trash2,
    Printer,
    Download,
    Plus,
    Clock,
    Filter,
    Banknote,
    CreditCard
} from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Dropdown } from '../components/ui/Dropdown';
import html2canvas from 'html2canvas';
import { DataTable } from '../components/ui/DataTable';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { useProducts } from '../context/ProductContext';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const CustomTooltip = ({ active, payload, label, currency, metric }: any) => {
    if (active && payload && payload.length) {
        const metricLabels: Record<string, string> = {
            revenue: 'Revenue',
            profit: 'Profit',
            orders: 'Orders'
        };

        const value = payload[0].value;
        const formattedValue = metric === 'orders'
            ? value.toString()
            : `${currency}${value.toLocaleString()}`;

        return (
            <div className="bg-white/80 dark:bg-secondary-900/80 backdrop-blur-xl p-4 rounded-2xl shadow-2xl ring-1 ring-secondary-100 dark:ring-secondary-800 animate-in zoom-in-95 duration-200">
                <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-[0.2em] mb-1">{label}</p>
                {payload[0].payload.fullRange && (
                    <p className="text-[10px] font-bold text-secondary-300 uppercase tracking-wider mb-3">{payload[0].payload.fullRange}</p>
                )}
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "w-2 h-2 rounded-full",
                        metric === 'revenue' ? 'bg-primary-500' :
                            metric === 'profit' ? 'bg-success-500' :
                                'bg-purple-500'
                    )} />
                    <span className="text-xs font-black text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">{metricLabels[metric]}</span>
                    <span className="text-sm font-black text-secondary-900 dark:text-secondary-50 ml-4">{formattedValue}</span>
                </div>
            </div>
        );
    }
    return null;
};

export const Dashboard = () => {
    const { products, sales, isLoading, voidSale, updateStock, refreshData } = useProducts();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [settings, setSettings] = useState<any>(null);
    const [chartTimeRange, setChartTimeRange] = useState<7 | 14 | 30 | 90 | 'YTD'>(7);
    const [chartMetric, setChartMetric] = useState<'revenue' | 'profit' | 'orders'>('revenue');
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [isSaleDetailsOpen, setIsSaleDetailsOpen] = useState(false);
    const [restockModalOpen, setRestockModalOpen] = useState(false);
    const [productToRestock, setProductToRestock] = useState<any>(null);
    const [restockQuantity, setRestockQuantity] = useState('10');
    const [paymentFilter, setPaymentFilter] = useState<string>('all');
    const [isConfirmVoidOpen, setIsConfirmVoidOpen] = useState(false);
    const [saleToVoid, setSaleToVoid] = useState<string | null>(null);
    const [isVoiding, setIsVoiding] = useState(false);
    const chartRef = useRef<HTMLDivElement>(null);

    const handleOpenRestock = (product: any) => {
        setProductToRestock(product);
        setRestockQuantity('10');
        setRestockModalOpen(true);
    };

    const handleConfirmRestock = async () => {
        if (productToRestock && restockQuantity) {
            await updateStock(productToRestock.id, parseInt(restockQuantity));
            setRestockModalOpen(false);
            setProductToRestock(null);
        }
    };

    const handleExportChart = async () => {
        if (chartRef.current) {
            const canvas = await html2canvas(chartRef.current);
            const link = document.createElement('a');
            link.download = `performance-chart-${format(new Date(), 'yyyy-MM-dd')}.png`;
            link.href = canvas.toDataURL();
            link.click();
        }
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${API_URL}/settings`);
                if (res.ok) {
                    const data = await res.json();
                    setSettings(data);
                }
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            }
        };
        fetchSettings();
    }, []);

    const currency = settings?.currencySymbol || 'GH₵';

    const stats = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Efficient pre-filtered calculations
        const todaySales = sales.filter(s => new Date(s.timestamp) >= todayStart);
        const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);

        const yesterdaySales = sales.filter(s => {
            const saleDate = new Date(s.timestamp);
            return saleDate >= yesterdayStart && saleDate < yesterdayEnd;
        });
        const yesterdayRevenue = yesterdaySales.reduce((sum, sale) => sum + sale.total, 0);

        const percentChange = yesterdayRevenue > 0
            ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
            : todayRevenue > 0 ? 100 : 0;

        let totalRevenue = 0;
        let totalCost = 0;
        sales.forEach(sale => {
            totalRevenue += sale.total;
            sale.items.forEach((item: any) => {
                totalCost += (item.quantity * (item.costPrice || 0));
            });
        });

        const totalProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
        const lowStockThreshold = settings ? parseFloat(settings.lowStockThreshold) || 5 : 5;
        const totalOrders = sales.length;
        const lowStockCount = products.filter(p => p.stock <= lowStockThreshold).length;

        const allStats = [
            {
                label: 'Total Revenue',
                value: `${currency}${totalRevenue.toLocaleString()}`,
                icon: DollarSign,
                color: 'text-primary-600 dark:text-primary-400',
                bg: 'bg-primary-50 dark:bg-primary-900/10'
            },
            {
                label: "Today's Sales",
                value: `${currency}${todayRevenue.toLocaleString()}`,
                subValue: percentChange !== 0 ? `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}% vs yesterday` : 'No change',
                trend: percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'neutral',
                icon: Calendar,
                color: 'text-purple-600 dark:text-purple-400',
                bg: 'bg-purple-50 dark:bg-purple-900/10'
            },
            {
                label: 'Total Profit',
                value: `${currency}${totalProfit.toLocaleString()}`,
                subValue: `${profitMargin.toFixed(1)}% Margin`,
                trend: 'neutral',
                icon: TrendingUp,
                color: 'text-success-600 dark:text-success-400',
                bg: 'bg-success-50 dark:bg-success-900/10',
                adminOnly: true
            },
            {
                label: 'Low Stock',
                value: lowStockCount.toLocaleString(),
                subValue: `${totalOrders.toLocaleString()} Total Orders`,
                trend: 'neutral',
                icon: AlertTriangle,
                color: lowStockCount > 0 ? 'text-danger-600 dark:text-danger-400' : 'text-secondary-400',
                bg: lowStockCount > 0 ? 'bg-danger-50 dark:bg-danger-900/10' : 'bg-secondary-50 dark:bg-secondary-900/10'
            },
        ];

        return allStats.filter(s => !s.adminOnly || user?.role === 'Admin');
    }, [products, sales, currency, user?.role]);

    const chartData = useMemo(() => {
        // Pre-group sales by date for O(N) efficiency instead of O(N*D)
        const salesByDate = new Map<string, any[]>();
        sales.forEach(sale => {
            const dateStr = format(new Date(sale.timestamp), 'yyyy-MM-dd');
            if (!salesByDate.has(dateStr)) {
                salesByDate.set(dateStr, []);
            }
            salesByDate.get(dateStr)?.push(sale);
        });

        let daysToFetch = typeof chartTimeRange === 'number' ? chartTimeRange : 7;
        if (chartTimeRange === 'YTD') {
            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            daysToFetch = Math.ceil((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        }

        const dateList = [...Array(daysToFetch)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return format(d, 'yyyy-MM-dd');
        }).reverse();

        const rawData = dateList.map(dateStr => {
            const daySales = salesByDate.get(dateStr) || [];
            const revenue = daySales.reduce((sum, s) => sum + s.total, 0);
            const cost = daySales.reduce((sum, s) => {
                return sum + s.items.reduce((iSum: number, item: any) => iSum + (item.quantity * (item.costPrice || 0)), 0);
            }, 0);
            const profit = revenue - cost;
            const orders = daySales.length;

            return {
                date: dateStr,
                name: format(new Date(dateStr), 'MMM dd'),
                revenue,
                profit,
                orders
            };
        });

        // Aggregation logic for longer ranges to avoid visual crowding
        if (chartTimeRange === 'YTD' || chartTimeRange === 90) {
            const aggregatedData: any[] = [];
            const groupSize = chartTimeRange === 'YTD' ? 30 : 7; // Group by month for YTD, week for 90D

            for (let i = 0; i < rawData.length; i += groupSize) {
                const slice = rawData.slice(i, i + groupSize);
                const revenue = slice.reduce((sum, d) => sum + d.revenue, 0);
                const profit = slice.reduce((sum, d) => sum + d.profit, 0);
                const orders = slice.reduce((sum, d) => sum + d.orders, 0);

                aggregatedData.push({
                    name: chartTimeRange === 'YTD'
                        ? format(new Date(slice[0].date), 'MMM')
                        : `Week ${Math.floor(i / 7) + 1}`,
                    revenue,
                    profit,
                    orders,
                    fullRange: `${slice[0].name} - ${slice[slice.length - 1].name}`
                });
            }
            return aggregatedData;
        }

        if (chartTimeRange === 30) {
            const weeklyData: any[] = [];
            for (let i = 0; i < rawData.length; i += 7) {
                const weekSlice = rawData.slice(i, i + 7);
                const weekRevenue = weekSlice.reduce((sum, d) => sum + d.revenue, 0);
                const weekProfit = weekSlice.reduce((sum, d) => sum + d.profit, 0);
                const weekOrders = weekSlice.reduce((sum, d) => sum + d.orders, 0);

                weeklyData.push({
                    name: `Week ${Math.floor(i / 7) + 1}`,
                    revenue: weekRevenue,
                    profit: weekProfit,
                    orders: weekOrders,
                    fullRange: `${weekSlice[0].name} - ${weekSlice[weekSlice.length - 1].name}`
                });
            }
            return weeklyData;
        }

        return rawData;
    }, [sales, chartTimeRange]);

    const recentSalesFormatted = useMemo(() => {
        return sales
            .filter(sale => paymentFilter === 'all' || sale.paymentMethod === paymentFilter)
            .slice(0, 5)
            .map(sale => ({
                id: sale.id,
                product: sale.items.map(i => i.name).join(', '),
                customer: 'Walk-in Customer',
                date: format(new Date(sale.timestamp), 'MMM dd, HH:mm'),
                amount: `${currency}${sale.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                status: 'Completed'
            }));
    }, [sales, currency, paymentFilter]);

    const lowStockItems = useMemo(() => {
        const lowStockThreshold = settings ? parseFloat(settings.lowStockThreshold) || 5 : 5;
        return products.filter(p => p.stock <= lowStockThreshold).slice(0, 4);
    }, [products, settings]);

    const topSellingProducts = useMemo(() => {
        const counts: Record<string, { name: string, quantity: number, revenue: number }> = {};
        sales.forEach(sale => {
            sale.items.forEach(item => {
                if (!counts[item.productId]) {
                    counts[item.productId] = { name: item.name, quantity: 0, revenue: 0 };
                }
                counts[item.productId].quantity += item.quantity;
                counts[item.productId].revenue += item.quantity * item.price;
            });
        });
        return Object.values(counts)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
    }, [sales]);

    const revenueGoal = settings ? parseFloat(settings.revenueGoal) || 50000 : 50000;
    const monthlyRevenue = useMemo(() => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return sales
            .filter(s => new Date(s.timestamp) >= monthStart)
            .reduce((sum, s) => sum + s.total, 0);
    }, [sales]);
    const goalProgress = Math.min(100, (monthlyRevenue / revenueGoal) * 100);

    const activityFeed = useMemo(() => {
        const activities: any[] = [];
        sales.forEach(sale => {
            const productNames = sale.items.map(i => i.name).join(', ');
            activities.push({
                id: `sale-${sale.id}`,
                type: 'sale',
                title: productNames,
                description: `Sold for ${currency}${sale.total.toFixed(2)} (${sale.id})`,
                timestamp: new Date(sale.timestamp),
                icon: ShoppingCart,
                color: 'text-success-600',
                bg: 'bg-success-50 dark:bg-success-900/20'
            });
        });
        const lowStockThreshold = settings ? parseFloat(settings.lowStockThreshold) || 5 : 5;
        products.filter(p => p.stock <= lowStockThreshold).forEach(product => {
            activities.push({
                id: `stock-${product.id}`,
                type: 'stock',
                title: 'Low Stock Alert',
                description: `${product.name} is down to ${product.stock} units`,
                timestamp: new Date(),
                icon: AlertTriangle,
                color: 'text-danger-600',
                bg: 'bg-danger-50 dark:bg-danger-900/20'
            });
        });
        return activities
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 10);
    }, [sales, products, currency]);

    const handleViewSale = (saleId: string) => {
        const sale = sales.find(s => s.id === saleId);
        if (sale) {
            setSelectedSale(sale);
            setIsSaleDetailsOpen(true);
        }
    };

    const handleVoidSale = (saleId: string) => {
        setSaleToVoid(saleId);
        setIsConfirmVoidOpen(true);
    };

    const confirmVoidSale = async () => {
        if (saleToVoid) {
            setIsVoiding(true);
            await voidSale(saleToVoid);
            setIsVoiding(false);
            setSaleToVoid(null);
            setIsConfirmVoidOpen(false);
        }
    };

    const handlePrintReceipt = (saleId: string) => {
        const sale = sales.find(s => s.id === saleId);
        if (!sale) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const receiptHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt - ${saleId}</title>
                <style>
                    body { font-family: 'Courier New', Courier, monospace; padding: 20px; max-width: 300px; margin: 0 auto; color: #000; }
                    .header { text-align: center; margin-bottom: 15px; }
                    .header h2 { margin: 0; font-size: 1.4em; text-transform: uppercase; }
                    .header p { margin: 2px 0; font-size: 0.85em; }
                    .line { border-bottom: 1px dashed #000; margin: 10px 0; }
                    .row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 0.9em; }
                    .item-row { margin: 8px 0; }
                    .item-name { font-weight: bold; }
                    .total-section { margin-top: 10px; }
                    .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1em; margin: 4px 0; }
                    .footer { text-align: center; margin-top: 20px; font-size: 0.8em; }
                    @media print {
                        body { padding: 0; width: 100%; }
                        @page { margin: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>${settings?.storeName || 'Home of Disposables'}</h2>
                    ${settings?.storeAddress ? `<p>${settings.storeAddress}</p>` : ''}
                    ${settings?.storePhone ? `<p>Tel: ${settings.storePhone}</p>` : ''}
                    ${settings?.storeEmail ? `<p>${settings.storeEmail}</p>` : ''}
                </div>
                <div class="line"></div>
                <div class="row"><span>Order ID:</span><span>${sale.id}</span></div>
                <div class="row"><span>Date:</span><span>${format(new Date(sale.timestamp), 'MMM dd, yyyy HH:mm')}</span></div>
                <div class="line"></div>
                <div class="items">
                    ${sale.items.map(item => `
                        <div class="item-row">
                            <div class="item-name">${item.name}</div>
                            <div class="row">
                                <span>${item.quantity.toFixed(2)} x ${currency}${item.price.toFixed(2)}</span>
                                <span>${currency}${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="line"></div>
                <div class="total-section">
                    <div class="total-row">
                        <span>TOTAL</span>
                        <span>${currency}${sale.total.toFixed(2)}</span>
                    </div>
                    <div class="row">
                        <span>Payment Method</span>
                        <span>${sale.paymentMethod}</span>
                    </div>
                </div>
                <div class="line"></div>
                <div class="footer">
                    <p>Thank you for your business!</p>
                    <p>Please keep your receipt.</p>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        printWindow.print();
    };

    const salesColumns = [
        {
            header: 'Products',
            accessorKey: 'product' as any,
            className: 'font-bold text-secondary-900 dark:text-secondary-100 min-w-[200px]',
            cell: (item: any) => (
                <div className="max-w-[200px] truncate" title={item.product}>
                    {item.product}
                </div>
            )
        },
        {
            header: 'Order ID',
            accessorKey: 'id' as any,
            className: 'font-semibold text-primary-600 dark:text-primary-400 min-w-[100px]'
        },
        {
            header: 'Date',
            accessorKey: 'date' as any,
            className: 'hidden lg:table-cell text-secondary-500 dark:text-secondary-400 min-w-[120px]'
        },
        {
            header: 'Amount',
            accessorKey: 'amount' as any,
            className: 'font-bold text-secondary-900 dark:text-secondary-100 min-w-[100px] text-right',
        },
        {
            header: 'Status',
            accessorKey: 'status' as any,
            className: 'hidden sm:table-cell min-w-[100px]',
            cell: (item: any) => (
                <span className="px-2.5 py-0.5 inline-flex text-xs font-bold rounded-full bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400">
                    {item.status}
                </span>
            )
        },
        {
            header: 'Actions',
            accessorKey: 'id' as any,
            className: 'text-right',
            cell: (item: any) => (
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={() => handleViewSale(item.id)}
                        className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400 transition-colors"
                        title="View Details"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handlePrintReceipt(item.id)}
                        className="p-2 hover:bg-secondary-50 dark:hover:bg-secondary-800 rounded-lg text-secondary-600 dark:text-secondary-400 transition-colors"
                        title="Print Receipt"
                    >
                        <Printer className="w-4 h-4" />
                    </button>
                    {user?.role === 'Admin' && (
                        <button
                            onClick={() => handleVoidSale(item.id)}
                            className="p-2 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg text-danger-600 dark:text-danger-400 transition-colors"
                            title="Void Sale"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="w-full space-y-8 animate-in fade-in duration-500 pb-12">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-secondary-900 dark:text-secondary-50 tracking-tight font-display">Dashboard</h1>
                    <p className="text-sm font-bold text-secondary-400 uppercase tracking-widest mt-1">Overview & Analytics</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => navigate('/pos')} size="sm" className="shadow-lg shadow-primary-600/20 text-xs py-2">
                        <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                        New Sale
                    </Button>
                    {user?.role === 'Admin' && (
                        <Button variant="secondary" size="sm" onClick={() => navigate('/products')} className="text-xs py-2">
                            <Plus className="w-3.5 h-3.5 mr-1.5" />
                            Add Product
                        </Button>
                    )}
                </div>
            </header>

            {/* Stats Grid */}
            <ErrorBoundary onRetry={refreshData}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {isLoading ? (
                        [...Array(4)].map((_, i) => (
                            <Card key={i} padding="sm" className="border-none shadow-sm bg-white dark:bg-secondary-900 ring-1 ring-secondary-200/50 dark:ring-secondary-800 h-24 animate-pulse" />
                        ))
                    ) : (
                        <>
                            {stats.map((stat, index) => (
                                <Card key={index} padding="sm" className="border-none shadow-sm bg-white dark:bg-secondary-900 ring-1 ring-secondary-200/50 dark:ring-secondary-800 group hover:ring-primary-500 transition-all duration-500 hover:-translate-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="text-[9px] font-bold text-secondary-400 uppercase tracking-[0.15em] mb-1">
                                                {stat.label}
                                            </p>
                                            <p className="text-2xl font-black text-secondary-900 dark:text-secondary-50 tracking-tighter font-display">
                                                {stat.value}
                                            </p>
                                            {stat.subValue && (
                                                <div className="mt-1 flex items-center gap-1">
                                                    {stat.trend === 'up' && <TrendingUp className="w-2.5 h-2.5 text-success-600" />}
                                                    {stat.trend === 'down' && <TrendingDown className="w-2.5 h-2.5 text-danger-600" />}
                                                    <p className={cn(
                                                        "text-[9px] font-bold uppercase tracking-wider",
                                                        stat.trend === 'up' ? 'text-success-600' :
                                                            stat.trend === 'down' ? 'text-danger-600' :
                                                                'text-secondary-400'
                                                    )}>
                                                        {stat.subValue}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", stat.bg, stat.color)}>
                                            <stat.icon className="w-5 h-5" />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {user?.role === 'Admin' && (
                                <Card padding="sm" className="border-none shadow-sm bg-white dark:bg-secondary-900 ring-1 ring-secondary-200/50 dark:ring-secondary-800 sm:col-span-2 md:col-span-3 lg:col-span-4 transition-all">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
                                                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] truncate">Revenue Goal Progress</p>
                                                <div className="flex items-center gap-1.5 font-display">
                                                    <span className="text-sm font-black text-secondary-900 dark:text-secondary-50">{currency}{monthlyRevenue.toLocaleString()}</span>
                                                    <span className="text-xs font-bold text-secondary-300">/</span>
                                                    <span className="text-xs font-bold text-secondary-400">{currency}{revenueGoal.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className="h-2 w-full bg-secondary-100 dark:bg-secondary-800/40 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary-500 transition-all duration-1000 ease-out rounded-full relative"
                                                    style={{ width: `${goalProgress}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-primary-400/20 animate-pulse" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">Progress</p>
                                                <p className="text-2xl font-black text-primary-500 font-display">{goalProgress.toFixed(1)}%</p>
                                            </div>
                                            <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/10 flex items-center justify-center text-primary-500 ring-1 ring-primary-500/10">
                                                <TrendingUp className="w-6 h-6" />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </>
                    )}
                </div>
            </ErrorBoundary >

            {/* Main Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Weekly Performance Chart */}
                <ErrorBoundary onRetry={refreshData}>
                    <Card padding="md" className="md:col-span-2 lg:col-span-3 border-none shadow-sm bg-white dark:bg-secondary-900 ring-1 ring-secondary-200/50 dark:ring-secondary-800 flex flex-col h-[350px] sm:h-[450px]">
                        <div className="flex flex-col gap-6 mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-secondary-900 dark:text-secondary-50 font-display">Performance Trend</h2>
                                        <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest mt-0.5">Last {chartTimeRange} days</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                    {user?.role === 'Admin' && (
                                        <button
                                            onClick={handleExportChart}
                                            className="p-2 rounded-lg text-secondary-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors mr-1"
                                            title="Export Chart"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    )}
                                    <div className="flex bg-secondary-100 dark:bg-secondary-800/50 p-1 rounded-xl">
                                        {[7, 14, 30, 90, 'YTD'].map((range) => (
                                            <button
                                                key={range}
                                                onClick={() => setChartTimeRange(range as any)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                                                    chartTimeRange === range
                                                        ? "bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-50 shadow-sm"
                                                        : "text-secondary-500 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-200"
                                                )}
                                            >
                                                {range}{typeof range === 'number' ? 'D' : ''}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-secondary-300 uppercase tracking-widest">Display</span>
                                <div className="h-4 w-px bg-secondary-200 dark:bg-secondary-800" />
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { key: 'revenue', label: 'Revenue', color: 'bg-primary-500' },
                                        { key: 'profit', label: 'Profit', color: 'bg-success-500', adminOnly: true },
                                        { key: 'orders', label: 'Orders', color: 'bg-purple-500' }
                                    ].filter(m => !m.adminOnly || user?.role === 'Admin').map((metric) => (
                                        <button
                                            key={metric.key}
                                            onClick={() => setChartMetric(metric.key as any)}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border",
                                                chartMetric === metric.key
                                                    ? "bg-primary-50/50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300"
                                                    : "bg-transparent border-transparent text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800/50"
                                            )}
                                        >
                                            <div className={cn("w-1.5 h-1.5 rounded-full", metric.color)} />
                                            {metric.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div ref={chartRef} className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                                            <stop
                                                offset="5%"
                                                stopColor={
                                                    chartMetric === 'revenue' ? '#0ea5e9' :
                                                        chartMetric === 'profit' ? '#10b981' :
                                                            '#a855f7'
                                                }
                                                stopOpacity={0.2}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor={
                                                    chartMetric === 'revenue' ? '#0ea5e9' :
                                                        chartMetric === 'profit' ? '#10b981' :
                                                            '#a855f7'
                                                }
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="currentColor" className="text-secondary-100/50 dark:text-secondary-800/30" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                                        tickFormatter={(value) => chartMetric === 'orders' ? value : `${currency}${value.toLocaleString()}`}
                                    />
                                    <Tooltip content={<CustomTooltip currency={currency} metric={chartMetric} />} cursor={{ stroke: 'currentColor', strokeWidth: 1, strokeDasharray: '4 4', className: 'text-secondary-200 dark:text-secondary-700' }} />
                                    <Area
                                        type="monotone"
                                        dataKey={chartMetric}
                                        stroke={
                                            chartMetric === 'revenue' ? '#0ea5e9' :
                                                chartMetric === 'profit' ? '#10b981' :
                                                    '#a855f7'
                                        }
                                        strokeWidth={2.5}
                                        fillOpacity={1}
                                        fill="url(#colorMetric)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </ErrorBoundary >

                {/* Activity Feed */}
                <ErrorBoundary onRetry={refreshData}>
                    <Card padding="none" className="md:col-span-1 border-none shadow-sm bg-white dark:bg-secondary-900 ring-1 ring-secondary-200/50 dark:ring-secondary-800 overflow-hidden flex flex-col h-[450px]">
                        <div className="p-6 border-b border-secondary-100 dark:border-secondary-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-secondary-50 dark:bg-secondary-800 flex items-center justify-center text-secondary-500">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-secondary-900 dark:text-secondary-50 font-display">Activity Feed</h2>
                                    <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest mt-0.5">Live updates</p>
                                </div>
                            </div>
                            <span className="px-2 py-0.5 bg-success-50 dark:bg-success-900/10 text-success-600 dark:text-success-400 text-[10px] font-bold rounded-md uppercase tracking-wider animate-pulse">Live</span>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {isLoading ? (
                                <div className="p-6 space-y-6">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="flex gap-4">
                                            <Skeleton variant="circular" className="w-10 h-10" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton variant="text" className="w-32 h-4" />
                                                <Skeleton variant="text" className="w-full h-3" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : activityFeed.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                    <p className="text-secondary-400 font-bold">No recent activity.</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-secondary-50 dark:divide-secondary-800">
                                    {activityFeed.map((activity) => (
                                        <li key={activity.id} className="px-6 py-4 hover:bg-secondary-50/50 dark:hover:bg-secondary-800/50 transition-colors">
                                            <div className="flex gap-4">
                                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ring-4 ring-current/5", activity.bg, activity.color)}>
                                                    <activity.icon className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="text-sm font-bold text-secondary-900 dark:text-secondary-50">{activity.title}</p>
                                                        <span className="text-[9px] font-bold text-secondary-300 uppercase shrink-0">{format(activity.timestamp, 'HH:mm')}</span>
                                                    </div>
                                                    <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-0.5 line-clamp-1 font-medium">{activity.description}</p>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </Card>
                </ErrorBoundary >

                {/* Inventory Alerts */}
                <ErrorBoundary onRetry={refreshData}>
                    <Card padding="none" className="md:col-span-1 border-none shadow-sm bg-white dark:bg-secondary-900 ring-1 ring-secondary-200/50 dark:ring-secondary-800 overflow-hidden flex flex-col h-[450px]">
                        <div className="p-6 border-b border-secondary-100 dark:border-secondary-800 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-danger-50 dark:bg-danger-900/10 flex items-center justify-center text-danger-500 ring-1 ring-danger-500/10">
                                <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-secondary-900 dark:text-secondary-50 font-display">Inventory Alerts</h2>
                                <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest mt-0.5">Critical stock</p>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {isLoading ? (
                                <div className="p-6 space-y-6">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="flex justify-between items-center">
                                            <div className="space-y-2">
                                                <Skeleton variant="text" className="w-32 h-4" />
                                                <Skeleton variant="text" className="w-24 h-3" />
                                            </div>
                                            <Skeleton variant="rounded" className="w-16 h-6 rounded-full" />
                                        </div>
                                    ))}
                                </div>
                            ) : lowStockItems.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                    <div className="w-16 h-16 rounded-full bg-success-50 dark:bg-success-900/10 flex items-center justify-center text-success-500 mb-4 ring-8 ring-success-500/5">
                                        <Package className="w-8 h-8" />
                                    </div>
                                    <p className="text-secondary-900 dark:text-secondary-50 font-bold">All Good!</p>
                                    <p className="text-secondary-400 text-xs font-medium mt-1">All items are well-stocked.</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-secondary-50 dark:divide-secondary-800">
                                    {lowStockItems.map((item) => (
                                        <li key={item.id} className="px-6 py-5 hover:bg-secondary-50/50 dark:hover:bg-secondary-800/50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-secondary-900 dark:text-secondary-50 truncate">{item.name}</p>
                                                    <p className="text-[10px] font-bold text-secondary-400 mt-1 uppercase tracking-widest">{item.sku}</p>
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <span className={cn(
                                                        "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap",
                                                        item.stock === 0 ? 'bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-400' : 'bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400'
                                                    )}>
                                                        {item.stock === 0 ? 'Out of stock' : `${item.stock} Left`}
                                                    </span>
                                                    {user?.role === 'Admin' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenRestock(item);
                                                            }}
                                                            className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                                            title="Quick Restock"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        {user?.role === 'Admin' && (
                            <div className="p-4 bg-secondary-50/30 dark:bg-secondary-800/20 border-t border-secondary-100 dark:border-secondary-800">
                                <button
                                    onClick={() => window.location.href = '/inventory'}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-bold text-secondary-500 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group"
                                >
                                    Manage Inventory
                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        )}
                    </Card>
                </ErrorBoundary >

                {/* Top Selling Products */}
                <ErrorBoundary onRetry={refreshData}>
                    <Card padding="none" className="md:col-span-1 border-none shadow-sm bg-white dark:bg-secondary-900 ring-1 ring-secondary-200/50 dark:ring-secondary-800 overflow-hidden flex flex-col h-[450px]">
                        <div className="p-6 border-b border-secondary-100 dark:border-secondary-800 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/10 flex items-center justify-center text-primary-500 ring-1 ring-primary-500/10">
                                <Package className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-secondary-900 dark:text-secondary-50 font-display">Top Products</h2>
                                <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest mt-0.5">Top performers</p>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {isLoading ? (
                                <div className="p-6 space-y-6">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="flex justify-between items-center">
                                            <div className="space-y-2">
                                                <Skeleton variant="text" className="w-32 h-4" />
                                                <Skeleton variant="text" className="w-24 h-3" />
                                            </div>
                                            <Skeleton variant="rounded" className="w-16 h-6 rounded-full" />
                                        </div>
                                    ))}
                                </div>
                            ) : topSellingProducts.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                                    <div className="w-16 h-16 rounded-full bg-secondary-50 dark:bg-secondary-800/50 flex items-center justify-center text-secondary-300 mb-4 ring-8 ring-secondary-500/5">
                                        <Package className="w-8 h-8" />
                                    </div>
                                    <p className="text-secondary-900 dark:text-secondary-50 font-bold">No Data</p>
                                    <p className="text-secondary-400 text-xs font-medium mt-1">Start selling to see insights.</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-secondary-50 dark:divide-secondary-800">
                                    {topSellingProducts.map((item, index) => (
                                        <li key={index} className="px-6 py-5 hover:bg-secondary-50/50 dark:hover:bg-secondary-800/50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-black text-secondary-900 dark:text-secondary-50 truncate">{item.name}</p>
                                                    <p className="text-[10px] font-bold text-secondary-400 mt-0.5 uppercase tracking-wider">{item.quantity} units sold</p>
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <span className="text-sm font-black text-primary-600">
                                                        {currency}{item.revenue.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        {user?.role === 'Admin' && (
                            <div className="p-4 bg-secondary-50/30 dark:bg-secondary-800/20 border-t border-secondary-100 dark:border-secondary-800">
                                <button
                                    onClick={() => window.location.href = '/sales'}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-bold text-secondary-500 hover:text-primary-600 transition-colors group"
                                >
                                    View Full Report
                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        )}
                    </Card>
                </ErrorBoundary >

                {/* Recent Sales Table */}
                < div className="md:col-span-2 lg:col-span-3" >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 px-2">
                        <h2 className="text-xl font-black text-secondary-900 dark:text-secondary-50">Recent Transactions</h2>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                            <Dropdown
                                value={paymentFilter}
                                onChange={setPaymentFilter}
                                options={[
                                    { label: 'All Payments', value: 'all', icon: Filter },
                                    { label: 'Cash', value: 'Cash', icon: Banknote },
                                    { label: 'Card', value: 'Card', icon: CreditCard },
                                    { label: 'Transfer', value: 'Transfer', icon: CreditCard },
                                ]}
                                className="sm:w-40"
                            />
                            <button className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center justify-center gap-1">
                                View All
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <ErrorBoundary onRetry={refreshData}>
                        <Card padding="none" className="border-none shadow-xl ring-1 ring-secondary-200/50 dark:ring-secondary-800 overflow-hidden bg-white dark:bg-secondary-900">
                            {isLoading ? (
                                <div className="p-6 space-y-4">
                                    <Skeleton variant="text" className="h-8 w-full" />
                                    <Skeleton variant="text" className="h-12 w-full" />
                                    <Skeleton variant="text" className="h-12 w-full" />
                                </div>
                            ) : sales.length === 0 ? (
                                <div className="p-12 text-center">
                                    <p className="text-secondary-400 font-bold">No sales recorded yet.</p>
                                </div>
                            ) : (
                                <DataTable
                                    data={recentSalesFormatted}
                                    columns={salesColumns}
                                    showPagination={true}
                                    pageSize={5}
                                    renderMobileCard={(item) => (
                                        <div className="space-y-4 p-5 hover:bg-secondary-50/30 dark:hover:bg-secondary-800/30 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-secondary-900 dark:text-secondary-50 truncate text-base">{item.product}</p>
                                                    <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest mt-1">{item.date}</p>
                                                </div>
                                                <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400 ml-2 flex-shrink-0 uppercase tracking-wider">
                                                    {item.status}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center pt-4 border-t border-secondary-100/50 dark:border-secondary-800/50">
                                                <span className="text-[10px] font-bold text-primary-500 uppercase tracking-[0.2em]">{item.id}</span>
                                                <span className="text-lg font-black text-secondary-900 dark:text-secondary-50">{item.amount}</span>
                                            </div>
                                        </div>
                                    )}
                                />
                            )}
                        </Card>
                    </ErrorBoundary>
                </div >
            </div >

            {/* Sale Details Modal */}
            < Modal
                isOpen={isSaleDetailsOpen}
                onClose={() => {
                    setIsSaleDetailsOpen(false);
                    setSelectedSale(null);
                }}
                title="Sale Details"
                size="md"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsSaleDetailsOpen(false)}>Close</Button>
                        {
                            selectedSale && (
                                <>
                                    <Button variant="secondary" onClick={() => handlePrintReceipt(selectedSale.id)}>
                                        <Printer className="w-4 h-4 mr-2" />
                                        Print Receipt
                                    </Button>
                                    {user?.role === 'Admin' && (
                                        <Button variant="danger" onClick={() => {
                                            handleVoidSale(selectedSale.id);
                                            setIsSaleDetailsOpen(false);
                                        }}>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Void Sale
                                        </Button>
                                    )}
                                </>
                            )
                        }
                    </>
                }
            >
                {selectedSale && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 p-4 bg-secondary-50 dark:bg-secondary-800 rounded-xl">
                            <div>
                                <p className="text-xs font-bold text-secondary-400 uppercase tracking-wider">Order ID</p>
                                <p className="text-sm font-black text-secondary-900 dark:text-secondary-50 mt-1">{selectedSale.id}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-secondary-400 uppercase tracking-wider">Date & Time</p>
                                <p className="text-sm font-black text-secondary-900 dark:text-secondary-50 mt-1">
                                    {format(new Date(selectedSale.timestamp), 'MMM dd, yyyy HH:mm')}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-secondary-400 uppercase tracking-wider">Payment Method</p>
                                <p className="text-sm font-black text-secondary-900 dark:text-secondary-50 mt-1">{selectedSale.paymentMethod}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-secondary-400 uppercase tracking-wider">Total Amount</p>
                                <p className="text-lg font-black text-primary-600 mt-1">{currency}{selectedSale.total.toFixed(2)}</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-black text-secondary-900 dark:text-secondary-50 uppercase tracking-wider mb-3">Items</h3>
                            <div className="space-y-2">
                                {selectedSale.items.map((item: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-secondary-900 rounded-lg ring-1 ring-secondary-100 dark:ring-secondary-800">
                                        <div className="flex-1">
                                            <p className="font-black text-secondary-900 dark:text-secondary-50">{item.name}</p>
                                            <p className="text-xs text-secondary-400 mt-0.5">
                                                {currency}{item.price.toFixed(2)} × {item.quantity}
                                            </p>
                                        </div>
                                        <p className="font-black text-secondary-900 dark:text-secondary-50">
                                            {currency}{(item.price * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t-2 border-secondary-200 dark:border-secondary-800">
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-black text-secondary-900 dark:text-secondary-50 uppercase tracking-wider">Total</span>
                                <span className="text-2xl font-black text-primary-600">{currency}{selectedSale.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </Modal >

            {/* Restock Modal */}
            < Modal
                isOpen={restockModalOpen}
                onClose={() => {
                    setRestockModalOpen(false);
                    setProductToRestock(null);
                }}
                title="Quick Restock"
                size="sm"
                footer={
                    <div className="flex items-center gap-3 w-full justify-end">
                        <Button variant="ghost" onClick={() => setRestockModalOpen(false)} className="rounded-xl">Cancel</Button>
                        <Button onClick={handleConfirmRestock} className="rounded-xl px-8 shadow-lg shadow-primary-600/20">
                            Confirm Restock
                        </Button>
                    </div>
                }
            >
                {productToRestock && (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-secondary-900 dark:text-secondary-50">
                                Restocking <span className="font-black">{productToRestock.name}</span>
                            </p>
                            <p className="text-xs text-secondary-500 dark:text-secondary-400">Current Stock: {productToRestock.stock}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-secondary-500 uppercase tracking-wider mb-1.5 block">
                                Quantity to Add
                            </label>
                            <Input
                                type="number"
                                value={restockQuantity}
                                onChange={(e) => setRestockQuantity(e.target.value)}
                                min="1"
                                autoFocus
                            />
                        </div>
                    </div>
                )}
            </Modal >

            <ConfirmDialog
                isOpen={isConfirmVoidOpen}
                onClose={() => {
                    setIsConfirmVoidOpen(false);
                    setSaleToVoid(null);
                }}
                onConfirm={confirmVoidSale}
                title="Void Sale"
                message="Are you sure you want to void this sale? Stock will be restored and this action cannot be undone."
                confirmText="Void Sale"
                variant="danger"
                isLoading={isVoiding}
            />
        </div >
    );
};





