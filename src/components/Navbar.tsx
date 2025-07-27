import React, { useState } from 'react';
import { ShoppingCart, User, Search, Menu, X, Heart, Package } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';

interface NavbarProps {
  onAuthClick: () => void;
  onCartClick: () => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
}

export function Navbar({ onAuthClick, onCartClick, onSearchChange, searchQuery }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { cartCount } = useCart();

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-blue-600">ShopHub</h1>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:block flex-1 max-w-lg mx-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search products..."
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                  <Heart className="h-6 w-6" />
                </button>
                <button
                  onClick={onCartClick}
                  className="p-2 text-gray-600 hover:text-blue-600 transition-colors relative"
                >
                  <ShoppingCart className="h-6 w-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>
                {profile?.is_admin && (
                  <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <Package className="h-6 w-6" />
                  </button>
                )}
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors">
                    <User className="h-6 w-6" />
                    <span className="text-sm font-medium">{profile?.full_name || 'Account'}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200">
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <button
                onClick={onAuthClick}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search products..."
            />
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {user ? (
              <>
                <div className="flex items-center px-3 py-2 text-gray-700">
                  <User className="h-5 w-5 mr-3" />
                  <span>{profile?.full_name || 'Account'}</span>
                </div>
                <button
                  onClick={onCartClick}
                  className="flex items-center w-full px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <ShoppingCart className="h-5 w-5 mr-3" />
                  <span>Cart ({cartCount})</span>
                </button>
                <button className="flex items-center w-full px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors">
                  <Heart className="h-5 w-5 mr-3" />
                  <span>Favorites</span>
                </button>
                {profile?.is_admin && (
                  <button className="flex items-center w-full px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <Package className="h-5 w-5 mr-3" />
                    <span>Admin</span>
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onAuthClick();
                  setIsMenuOpen(false);
                }}
                className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}