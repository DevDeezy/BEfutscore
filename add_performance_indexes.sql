-- Performance indexes for common queries (PostgreSQL)
-- Safe to run multiple times thanks to IF NOT EXISTS

-- Optional: enable trigram search for fast ILIKE
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- products
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_product_type_id
  ON products (product_type_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_product_type_id_id_desc
  ON products (product_type_id, id DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_name_trgm
  ON products USING GIN (lower(name) gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_description_trgm
  ON products USING GIN (lower(description) gin_trgm_ops);

-- product_types (hierarchy lookups)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_types_parent_id
  ON product_types (parent_id);

-- orders
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_id_created_at_desc
  ON orders (user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_at_desc
  ON orders (created_at DESC);

-- orderitems
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orderitems_order_id
  ON orderitems (order_id);

-- packs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_packs_created_at_desc
  ON packs (created_at DESC);

-- packitems
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_packitems_pack_id
  ON packitems (pack_id);

-- patches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patches_active_name
  ON patches (active, name);

-- users
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at_desc
  ON users (created_at DESC);

-- addresses (note camelCase column)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_addresses_userId_id_desc
  ON addresses ("userId", id DESC);

-- notifications (note camelCase userId)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_userId_created_at_desc
  ON notifications ("userId", created_at DESC);

-- payment_methods
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_methods_userId_default_created_at
  ON payment_methods ("userId", isDefault DESC, created_at DESC);

-- pricing_config
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pricing_config_name
  ON pricing_config (name);


