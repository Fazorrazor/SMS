import { useState, useEffect, useMemo, useRef, } from 'react';
import { createPortal } from 'react-dom';
import { useProducts, type Product } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { formatStock } from '../lib/utils';
import { Dropdown } from '../components/ui/Dropdown';
import { Plus, Search, Filter, Package, Tag, Layers, AlertCircle, ChevronDown, Lock, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStickyOverlay } from '../hooks/useStickyOverlay';

const COMMON_UNITS = [
    'Pack', 'Bottle', 'Litre', 'kg', 'g', 'Piece', 'Box', 'Carton', 'Sachet', 'Roll', 'Bag', 'Can', 'Jar', 'Tube'
];

export const Products = () => {
    const { products, addProduct, bulkAddProducts, updateProduct, deleteProduct, isLoading } = useProducts();
    const { isAdmin, verifyPassword } = useAuth();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);
    const [deletePassword, setDeletePassword] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [settings, setSettings] = useState<any>(null);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showUnitSuggestions, setShowUnitSuggestions] = useState(false);
    const [unitSearch, setUnitSearch] = useState('');
    const [unitQuantity, setUnitQuantity] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    // Coordinate tracking for sticky overlays using unified hook
    const nameInputRef = useRef<HTMLDivElement>(null);
    const unitInputRef = useRef<HTMLDivElement>(null);
    const nameCoords = useStickyOverlay(nameInputRef, showSuggestions, 4);
    const unitCoords = useStickyOverlay(unitInputRef, showUnitSuggestions, 4);

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

    const [newProduct, setNewProduct] = useState({
        name: '',
        sku: '',
        category: '',
        sellingPrice: 0,
        halfPrice: 0,
        quarterPrice: 0,
        costPrice: 0,
        stock: 0,
        unit: 'Pack'
    });

    const [bulkProducts, setBulkProducts] = useState([
        { name: '', sku: '', category: '', sellingPrice: 0, costPrice: 0, stock: 0, unit: 'Pack' }
    ]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/settings`);
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

    const suggestions = useMemo(() => {
        if (!newProduct.name || selectedProductId || newProduct.name.length < 2) return [];
        return products.filter((p: Product) =>
            p.name.toLowerCase().includes(newProduct.name.toLowerCase())
        ).slice(0, 5);
    }, [newProduct.name, products, selectedProductId]);

    const unitSuggestions = useMemo(() => {
        const search = unitSearch.toLowerCase();
        return COMMON_UNITS.filter(u => u.toLowerCase().includes(search));
    }, [unitSearch]);

    const handleSelectSuggestion = (product: any) => {
        setNewProduct({
            name: product.name,
            sku: product.sku,
            category: product.category,
            sellingPrice: product.sellingPrice,
            halfPrice: product.halfPrice || 0,
            quarterPrice: product.quarterPrice || 0,
            costPrice: product.costPrice,
            stock: 0,
            unit: product.unit
        });

        const unitParts = product.unit.split(' ');
        if (unitParts.length > 1 && !isNaN(parseFloat(unitParts[0]))) {
            setUnitQuantity(unitParts[0]);
            setUnitSearch(unitParts.slice(1).join(' '));
        } else {
            setUnitQuantity('');
            setUnitSearch(product.unit);
        }

        setSelectedProductId(product.id);
        setIsEditing(false); // This is "Add Stock" mode, not full edit
        setShowSuggestions(false);
    };

    const handleEditProduct = (product: Product) => {
        setNewProduct({
            name: product.name,
            sku: product.sku,
            category: product.category,
            sellingPrice: product.sellingPrice,
            halfPrice: product.halfPrice || 0,
            quarterPrice: product.quarterPrice || 0,
            costPrice: product.costPrice,
            stock: product.stock,
            unit: product.unit
        });

        const unitParts = product.unit.split(' ');
        if (unitParts.length > 1 && !isNaN(parseFloat(unitParts[0]))) {
            setUnitQuantity(unitParts[0]);
            setUnitSearch(unitParts.slice(1).join(' '));
        } else {
            setUnitQuantity('');
            setUnitSearch(product.unit);
        }

        setSelectedProductId(product.id);
        setIsEditing(true);
        setIsAddModalOpen(true);
    };

    const handleAddProduct = () => {
        if (!newProduct.name) return;
        setError(null);

        const finalUnit = unitQuantity ? `${unitQuantity} ${unitSearch}` : unitSearch;
        const productToSave = { ...newProduct, unit: finalUnit || 'Pack' };

        // Check for duplicate SKU if it's a new product or SKU is being changed
        if (!selectedProductId) {
            const skuExists = products.some(p => p.sku.toLowerCase() === newProduct.sku.toLowerCase());
            if (skuExists && newProduct.sku) {
                setError(`A product with code "${newProduct.sku}" already exists. Please use a different product code.`);
                return;
            }
        } else {
            const skuExists = products.some(p => p.sku.toLowerCase() === newProduct.sku.toLowerCase() && p.id !== selectedProductId);
            if (skuExists && newProduct.sku) {
                setError(`A product with code "${newProduct.sku}" already exists. Please use a different product code.`);
                return;
            }
        }

        if (selectedProductId) {
            const existingProduct = products.find(p => p.id === selectedProductId);
            if (existingProduct) {
                updateProduct(selectedProductId, {
                    ...productToSave,
                    stock: isEditing ? newProduct.stock : existingProduct.stock + newProduct.stock
                });
            }
        } else {
            addProduct(productToSave);
        }

        setIsAddModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setNewProduct({
            name: '',
            sku: '',
            category: '',
            sellingPrice: 0,
            halfPrice: 0,
            quarterPrice: 0,
            costPrice: 0,
            stock: 0,
            unit: 'Pack'
        });
        setBulkProducts([{ name: '', sku: '', category: '', sellingPrice: 0, costPrice: 0, stock: 0, unit: 'Pack' }]);
        setSelectedProductId(null);
        setIsEditing(false);
        setUnitSearch('');
        setUnitQuantity('');
        setError(null);
    };

    const handleAddBulkRow = () => {
        setBulkProducts([...bulkProducts, { name: '', sku: '', category: '', sellingPrice: 0, costPrice: 0, stock: 0, unit: 'Pack' }]);
    };

    const handleRemoveBulkRow = (index: number) => {
        if (bulkProducts.length > 1) {
            setBulkProducts(bulkProducts.filter((_, i) => i !== index));
        }
    };

    const handleBulkProductChange = (index: number, field: string, value: any) => {
        const updated = [...bulkProducts];
        updated[index] = { ...updated[index], [field]: value };
        setBulkProducts(updated);
    };

    const handleBulkAddSubmit = async () => {
        const validProducts = bulkProducts.filter(p => p.name.trim() !== '');
        if (validProducts.length === 0) {
            setError('Please add at least one product with a name.');
            return;
        }
        await bulkAddProducts(validProducts);
        setIsBulkAddModalOpen(false);
        resetForm();
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-secondary-900 dark:text-secondary-50">Products</h1>
                    <p className="mt-2 text-base text-secondary-500 dark:text-secondary-400">Manage your product catalog and pricing.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            resetForm();
                            setIsBulkAddModalOpen(true);
                        }}
                        size="lg"
                        className="shadow-sm"
                    >
                        <Layers className="w-5 h-5 mr-2" />
                        Bulk Add
                    </Button>
                    <Button
                        onClick={() => {
                            resetForm();
                            setIsAddModalOpen(true);
                        }}
                        size="lg"
                        className="shadow-primary-600/20"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Product
                    </Button>
                </div>
            </div>

            {/* Add Product Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={isEditing ? "Edit Product" : selectedProductId ? "Update Product Stock" : "Add New Product"}
                size="lg"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddProduct}>Save Product</Button>
                    </>
                }
            >
                <div className="space-y-6">
                    {error && (
                        <div className="p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-100 dark:border-danger-900/50 rounded-2xl flex items-start gap-3 text-danger-600 dark:text-danger-400 animate-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p className="text-sm font-bold">{error}</p>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                            <div ref={nameInputRef}>
                                <Input
                                    label="Product Name"
                                    placeholder="e.g. Wireless Earbuds"
                                    icon={<Package className="w-5 h-5" />}
                                    value={newProduct.name}
                                    onChange={e => {
                                        setNewProduct({ ...newProduct, name: e.target.value });
                                        setSelectedProductId(null);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => {
                                        setShowSuggestions(true);
                                    }}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                />
                            </div>
                            {showSuggestions && suggestions.length > 0 && createPortal(
                                <div
                                    className="fixed z-[100000] bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                                    style={{
                                        top: nameCoords.top,
                                        left: nameCoords.left,
                                        width: nameCoords.width
                                    }}
                                >
                                    {suggestions.map(p => (
                                        <button
                                            key={p.id}
                                            className="w-full px-4 py-3 text-left hover:bg-secondary-50 dark:hover:bg-secondary-800 flex items-center justify-between transition-colors"
                                            onClick={() => handleSelectSuggestion(p)}
                                        >
                                            <div>
                                                <p className="font-bold text-secondary-900 dark:text-secondary-50">{p.name}</p>
                                                <p className="text-xs text-secondary-400 uppercase">{p.sku}</p>
                                            </div>
                                            <span className="text-xs font-black text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-lg">
                                                {p.stock} {p.unit}s
                                            </span>
                                        </button>
                                    ))}
                                </div>,
                                document.body
                            )}
                        </div>
                        <Input
                            label="SKU / Barcode (Optional)"
                            placeholder="Leave empty to auto-generate"
                            icon={<Tag className="w-5 h-5" />}
                            value={newProduct.sku}
                            onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })}
                        />
                        <Input
                            label="Category"
                            placeholder="e.g. Electronics"
                            icon={<Layers className="w-5 h-5" />}
                            value={newProduct.category}
                            onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                        />

                        {/* Enhanced Unit of Measure Field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-secondary-500 uppercase tracking-wider ml-1">
                                Unit of Measure
                            </label>
                            <div className="flex gap-2">
                                <div className="w-20">
                                    <input
                                        type="text"
                                        placeholder="Qty"
                                        className="w-full bg-white dark:bg-secondary-900 border-none ring-1 ring-secondary-200 dark:ring-secondary-800 rounded-xl py-3 px-3 outline-none transition-all duration-200 focus:ring-2 focus:ring-primary-500 text-secondary-900 dark:text-secondary-50 font-semibold text-center"
                                        value={unitQuantity}
                                        onChange={e => setUnitQuantity(e.target.value)}
                                    />
                                </div>
                                <div className="relative flex-1">
                                    <div className="relative group" ref={unitInputRef}>
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-500 transition-colors">
                                            <Tag className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Unit (e.g. Litre, kg)"
                                            className="w-full bg-white dark:bg-secondary-900 border-none ring-1 ring-secondary-200 dark:ring-secondary-800 rounded-xl py-3 pl-11 pr-10 outline-none transition-all duration-200 focus:ring-2 focus:ring-primary-500 text-secondary-900 dark:text-secondary-50 font-semibold"
                                            value={unitSearch}
                                            onChange={e => {
                                                setUnitSearch(e.target.value);
                                                setShowUnitSuggestions(true);
                                            }}
                                            onFocus={() => {
                                                setShowUnitSuggestions(true);
                                            }}
                                            onBlur={() => setTimeout(() => setShowUnitSuggestions(false), 200)}
                                        />
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
                                    </div>

                                    {showUnitSuggestions && createPortal(
                                        <div
                                            className="fixed z-[100000] bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
                                            style={{
                                                top: unitCoords.top,
                                                left: unitCoords.left,
                                                width: unitCoords.width
                                            }}
                                        >
                                            {unitSuggestions.length > 0 ? (
                                                unitSuggestions.map(u => (
                                                    <button
                                                        key={u}
                                                        className="w-full px-4 py-2.5 text-left hover:bg-secondary-50 dark:hover:bg-secondary-800 text-sm font-bold text-secondary-700 dark:text-secondary-300 transition-colors"
                                                        onClick={() => {
                                                            setUnitSearch(u);
                                                            setShowUnitSuggestions(false);
                                                        }}
                                                    >
                                                        {u}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-4 py-2.5 text-xs font-bold text-secondary-400 italic">
                                                    Press enter to use "{unitSearch}"
                                                </div>
                                            )}
                                        </div>,
                                        document.body
                                    )}
                                </div>
                            </div>
                        </div>

                        <Input
                            label="Full Unit Price"
                            placeholder="0.00"
                            type="number"
                            icon={<span className="text-sm font-bold text-secondary-400">{currency}</span>}
                            value={newProduct.sellingPrice || ''}
                            onChange={e => setNewProduct({ ...newProduct, sellingPrice: parseFloat(e.target.value) })}
                        />
                        <Input
                            label="Half Unit Price (Optional)"
                            placeholder="Leave empty for auto-calc"
                            type="number"
                            icon={<span className="text-sm font-bold text-secondary-400">{currency}</span>}
                            value={newProduct.halfPrice || ''}
                            onChange={e => setNewProduct({ ...newProduct, halfPrice: parseFloat(e.target.value) })}
                        />
                        <Input
                            label="Quarter Unit Price (Optional)"
                            placeholder="Leave empty for auto-calc"
                            type="number"
                            icon={<span className="text-sm font-bold text-secondary-400">{currency}</span>}
                            value={newProduct.quarterPrice || ''}
                            onChange={e => setNewProduct({ ...newProduct, quarterPrice: parseFloat(e.target.value) })}
                        />
                        <Input
                            label="Cost Price"
                            placeholder="0.00"
                            type="number"
                            icon={<span className="text-sm font-bold text-secondary-400">{currency}</span>}
                            value={newProduct.costPrice || ''}
                            onChange={e => setNewProduct({ ...newProduct, costPrice: parseFloat(e.target.value) })}
                        />
                        <Input
                            label={isEditing ? "Current Stock" : selectedProductId ? "Add to Stock" : "Initial Stock"}
                            placeholder="0"
                            type="number"
                            step="any"
                            icon={<Layers className="w-5 h-5" />}
                            value={newProduct.stock || ''}
                            onChange={e => setNewProduct({ ...newProduct, stock: parseFloat(e.target.value) })}
                        />
                        {selectedProductId && (
                            <div className="md:col-span-2 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-900/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    <p className="text-sm font-bold text-primary-900 dark:text-primary-100">
                                        Updating existing product. New stock will be added to the current balance.
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedProductId(null);
                                        setNewProduct({ ...newProduct, stock: 0 });
                                    }}
                                    className="text-xs font-black text-primary-600 hover:underline"
                                >
                                    Reset to New
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Bulk Add Modal */}
            <Modal
                isOpen={isBulkAddModalOpen}
                onClose={() => setIsBulkAddModalOpen(false)}
                title="Bulk Add Products"
                size="xl"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsBulkAddModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleBulkAddSubmit}>Save All Products</Button>
                    </>
                }
            >
                <div className="space-y-6">
                    {error && (
                        <div className="p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-100 dark:border-danger-900/50 rounded-2xl flex items-start gap-3 text-danger-600 dark:text-danger-400">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p className="text-sm font-bold">{error}</p>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-secondary-100 dark:border-secondary-800">
                                    <th className="px-4 py-3 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Name</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Category</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Cost Price</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Selling Price</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Stock</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Unit</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-secondary-400 uppercase tracking-widest text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-50 dark:divide-secondary-800">
                                {bulkProducts.map((p, index) => (
                                    <tr key={index} className="group">
                                        <td className="px-2 py-3">
                                            <input
                                                type="text"
                                                placeholder="Product Name"
                                                className="w-full bg-secondary-50 dark:bg-secondary-800 border-none rounded-lg py-2 px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500"
                                                value={p.name}
                                                onChange={e => handleBulkProductChange(index, 'name', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-2 py-3">
                                            <input
                                                type="text"
                                                placeholder="Category"
                                                className="w-full bg-secondary-50 dark:bg-secondary-800 border-none rounded-lg py-2 px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500"
                                                value={p.category}
                                                onChange={e => handleBulkProductChange(index, 'category', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-2 py-3 w-28">
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                className="w-full bg-secondary-50 dark:bg-secondary-800 border-none rounded-lg py-2 px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500"
                                                value={p.costPrice || ''}
                                                onChange={e => handleBulkProductChange(index, 'costPrice', parseFloat(e.target.value))}
                                            />
                                        </td>
                                        <td className="px-2 py-3 w-28">
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                className="w-full bg-secondary-50 dark:bg-secondary-800 border-none rounded-lg py-2 px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500"
                                                value={p.sellingPrice || ''}
                                                onChange={e => handleBulkProductChange(index, 'sellingPrice', parseFloat(e.target.value))}
                                            />
                                        </td>
                                        <td className="px-2 py-3 w-24">
                                            <input
                                                type="number"
                                                placeholder="0"
                                                className="w-full bg-secondary-50 dark:bg-secondary-800 border-none rounded-lg py-2 px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500"
                                                value={p.stock || ''}
                                                onChange={e => handleBulkProductChange(index, 'stock', parseFloat(e.target.value))}
                                            />
                                        </td>
                                        <td className="px-2 py-3 w-28">
                                            <Dropdown
                                                value={p.unit}
                                                onChange={val => handleBulkProductChange(index, 'unit', val)}
                                                options={COMMON_UNITS.map(u => ({ label: u, value: u, icon: Tag }))}
                                                className="w-full"
                                            />
                                        </td>
                                        <td className="px-2 py-3 text-right">
                                            <button
                                                onClick={() => handleRemoveBulkRow(index)}
                                                className="p-2 text-secondary-400 hover:text-danger-600 transition-colors"
                                                disabled={bulkProducts.length === 1}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Button variant="ghost" className="w-full border-2 border-dashed border-secondary-200 dark:border-secondary-800 py-6" onClick={handleAddBulkRow}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Another Product
                    </Button>
                </div>
            </Modal>

            {/* Filters & Search */}
            <Card padding="md" className="border-none shadow-sm ring-1 ring-secondary-200/50 dark:ring-secondary-800 bg-white dark:bg-secondary-900">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full pl-10 pr-4 py-2.5 bg-secondary-50 dark:bg-secondary-800 border-none ring-1 ring-secondary-200 dark:ring-secondary-700 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all outline-none text-secondary-900 dark:text-secondary-50 placeholder:text-secondary-400"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button className="inline-flex items-center px-4 py-2.5 bg-white dark:bg-secondary-900 ring-1 ring-secondary-200 dark:ring-secondary-800 text-secondary-700 dark:text-secondary-300 font-semibold rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-all">
                            <Filter className="w-5 h-5 mr-2" />
                            Filters
                        </button>
                    </div>
                </div>
            </Card>

            {/* Product Table */}
            <Card padding="none" className="border-none shadow-sm ring-1 ring-secondary-200/50 dark:ring-secondary-800 overflow-hidden bg-white dark:bg-secondary-900">
                {isLoading ? (
                    <div className="p-6 space-y-4">
                        <div className="flex gap-4 pb-4 border-b border-secondary-100 dark:border-secondary-800">
                            <Skeleton variant="text" className="h-6 flex-1" />
                            <Skeleton variant="text" className="h-6 flex-1" />
                            <Skeleton variant="text" className="h-6 flex-1" />
                            <Skeleton variant="text" className="h-6 w-24" />
                        </div>
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex gap-4 py-4 border-b border-secondary-50 dark:border-secondary-800 last:border-0">
                                <Skeleton variant="rounded" className="h-12 flex-1" />
                                <Skeleton variant="rounded" className="h-12 flex-1" />
                                <Skeleton variant="rounded" className="h-12 flex-1" />
                                <Skeleton variant="rounded" className="h-12 w-24" />
                            </div>
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary-100 dark:bg-secondary-800 mb-4">
                            <Package className="w-8 h-8 text-secondary-400 dark:text-secondary-500" />
                        </div>
                        <p className="text-secondary-500 font-medium">No products found. Start by adding your first product.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-secondary-50/50 dark:bg-secondary-800/50 border-b border-secondary-100 dark:border-secondary-800">
                                        <th className="px-4 py-3 text-[10px] font-bold text-secondary-500 uppercase tracking-wider min-w-[150px]">Product</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-secondary-500 uppercase tracking-wider min-w-[100px]">Category</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-secondary-500 uppercase tracking-wider min-w-[120px]">Price</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-secondary-500 uppercase tracking-wider min-w-[100px]">Stock</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-secondary-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
                                    {products.map((product) => (
                                        <tr key={product.id} className="hover:bg-secondary-50/50 dark:hover:bg-secondary-800/50 transition-colors group">
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <p className="font-bold text-secondary-900 dark:text-secondary-50 text-sm truncate max-w-[200px]" title={product.name}>{product.name}</p>
                                                    <span className="text-[9px] text-secondary-400 font-bold uppercase tracking-wider">{product.sku}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                                                    {product.category}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-secondary-900 dark:text-secondary-50 text-sm">{currency}{product.sellingPrice.toFixed(2)}</span>
                                                    {(product.halfPrice || product.quarterPrice) && (
                                                        <div className="flex gap-2 mt-0.5">
                                                            {product.halfPrice && (
                                                                <span className="text-[9px] font-bold text-secondary-400">H: {currency}{product.halfPrice.toFixed(2)}</span>
                                                            )}
                                                            {product.quarterPrice && (
                                                                <span className="text-[9px] font-bold text-secondary-400">Q: {currency}{product.quarterPrice.toFixed(2)}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-lg text-[10px] font-bold inline-block",
                                                        product.stock <= (settings ? parseFloat(settings.lowStockThreshold) || 5 : 5) ? "bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-400" : "bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400"
                                                    )}>
                                                        {formatStock(product.stock, product.unit || 'Pack')}
                                                    </span>
                                                    <span className="text-[9px] text-secondary-400 font-bold mt-0.5">
                                                        ({product.stock.toFixed(2)} total)
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-primary-600 hover:bg-primary-50 hover:text-primary-700 text-xs"
                                                        onClick={() => handleEditProduct(product)}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-danger-600 hover:bg-danger-50 hover:text-danger-700 text-xs"
                                                        onClick={() => {
                                                            setProductToDelete(product.id);
                                                            setIsDeleteModalOpen(true);
                                                            setDeletePassword('');
                                                            setError(null);
                                                        }}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-secondary-100 dark:divide-secondary-800">
                            {products.map((product) => (
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

                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-wider mb-1">Price</p>
                                            <p className="font-bold text-secondary-900 dark:text-secondary-50">{currency}{product.sellingPrice.toFixed(2)}</p>
                                            {(product.halfPrice || product.quarterPrice) && (
                                                <div className="flex gap-2 mt-1">
                                                    {product.halfPrice && (
                                                        <span className="text-[9px] font-bold text-secondary-400">H: {currency}{product.halfPrice.toFixed(2)}</span>
                                                    )}
                                                    {product.quarterPrice && (
                                                        <span className="text-[9px] font-bold text-secondary-400">Q: {currency}{product.quarterPrice.toFixed(2)}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-wider mb-1">Stock</p>
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-lg text-[11px] font-bold inline-block",
                                                product.stock <= (settings ? parseFloat(settings.lowStockThreshold) || 5 : 5) ? "bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-400" : "bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400"
                                            )}>
                                                {formatStock(product.stock, product.unit || 'Pack')}
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                                        onClick={() => {
                                            setProductToDelete(product.id);
                                            setIsDeleteModalOpen(true);
                                            setDeletePassword('');
                                            setError(null);
                                        }}
                                    >
                                        Delete Product
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </Card>

            {/* Secure Delete Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setProductToDelete(null);
                    setDeletePassword('');
                    setError(null);
                }}
                title={
                    <div className="flex items-center gap-2 text-danger-600 dark:text-danger-400">
                        <AlertCircle className="w-6 h-6" />
                        Confirm Deletion
                    </div>
                }
                size="md"
                footer={
                    <>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsDeleteModalOpen(false);
                                setProductToDelete(null);
                                setDeletePassword('');
                                setError(null);
                            }}
                            disabled={isVerifying}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={async () => {
                                if (!deletePassword) {
                                    setError('Please enter your password to confirm.');
                                    return;
                                }
                                setIsVerifying(true);
                                setError(null);
                                try {
                                    const isValid = await verifyPassword(deletePassword);
                                    if (isValid && productToDelete) {
                                        await deleteProduct(productToDelete);
                                        setIsDeleteModalOpen(false);
                                        setProductToDelete(null);
                                        setDeletePassword('');
                                    } else {
                                        setError('Incorrect password. Please try again.');
                                    }
                                } catch (err) {
                                    setError('Verification failed. Please try again.');
                                } finally {
                                    setIsVerifying(false);
                                }
                            }}
                            disabled={isVerifying}
                            isLoading={isVerifying}
                        >
                            {isVerifying ? 'Verifying...' : 'Delete Product'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className="text-secondary-600 dark:text-secondary-300">
                        Are you sure you want to delete this product? This action cannot be undone.
                    </p>
                    <div className="p-4 bg-secondary-50 dark:bg-secondary-800 rounded-xl border border-secondary-100 dark:border-secondary-700">
                        <p className="text-sm font-bold text-secondary-900 dark:text-secondary-50 mb-1">Security Check</p>
                        <p className="text-xs text-secondary-500 dark:text-secondary-400 mb-3">Please enter your password to confirm this action.</p>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                            <input
                                type="password"
                                placeholder="Enter your password"
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-secondary-900 border-none ring-1 ring-secondary-200 dark:ring-secondary-700 rounded-xl focus:ring-2 focus:ring-danger-500 transition-all outline-none text-secondary-900 dark:text-secondary-50 placeholder:text-secondary-400"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                            />
                        </div>
                        {error && (
                            <p className="text-xs font-bold text-danger-600 dark:text-danger-400 mt-2 animate-in slide-in-from-top-1">
                                {error}
                            </p>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};


