# HOK Interior Designs Architecture

## Frontend Structure

- `src/app`: App router and protected route logic
- `src/components/layout`: Navbar, Footer, global layout shell
- `src/components/common`: Shared UI primitives
- `src/components/shop`: Product card and shop-facing components
- `src/context`: Auth and shop global state
- `src/pages/public`: Home, shop, about, virtual design, product detail
- `src/pages/auth`: Login, register, forgot/reset password
- `src/pages/account`: User account and order history
- `src/pages/admin`: Admin dashboard overview
- `src/services`: Axios API client with JWT refresh interceptor
- `src/utils`: App constants and helpers

## Backend Structure

- `server/src/config`: Environment, DB, Cloudinary, SendGrid configs
- `server/src/controllers`: Domain controllers
- `server/src/routes`: Route modules and API index router
- `server/src/models`: (none — schemas are defined in `server/prisma/schema.prisma` via Prisma + PostgreSQL/Neon)
- `server/src/middleware`: Auth, validation, error handling
- `server/src/services`: Cloudinary upload service
- `server/src/utils`: Tokens, async wrapper, API error class

## Data Models

- `User`: role-based auth, addresses, wishlist refs
- `Product`: catalog, category, SKU, stock, pricing, media
- `Project`: video-driven homepage hero project entries
- `Portfolio`: media gallery tiles
- `About`: single source about content block
- `VirtualDesign`: virtual service content and media
- `Order`: user orders with normalized items
- `Wishlist`: user wishlist product refs
- `Message`: contact/work-with-us submissions
- `Analytics`: dashboard charts dataset
- `Settings`: site-level operational config

## Integration Flow

- Admin uploads content via protected backend routes.
- Uploaded media is sent to Cloudinary and stored with secure URL + public ID.
- Public endpoints (`/content/homepage`, `/products`, `/content/*`) drive frontend sections.
- New admin uploads automatically appear in homepage/shop/public pages without manual sync.
