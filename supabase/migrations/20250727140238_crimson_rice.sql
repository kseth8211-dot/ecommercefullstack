/*
  # E-Commerce Platform Database Schema

  1. New Tables
    - `profiles` - User profile information extending Supabase auth
    - `categories` - Product categories for organization
    - `products` - Main product catalog with inventory
    - `cart_items` - Shopping cart functionality
    - `orders` - Order management and history
    - `order_items` - Individual items within orders
    - `favorites` - User wishlist functionality

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Admin-only policies for product management
*/

-- User profiles extending Supabase auth
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Products catalog
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  image_url text,
  images text[] DEFAULT '{}',
  stock_quantity integer DEFAULT 0 CHECK (stock_quantity >= 0),
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  rating decimal(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  review_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Shopping cart
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  total_amount decimal(10,2) NOT NULL CHECK (total_amount >= 0),
  shipping_address jsonb NOT NULL,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now()
);

-- User favorites/wishlist
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Categories policies (public read, admin write)
CREATE POLICY "Anyone can read categories"
  ON categories FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  ));

-- Products policies (public read, admin write)
CREATE POLICY "Anyone can read active products"
  ON products FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  ));

-- Cart policies
CREATE POLICY "Users can manage own cart"
  ON cart_items FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Users can read own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  ));

-- Order items policies
CREATE POLICY "Users can read own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders 
    WHERE id = order_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create order items for own orders"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders 
    WHERE id = order_id AND user_id = auth.uid()
  ));

CREATE POLICY "Admins can read all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND is_admin = true
  ));

-- Favorites policies
CREATE POLICY "Users can manage own favorites"
  ON favorites FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert sample categories
INSERT INTO categories (name, description, image_url) VALUES
('Electronics', 'Latest gadgets and electronic devices', 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg'),
('Clothing', 'Fashion and apparel for all occasions', 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg'),
('Home & Garden', 'Everything for your home and garden', 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'),
('Books', 'Books and educational materials', 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg'),
('Sports', 'Sports equipment and fitness gear', 'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg');

-- Insert sample products
INSERT INTO products (name, description, price, category_id, image_url, stock_quantity, is_featured, rating, review_count) VALUES
('Wireless Headphones', 'Premium wireless headphones with noise cancellation', 199.99, (SELECT id FROM categories WHERE name = 'Electronics'), 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg', 50, true, 4.5, 128),
('Smart Watch', 'Advanced fitness tracking and smart notifications', 299.99, (SELECT id FROM categories WHERE name = 'Electronics'), 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg', 30, true, 4.3, 89),
('Laptop Computer', 'High-performance laptop for work and gaming', 1299.99, (SELECT id FROM categories WHERE name = 'Electronics'), 'https://images.pexels.com/photos/18105/pexels-photo.jpg', 15, true, 4.7, 245),
('Designer T-Shirt', 'Premium cotton t-shirt with modern design', 29.99, (SELECT id FROM categories WHERE name = 'Clothing'), 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg', 100, false, 4.2, 67),
('Running Shoes', 'Comfortable running shoes for daily exercise', 89.99, (SELECT id FROM categories WHERE name = 'Clothing'), 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg', 75, true, 4.6, 156),
('Coffee Maker', 'Automatic coffee maker with programmable features', 149.99, (SELECT id FROM categories WHERE name = 'Home & Garden'), 'https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg', 25, false, 4.1, 93),
('Programming Book', 'Complete guide to modern web development', 49.99, (SELECT id FROM categories WHERE name = 'Books'), 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg', 200, false, 4.8, 312),
('Yoga Mat', 'Premium non-slip yoga mat for home workouts', 39.99, (SELECT id FROM categories WHERE name = 'Sports'), 'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg', 80, false, 4.4, 178);