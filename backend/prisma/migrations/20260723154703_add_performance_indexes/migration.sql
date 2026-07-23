-- CreateIndex
CREATE INDEX "abouts_created_at_idx" ON "abouts"("created_at");

-- CreateIndex
CREATE INDEX "consultations_status_created_at_idx" ON "consultations"("status", "created_at");

-- CreateIndex
CREATE INDEX "consultations_email_created_at_idx" ON "consultations"("email", "created_at");

-- CreateIndex
CREATE INDEX "hero_media_is_active_display_order_idx" ON "hero_media"("is_active", "display_order");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

-- CreateIndex
CREATE INDEX "orders_email_created_at_idx" ON "orders"("email", "created_at");

-- CreateIndex
CREATE INDEX "orders_status_created_at_idx" ON "orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "password_resets_admin_id_token_idx" ON "password_resets"("admin_id", "token");

-- CreateIndex
CREATE INDEX "portfolios_published_featured_display_order_idx" ON "portfolios"("published", "featured", "display_order");

-- CreateIndex
CREATE INDEX "portfolios_display_order_idx" ON "portfolios"("display_order");

-- CreateIndex
CREATE INDEX "products_featured_in_stock_created_at_idx" ON "products"("featured", "in_stock", "created_at");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE INDEX "services_is_active_display_order_idx" ON "services"("is_active", "display_order");

-- CreateIndex
CREATE INDEX "testimonials_is_active_display_order_idx" ON "testimonials"("is_active", "display_order");

-- CreateIndex
CREATE INDEX "virtual_designs_published_featured_created_at_idx" ON "virtual_designs"("published", "featured", "created_at");

-- CreateIndex
CREATE INDEX "virtual_designs_featured_idx" ON "virtual_designs"("featured");
