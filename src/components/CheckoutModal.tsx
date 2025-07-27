import React from 'react';
import { X, CreditCard, MapPin, Package } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import toast from 'react-hot-toast';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const checkoutSchema = yup.object({
  fullName: yup.string().required('Full name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  address: yup.string().required('Address is required'),
  city: yup.string().required('City is required'),
  postalCode: yup.string().required('Postal code is required'),
  country: yup.string().required('Country is required'),
});

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, profile } = useAuth();

  const form = useForm({
    resolver: yupResolver(checkoutSchema),
    defaultValues: {
      fullName: profile?.full_name || '',
      email: profile?.email || '',
      address: '',
      city: '',
      postalCode: '',
      country: '',
    },
  });

  const handleCheckout = async (data: any) => {
    if (!user || !isSupabaseConfigured()) {
      toast.error('Please connect to Supabase first');
      return;
    }

    try {
      // Create order
      const { data: order, error: orderError } = await supabase!
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: cartTotal,
          shipping_address: {
            fullName: data.fullName,
            address: data.address,
            city: data.city,
            postalCode: data.postalCode,
            country: data.country,
          },
          status: 'confirmed',
          payment_status: 'paid',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const { error: itemsError } = await supabase!
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update product stock
      for (const item of cartItems) {
        const { error: stockError } = await supabase!
          .from('products')
          .update({
            stock_quantity: item.product.stock_quantity - item.quantity,
          })
          .eq('id', item.product_id);

        if (stockError) throw stockError;
      }

      // Clear cart
      await clearCart();

      toast.success('Order placed successfully!');
      onClose();
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to place order');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Checkout
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Order Summary */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
            <div className="space-y-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.product.name} x {item.quantity}</span>
                  <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total:</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Form */}
          <form onSubmit={form.handleSubmit(handleCheckout)} className="space-y-4">
            <div className="flex items-center mb-4">
              <MapPin className="h-5 w-5 mr-2 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Shipping Address</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  {...form.register('fullName')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {form.formState.errors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  {...form.register('email')}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {form.formState.errors.email && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                {...form.register('address')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {form.formState.errors.address && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  {...form.register('city')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {form.formState.errors.city && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  {...form.register('postalCode')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {form.formState.errors.postalCode && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.postalCode.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  {...form.register('country')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {form.formState.errors.country && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.country.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center mt-6 mb-4">
              <CreditCard className="h-5 w-5 mr-2 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Payment</h3>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                This is a demo checkout. In a real application, you would integrate with a payment processor like Stripe.
              </p>
            </div>

            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center"
            >
              {form.formState.isSubmitting ? (
                'Processing...'
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Place Order - ${cartTotal.toFixed(2)}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}