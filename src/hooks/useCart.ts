import { useState, useEffect } from 'react';
import { supabase, CartItem, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user && isSupabaseConfigured()) {
      fetchCartItems();
    } else {
      setCartItems([]);
    }
  }, [user]);

  const fetchCartItems = async () => {
    if (!user || !isSupabaseConfigured()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase!
        .from('cart_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error('Error fetching cart items:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!user || !isSupabaseConfigured()) {
      toast.error('Please sign in to add items to cart');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .upsert({
          user_id: user.id,
          product_id: productId,
          quantity,
        })
        .select(`
          *,
          product:products(*)
        `)
        .single();

      if (error) throw error;

      // Update local state
      const existingIndex = cartItems.findIndex(item => item.product_id === productId);
      if (existingIndex >= 0) {
        const newItems = [...cartItems];
        newItems[existingIndex] = data;
        setCartItems(newItems);
      } else {
        setCartItems([...cartItems, data]);
      }

      toast.success('Added to cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user || !isSupabaseConfigured()) return;

    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    try {
      const { data, error } = await supabase!
        .from('cart_items')
        .update({ quantity })
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .select(`
          *,
          product:products(*)
        `)
        .single();

      if (error) throw error;

      // Update local state
      const newItems = cartItems.map(item =>
        item.product_id === productId ? data : item
      );
      setCartItems(newItems);
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user || !isSupabaseConfigured()) return;

    try {
      const { error } = await supabase!
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;

      // Update local state
      setCartItems(cartItems.filter(item => item.product_id !== productId));
      toast.success('Removed from cart');
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove from cart');
    }
  };

  const clearCart = async () => {
    if (!user || !isSupabaseConfigured()) return;

    try {
      const { error } = await supabase!
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    }
  };

  const cartTotal = cartItems.reduce(
    (total, item) => total + (item.product.price * item.quantity),
    0
  );

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return {
    cartItems,
    loading,
    cartTotal,
    cartCount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };
}