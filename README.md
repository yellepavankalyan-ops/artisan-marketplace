<<<<<<< HEAD
# artisan-marketplace

An e-commerce platform connecting rural Indian artisans directly to buyers.

## Features

- Buyer and artisan registration/login
- Artisan onboarding with KYC document upload
- Artisan profile story section and public storefront
- Product listing, admin approval, featured products, reviews, and filtering
- Buyer wishlist, cart, and Razorpay payment flow
- Admin dashboard APIs for KYC, product approvals, orders, and stats

## Project structure

- `Backend` - Express, MongoDB, Cloudinary, Razorpay APIs
- `frontend` - Vite React marketplace UI with routed pages and role dashboards

## Run

Copy `Backend/.env.example` to `Backend/.env` and fill in your real MongoDB,
Cloudinary, Razorpay, and JWT secret values.

Start the API:

```bash
cd Backend
npm install
npm run dev
```

Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step instructions to deploy
the backend to Render and the frontend to Vercel.
=======
# artisan-marketplace
>>>>>>> 95e8a1636217346ccad5ce163649875cc5b7bc22
