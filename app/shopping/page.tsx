'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { 
  ShoppingCart, 
  ArrowLeft,
  Store,
  TrendingDown,
  MapPin,
  Search,
  Filter,
  Star,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Percent
} from 'lucide-react';
import Link from 'next/link';

interface StorePrice {
  storeName: string;
  location: string;
  price: number;
  distance: string;
  rating: number;
  inStock: boolean;
}

interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  averagePrice: number;
  lowestPrice: number;
  highestPrice: number;
  savings: number;
  stores: StorePrice[];
  emoji: string;
}

export default function Shopping() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    // Mock product data with price comparisons
    // In production, this would come from a real price comparison API or database
    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'Maize Flour (White)',
        category: 'food',
        unit: 'kg',
        averagePrice: 450,
        lowestPrice: 420,
        highestPrice: 480,
        savings: 60,
        emoji: '🌽',
        stores: [
          { storeName: 'Shoprite Blantyre', location: 'Chichiri', price: 420, distance: '2.5km', rating: 4.5, inStock: true },
          { storeName: 'Chipiku Stores', location: 'Limbe', price: 435, distance: '3.1km', rating: 4.2, inStock: true },
          { storeName: 'Game Stores', location: 'Blantyre CBD', price: 450, distance: '1.8km', rating: 4.3, inStock: true },
          { storeName: 'People\'s Supermarket', location: 'Limbe', price: 480, distance: '3.5km', rating: 3.9, inStock: false }
        ]
      },
      {
        id: '2',
        name: 'Cooking Oil (5L)',
        category: 'food',
        unit: 'bottle',
        averagePrice: 18200,
        lowestPrice: 17500,
        highestPrice: 19000,
        savings: 1500,
        emoji: '🫗',
        stores: [
          { storeName: 'Chipiku Stores', location: 'Limbe', price: 17500, distance: '3.1km', rating: 4.2, inStock: true },
          { storeName: 'Shoprite Blantyre', location: 'Chichiri', price: 17800, distance: '2.5km', rating: 4.5, inStock: true },
          { storeName: 'Game Stores', location: 'Blantyre CBD', price: 18500, distance: '1.8km', rating: 4.3, inStock: true },
          { storeName: 'Choppies', location: 'Limbe', price: 19000, distance: '3.8km', rating: 4.0, inStock: true }
        ]
      },
      {
        id: '3',
        name: 'Sugar (Brown)',
        category: 'food',
        unit: 'kg',
        averagePrice: 1480,
        lowestPrice: 1450,
        highestPrice: 1520,
        savings: 70,
        emoji: '🍬',
        stores: [
          { storeName: 'Shoprite Blantyre', location: 'Chichiri', price: 1450, distance: '2.5km', rating: 4.5, inStock: true },
          { storeName: 'People\'s Supermarket', location: 'Limbe', price: 1470, distance: '3.5km', rating: 3.9, inStock: true },
          { storeName: 'Game Stores', location: 'Blantyre CBD', price: 1490, distance: '1.8km', rating: 4.3, inStock: true },
          { storeName: 'Chipiku Stores', location: 'Limbe', price: 1520, distance: '3.1km', rating: 4.2, inStock: false }
        ]
      },
      {
        id: '4',
        name: 'Rice (White)',
        category: 'food',
        unit: 'kg',
        averagePrice: 1180,
        lowestPrice: 1120,
        highestPrice: 1250,
        savings: 130,
        emoji: '🍚',
        stores: [
          { storeName: 'Chipiku Stores', location: 'Limbe', price: 1120, distance: '3.1km', rating: 4.2, inStock: true },
          { storeName: 'Shoprite Blantyre', location: 'Chichiri', price: 1150, distance: '2.5km', rating: 4.5, inStock: true },
          { storeName: 'Choppies', location: 'Limbe', price: 1200, distance: '3.8km', rating: 4.0, inStock: true },
          { storeName: 'Game Stores', location: 'Blantyre CBD', price: 1250, distance: '1.8km', rating: 4.3, inStock: true }
        ]
      },
      {
        id: '5',
        name: 'Bread (White Loaf)',
        category: 'food',
        unit: 'loaf',
        averagePrice: 920,
        lowestPrice: 850,
        highestPrice: 1000,
        savings: 150,
        emoji: '🍞',
        stores: [
          { storeName: 'People\'s Supermarket', location: 'Limbe', price: 850, distance: '3.5km', rating: 3.9, inStock: true },
          { storeName: 'Shoprite Blantyre', location: 'Chichiri', price: 900, distance: '2.5km', rating: 4.5, inStock: true },
          { storeName: 'Chipiku Stores', location: 'Limbe', price: 950, distance: '3.1km', rating: 4.2, inStock: true },
          { storeName: 'Game Stores', location: 'Blantyre CBD', price: 1000, distance: '1.8km', rating: 4.3, inStock: true }
        ]
      },
      {
        id: '6',
        name: 'Tomatoes',
        category: 'food',
        unit: 'kg',
        averagePrice: 820,
        lowestPrice: 750,
        highestPrice: 900,
        savings: 150,
        emoji: '🍅',
        stores: [
          { storeName: 'Local Market', location: 'Limbe Market', price: 750, distance: '2.8km', rating: 4.0, inStock: true },
          { storeName: 'Shoprite Blantyre', location: 'Chichiri', price: 800, distance: '2.5km', rating: 4.5, inStock: true },
          { storeName: 'Chipiku Stores', location: 'Limbe', price: 850, distance: '3.1km', rating: 4.2, inStock: true },
          { storeName: 'Game Stores', location: 'Blantyre CBD', price: 900, distance: '1.8km', rating: 4.3, inStock: false }
        ]
      }
    ];

    setProducts(mockProducts);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const categories = [
    { value: 'all', label: 'All Products' },
    { value: 'food', label: 'Food & Groceries' },
    { value: 'household', label: 'Household Items' }
  ];

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalSavings = filteredProducts.reduce((sum, product) => sum + product.savings, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link 
              href="/dashboard" 
              className="mr-4 p-2 hover:bg-white/10 rounded-lg transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="flex items-center">
              <ShoppingCart className="w-6 h-6 text-green-400 mr-2" />
              <h2 className="text-2xl font-bold text-white">Smart Shopping</h2>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-green-400">
            <TrendingDown className="w-5 h-5" />
            <span className="font-semibold">Save up to K{totalSavings.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Savings Alert */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6 flex items-start">
          <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-green-300 font-medium mb-1">Smart Savings Available!</p>
            <p className="text-white/70 text-sm">
              You can save up to K{totalSavings.toLocaleString()} by choosing the best prices across stores. Shop smart and beat inflation!
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex gap-2">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-3 rounded-xl border transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => {
            const savingsPercent = ((product.savings / product.highestPrice) * 100).toFixed(0);
            const bestStore = product.stores.sort((a, b) => a.price - b.price)[0];

            return (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-4xl mr-3">{product.emoji}</span>
                    <div>
                      <h3 className="text-white font-semibold">{product.name}</h3>
                      <p className="text-white/40 text-sm">Per {product.unit}</p>
                    </div>
                  </div>
                  <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-1">
                    <span className="text-green-400 font-semibold text-sm">-{savingsPercent}%</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-white/60 text-sm">Best Price</span>
                    <span className="text-2xl font-bold text-green-400">K{bestStore.price.toLocaleString()}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-white/60 text-sm">Average</span>
                    <span className="text-white/40 line-through">K{product.averagePrice.toLocaleString()}</span>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-white/60">
                      <Store className="w-4 h-4 mr-1" />
                      {bestStore.storeName}
                    </div>
                    <div className="flex items-center text-white/60">
                      <MapPin className="w-4 h-4 mr-1" />
                      {bestStore.distance}
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <span className="text-green-400 font-semibold text-sm">
                      Save K{product.savings.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Shopping Tips */}
        <div className="mt-8 bg-gradient-to-r from-violet-500/20 to-purple-500/20 backdrop-blur border border-violet-400/30 rounded-xl p-6">
          <h4 className="text-white font-semibold mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-violet-400" />
            Smart Shopping Tips
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <div className="w-2 h-2 rounded-full bg-violet-400 mt-2 mr-3 flex-shrink-0"></div>
              <p className="text-white/80 text-sm">Compare prices before shopping - save up to 25%</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 rounded-full bg-violet-400 mt-2 mr-3 flex-shrink-0"></div>
              <p className="text-white/80 text-sm">Buy in bulk when prices drop to hedge against inflation</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 rounded-full bg-violet-400 mt-2 mr-3 flex-shrink-0"></div>
              <p className="text-white/80 text-sm">Local markets often have better prices for fresh produce</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 rounded-full bg-violet-400 mt-2 mr-3 flex-shrink-0"></div>
              <p className="text-white/80 text-sm">Shop early morning for best selection and prices</p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedProduct(null)}>
          <div className="bg-gradient-to-br from-indigo-900/95 to-purple-900/95 border border-white/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center">
                <span className="text-5xl mr-4">{selectedProduct.emoji}</span>
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedProduct.name}</h3>
                  <p className="text-white/60">Price comparison across stores</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <span className="text-white text-2xl">&times;</span>
              </button>
            </div>

            <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm mb-1">You can save</p>
                  <p className="text-3xl font-bold text-green-400">K{selectedProduct.savings.toLocaleString()}</p>
                </div>
                <div className="bg-green-500/20 rounded-full px-4 py-2">
                  <span className="text-green-400 font-bold text-xl">
                    {((selectedProduct.savings / selectedProduct.highestPrice) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            <h4 className="text-white font-semibold mb-4">Store Prices</h4>
            <div className="space-y-3">
              {selectedProduct.stores.sort((a, b) => a.price - b.price).map((store, index) => (
                <div key={index} className={`border rounded-xl p-4 ${
                  index === 0 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-white/5 border-white/10'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="flex items-center">
                        <h5 className="text-white font-semibold">{store.storeName}</h5>
                        {index === 0 && (
                          <span className="ml-2 bg-green-500/30 text-green-300 text-xs px-2 py-1 rounded-full">
                            Best Price
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-white/60 text-sm mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {store.location} • {store.distance}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">K{store.price.toLocaleString()}</p>
                      <div className="flex items-center text-yellow-400 text-sm">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        {store.rating}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${store.inStock ? 'text-green-400' : 'text-red-400'}`}>
                      {store.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                    </span>
                    {index > 0 && (
                      <span className="text-white/60 text-sm">
                        +K{(store.price - selectedProduct.stores[0].price).toLocaleString()} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}