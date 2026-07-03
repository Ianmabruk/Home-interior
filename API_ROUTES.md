# HOK Interior Designs API Routes

Base URL: `/api`

## Health
- `GET /health`

## Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/forgot-password`
- `POST /auth/reset-password/:token`

## Products
- `GET /products`
- `GET /products/:id`
- `POST /products` (admin, multipart `images[]`)
- `PATCH /products/:id` (admin)
- `DELETE /products/:id` (admin)

## Content
- `GET /content/homepage`
- `GET /content/projects`
- `POST /content/projects` (admin, multipart `media` with `resourceType=video`)
- `PATCH /content/projects/:id` (admin)
- `DELETE /content/projects/:id` (admin)

- `GET /content/portfolio`
- `POST /content/portfolio` (admin, multipart `media`)
- `PATCH /content/portfolio/:id` (admin)
- `DELETE /content/portfolio/:id` (admin)

- `GET /content/about`
- `PUT /content/about` (admin, multipart `media` optional)

- `GET /content/virtual-design`
- `POST /content/virtual-design` (admin, multipart `media` with `resourceType=video`)
- `PATCH /content/virtual-design/:id` (admin)
- `DELETE /content/virtual-design/:id` (admin)

## Orders
- `POST /orders` (auth)
- `GET /orders/me` (auth)
- `GET /orders` (admin)

## Users
- `GET /users/me` (auth)
- `PATCH /users/me` (auth)
- `GET /users/wishlist` (auth)
- `POST /users/wishlist/toggle` (auth)

## Admin
- `GET /admin/overview` (admin)
- `GET /admin/messages` (admin)

## Messages
- `POST /messages`
