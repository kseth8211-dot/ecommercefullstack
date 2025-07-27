import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { ProductCard } from './components/ProductCard';
import { CartSidebar } from './components/CartSidebar';
import { CategoryFilter } from './components/CategoryFilter';
import { CheckoutModal } from './components/CheckoutModal';
import { useAuth } from './hooks/useAuth';
import { useCart } from './hooks/useCart';
import { supabase, Product, Category, isSupabaseConfigured } from './lib/supabase';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCartSidebar, setShowCartSidebar] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const { loading: authLoading } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, selectedCategory]);

  const fetchData = async () => {
    setLoading(true);
    
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    
    try {
      // Fetch products with categories
      const { data: productsData, error: productsError } = await supabase!
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase!
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      setProducts(productsData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category_id === selectedCategory);
    }

    setFilteredProducts(filtered);
  };

  const handleCheckout = () => {
    setShowCartSidebar(false);
    setShowCheckoutModal(true);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ShopHub...</p>
        </div>
      </div>
    );
  }

  // Show connection prompt if Supabase is not configured
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar
          onAuthClick={() => setShowAuthModal(true)}
          onCartClick={() => setShowCartSidebar(true)}
          onSearchChange={setSearchQuery}
          searchQuery={searchQuery}
        />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c0-2.21-1.79-4-4-4H7c-2.21 0-4-1.79-4-4V7c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4v10c0 2.21-1.79 4-4 4" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to ShopHub</h1>
              <p className="text-lg text-gray-600 mb-8">
                To get started with your e-commerce platform, you'll need to connect to Supabase for database functionality.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-blue-900 mb-3">Quick Setup</h2>
                <p className="text-blue-800 mb-4">
                  Click the "Connect to Supabase" button in the top right corner to set up your database and enable:
                </p>
                <ul className="text-left text-blue-800 space-y-2">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    User authentication and profiles
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Product catalog and categories
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Shopping cart and checkout
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Order management and history
                  </li>
                </ul>
              </div>
              <div className="text-sm text-gray-500">
                Once connected, your database will be automatically set up with all the necessary tables and security policies.
              </div>
            </div>
          </div>
        </main>
        
        <Toaster position="top-right" />
      </div>
    );
  }
  const featuredProducts = filteredProducts.filter(product => product.is_featured).slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        onAuthClick={() => setShowAuthModal(true)}
        onCartClick={() => setShowCartSidebar(true)}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        {!searchQuery && !selectedCategory && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg text-white p-8 mb-8">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold mb-4">Welcome to ShopHub</h1>
              <p className="text-xl mb-6">Discover amazing products at unbeatable prices</p>
              <div className="flex flex-wrap gap-4">
                <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
                  <span className="font-medium">✓ Free Shipping</span>
                </div>
                <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
                  <span className="font-medium">✓ 30-Day Returns</span>
                </div>
                <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full">
                  <span className="font-medium">✓ Secure Checkout</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* Featured Products */}
        {!searchQuery && !selectedCategory && featuredProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* All Products */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {searchQuery
                ? `Search Results for "${searchQuery}"`
                : selectedCategory
                ? `${categories.find(c => c.id === selectedCategory)?.name} Products`
                : 'All Products'}
            </h2>
            <span className="text-gray-600">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg mb-4">No products found</p>
              {(searchQuery || selectedCategory) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View All Products
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">ShopHub</h3>
              <p className="text-gray-400">
                Your one-stop destination for quality products at amazing prices.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Customer Service</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Contact Us</li>
                <li>FAQs</li>
                <li>Shipping Info</li>
                <li>Returns</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">About</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Our Story</li>
                <li>Careers</li>
                <li>Press</li>
                <li>Investors</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Facebook</li>
                <li>Twitter</li>
                <li>Instagram</li>
                <li>Newsletter</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 ShopHub. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      <CartSidebar
        isOpen={showCartSidebar}
        onClose={() => setShowCartSidebar(false)}
        onCheckout={handleCheckout}
      />

      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
      />

      <Toaster position="top-right" />
    </div>
  );
}

export default App;