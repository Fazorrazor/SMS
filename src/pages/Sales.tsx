import { useMemo, useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import {
    BarChart3,
    Calendar,
    Download,
    History,
    Package,
    FileText,
    Search,
    Banknote,
    CreditCard,
    ChevronRight,
    ArrowUpRight,
    Coins,
    TrendingUp,
    AlertCircle,
    Filter,
    Printer,
    Trash2,
    Trophy,
    Target,
    PieChart as PieChartIcon,
    Boxes,
    BarChart as BarChartIcon
} from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Dropdown } from '../components/ui/Dropdown';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import {
    format,
    subDays,
    startOfDay,
    endOfDay,
    isWithinInterval,
    startOfYesterday,
    endOfYesterday,
    isSameDay
} from 'date-fns';

type DateRangeType = 'today' | 'yesterday' | '7days' | '30days' | 'all';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const CustomTooltip = ({ active, payload, label, currency }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-secondary-900 p-4 rounded-2xl shadow-2xl ring-1 ring-secondary-100 dark:ring-secondary-800 animate-in zoom-in-95 duration-200">
                {label && <p className="text-[10px] font-black text-secondary-400 dark:text-secondary-500 uppercase tracking-[0.2em] mb-3">{label}</p>}
                <div className="space-y-2">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-8">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.payload.fill || entry.color }} />
                                <span className="text-xs font-black text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">{entry.name}</span>
                            </div>
                            <span className="text-sm font-black text-secondary-900 dark:text-secondary-50">{currency}{entry.value.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export const Sales = () => {
    const { sales, products, voidSale, isLoading: isDataLoading } = useProducts();
    const { isAdmin } = useAuth();
    const [settings, setSettings] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'transactions' | 'items' | 'reports'>('transactions');
    const [selectedSale, setSelectedSale] = useState<any>(null);

    if (!isAdmin) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-secondary-900 dark:text-secondary-50">Access Denied</h2>
                <p className="text-secondary-500 dark:text-secondary-400 mt-2 max-w-md">You do not have permission to view this page. Please contact your administrator if you believe this is an error.</p>
            </div>
        );
    }
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState<DateRangeType>('7days');
    const [paymentFilter, setPaymentFilter] = useState<string>('all');
    const [isVoiding, setIsVoiding] = useState(false);
    const [isConfirmVoidOpen, setIsConfirmVoidOpen] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`/api/settings`);
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

    const handlePrintReceipt = (sale: any) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const receiptHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt - ${sale.id}</title>
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
                    ${sale.items.map((item: any) => `
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

    const currency = settings?.currencySymbol || 'GH₵';

    const filteredSalesByDate = useMemo(() => {
        const now = new Date();
        return sales.filter(sale => {
            const saleDate = new Date(sale.timestamp);

            if (dateRange === 'today') {
                return isSameDay(saleDate, now);
            } else if (dateRange === 'yesterday') {
                return isWithinInterval(saleDate, {
                    start: startOfYesterday(),
                    end: endOfYesterday()
                });
            } else if (dateRange === '7days') {
                return isWithinInterval(saleDate, {
                    start: startOfDay(subDays(now, 6)),
                    end: endOfDay(now)
                });
            } else if (dateRange === '30days') {
                return isWithinInterval(saleDate, {
                    start: startOfDay(subDays(now, 29)),
                    end: endOfDay(now)
                });
            }
            return true; // 'all'
        });
    }, [sales, dateRange]);

    const filteredSales = useMemo(() => {
        return filteredSalesByDate.filter(sale => {
            const matchesSearch = sale.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sale.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesPayment = paymentFilter === 'all' || sale.paymentMethod === paymentFilter;
            return matchesSearch && matchesPayment;
        });
    }, [filteredSalesByDate, searchQuery, paymentFilter]);

    const itemizedSalesByDay = useMemo(() => {
        const groups: Record<string, { date: Date, items: any[], totalRevenue: number, totalProfit: number }> = {};

        filteredSales.forEach(sale => {
            const dateKey = format(new Date(sale.timestamp), 'yyyy-MM-dd');
            if (!groups[dateKey]) {
                groups[dateKey] = {
                    date: new Date(sale.timestamp),
                    items: [],
                    totalRevenue: 0,
                    totalProfit: 0
                };
            }

            sale.items.forEach((item: any) => {
                const revenue = item.quantity * item.price;
                const cost = item.quantity * (item.costPrice || 0);
                const profit = revenue - cost;

                groups[dateKey].items.push({
                    ...item,
                    saleId: sale.id,
                    timestamp: sale.timestamp,
                    revenue,
                    profit
                });

                groups[dateKey].totalRevenue += revenue;
                groups[dateKey].totalProfit += profit;
            });
        });

        return Object.values(groups).sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [filteredSales]);

    const chartData = useMemo(() => {
        // Determine how many days to show based on dateRange
        let daysToShow = 7;
        if (dateRange === '30days') daysToShow = 30;
        else if (dateRange === 'all') daysToShow = 30; // Default to 30 for 'all' to avoid clutter
        else if (dateRange === 'today' || dateRange === 'yesterday') daysToShow = 1;

        const dateList = [...Array(daysToShow)].map((_, i) => {
            const date = new Date();
            if (dateRange === 'yesterday') date.setDate(date.getDate() - 1);
            else date.setDate(date.getDate() - i);
            return format(date, 'yyyy-MM-dd');
        }).reverse();

        return dateList.map(dateStr => {
            const daySales = sales.filter(s => format(new Date(s.timestamp), 'yyyy-MM-dd') === dateStr);
            const revenue = daySales.reduce((sum, s) => sum + s.total, 0);
            const cost = daySales.reduce((sum, s) => {
                return sum + s.items.reduce((iSum, item) => iSum + (item.quantity * (item.costPrice || 0)), 0);
            }, 0);
            return {
                name: format(new Date(dateStr), 'MM/dd'),
                revenue,
                profit: revenue - cost
            };
        });
    }, [sales, dateRange]);

    const productPerformance = useMemo(() => {
        const performance: { [key: string]: any } = {};
        filteredSalesByDate.forEach(sale => {
            sale.items.forEach(item => {
                if (!performance[item.productId]) {
                    performance[item.productId] = {
                        name: item.name,
                        quantity: 0,
                        revenue: 0,
                        profit: 0
                    };
                }
                performance[item.productId].quantity += item.quantity;
                performance[item.productId].revenue += item.quantity * item.price;
                performance[item.productId].profit += item.quantity * (item.price - (item.costPrice || 0));
            });
        });

        const sortedByQty = Object.values(performance).sort((a: any, b: any) => b.quantity - a.quantity).slice(0, 5);
        const sortedByRevenue = Object.values(performance).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 5);

        return { sortedByQty, sortedByRevenue };
    }, [filteredSalesByDate]);

    const categoryAnalysis = useMemo(() => {
        const categories: { [key: string]: number } = {};
        filteredSalesByDate.forEach(sale => {
            sale.items.forEach(item => {
                // Find product to get category
                const product = products.find(p => p.id === item.productId);
                const category = product?.category || 'Uncategorized';
                categories[category] = (categories[category] || 0) + (item.quantity * item.price);
            });
        });

        return Object.entries(categories).map(([name, value]) => ({ name, value }));
    }, [filteredSalesByDate, products]);

    const inventoryValuation = useMemo(() => {
        const totalCost = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);
        const totalRetail = products.reduce((sum, p) => sum + (p.stock * p.sellingPrice), 0);
        return {
            totalCost,
            totalRetail,
            potentialProfit: totalRetail - totalCost
        };
    }, [products]);

    const stats = useMemo(() => {
        const totalRevenue = filteredSalesByDate.reduce((sum, s) => sum + s.total, 0);
        const totalCost = filteredSalesByDate.reduce((sum, s) => {
            return sum + s.items.reduce((iSum, item) => iSum + (item.quantity * (item.costPrice || 0)), 0);
        }, 0);
        const totalProfit = totalRevenue - totalCost;
        const totalOrders = filteredSalesByDate.length;

        return [
            { label: 'Total Revenue', value: `${currency}${totalRevenue.toLocaleString()}`, icon: BarChart3, color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/20' },
            { label: 'Total Profit', value: `${currency}${totalProfit.toLocaleString()}`, icon: Coins, color: 'text-success-600 dark:text-success-400', bg: 'bg-success-50 dark:bg-success-900/20' },
            { label: 'Total Orders', value: totalOrders.toString(), icon: ArrowUpRight, color: 'text-warning-600 dark:text-warning-400', bg: 'bg-warning-50 dark:bg-warning-900/20' },
        ];
    }, [filteredSalesByDate, currency]);

    const dailyReports = useMemo(() => {
        const groups: { [key: string]: any } = {};
        filteredSalesByDate.forEach(sale => {
            const date = format(new Date(sale.timestamp), 'yyyy-MM-dd');
            if (!groups[date]) {
                groups[date] = {
                    date,
                    revenue: 0,
                    cost: 0,
                    items: 0,
                    orders: 0,
                    cash: 0,
                    card: 0,
                    transfer: 0
                };
            }
            groups[date].revenue += sale.total;
            groups[date].cost += sale.items.reduce((sum, item) => sum + (item.quantity * (item.costPrice || 0)), 0);
            groups[date].orders += 1;
            groups[date].items += sale.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
            if (sale.paymentMethod === 'Cash') groups[date].cash += sale.total;
            else if (sale.paymentMethod === 'Card') groups[date].card += sale.total;
            else groups[date].transfer += sale.total;
        });
        return Object.values(groups).map((g: any) => ({
            ...g,
            profit: g.revenue - g.cost
        })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [filteredSalesByDate]);

    const dateRangeLabels: Record<DateRangeType, string> = {
        today: 'Today',
        yesterday: 'Yesterday',
        '7days': 'Last 7 Days',
        '30days': 'Last 30 Days',
        all: 'All Time'
    };

    const handleExport = () => {
        const headers = [
            'Order ID',
            'Date',
            'Time',
            'Payment Method',
            'Product Name',
            'Category',
            'SKU',
            'Quantity',
            'Unit Price',
            'Cost Price',
            'Item Total',
            'Item Profit'
        ];

        const csvData = filteredSales.flatMap(sale => {
            return sale.items.map((item: any) => {
                const product = products.find(p => p.id === item.productId);
                const category = product?.category || 'Uncategorized';
                const sku = product?.sku || 'N/A';
                const costPrice = item.costPrice || 0;
                const itemTotal = item.quantity * item.price;
                const itemProfit = item.quantity * (item.price - costPrice);

                return [
                    sale.id,
                    format(new Date(sale.timestamp), 'yyyy-MM-dd'),
                    format(new Date(sale.timestamp), 'hh:mm a'),
                    sale.paymentMethod,
                    `"${item.name.replace(/"/g, '""')}"`, // Escape quotes
                    `"${category.replace(/"/g, '""')}"`,
                    sku,
                    item.quantity,
                    item.price.toFixed(2),
                    costPrice.toFixed(2),
                    itemTotal.toFixed(2),
                    itemProfit.toFixed(2)
                ];
            });
        });

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `sales-report-detailed-${dateRange}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleVoidSale = async () => {
        if (!selectedSale) return;
        setIsConfirmVoidOpen(true);
    };

    const confirmVoidSale = async () => {
        if (!selectedSale) return;
        setIsVoiding(true);
        await voidSale(selectedSale.id);
        setIsVoiding(false);
        setSelectedSale(null);
        setIsConfirmVoidOpen(false);
    };

    if (isDataLoading || !settings) {
        return (
            <div className="space-y-8 animate-in fade-in duration-500 pb-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="h-10 w-48 bg-secondary-100 animate-pulse rounded-xl" />
                        <div className="h-4 w-64 bg-secondary-50 animate-pulse rounded-lg" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 h-[400px] bg-secondary-50 animate-pulse rounded-[2rem]" />
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-secondary-50 animate-pulse rounded-[2rem]" />
                        ))}
                    </div>
                </div>
                <div className="h-96 bg-secondary-50 animate-pulse rounded-[2rem]" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-secondary-900 dark:text-secondary-50 tracking-tight">Sales & Analytics</h1>
                    <p className="text-sm font-bold text-secondary-400 uppercase tracking-widest mt-1">Detailed Reports</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Dropdown
                        value={dateRange}
                        onChange={(val) => setDateRange(val as DateRangeType)}
                        options={(Object.keys(dateRangeLabels) as DateRangeType[]).map(range => ({
                            label: dateRangeLabels[range],
                            value: range,
                            icon: Calendar
                        }))}
                        className="sm:w-48"
                    />
                    <button
                        onClick={handleExport}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 rounded-xl font-bold text-white shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export CSV</span>
                    </button>
                </div>
            </header>

            {/* Stats & Chart Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card padding="md" className="border-none shadow-sm ring-1 ring-secondary-200/50 dark:ring-secondary-800 h-[400px] flex flex-col bg-white dark:bg-secondary-900">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                <h3 className="font-black text-secondary-900 dark:text-secondary-50">Performance Trend</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-primary-500" />
                                    <span className="text-[10px] font-black text-secondary-400 dark:text-secondary-500 uppercase tracking-widest">Revenue</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-success-500" />
                                    <span className="text-[10px] font-black text-secondary-400 dark:text-secondary-500 uppercase tracking-widest">Profit</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-secondary-100 dark:text-secondary-800" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                                        tickFormatter={(value) => `${currency}${value}`}
                                    />
                                    <Tooltip content={<CustomTooltip currency={currency} />} />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#0ea5e9"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorRev)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="profit"
                                        stroke="#10b981"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorProfit)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    {stats.map((stat, i) => (
                        <Card key={i} padding="md" className="border-none shadow-sm ring-1 ring-secondary-200/50 dark:ring-secondary-800 bg-white dark:bg-secondary-900">
                            <div className="flex items-center gap-4">
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg)}>
                                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-secondary-400 dark:text-secondary-500 uppercase tracking-wider">{stat.label}</p>
                                    <p className="text-2xl font-black text-secondary-900 dark:text-secondary-50 mt-0.5">{stat.value}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div >

            {/* Tabs */}
            {/* Tabs */}
            <div className="w-full overflow-x-auto pb-2 -mb-2">
                <div className="flex items-center gap-1 p-1 bg-secondary-100 dark:bg-secondary-800 rounded-2xl w-max min-w-fit">
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={cn(
                            "flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-xl font-black text-sm transition-all whitespace-nowrap",
                            activeTab === 'transactions'
                                ? "bg-white dark:bg-secondary-900 text-primary-600 dark:text-primary-400 shadow-sm"
                                : "text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-200"
                        )}
                    >
                        <History className="w-4 h-4" />
                        Transactions
                    </button>
                    <button
                        onClick={() => setActiveTab('items')}
                        className={cn(
                            "flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-xl font-black text-sm transition-all whitespace-nowrap",
                            activeTab === 'items'
                                ? "bg-white dark:bg-secondary-900 text-primary-600 dark:text-primary-400 shadow-sm"
                                : "text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-200"
                        )}
                    >
                        <Package className="w-4 h-4" />
                        Itemized
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={cn(
                            "flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-xl font-black text-sm transition-all whitespace-nowrap",
                            activeTab === 'reports'
                                ? "bg-white dark:bg-secondary-900 text-primary-600 dark:text-primary-400 shadow-sm"
                                : "text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-200"
                        )}
                    >
                        <FileText className="w-4 h-4" />
                        Reports & Analytics
                    </button>
                </div>
            </div>

            {/* Content Section */}
            {
                activeTab === 'transactions' ? (
                    <Card padding="none" className="border-none shadow-xl ring-1 ring-secondary-200/50 dark:ring-secondary-800 overflow-hidden bg-white dark:bg-secondary-900">
                        <div className="p-6 border-b border-secondary-100 dark:border-secondary-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <h2 className="text-xl font-black text-secondary-900 dark:text-secondary-50">Transaction History</h2>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1 lg:justify-end min-w-0">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                                    <input
                                        type="text"
                                        placeholder="Search sales..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2.5 bg-secondary-50 dark:bg-secondary-800 border-none ring-1 ring-secondary-200 dark:ring-secondary-700 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all outline-none text-sm w-full text-secondary-900 dark:text-secondary-50 placeholder:text-secondary-400"
                                    />
                                </div>
                                <Dropdown
                                    value={paymentFilter}
                                    onChange={setPaymentFilter}
                                    options={[
                                        { label: 'All Payments', value: 'all', icon: Filter },
                                        { label: 'Cash', value: 'Cash', icon: Banknote },
                                        { label: 'Card', value: 'Card', icon: CreditCard },
                                        { label: 'Transfer', value: 'Transfer', icon: CreditCard },
                                    ]}
                                    className="sm:w-48"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse hidden md:table">
                                <thead>
                                    <tr className="bg-secondary-50/50 dark:bg-secondary-800/50">
                                        <th className="px-6 py-4 text-xs font-black text-secondary-400 uppercase tracking-widest">Order ID</th>
                                        <th className="px-6 py-4 text-xs font-black text-secondary-400 uppercase tracking-widest">Date & Time</th>
                                        <th className="px-6 py-4 text-xs font-black text-secondary-400 uppercase tracking-widest">Items</th>
                                        <th className="px-6 py-4 text-xs font-black text-secondary-400 uppercase tracking-widest">Payment</th>
                                        <th className="px-6 py-4 text-xs font-black text-secondary-400 uppercase tracking-widest text-right">Total</th>
                                        <th className="px-6 py-4 text-xs font-black text-secondary-400 uppercase tracking-widest text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary-50 dark:divide-secondary-800">
                                    {filteredSales.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-20 text-center">
                                                <div className="w-16 h-16 bg-secondary-50 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <BarChart3 className="w-8 h-8 text-secondary-200 dark:text-secondary-700" />
                                                </div>
                                                <p className="text-secondary-400 dark:text-secondary-500 font-bold">No transactions found.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSales.map((sale) => (
                                            <tr key={sale.id} className="hover:bg-secondary-50/50 dark:hover:bg-secondary-800/50 transition-colors group">
                                                <td className="px-6 py-4 min-w-[100px]">
                                                    <span className="font-black text-secondary-900 dark:text-secondary-50">{sale.id}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-secondary-700 dark:text-secondary-300 text-sm">
                                                            {format(new Date(sale.timestamp), 'MMM dd, yyyy')}
                                                        </span>
                                                        <span className="text-secondary-400 dark:text-secondary-500 text-xs">
                                                            {format(new Date(sale.timestamp), 'hh:mm a')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 min-w-[200px] max-w-[300px]">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-bold text-secondary-900 dark:text-secondary-50 text-sm line-clamp-1">
                                                            {sale.items.map((i: any) => i.name).join(', ')}
                                                        </span>
                                                        <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">
                                                            {sale.items.reduce((sum: number, item: any) => sum + item.quantity, 0)} Items
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {sale.paymentMethod === 'Cash' ? (
                                                            <Banknote className="w-4 h-4 text-success-500" />
                                                        ) : (
                                                            <CreditCard className="w-4 h-4 text-primary-500" />
                                                        )}
                                                        <span className="font-bold text-secondary-700 dark:text-secondary-300 text-sm">{sale.paymentMethod}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-black text-secondary-900 dark:text-secondary-50">{currency}{sale.total.toFixed(2)}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => setSelectedSale(sale)}
                                                        className="p-2 hover:bg-white dark:hover:bg-secondary-800 hover:shadow-md hover:ring-1 hover:ring-secondary-200 dark:hover:ring-secondary-700 rounded-xl transition-all text-secondary-400 hover:text-primary-600"
                                                    >
                                                        <ChevronRight className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>

                            {/* Mobile View for Transactions */}
                            <div className="md:hidden divide-y divide-secondary-50 dark:divide-secondary-800">
                                {filteredSales.length === 0 ? (
                                    <div className="px-6 py-20 text-center">
                                        <p className="text-secondary-400 font-bold">No transactions found.</p>
                                    </div>
                                ) : (
                                    filteredSales.map((sale) => (
                                        <div
                                            key={sale.id}
                                            className="p-5 active:bg-secondary-50 dark:active:bg-secondary-800 transition-colors"
                                            onClick={() => setSelectedSale(sale)}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-black text-secondary-900 dark:text-secondary-50 truncate flex-1 mr-4">
                                                    {sale.items.map((i: any) => i.name).join(', ')}
                                                </span>
                                                <span className="font-black text-primary-600 dark:text-primary-400 flex-shrink-0">{currency}{sale.total.toFixed(2)}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs font-bold text-secondary-400">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-primary-600 dark:text-primary-400 font-black uppercase tracking-widest mb-1">{sale.id}</span>
                                                    <span>{format(new Date(sale.timestamp), 'MMM dd, yyyy')}</span>
                                                    <span>{format(new Date(sale.timestamp), 'hh:mm a')}</span>
                                                </div>
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <span className="px-2 py-0.5 bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 rounded-md">
                                                        {sale.items.reduce((sum: number, item: any) => sum + item.quantity, 0)} Items
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        {sale.paymentMethod === 'Cash' ? <Banknote className="w-3 h-3 text-success-500" /> : <CreditCard className="w-3 h-3 text-primary-500" />}
                                                        <span className="dark:text-secondary-300">{sale.paymentMethod}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </Card>
                ) : activeTab === 'items' ? (
                    <div className="space-y-8">
                        {itemizedSalesByDay.length === 0 ? (
                            <Card className="p-20 text-center border-none shadow-xl ring-1 ring-secondary-200/50 dark:ring-secondary-800 bg-white dark:bg-secondary-900">
                                <div className="w-16 h-16 bg-secondary-50 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Package className="w-8 h-8 text-secondary-200 dark:text-secondary-700" />
                                </div>
                                <p className="text-secondary-400 dark:text-secondary-500 font-bold">No items sold in this period.</p>
                            </Card>
                        ) : (
                            itemizedSalesByDay.map((group) => (
                                <div key={format(group.date, 'yyyy-MM-dd')} className="space-y-4">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-secondary-900 dark:text-secondary-50 text-lg">
                                                    {isSameDay(group.date, new Date()) ? 'Today' : format(group.date, 'EEEE, MMM dd, yyyy')}
                                                </h3>
                                                <p className="text-xs font-bold text-secondary-400 uppercase tracking-widest">Daily Summary</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4 md:gap-6 bg-secondary-50 dark:bg-secondary-800/50 p-3 rounded-2xl md:bg-transparent md:p-0">
                                            <div className="flex-1 md:text-right">
                                                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Total Revenue</p>
                                                <p className="text-lg md:text-xl font-black text-primary-600">{currency}{group.totalRevenue.toFixed(2)}</p>
                                            </div>
                                            <div className="w-px h-8 bg-secondary-200 dark:bg-secondary-700 md:hidden" />
                                            <div className="flex-1 text-right">
                                                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Total Profit</p>
                                                <p className="text-lg md:text-xl font-black text-success-600">{currency}{group.totalProfit.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <Card padding="none" className="border-none shadow-xl ring-1 ring-secondary-200/50 dark:ring-secondary-800 overflow-hidden bg-white dark:bg-secondary-900">
                                        {/* Desktop Table */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-secondary-50/50 dark:bg-secondary-800/50 border-b border-secondary-100 dark:border-secondary-800">
                                                        <th className="px-6 py-4 text-xs font-black text-secondary-400 uppercase tracking-widest">Item Name</th>
                                                        <th className="px-6 py-4 text-xs font-black text-secondary-400 uppercase tracking-widest">Time</th>
                                                        <th className="px-6 py-4 text-xs font-black text-secondary-400 uppercase tracking-widest">Qty</th>
                                                        <th className="px-6 py-4 text-xs font-black text-secondary-400 uppercase tracking-widest">Unit Price</th>
                                                        <th className="px-6 py-4 text-xs font-black text-secondary-400 uppercase tracking-widest text-right">Total</th>
                                                        <th className="px-6 py-4 text-xs font-black text-secondary-400 uppercase tracking-widest text-right">Profit</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-secondary-50 dark:divide-secondary-800">
                                                    {group.items.map((item, idx) => (
                                                        <tr key={`${item.saleId}-${idx}`} className="hover:bg-secondary-50/50 dark:hover:bg-secondary-800/50 transition-colors">
                                                            <td className="px-6 py-4 min-w-[150px]">
                                                                <p className="font-bold text-secondary-900 dark:text-secondary-50 truncate max-w-[250px]">{item.name}</p>
                                                                <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-tighter">{item.saleId}</p>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-medium text-secondary-500">
                                                                {format(new Date(item.timestamp), 'hh:mm a')}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="px-2 py-1 bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 text-xs font-black rounded-lg">
                                                                    {item.quantity}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-bold text-secondary-600">
                                                                {currency}{item.price.toFixed(2)}
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <span className="font-black text-secondary-900 dark:text-secondary-50">{currency}{item.revenue.toFixed(2)}</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <span className="font-black text-success-600">{currency}{item.profit.toFixed(2)}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Mobile List View */}
                                        <div className="md:hidden divide-y divide-secondary-50 dark:divide-secondary-800">
                                            {group.items.map((item, idx) => (
                                                <div key={`${item.saleId}-${idx}`} className="p-4 space-y-3">
                                                    <div className="flex justify-between items-start">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-black text-secondary-900 dark:text-secondary-50 truncate">{item.name}</p>
                                                            <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-tighter">{item.saleId}</p>
                                                        </div>
                                                        <div className="text-right ml-4">
                                                            <p className="font-black text-secondary-900 dark:text-secondary-50">{currency}{item.revenue.toFixed(2)}</p>
                                                            <p className="text-[10px] font-black text-success-600 uppercase">+{currency}{item.profit.toFixed(2)} Profit</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-3">
                                                            <span className="px-2 py-0.5 bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 font-black rounded-md">
                                                                {item.quantity} Units
                                                            </span>
                                                            <span className="text-secondary-400 font-bold">
                                                                {currency}{item.price.toFixed(2)} / unit
                                                            </span>
                                                        </div>
                                                        <span className="text-secondary-400 font-bold">
                                                            {format(new Date(item.timestamp), 'hh:mm a')}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Inventory Valuation Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card padding="md" className="border-none shadow-sm ring-1 ring-secondary-200/50 dark:ring-secondary-800 bg-white dark:bg-secondary-900">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-secondary-50 dark:bg-secondary-800 flex items-center justify-center text-secondary-400 dark:text-secondary-500">
                                        <Boxes className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-black text-secondary-900 dark:text-secondary-50">Stock Cost Value</h3>
                                </div>
                                <p className="text-3xl font-black text-secondary-900 dark:text-secondary-50">{currency}{inventoryValuation.totalCost.toLocaleString()}</p>
                                <p className="text-xs font-bold text-secondary-400 dark:text-secondary-500 mt-1 uppercase tracking-wider">Total investment in stock</p>
                            </Card>
                            <Card padding="md" className="border-none shadow-sm ring-1 ring-secondary-200/50 dark:ring-secondary-800 bg-white dark:bg-secondary-900">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-400">
                                        <BarChartIcon className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-black text-secondary-900 dark:text-secondary-50">Stock Retail Value</h3>
                                </div>
                                <p className="text-3xl font-black text-primary-600 dark:text-primary-400">{currency}{inventoryValuation.totalRetail.toLocaleString()}</p>
                                <p className="text-xs font-bold text-secondary-400 dark:text-secondary-500 mt-1 uppercase tracking-wider">Expected revenue from stock</p>
                            </Card>
                            <Card padding="md" className="border-none shadow-sm ring-1 ring-secondary-200/50 dark:ring-secondary-800 bg-white dark:bg-secondary-900">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-success-50 dark:bg-success-900/20 flex items-center justify-center text-success-400">
                                        <Coins className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-black text-secondary-900 dark:text-secondary-50">Potential Profit</h3>
                                </div>
                                <p className="text-3xl font-black text-success-600 dark:text-success-400">{currency}{inventoryValuation.potentialProfit.toLocaleString()}</p>
                                <p className="text-xs font-bold text-secondary-400 dark:text-secondary-500 mt-1 uppercase tracking-wider">Estimated profit if all sold</p>
                            </Card>
                        </div>

                        {/* Top Products & Category Analysis Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Category Analysis */}
                            <Card padding="md" className="border-none shadow-sm ring-1 ring-secondary-200/50 dark:ring-secondary-800 lg:col-span-1 bg-white dark:bg-secondary-900">
                                <div className="flex items-center gap-2 mb-6">
                                    <PieChartIcon className="w-5 h-5 text-primary-500" />
                                    <h3 className="font-black text-secondary-900 dark:text-secondary-50">Revenue by Category</h3>
                                </div>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={categoryAnalysis}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {categoryAnalysis.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip currency={currency} />} />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            {/* Top by Quantity */}
                            <Card padding="md" className="border-none shadow-sm ring-1 ring-secondary-200/50 dark:ring-secondary-800 lg:col-span-1 bg-white dark:bg-secondary-900">
                                <div className="flex items-center gap-2 mb-6">
                                    <Trophy className="w-5 h-5 text-warning-500" />
                                    <h3 className="font-black text-secondary-900 dark:text-secondary-50">Top by Quantity</h3>
                                </div>
                                <div className="space-y-4">
                                    {productPerformance.sortedByQty.length === 0 ? (
                                        <p className="text-center py-8 text-secondary-400 font-bold">No data available.</p>
                                    ) : (
                                        productPerformance.sortedByQty.map((item: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-secondary-50/50 dark:bg-secondary-800/50 ring-1 ring-secondary-100 dark:ring-secondary-800">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-secondary-900 shadow-sm flex items-center justify-center font-black text-secondary-400 dark:text-secondary-500 text-xs">
                                                        #{i + 1}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-black text-secondary-900 dark:text-secondary-50 text-sm truncate">{item.name}</p>
                                                        <p className="text-xs font-bold text-secondary-400 dark:text-secondary-500">{item.quantity} units sold</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>

                            {/* Top by Revenue */}
                            <Card padding="md" className="border-none shadow-sm ring-1 ring-secondary-200/50 dark:ring-secondary-800 lg:col-span-1 bg-white dark:bg-secondary-900">
                                <div className="flex items-center gap-2 mb-6">
                                    <Target className="w-5 h-5 text-primary-500" />
                                    <h3 className="font-black text-secondary-900 dark:text-secondary-50">Top by Revenue</h3>
                                </div>
                                <div className="space-y-4">
                                    {productPerformance.sortedByRevenue.length === 0 ? (
                                        <p className="text-center py-8 text-secondary-400 font-bold">No data available.</p>
                                    ) : (
                                        productPerformance.sortedByRevenue.map((item: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-secondary-50/50 dark:bg-secondary-800/50 ring-1 ring-secondary-100 dark:ring-secondary-800">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-secondary-900 shadow-sm flex items-center justify-center font-black text-secondary-400 dark:text-secondary-500 text-xs">
                                                        #{i + 1}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-black text-secondary-900 dark:text-secondary-50 text-sm truncate">{item.name}</p>
                                                        <p className="text-xs font-bold text-success-600 dark:text-success-400">{currency}{item.revenue.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Daily Summary Table */}
                        <Card padding="none" className="border-none shadow-xl ring-1 ring-secondary-200/50 dark:ring-secondary-800 overflow-hidden bg-white dark:bg-secondary-900">
                            <div className="p-6 border-b border-secondary-100 dark:border-secondary-800">
                                <h2 className="text-xl font-black text-secondary-900 dark:text-secondary-50">Daily Sales Summary</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse hidden md:table">
                                    <thead>
                                        <tr className="bg-secondary-50/50 dark:bg-secondary-800/50">
                                            <th className="px-6 py-4 text-xs font-black text-secondary-400 uppercase tracking-widest">Date</th>
                                            <th className="px-6 py-4 text-xs font-black text-secondary-400 uppercase tracking-widest">Orders</th>
                                            <th className="px-6 py-4 text-xs font-black text-secondary-400 uppercase tracking-widest">Items Sold</th>
                                            <th className="px-6 py-4 text-xs font-black text-secondary-400 uppercase tracking-widest">Revenue</th>
                                            <th className="px-6 py-4 text-xs font-black text-secondary-400 uppercase tracking-widest text-right">Profit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-secondary-50 dark:divide-secondary-800">
                                        {dailyReports.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-20 text-center">
                                                    <p className="text-secondary-400 font-bold">No data available for reports.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            dailyReports.map((report: any) => (
                                                <tr key={report.date} className="hover:bg-secondary-50/50 dark:hover:bg-secondary-800/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <span className="font-black text-secondary-900 dark:text-secondary-50">
                                                            {format(new Date(report.date), 'MMM dd, yyyy')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-bold text-secondary-700 dark:text-secondary-300">{report.orders}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2.5 py-1 bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 text-xs font-black rounded-lg">
                                                            {report.items} Items
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-bold text-secondary-900 dark:text-secondary-50">{currency}{report.revenue.toFixed(2)}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className={cn(
                                                                "font-black text-lg",
                                                                report.profit >= 0 ? "text-success-600 dark:text-success-400" : "text-danger-600 dark:text-danger-400"
                                                            )}>
                                                                {currency}{report.profit.toFixed(2)}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-secondary-400 dark:text-secondary-500 uppercase">
                                                                {((report.profit / report.revenue) * 100).toFixed(1)}% Margin
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>

                                {/* Mobile View for Daily Summary */}
                                <div className="md:hidden divide-y divide-secondary-50 dark:divide-secondary-800">
                                    {dailyReports.length === 0 ? (
                                        <div className="px-6 py-20 text-center">
                                            <p className="text-secondary-400 font-bold">No data available.</p>
                                        </div>
                                    ) : (
                                        dailyReports.map((report: any) => (
                                            <div key={report.date} className="p-5">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="font-black text-secondary-900 dark:text-secondary-50">
                                                        {format(new Date(report.date), 'MMM dd, yyyy')}
                                                    </span>
                                                    <div className="text-right">
                                                        <p className={cn(
                                                            "font-black text-base",
                                                            report.profit >= 0 ? "text-success-600 dark:text-success-400" : "text-danger-600 dark:text-danger-400"
                                                        )}>
                                                            {currency}{report.profit.toFixed(2)}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-secondary-400 dark:text-secondary-500 uppercase">Profit</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4 text-center">
                                                    <div className="p-2 rounded-xl bg-secondary-50 dark:bg-secondary-800">
                                                        <p className="text-[10px] font-black text-secondary-400 dark:text-secondary-500 uppercase mb-1">Orders</p>
                                                        <p className="font-bold text-secondary-700 dark:text-secondary-300 text-sm">{report.orders}</p>
                                                    </div>
                                                    <div className="p-2 rounded-xl bg-secondary-50 dark:bg-secondary-800">
                                                        <p className="text-[10px] font-black text-secondary-400 dark:text-secondary-500 uppercase mb-1">Items</p>
                                                        <p className="font-bold text-secondary-700 dark:text-secondary-300 text-sm">{report.items}</p>
                                                    </div>
                                                    <div className="p-2 rounded-xl bg-secondary-50 dark:bg-secondary-800">
                                                        <p className="text-[10px] font-black text-secondary-400 dark:text-secondary-500 uppercase mb-1">Revenue</p>
                                                        <p className="font-bold text-secondary-900 dark:text-secondary-50 text-sm">{currency}{Math.round(report.revenue)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                )
            }

            {/* Sale Details Modal */}
            <Modal
                isOpen={!!selectedSale}
                onClose={() => setSelectedSale(null)}
                title={
                    <div className="flex items-center justify-between w-full pr-8">
                        <div>
                            <h3 className="text-xl font-black text-secondary-900 dark:text-secondary-50 tracking-tight">Sale Details</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="px-1.5 py-0.5 bg-secondary-100 dark:bg-secondary-800 text-secondary-500 dark:text-secondary-400 text-[9px] font-black rounded-md uppercase tracking-wider">Order ID</span>
                                <p className="text-xs font-bold text-primary-600 dark:text-primary-400">{selectedSale?.id}</p>
                            </div>
                        </div>
                    </div>
                }
                size="md"
                footer={
                    <div className="grid grid-cols-3 gap-2 w-full">
                        <button
                            onClick={() => handlePrintReceipt(selectedSale)}
                            className="py-2.5 bg-white dark:bg-secondary-900 ring-1 ring-secondary-200 dark:ring-secondary-800 rounded-xl font-black text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all flex flex-col items-center justify-center gap-1 shadow-sm text-[10px] uppercase tracking-wider"
                        >
                            <Printer className="w-4 h-4" />
                            Print
                        </button>
                        <button
                            onClick={handleVoidSale}
                            disabled={isVoiding}
                            className="py-2.5 bg-white dark:bg-secondary-900 ring-1 ring-danger-200 dark:ring-danger-900/50 rounded-xl font-black text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-all flex flex-col items-center justify-center gap-1 shadow-sm disabled:opacity-50 text-[10px] uppercase tracking-wider"
                        >
                            <Trash2 className="w-4 h-4" />
                            {isVoiding ? 'Voiding...' : 'Void'}
                        </button>
                        <button
                            onClick={() => setSelectedSale(null)}
                            className="py-2.5 bg-secondary-900 rounded-xl font-black text-white hover:bg-secondary-800 transition-all shadow-lg shadow-secondary-900/20 text-[10px] uppercase tracking-wider flex flex-col items-center justify-center gap-1"
                        >
                            <div className="w-4 h-4 flex items-center justify-center">✕</div>
                            Close
                        </button>
                    </div>
                }
            >
                {selectedSale && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-2xl bg-secondary-50 dark:bg-secondary-800 ring-1 ring-secondary-100/50 dark:ring-secondary-700">
                                <p className="text-[9px] font-black text-secondary-400 dark:text-secondary-500 uppercase tracking-wider mb-1">Date & Time</p>
                                <p className="font-black text-secondary-900 dark:text-secondary-50 text-sm">
                                    {format(new Date(selectedSale.timestamp), 'MMM dd, yyyy')}
                                    <span className="text-secondary-400 dark:text-secondary-500 ml-1.5 font-bold text-[10px]">{format(new Date(selectedSale.timestamp), 'hh:mm a')}</span>
                                </p>
                            </div>
                            <div className="p-3 rounded-2xl bg-secondary-50 dark:bg-secondary-800 ring-1 ring-secondary-100/50 dark:ring-secondary-700">
                                <p className="text-[9px] font-black text-secondary-400 dark:text-secondary-500 uppercase tracking-wider mb-1">Payment</p>
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "w-6 h-6 rounded-lg flex items-center justify-center",
                                        selectedSale.paymentMethod === 'Cash' ? "bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400" : "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                                    )}>
                                        {selectedSale.paymentMethod === 'Cash' ? <Banknote className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                                    </div>
                                    <p className="font-black text-secondary-900 dark:text-secondary-50 text-sm">{selectedSale.paymentMethod}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-black text-secondary-900 dark:text-secondary-50 text-sm flex items-center gap-2">
                                    <Package className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                    Items Purchased
                                </h4>
                                <span className="px-2 py-0.5 bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 text-[9px] font-black rounded-full uppercase tracking-wider">
                                    {selectedSale.items.reduce((sum: number, item: any) => sum + item.quantity, 0)} Units
                                </span>
                            </div>
                            <div className="space-y-2">
                                {selectedSale.items.map((item: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl ring-1 ring-secondary-100 dark:ring-secondary-800 hover:bg-secondary-50/50 dark:hover:bg-secondary-800/50 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-sm">
                                                {item.quantity}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black text-secondary-900 dark:text-secondary-50 text-sm truncate">{item.name}</p>
                                                <p className="text-[10px] font-bold text-secondary-400 dark:text-secondary-500 mt-0.5">{currency}{item.price.toFixed(2)} / unit</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-secondary-900 dark:text-secondary-50 text-sm">{currency}{(item.quantity * item.price).toFixed(2)}</p>
                                            <div className="flex items-center justify-end gap-1 mt-0.5">
                                                <div className="w-1 h-1 rounded-full bg-success-500" />
                                                <p className="text-[8px] font-black text-success-600 dark:text-success-400 uppercase">Profit: {currency}{(item.quantity * (item.price - (item.costPrice || 0))).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 rounded-3xl bg-secondary-900 dark:bg-black text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/10 rounded-full -mr-12 -mt-12 blur-2xl" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-secondary-400 dark:text-secondary-500 text-[9px] font-black uppercase tracking-wider mb-0.5">Total Revenue</p>
                                    <p className="text-2xl font-black tracking-tight">{currency}{selectedSale.total.toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-success-400 text-[9px] font-black uppercase tracking-wider mb-0.5 text-right">Net Profit</p>
                                    <p className="text-lg font-black text-success-400 tracking-tight">
                                        +{currency}{(selectedSale.total - selectedSale.items.reduce((sum: number, item: any) => sum + (item.quantity * (item.costPrice || 0)), 0)).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-danger-50 dark:bg-danger-900/20 ring-1 ring-danger-100/50 dark:ring-danger-900/50 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-secondary-900 flex items-center justify-center text-danger-600 dark:text-danger-400 shadow-sm flex-shrink-0">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-danger-900 dark:text-danger-50">Void Transaction</p>
                                <p className="text-[10px] font-bold text-danger-600/80 dark:text-danger-400/80 mt-0.5 leading-tight">
                                    Voiding will delete this record and restore stock levels.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmDialog
                isOpen={isConfirmVoidOpen}
                onClose={() => setIsConfirmVoidOpen(false)}
                onConfirm={confirmVoidSale}
                title="Void Sale"
                message="Are you sure you want to void this sale? This will restore the stock for all items in this order. This action cannot be undone."
                confirmText="Void Sale"
                variant="danger"
                isLoading={isVoiding}
            />
        </div >
    );
};





