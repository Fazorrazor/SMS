import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { io } from 'socket.io-client';

export interface Product {
    id: string;
    name: string;
    sku: string;
    category: string;
    sellingPrice: number;
    halfPrice?: number;
    quarterPrice?: number;
    costPrice: number;
    stock: number;
    unit: string;
}

export interface Sale {
    id: string;
    items: { productId: string; name: string; quantity: number; price: number; costPrice?: number }[];
    total: number;
    timestamp: number;
    paymentMethod: 'Cash' | 'Card' | 'Transfer';
}

interface ProductContextType {
    products: Product[];
    sales: Sale[];
    addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
    bulkAddProducts: (products: Omit<Product, 'id'>[]) => Promise<void>;
    updateProduct: (id: string, product: Omit<Product, 'id'>) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    updateStock: (productId: string, quantity: number) => Promise<void>;
    recordSale: (sale: Omit<Sale, 'id' | 'timestamp'>) => Promise<void>;
    voidSale: (id: string) => Promise<void>;
    isLoading: boolean;
    isOnline: boolean;
    settings: any;
    refreshData: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const API_URL = '/api';

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(true);
    const [settings, setSettings] = useState<any>(null);
    const lastFetchRef = useRef(0);

    const refreshData = useCallback(async (force = false) => {
        const now = Date.now();
        if (!force && now - lastFetchRef.current < 5000) return;

        try {
            const [productsRes, salesRes, settingsRes] = await Promise.all([
                fetch(`${API_URL}/products`),
                fetch(`${API_URL}/sales`),
                fetch(`${API_URL}/settings`)
            ]);

            if (productsRes.ok && salesRes.ok && settingsRes.ok) {
                const [productsData, salesData, settingsData] = await Promise.all([
                    productsRes.json(),
                    salesRes.json(),
                    settingsRes.json()
                ]);
                setProducts(productsData);
                setSales(salesData);
                setSettings(settingsData);
                lastFetchRef.current = now;
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshData(true);

        const socket = io();

        socket.on('connect', () => {
            setIsOnline(true);
        });

        socket.on('disconnect', () => {
            setIsOnline(false);
        });

        socket.on('connect_error', () => {
            setIsOnline(false);
        });

        socket.on('sale_completed', (sale) => {
            refreshData(true);
            const productNames = sale.items.map((i: any) => i.name).join(', ');
            toast.success(`Sale: ${productNames}`, {
                description: `Total: ${sale.total.toFixed(2)}`,
                duration: 5000
            });
        });

        socket.on('sale_voided', (saleId: string) => {
            refreshData(true);
            toast.info(`Sale Voided: ${saleId}`);
        });

        socket.on('product_updated', () => {
            refreshData(true);
        });

        socket.on('product_deleted', () => {
            refreshData(true);
        });

        return () => {
            socket.disconnect();
        };
    }, [refreshData]);

    const addProduct = async (product: Omit<Product, 'id'>) => {
        try {
            const res = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(product)
            });
            if (res.ok) {
                await refreshData(true);
                toast.success(`Product "${product.name}" added successfully`);
            } else {
                toast.error('Failed to add product');
            }
        } catch (error) {
            console.error('Failed to add product:', error);
            toast.error('Network error while adding product');
        }
    };

    const bulkAddProducts = async (products: Omit<Product, 'id'>[]) => {
        try {
            // For now, we'll add them sequentially to avoid race conditions and ensure all toasts show up
            // In a real production app, we'd have a bulk endpoint
            for (const product of products) {
                await fetch(`${API_URL}/products`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(product)
                });
            }
            await refreshData(true);
            toast.success(`Successfully added ${products.length} products`);
        } catch (error) {
            console.error('Failed to bulk add products:', error);
            toast.error('Failed to add some products');
        }
    };

    const updateProduct = async (id: string, product: Omit<Product, 'id'>) => {
        try {
            const res = await fetch(`${API_URL}/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(product)
            });
            if (res.ok) {
                await refreshData(true);
                toast.success(`Product "${product.name}" updated successfully`);
            } else {
                toast.error('Failed to update product');
            }
        } catch (error) {
            console.error('Failed to update product:', error);
            toast.error('Network error while updating product');
        }
    };

    const deleteProduct = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/products/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                const data = await res.json();
                await refreshData(true);
                toast.success(data.message || 'Product deleted');
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to delete product');
            }
        } catch (error) {
            console.error('Failed to delete product:', error);
            toast.error('Network error while deleting product');
        }
    };

    const updateStock = async (productId: string, quantity: number) => {
        try {
            const res = await fetch(`${API_URL}/products/${productId}/stock`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ quantity })
            });
            if (res.ok) {
                await refreshData(true);
            }
        } catch (error) {
            console.error('Failed to update stock:', error);
        }
    };

    const recordSale = async (sale: Omit<Sale, 'id' | 'timestamp'>) => {
        try {
            const res = await fetch(`${API_URL}/sales`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sale)
            });
            if (res.ok) {
                await refreshData(true);
                toast.success('Sale recorded successfully');
            } else {
                toast.error('Failed to record sale');
            }
        } catch (error) {
            console.error('Failed to record sale:', error);
            toast.error('Network error while recording sale');
        }
    };

    const voidSale = async (id: string) => {
        try {
            const res = await fetch(`${API_URL}/sales/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                await refreshData(true);
                toast.success('Sale voided successfully');
            } else {
                toast.error('Failed to void sale');
            }
        } catch (error) {
            console.error('Failed to void sale:', error);
            toast.error('Network error while voiding sale');
        }
    };

    return (
        <ProductContext.Provider value={{
            products,
            sales,
            addProduct,
            bulkAddProducts,
            updateProduct,
            deleteProduct,
            updateStock,
            recordSale,
            voidSale,
            isLoading,
            isOnline,
            settings,
            refreshData: () => refreshData(true)
        }}>
            {children}
        </ProductContext.Provider>
    );
};

export const useProducts = () => {
    const context = useContext(ProductContext);
    if (context === undefined) {
        throw new Error('useProducts must be used within a ProductProvider');
    }
    return context;
};



