import { useState, useMemo, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useProducts } from '../context/ProductContext';
import { cn, formatStock } from '../lib/utils';
import { format } from 'date-fns';
import { Search, ShoppingCart, Plus, Minus, CreditCard, Banknote, ArrowRight, CheckCircle2, ChevronUp, Printer } from 'lucide-react';

interface CartItem {
    productId: string;
    name: string;
    price: number;
    costPrice: number;
    quantity: number;
    stock: number;
}

export const POS = () => {
    const { products, recordSale, isLoading } = useProducts();
    const [cart, setCart] = useState<CartItem[]>(() => {
        const savedCart = localStorage.getItem('pos_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Transfer'>('Cash');
    const [amountTendered, setAmountTendered] = useState('');
    const [isSuccessOpen, setIsSuccessOpen] = useState(false);
    const [isCartMobileOpen, setIsCartMobileOpen] = useState(false);
    const [settings, setSettings] = useState<any>(null);
    const [selectedProductForQty, setSelectedProductForQty] = useState<any>(null);
    const [lastSale, setLastSale] = useState<any>(null);
    const [finalChangeDue, setFinalChangeDue] = useState<number>(0);

    useEffect(() => {
        localStorage.setItem('pos_cart', JSON.stringify(cart));
    }, [cart]);

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

    const categories = useMemo(() => ['All', ...new Set(products.map(p => p.category))], [products]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [products, searchQuery, selectedCategory]);

    const addToCart = (product: any, qty: number = 1) => {
        if (product.stock <= 0) return;

        // Determine price based on quantity and specific price tiers
        let itemPrice = product.sellingPrice;
        if (qty === 0.5 && product.halfPrice) {
            itemPrice = product.halfPrice / 0.5; // Store unit price that results in halfPrice
        } else if (qty === 0.25 && product.quarterPrice) {
            itemPrice = product.quarterPrice / 0.25; // Store unit price that results in quarterPrice
        }

        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id);
            if (existing) {
                if (existing.quantity + qty > product.stock) return prev;
                return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + qty, price: itemPrice } : item);
            }
            return [...prev, {
                productId: product.id,
                name: product.name,
                price: itemPrice,
                costPrice: product.costPrice,
                quantity: qty,
                stock: product.stock
            }];
        });
        setSelectedProductForQty(null);
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.productId === productId) {
                const newQty = Math.max(0, item.quantity + delta);
                if (newQty > item.stock) return item;
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxRate = settings ? parseFloat(settings.taxRate) / 100 : 0.05;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    const changeDue = parseFloat(amountTendered) - total;
    const currency = settings?.currencySymbol || 'GH₵';

    const handleCheckout = async () => {
        const saleData = {
            items: cart.map(item => ({
                productId: item.productId,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                costPrice: item.costPrice
            })),
            total,
            paymentMethod
        };

        try {
            const currentChange = paymentMethod === 'Cash' ? changeDue : 0;
            const result = await recordSale(saleData);
            setLastSale(result);
            setFinalChangeDue(currentChange);
            setCart([]);
            setIsCheckoutOpen(false);
            setIsSuccessOpen(true);
            setAmountTendered('');
        } catch (error) {
            console.error('Checkout failed:', error);
        }
    };

    const handlePrintReceipt = (sale: any) => {
        if (!sale) return;
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

    return (
        <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-8 overflow-hidden relative">
            {/* Product Selection Area */}
            <div className="flex-1 flex flex-col min-w-0 gap-6 overflow-hidden">
                {/* Search and Categories */}
                <Card padding="sm" className="border-none shadow-sm ring-1 ring-secondary-200/50 flex-shrink-0 mx-1">
                    <div className="flex flex-col lg:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-secondary-50 dark:bg-secondary-800 border-none ring-1 ring-secondary-200 dark:ring-secondary-700 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all outline-none font-medium text-sm text-secondary-900 dark:text-secondary-50 placeholder:text-secondary-400"
                            />
                        </div>
                        <div className="flex gap-1.5 overflow-x-auto pb-0.5 lg:pb-0">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={cn(
                                        "px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all",
                                        selectedCategory === cat
                                            ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                                            : "bg-white dark:bg-secondary-900 ring-1 ring-secondary-200 dark:ring-secondary-800 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-800"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Product Grid - Scrollable */}
                <div className="flex-1 overflow-y-auto px-1 pr-2 pt-4 pb-32 md:pb-6">
                    <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 sm:gap-4 lg:gap-8">
                        {isLoading ? (
                            [...Array(12)].map((_, i) => (
                                <Card key={i} padding="md" className="border-none shadow-sm ring-1 ring-secondary-200/50 space-y-4">
                                    <Skeleton variant="rounded" className="aspect-[4/3] w-full" />
                                    <div className="space-y-2">
                                        <Skeleton variant="text" className="w-1/3 h-3" />
                                        <Skeleton variant="text" className="w-full h-5" />
                                        <Skeleton variant="text" className="w-1/2 h-6" />
                                    </div>
                                </Card>
                            ))
                        ) : filteredProducts.length === 0 ? (
                            <div className="col-span-full py-32 text-center">
                                <div className="w-20 h-20 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-10 h-10 text-secondary-300 dark:text-secondary-600" />
                                </div>
                                <p className="text-secondary-400 dark:text-secondary-500 font-black text-xl">No products found</p>
                                <p className="text-secondary-300 dark:text-secondary-600 mt-2">Try adjusting your search or category</p>
                            </div>
                        ) : (
                            filteredProducts.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => setSelectedProductForQty(product)}
                                    disabled={product.stock <= 0}
                                    className="group text-left transition-all active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
                                >
                                    <Card padding="sm" className="h-full border-none shadow-sm ring-1 ring-secondary-200/50 dark:ring-secondary-800 group-hover:ring-primary-500 group-hover:shadow-xl group-hover:-translate-y-1 transition-all bg-white dark:bg-secondary-900 relative overflow-hidden rounded-2xl">
                                        <div className="aspect-[16/11] w-full bg-secondary-50 dark:bg-secondary-800 rounded-xl mb-3 flex items-center justify-center relative overflow-hidden group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
                                            <ShoppingCart className="w-8 h-8 text-secondary-200 dark:text-secondary-700 group-hover:text-primary-300 transition-all group-hover:scale-110" />
                                            <div className="absolute top-2 right-2">
                                                {product.stock <= (settings ? parseFloat(settings.lowStockThreshold) || 5 : 5) && product.stock > 0 && (
                                                    <span className="px-2 py-0.5 bg-warning-500 text-white text-[8px] font-black rounded-full shadow-lg uppercase tracking-wider">
                                                        {product.stock} {product.unit || 'Pack'}s Left
                                                    </span>
                                                )}
                                                {product.stock <= 0 && (
                                                    <span className="px-2 py-0.5 bg-danger-600 text-white text-[8px] font-black rounded-full shadow-lg uppercase tracking-wider">
                                                        Sold Out
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[8px] font-black text-secondary-400 uppercase tracking-wider">
                                                {product.category}
                                            </span>
                                            <h3 className="font-extrabold text-secondary-900 dark:text-secondary-50 text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                                                {product.name}
                                            </h3>
                                            <p className="text-primary-600 dark:text-primary-400 font-black text-lg truncate">{currency}{product.sellingPrice.toFixed(2)} <span className="text-[10px] text-secondary-400 font-bold">/ {product.unit || 'Pack'}</span></p>
                                        </div>
                                    </Card>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Cart Area - Sidebar on Desktop/Tablet, Drawer on Mobile */}
            <div className={cn(
                "fixed inset-0 z-50 lg:relative lg:z-0 lg:flex lg:w-80 xl:w-96 lg:h-full flex-col transition-all duration-300",
                isCartMobileOpen ? "pointer-events-auto" : "pointer-events-none lg:pointer-events-auto"
            )}>
                {/* Backdrop for mobile drawer */}
                <div
                    className={cn(
                        "absolute inset-0 bg-secondary-900/60 backdrop-blur-sm md:hidden transition-opacity duration-300 transform-gpu",
                        isCartMobileOpen ? "opacity-100" : "opacity-0"
                    )}
                    onClick={() => setIsCartMobileOpen(false)}
                />

                <div className={cn(
                    "absolute inset-x-0 bottom-0 top-20 lg:relative lg:top-0 lg:h-full flex flex-col transition-transform duration-300 ease-out",
                    isCartMobileOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0"
                )}>
                    <Card padding="none" className="h-full flex flex-col border-none shadow-2xl md:shadow-xl ring-1 ring-secondary-200/50 dark:ring-secondary-800 overflow-hidden bg-white dark:bg-secondary-900 rounded-t-[2.5rem] md:rounded-none">
                        {/* Cart Header */}
                        <div className="p-4 border-b border-secondary-100 dark:border-secondary-800 bg-secondary-50/50 dark:bg-secondary-800/50 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                    <ShoppingCart className="w-4 h-4" />
                                </div>
                                <h2 className="font-black text-secondary-900 dark:text-secondary-50 text-base">Current Order</h2>
                            </div>
                            <button
                                onClick={() => setIsCartMobileOpen(false)}
                                className="md:hidden p-1.5 hover:bg-secondary-100 rounded-full transition-colors"
                            >
                                <Minus className="w-5 h-5 text-secondary-400" />
                            </button>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto p-4 min-h-0">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-secondary-50 dark:bg-secondary-800 flex items-center justify-center mb-3">
                                        <ShoppingCart className="w-8 h-8 text-secondary-200 dark:text-secondary-700" />
                                    </div>
                                    <p className="text-secondary-400 dark:text-secondary-500 font-black text-sm">Your cart is empty</p>
                                    <p className="text-secondary-300 dark:text-secondary-600 text-[10px] mt-1">Tap products to add them here</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {cart.map(item => {
                                        const product = products.find(p => p.id === item.productId);
                                        const hasFractional = (product?.halfPrice && product.halfPrice > 0) || (product?.quarterPrice && product.quarterPrice > 0);
                                        const step = hasFractional ? 0.25 : 1.0;

                                        return (
                                            <div key={item.productId} className="flex items-center gap-3 group min-w-0">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-secondary-900 dark:text-secondary-50 text-xs truncate" title={item.name}>{item.name}</p>
                                                    <p className="text-primary-600 dark:text-primary-400 text-[10px] font-black mt-0.5 truncate">{currency}{item.price.toFixed(2)}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-secondary-50 dark:bg-secondary-800 p-0.5 rounded-lg flex-shrink-0">
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, -step)}
                                                        className="w-7 h-7 flex items-center justify-center bg-white dark:bg-secondary-900 rounded-md shadow-sm text-secondary-600 dark:text-secondary-400 hover:text-danger-600 transition-colors"
                                                    >
                                                        <Minus className="w-3.5 h-3.5" />
                                                    </button>
                                                    <span className="w-10 text-center font-bold text-secondary-900 dark:text-secondary-50 text-xs tabular-nums">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, step)}
                                                        className="w-7 h-7 flex items-center justify-center bg-white dark:bg-secondary-900 rounded-md shadow-sm text-secondary-600 dark:text-secondary-400 hover:text-primary-600 transition-colors"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Cart Summary */}
                        <div className="p-4 bg-secondary-50/50 dark:bg-secondary-800/50 border-t border-secondary-100 dark:border-secondary-800 space-y-4 flex-shrink-0">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold text-secondary-400">
                                    <span>Subtotal</span>
                                    <span>{currency}{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-secondary-400">
                                    <span>Tax ({settings?.taxRate || '5.0'}%)</span>
                                    <span>{currency}{tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-2xl font-black text-secondary-900 dark:text-secondary-50 pt-4 border-t border-secondary-200 dark:border-secondary-800">
                                    <span>Total</span>
                                    <span>{currency}{total.toFixed(2)}</span>
                                </div>
                            </div>
                            <Button
                                className="w-full py-8 text-xl font-black rounded-2xl shadow-xl shadow-primary-600/20"
                                disabled={cart.length === 0}
                                onClick={() => setIsCheckoutOpen(true)}
                            >
                                Checkout
                                <ArrowRight className="w-6 h-6 ml-2" />
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Sticky Bottom Bar for Mobile/Tablet Portrait */}
            <div className={cn(
                "lg:hidden fixed bottom-0 left-0 md:left-60 right-0 p-4 bg-secondary-50/80 dark:bg-secondary-950/80 backdrop-blur-xl border-t border-secondary-200 dark:border-secondary-800 z-40 flex items-center justify-between gap-4 transition-transform duration-300 transform-gpu",
                isCartMobileOpen ? "translate-y-full" : "translate-y-0"
            )}>
                <button
                    onClick={() => setIsCartMobileOpen(true)}
                    className="flex-1 flex items-center gap-3 bg-primary-600 text-white p-4 rounded-2xl active:scale-95 transition-all shadow-lg shadow-primary-600/20"
                >
                    <div className="relative">
                        <ShoppingCart className="w-6 h-6" />
                        {cart.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-white text-primary-600 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-primary-600">
                                {cart.reduce((sum, item) => sum + item.quantity, 0)}
                            </span>
                        )}
                    </div>
                    <div className="text-left min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-primary-100 uppercase leading-none truncate">Total Amount</p>
                        <p className="text-lg font-black leading-none mt-1 truncate">{currency}{total.toFixed(2)}</p>
                    </div>
                    <ChevronUp className="w-5 h-5 ml-auto text-primary-100" />
                </button>
                <Button
                    className="h-14 px-8 rounded-2xl font-black"
                    disabled={cart.length === 0}
                    onClick={() => setIsCheckoutOpen(true)}
                >
                    Pay
                </Button>
            </div>

            {/* Checkout Modal */}
            <Modal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                title="Complete Sale"
                size="md"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsCheckoutOpen(false)}>Back to Cart</Button>
                        <Button
                            onClick={handleCheckout}
                            disabled={paymentMethod === 'Cash' && (!amountTendered || parseFloat(amountTendered) < total)}
                        >
                            Complete Sale
                        </Button>
                    </>
                }
            >
                <div className="space-y-8">
                    <div className="text-center">
                        <p className="text-secondary-500 dark:text-secondary-400 font-bold uppercase tracking-widest text-xs">Total Amount Due</p>
                        <p className="text-4xl md:text-5xl font-black text-secondary-900 dark:text-secondary-50 mt-2">{currency}{total.toFixed(2)}</p>
                    </div>

                    <div className="space-y-4">
                        <p className="text-xs font-bold text-secondary-500 uppercase tracking-wider">Select Payment Method</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { id: 'Cash', icon: Banknote, label: 'Cash' },
                                { id: 'Card', icon: CreditCard, label: 'Card' },
                                { id: 'Transfer', icon: Banknote, label: 'Transfer' },
                            ].map(method => (
                                <button
                                    key={method.id}
                                    onClick={() => setPaymentMethod(method.id as any)}
                                    className={cn(
                                        "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                                        paymentMethod === method.id
                                            ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                                            : "border-secondary-100 dark:border-secondary-800 hover:border-secondary-200 dark:hover:border-secondary-700 text-secondary-500 dark:text-secondary-400"
                                    )}
                                >
                                    <method.icon className="w-6 h-6" />
                                    <span className="font-bold text-sm">{method.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {paymentMethod === 'Cash' && (
                        <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                            <Input
                                label="Amount Tendered"
                                placeholder="0.00"
                                type="number"
                                value={amountTendered}
                                onChange={e => setAmountTendered(e.target.value)}
                                className="text-2xl py-4 font-black"
                                autoFocus
                            />
                            {parseFloat(amountTendered) >= total && (
                                <div
                                    ref={(el) => {
                                        if (el) {
                                            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                        }
                                    }}
                                    className="p-6 bg-success-50 dark:bg-success-900/20 rounded-2xl border-2 border-success-100 dark:border-success-900/50 flex justify-between items-center animate-in zoom-in-95"
                                >
                                    <span className="font-bold text-success-700 dark:text-success-400">Change Due</span>
                                    <span className="text-3xl font-black text-success-700 dark:text-success-400">{currency}{changeDue.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Modal>

            {/* Quantity Selection Modal */}
            <Modal
                isOpen={!!selectedProductForQty}
                onClose={() => setSelectedProductForQty(null)}
                title="Select Quantity"
                size="sm"
            >
                <div className="space-y-5 min-w-0">
                    {/* Product Info Header */}
                    <div className="text-center p-4 sm:p-5 bg-secondary-50 dark:bg-secondary-800 rounded-2xl min-w-0">
                        <p className="font-black text-secondary-900 dark:text-secondary-50 text-lg sm:text-xl mb-2 truncate" title={selectedProductForQty?.name}>
                            {selectedProductForQty?.name}
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider whitespace-nowrap">
                                Stock: {formatStock(selectedProductForQty?.stock || 0, selectedProductForQty?.unit || 'Pack')}
                            </p>
                            <span className="text-[10px] sm:text-xs text-secondary-400 font-medium whitespace-nowrap">
                                ({selectedProductForQty?.stock.toFixed(2)} total)
                            </span>
                        </div>
                    </div>

                    {/* Preset Quantity Options */}
                    <div className="grid grid-cols-1 gap-3 min-w-0">
                        <button
                            onClick={() => addToCart(selectedProductForQty, 1)}
                            className="flex items-center justify-between p-4 sm:p-5 bg-white dark:bg-secondary-900 ring-2 ring-secondary-200 dark:ring-secondary-800 rounded-2xl hover:ring-primary-500 dark:hover:ring-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group min-w-0"
                        >
                            <div className="flex flex-col items-start min-w-0 mr-4">
                                <span className="font-black text-base sm:text-lg text-secondary-900 dark:text-secondary-50 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate w-full">
                                    Full {selectedProductForQty?.unit || 'Pack'}
                                </span>
                                <span className="text-xs sm:text-sm font-bold text-secondary-500 dark:text-secondary-400 mt-0.5 truncate w-full">
                                    {currency}{selectedProductForQty?.sellingPrice.toFixed(2)}
                                </span>
                            </div>
                            <span className="text-xl sm:text-2xl font-black text-secondary-400 group-hover:text-primary-500 flex-shrink-0">1.0</span>
                        </button>

                        {selectedProductForQty?.halfPrice && selectedProductForQty.halfPrice > 0 && (
                            <button
                                onClick={() => addToCart(selectedProductForQty, 0.5)}
                                className="flex items-center justify-between p-4 sm:p-5 bg-white dark:bg-secondary-900 ring-2 ring-secondary-200 dark:ring-secondary-800 rounded-2xl hover:ring-primary-500 dark:hover:ring-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group min-w-0"
                            >
                                <div className="flex flex-col items-start min-w-0 mr-4">
                                    <span className="font-black text-base sm:text-lg text-secondary-900 dark:text-secondary-50 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate w-full">
                                        Half {selectedProductForQty?.unit || 'Pack'}
                                    </span>
                                    <span className="text-xs sm:text-sm font-bold text-secondary-500 dark:text-secondary-400 mt-0.5 truncate w-full">
                                        {currency}{selectedProductForQty.halfPrice.toFixed(2)}
                                    </span>
                                </div>
                                <span className="text-xl sm:text-2xl font-black text-secondary-400 group-hover:text-primary-500 flex-shrink-0">0.5</span>
                            </button>
                        )}

                        {selectedProductForQty?.quarterPrice && selectedProductForQty.quarterPrice > 0 && (
                            <button
                                onClick={() => addToCart(selectedProductForQty, 0.25)}
                                className="flex items-center justify-between p-4 sm:p-5 bg-white dark:bg-secondary-900 ring-2 ring-secondary-200 dark:ring-secondary-800 rounded-2xl hover:ring-primary-500 dark:hover:ring-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group min-w-0"
                            >
                                <div className="flex flex-col items-start min-w-0 mr-4">
                                    <span className="font-black text-base sm:text-lg text-secondary-900 dark:text-secondary-50 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate w-full">
                                        Quarter {selectedProductForQty?.unit || 'Pack'}
                                    </span>
                                    <span className="text-xs sm:text-sm font-bold text-secondary-500 dark:text-secondary-400 mt-0.5 truncate w-full">
                                        {currency}{selectedProductForQty.quarterPrice.toFixed(2)}
                                    </span>
                                </div>
                                <span className="text-xl sm:text-2xl font-black text-secondary-400 group-hover:text-primary-500 flex-shrink-0">0.25</span>
                            </button>
                        )}
                    </div>

                    {/* Custom Quantity Section */}
                    <div className="pt-2 border-t border-secondary-200 dark:border-secondary-800 min-w-0">
                        <p className="text-[10px] sm:text-xs font-black text-secondary-400 uppercase tracking-widest mb-3">Custom Quantity</p>
                        <div className="flex gap-2 sm:gap-3 min-w-0">
                            <input
                                type="number"
                                step={selectedProductForQty?.quarterPrice ? "0.25" : selectedProductForQty?.halfPrice ? "0.5" : "1"}
                                placeholder="0.00"
                                className="flex-1 min-w-0 px-4 sm:px-5 py-3 sm:py-4 text-base sm:text-lg bg-secondary-50 dark:bg-secondary-800 border-none ring-2 ring-secondary-200 dark:ring-secondary-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-bold text-secondary-900 dark:text-secondary-50 placeholder:text-secondary-400"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = parseFloat((e.target as HTMLInputElement).value);
                                        if (val > 0) addToCart(selectedProductForQty, val);
                                    }
                                }}
                            />
                            <Button
                                onClick={(e) => {
                                    const input = (e.currentTarget.previousSibling as HTMLInputElement);
                                    const val = parseFloat(input.value);
                                    if (val > 0) addToCart(selectedProductForQty, val);
                                }}
                                size="lg"
                                className="px-6 sm:px-8 flex-shrink-0"
                            >
                                Add
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Success Modal */}

            {/* Success Modal */}
            <Modal
                isOpen={isSuccessOpen}
                onClose={() => setIsSuccessOpen(false)}
                title="Sale Completed"
                size="sm"
            >
                <div className="flex flex-col items-center text-center py-6">
                    <div className="w-20 h-20 bg-success-100 dark:bg-success-900/20 text-success-600 dark:text-success-400 rounded-full flex items-center justify-center mb-6 animate-in zoom-in-50 duration-500">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h3 className="text-2xl font-black text-secondary-900 dark:text-secondary-50">Transaction Successful</h3>
                    <p className="text-secondary-500 dark:text-secondary-400 mt-2 font-medium">The sale has been recorded and inventory updated.</p>

                    {finalChangeDue > 0 && (
                        <div className="mt-6 w-full p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border-2 border-primary-100 dark:border-primary-900/50">
                            <p className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest">Change to give</p>
                            <p className="text-3xl font-black text-primary-700 dark:text-primary-300 mt-1">{currency}{finalChangeDue.toFixed(2)}</p>
                        </div>
                    )}
                    <div className="mt-8 w-full space-y-3">
                        <Button className="w-full" variant="outline" onClick={() => handlePrintReceipt(lastSale)}>
                            <Printer className="w-4 h-4 mr-2" />
                            Print Receipt
                        </Button>
                        <Button className="w-full" onClick={() => setIsSuccessOpen(false)}>New Sale</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};


