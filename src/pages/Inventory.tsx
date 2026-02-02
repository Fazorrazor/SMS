import { useState, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { cn, formatStock } from '../lib/utils';
import { format } from 'date-fns';
import {
    ClipboardList,
    ArrowUpDown,
    Download,
    Search,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Plus,
    Minus,
    Package,
    Undo2,
    ChevronUp,
    ChevronDown
} from 'lucide-react';

type SortField = 'name' | 'stock' | 'category';
type SortDirection = 'asc' | 'desc';
type FilterType = 'all' | 'low' | 'out' | 'in-stock';

interface StockHistory {
    productId: string;
    previousStock: number;
    newStock: number;
    adjustment: number;
    timestamp: Date;
}

export const Inventory = () => {
    const { products, updateStock, isLoading } = useProducts();
    const { isAdmin } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdjustOpen, setIsAdjustOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [adjustmentAmount, setAdjustmentAmount] = useState('');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
    const [showHistory, setShowHistory] = useState(false);

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

    const getStockStatus = (stock: number) => {
        if (stock <= 0) return 'out';
        if (stock <= 5) return 'low';
        return 'in-stock';
    };

    const filteredAndSortedProducts = useMemo(() => {
        let filtered = products.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Apply filter
        if (filterType !== 'all') {
            filtered = filtered.filter(p => getStockStatus(p.stock) === filterType);
        }

        // Apply sort
        filtered.sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'stock':
                    comparison = a.stock - b.stock;
                    break;
                case 'category':
                    comparison = a.category.localeCompare(b.category);
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return filtered;
    }, [products, searchQuery, sortField, sortDirection, filterType]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleQuickAdjust = (product: any, amount: number) => {
        const history: StockHistory = {
            productId: product.id,
            previousStock: product.stock,
            newStock: product.stock + amount,
            adjustment: amount,
            timestamp: new Date()
        };
        setStockHistory(prev => [history, ...prev].slice(0, 10));
        updateStock(product.id, amount);
    };

    const handleAdjustStock = () => {
        if (!selectedProduct || !adjustmentAmount) return;
        const amount = parseFloat(adjustmentAmount);
        const history: StockHistory = {
            productId: selectedProduct.id,
            previousStock: selectedProduct.stock,
            newStock: selectedProduct.stock + amount,
            adjustment: amount,
            timestamp: new Date()
        };
        setStockHistory(prev => [history, ...prev].slice(0, 10));
        updateStock(selectedProduct.id, amount);
        setIsAdjustOpen(false);
        setAdjustmentAmount('');
        setSelectedProduct(null);
    };

    const handleUndo = (history: StockHistory) => {
        updateStock(history.productId, -history.adjustment);
        setStockHistory(prev => prev.filter(h => h !== history));
    };

    const handleExport = () => {
        const headers = [
            'Product Name',
            'SKU',
            'Category',
            'Stock Level',
            'Unit',
            'Status',
            'Cost Price',
            'Selling Price',
            'Total Cost Value',
            'Total Retail Value'
        ];

        const csvData = filteredAndSortedProducts.map(product => {
            const totalCost = product.stock * product.costPrice;
            const totalRetail = product.stock * product.sellingPrice;
            const status = getStockStatus(product.stock);

            return [
                `"${product.name.replace(/"/g, '""')}"`,
                product.sku,
                `"${product.category.replace(/"/g, '""')}"`,
                product.stock,
                product.unit || 'Pack',
                status === 'out' ? 'Out of Stock' : status === 'low' ? 'Low Stock' : 'In Stock',
                product.costPrice.toFixed(2),
                product.sellingPrice.toFixed(2),
                totalCost.toFixed(2),
                totalRetail.toFixed(2)
            ];
        });

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `inventory-report-${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const lowStockCount = products.filter(p => getStockStatus(p.stock) === 'low').length;
    const outOfStockCount = products.filter(p => getStockStatus(p.stock) === 'out').length;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-secondary-900 dark:text-secondary-50 tracking-tight">Inventory Management</h1>
                    <p className="text-secondary-500 dark:text-secondary-400 font-medium mt-1">Monitor stock levels and perform manual adjustments.</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {stockHistory.length > 0 && (
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-secondary-900 ring-1 ring-secondary-200 dark:ring-secondary-800 rounded-xl font-bold text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-all"
                        >
                            <Undo2 className="w-4 h-4" />
                            History ({stockHistory.length})
                        </button>
                    )}
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-secondary-900 ring-1 ring-secondary-200 dark:ring-secondary-800 rounded-xl font-bold text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-all"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Export CSV</span>
                    </button>
                    <button
                        onClick={() => setIsAdjustOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 rounded-xl font-bold text-white shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all"
                    >
                        <ArrowUpDown className="w-4 h-4" />
                        <span className="hidden sm:inline">Stock Adjustment</span>
                        <span className="sm:hidden">Adjust</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card padding="md" className="border-none shadow-sm ring-1 ring-secondary-200/50 dark:ring-secondary-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-secondary-400 uppercase tracking-wider">Total Products</p>
                            <p className="text-2xl font-black text-secondary-900 dark:text-secondary-50 mt-1">{products.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center">
                            <Package className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        </div>
                    </div>
                </Card>
                <Card padding="md" className="border-none shadow-sm ring-1 ring-warning-200/50 dark:ring-warning-800/50 bg-warning-50/30 dark:bg-warning-900/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-warning-600 dark:text-warning-400 uppercase tracking-wider">Low Stock</p>
                            <p className="text-2xl font-black text-warning-700 dark:text-warning-300 mt-1">{lowStockCount}</p>
                        </div>
                        <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-xl flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-warning-600 dark:text-warning-400" />
                        </div>
                    </div>
                </Card>
                <Card padding="md" className="border-none shadow-sm ring-1 ring-danger-200/50 dark:ring-danger-800/50 bg-danger-50/30 dark:bg-danger-900/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-danger-600 dark:text-danger-400 uppercase tracking-wider">Out of Stock</p>
                            <p className="text-2xl font-black text-danger-700 dark:text-danger-300 mt-1">{outOfStockCount}</p>
                        </div>
                        <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-xl flex items-center justify-center">
                            <XCircle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* History Panel */}
            {showHistory && stockHistory.length > 0 && (
                <Card padding="md" className="border-none shadow-sm ring-1 ring-secondary-200/50 dark:ring-secondary-800 animate-in slide-in-from-top-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-secondary-900 dark:text-secondary-50">Recent Adjustments</h3>
                        <button onClick={() => setShowHistory(false)} className="text-secondary-400 hover:text-secondary-600">
                            <ChevronUp className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="space-y-2">
                        {stockHistory.map((history, idx) => {
                            const product = products.find(p => p.id === history.productId);
                            if (!product) return null;
                            return (
                                <div key={idx} className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-800 rounded-xl">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-secondary-900 dark:text-secondary-50 text-sm truncate">{product.name}</p>
                                        <p className="text-xs text-secondary-400">
                                            {history.previousStock} → {history.newStock} ({history.adjustment > 0 ? '+' : ''}{history.adjustment})
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-secondary-400">{format(history.timestamp, 'HH:mm')}</span>
                                        <button
                                            onClick={() => handleUndo(history)}
                                            className="p-1.5 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg transition-colors"
                                        >
                                            <Undo2 className="w-4 h-4 text-secondary-400" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            {/* Inventory Table Section */}
            <Card padding="none" className="border-none shadow-xl ring-1 ring-secondary-200/50 dark:ring-secondary-800 overflow-hidden bg-white dark:bg-secondary-900">
                <div className="p-4 sm:p-6 border-b border-secondary-100 dark:border-secondary-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <h2 className="text-xl font-black text-secondary-900 dark:text-secondary-50">Stock Levels</h2>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1 sm:flex-initial">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                                <input
                                    type="text"
                                    placeholder="Search inventory..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 bg-secondary-50 dark:bg-secondary-800 border-none ring-1 ring-secondary-200 dark:ring-secondary-700 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all outline-none text-sm w-full sm:w-64 text-secondary-900 dark:text-secondary-50 placeholder:text-secondary-400"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {[
                            { id: 'all', label: 'All Items', count: products.length },
                            { id: 'in-stock', label: 'In Stock', count: products.length - lowStockCount - outOfStockCount },
                            { id: 'low', label: 'Low Stock', count: lowStockCount },
                            { id: 'out', label: 'Out of Stock', count: outOfStockCount }
                        ].map(filter => (
                            <button
                                key={filter.id}
                                onClick={() => setFilterType(filter.id as FilterType)}
                                className={cn(
                                    "px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all",
                                    filterType === filter.id
                                        ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                                        : "bg-secondary-50 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                                )}
                            >
                                {filter.label} ({filter.count})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-secondary-50/50 dark:bg-secondary-800/50">
                                <th className="px-4 py-3 text-[10px] font-black text-secondary-400 uppercase tracking-widest min-w-[150px]">
                                    <button onClick={() => handleSort('name')} className="flex items-center gap-2 hover:text-secondary-600">
                                        <Package className="w-3.5 h-3.5" />
                                        Product
                                        {sortField === 'name' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-[10px] font-black text-secondary-400 uppercase tracking-widest min-w-[100px]">
                                    <button onClick={() => handleSort('category')} className="flex items-center gap-2 hover:text-secondary-600">
                                        Category
                                        {sortField === 'category' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-[10px] font-black text-secondary-400 uppercase tracking-widest min-w-[120px]">
                                    <button onClick={() => handleSort('stock')} className="flex items-center gap-2 hover:text-secondary-600">
                                        Stock Level
                                        {sortField === 'stock' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-[10px] font-black text-secondary-400 uppercase tracking-widest min-w-[100px]">Status</th>
                                <th className="px-4 py-3 text-[10px] font-black text-secondary-400 uppercase tracking-widest min-w-[100px]">Quick Adjust</th>
                                <th className="px-4 py-3 text-[10px] font-black text-secondary-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-50 dark:divide-secondary-800">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={6} className="px-6 py-4">
                                            <div className="h-12 bg-secondary-50 dark:bg-secondary-800 animate-pulse rounded-xl" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredAndSortedProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="w-16 h-16 bg-secondary-50 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <ClipboardList className="w-8 h-8 text-secondary-200 dark:text-secondary-700" />
                                        </div>
                                        <p className="text-secondary-400 dark:text-secondary-500 font-bold">No items found.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedProducts.map((product) => {
                                    const status = getStockStatus(product.stock);
                                    const stockPercentage = Math.min((product.stock / 20) * 100, 100);

                                    return (
                                        <tr key={product.id} className="hover:bg-secondary-50/50 dark:hover:bg-secondary-800/50 transition-colors group">
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-secondary-900 dark:text-secondary-50 text-sm truncate max-w-[200px]" title={product.name}>{product.name}</span>
                                                    <span className="font-bold text-secondary-500 dark:text-secondary-400 text-[9px] uppercase tracking-wider">{product.sku}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 text-[9px] font-black rounded-lg uppercase tracking-wider">
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn(
                                                            "font-black text-sm",
                                                            status === 'out' ? "text-danger-600" :
                                                                status === 'low' ? "text-warning-600" : "text-success-600"
                                                        )}>
                                                            {formatStock(product.stock, product.unit || 'Pack')}
                                                        </span>
                                                        <span className="text-[10px] text-secondary-400 font-bold">
                                                            ({product.stock.toFixed(2)})
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-1 bg-secondary-100 dark:bg-secondary-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={cn(
                                                                "h-full transition-all",
                                                                status === 'out' ? "bg-danger-500" :
                                                                    status === 'low' ? "bg-warning-500" : "bg-success-500"
                                                            )}
                                                            style={{ width: `${stockPercentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {status === 'out' ? (
                                                    <div className="flex items-center gap-1.5 text-danger-600 dark:text-danger-400 font-bold text-[10px] uppercase tracking-wider">
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        Out of Stock
                                                    </div>
                                                ) : status === 'low' ? (
                                                    <div className="flex items-center gap-1.5 text-warning-600 dark:text-warning-400 font-bold text-[10px] uppercase tracking-wider">
                                                        <AlertCircle className="w-3.5 h-3.5" />
                                                        Low Stock
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-success-600 dark:text-success-400 font-bold text-xs uppercase tracking-wider">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        In Stock
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleQuickAdjust(product, -1)}
                                                        className="w-8 h-8 bg-secondary-100 dark:bg-secondary-800 hover:bg-danger-50 dark:hover:bg-danger-900/20 hover:text-danger-600 rounded-lg flex items-center justify-center transition-all"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleQuickAdjust(product, 1)}
                                                        className="w-8 h-8 bg-secondary-100 dark:bg-secondary-800 hover:bg-success-50 dark:hover:bg-success-900/20 hover:text-success-600 rounded-lg flex items-center justify-center transition-all"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => {
                                                        setSelectedProduct(product);
                                                        setIsAdjustOpen(true);
                                                    }}
                                                    className="p-2 hover:bg-white dark:hover:bg-secondary-800 hover:shadow-md hover:ring-1 hover:ring-secondary-200 dark:hover:ring-secondary-700 rounded-xl transition-all text-secondary-400 hover:text-primary-600"
                                                >
                                                    <ArrowUpDown className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-secondary-100 dark:divide-secondary-800">
                    {isLoading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="p-4">
                                <div className="h-24 bg-secondary-50 dark:bg-secondary-800 animate-pulse rounded-xl" />
                            </div>
                        ))
                    ) : filteredAndSortedProducts.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-secondary-50 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ClipboardList className="w-8 h-8 text-secondary-200 dark:text-secondary-700" />
                            </div>
                            <p className="text-secondary-400 dark:text-secondary-500 font-bold">No items found.</p>
                        </div>
                    ) : (
                        filteredAndSortedProducts.map((product) => {
                            const status = getStockStatus(product.stock);
                            const stockPercentage = Math.min((product.stock / 20) * 100, 100);

                            return (
                                <div key={product.id} className="p-4 hover:bg-secondary-50/50 dark:hover:bg-secondary-800/50 transition-colors">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-secondary-900 dark:text-secondary-50 truncate">{product.name}</h3>
                                            <p className="text-[10px] text-secondary-400 font-bold uppercase tracking-wider mt-0.5">{product.sku}</p>
                                        </div>
                                        <span className="px-2.5 py-1 bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 text-[10px] font-bold rounded-lg uppercase tracking-wider flex-shrink-0">
                                            {product.category}
                                        </span>
                                    </div>

                                    <div className="space-y-3 mb-3">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-wider">Stock Level</p>
                                                <span className={cn(
                                                    "font-black text-base",
                                                    status === 'out' ? "text-danger-600" :
                                                        status === 'low' ? "text-warning-600" : "text-success-600"
                                                )}>
                                                    {formatStock(product.stock, product.unit || 'Pack')}
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-secondary-100 dark:bg-secondary-800 rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full transition-all",
                                                        status === 'out' ? "bg-danger-500" :
                                                            status === 'low' ? "bg-warning-500" : "bg-success-500"
                                                    )}
                                                    style={{ width: `${stockPercentage}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                {status === 'out' ? (
                                                    <div className="flex items-center gap-1.5 text-danger-600 dark:text-danger-400 font-bold text-xs uppercase tracking-wider">
                                                        <XCircle className="w-4 h-4" />
                                                        Out of Stock
                                                    </div>
                                                ) : status === 'low' ? (
                                                    <div className="flex items-center gap-1.5 text-warning-600 dark:text-warning-400 font-bold text-xs uppercase tracking-wider">
                                                        <AlertCircle className="w-4 h-4" />
                                                        Low Stock
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-success-600 dark:text-success-400 font-bold text-xs uppercase tracking-wider">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        In Stock
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleQuickAdjust(product, -1)}
                                                    className="w-10 h-10 bg-secondary-100 dark:bg-secondary-800 hover:bg-danger-50 dark:hover:bg-danger-900/20 hover:text-danger-600 rounded-xl flex items-center justify-center transition-all"
                                                >
                                                    <Minus className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleQuickAdjust(product, 1)}
                                                    className="w-10 h-10 bg-secondary-100 dark:bg-secondary-800 hover:bg-success-50 dark:hover:bg-success-900/20 hover:text-success-600 rounded-xl flex items-center justify-center transition-all"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => {
                                            setSelectedProduct(product);
                                            setIsAdjustOpen(true);
                                        }}
                                    >
                                        <ArrowUpDown className="w-4 h-4 mr-2" />
                                        Adjust Stock
                                    </Button>
                                </div>
                            );
                        })
                    )}
                </div>
            </Card>

            {/* Stock Adjustment Modal */}
            <Modal
                isOpen={isAdjustOpen}
                onClose={() => {
                    setIsAdjustOpen(false);
                    setSelectedProduct(null);
                    setAdjustmentAmount('');
                }}
                title="Stock Adjustment"
                size="sm"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsAdjustOpen(false)}>Cancel</Button>
                        <Button onClick={handleAdjustStock} disabled={!selectedProduct || !adjustmentAmount}>
                            Update Stock
                        </Button>
                    </>
                }
            >
                <div className="space-y-6">
                    {!selectedProduct ? (
                        <div className="space-y-4">
                            <p className="text-sm font-bold text-secondary-500 uppercase tracking-wider">Select Product</p>
                            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2">
                                {products.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedProduct(p)}
                                        className="flex items-center justify-between p-4 bg-secondary-50 dark:bg-secondary-800 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-2xl transition-all text-left group"
                                    >
                                        <div className="min-w-0 flex-1 mr-4">
                                            <p className="font-black text-secondary-900 dark:text-secondary-50 truncate">{p.name}</p>
                                            <p className="text-xs font-bold text-secondary-400 uppercase">{p.sku}</p>
                                        </div>
                                        <span className="font-black text-secondary-600 dark:text-secondary-400 whitespace-nowrap">{p.stock}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border-2 border-primary-100 dark:border-primary-900/50 flex items-center justify-between">
                                <div>
                                    <p className="font-black text-primary-900 dark:text-primary-100">{selectedProduct.name}</p>
                                    <p className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase">Current Stock: {selectedProduct.stock}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedProduct(null)}
                                    className="text-xs font-black text-primary-600 dark:text-primary-400 hover:underline"
                                >
                                    Change
                                </button>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm font-bold text-secondary-500 uppercase tracking-wider">Adjustment Amount</p>
                                <div className={cn(
                                    "grid gap-2 mb-4",
                                    selectedProduct.halfPrice || selectedProduct.quarterPrice ? "grid-cols-3" : "grid-cols-1"
                                )}>
                                    <button
                                        onClick={() => setAdjustmentAmount('1')}
                                        className="py-2 bg-secondary-100 dark:bg-secondary-800 rounded-xl font-bold text-secondary-600 dark:text-secondary-400 hover:bg-secondary-200 dark:hover:bg-secondary-700"
                                    >
                                        +1.0
                                    </button>
                                    {selectedProduct.halfPrice && (
                                        <button
                                            onClick={() => setAdjustmentAmount('0.5')}
                                            className="py-2 bg-secondary-100 dark:bg-secondary-800 rounded-xl font-bold text-secondary-600 dark:text-secondary-400 hover:bg-secondary-200 dark:hover:bg-secondary-700"
                                        >
                                            +0.5
                                        </button>
                                    )}
                                    {selectedProduct.quarterPrice && (
                                        <button
                                            onClick={() => setAdjustmentAmount('0.25')}
                                            className="py-2 bg-secondary-100 dark:bg-secondary-800 rounded-xl font-bold text-secondary-600 dark:text-secondary-400 hover:bg-secondary-200 dark:hover:bg-secondary-700"
                                        >
                                            +0.25
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setAdjustmentAmount(prev => {
                                            const step = selectedProduct.quarterPrice ? 0.25 : selectedProduct.halfPrice ? 0.5 : 1;
                                            return (parseFloat(prev || '0') - step).toString();
                                        })}
                                        className="w-12 h-12 bg-secondary-100 dark:bg-secondary-800 rounded-xl flex items-center justify-center text-secondary-600 dark:text-secondary-400 hover:bg-secondary-200 dark:hover:bg-secondary-700"
                                    >
                                        <Minus className="w-6 h-6" />
                                    </button>
                                    <Input
                                        placeholder="Quantity (+/-)"
                                        type="number"
                                        step={selectedProduct.quarterPrice ? "0.25" : selectedProduct.halfPrice ? "0.5" : "1"}
                                        value={adjustmentAmount}
                                        onChange={e => setAdjustmentAmount(e.target.value)}
                                        className="text-center text-2xl font-black py-4"
                                    />
                                    <button
                                        onClick={() => setAdjustmentAmount(prev => {
                                            const step = selectedProduct.quarterPrice ? 0.25 : selectedProduct.halfPrice ? 0.5 : 1;
                                            return (parseFloat(prev || '0') + step).toString();
                                        })}
                                        className="w-12 h-12 bg-secondary-100 dark:bg-secondary-800 rounded-xl flex items-center justify-center text-secondary-600 dark:text-secondary-400 hover:bg-secondary-200 dark:hover:bg-secondary-700"
                                    >
                                        <Plus className="w-6 h-6" />
                                    </button>
                                </div>
                                <p className="text-xs text-center text-secondary-400 font-medium">
                                    Use positive numbers to add stock, negative to remove.
                                    {selectedProduct.quarterPrice && " (Increments of 0.25)"}
                                    {!selectedProduct.quarterPrice && selectedProduct.halfPrice && " (Increments of 0.5)"}
                                    {!selectedProduct.quarterPrice && !selectedProduct.halfPrice && " (Whole units only)"}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};


