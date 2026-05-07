# Smart Recommendation

**AI-powered electronics recommendation & e-commerce platform for students.**

Smart Recommendation helps students discover the right tech (laptops, headphones, tablets, monitors, keyboards, mice, GPUs, storage) based on their **faculty**, **study year**, **budget**, **usage type**, and **brand preferences** — all priced in **EGP**.

---

## ✨ Features

### 🧠 Intelligent Recommendation System
- Personalized scoring engine (v2): `faculty × 3 + category × 2 + budget × 2 + usage × 2 + popularity + rating × 2 + behavior signals`
- Sections: *Recommended for You*, *Top Picks for Your Faculty*, *Best for Your Budget*, *Trending Now*
- Behavioral tracking via product views, clicks, and cart events

### 🛒 Full E-Commerce Logic
- Product catalog with categories, tags, ratings, and stock
- Shopping cart, checkout, and order history
- Wishlist / favorites
- Stock automatically decreases on order, restores on cancellation
- Revenue updated in real time

### 👑 Admin Dashboard
- KPI cards: Conversion Rate, AOV, Cancellation Rate, Revenue Growth (MoM), Stock Turnover
- Charts: Revenue over time, Orders per day, Top products, Category distribution
- Conversion funnel: Views → Clicks → Cart → Orders
- Low-stock alerts (≤ 5 units)
- Product, order, and user management with search & filters

### 🔐 Authentication & Roles
- Email/password authentication
- Role-based access (Admin / User) using a secure `user_roles` table with RLS
- Rich user profile (faculty, year, budget, preferred categories, usage, brand, performance priority)

---

## 🧰 Tech Stack

- **Frontend:** React 18, Vite 5, TypeScript 5, Tailwind CSS, shadcn/ui
- **Backend:** Supabase backend — Postgres, Auth, Storage, Edge Functions, RLS
- **State / Data:** TanStack Query, React Context
- **Charts:** Recharts

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# then fill in your Supabase project values

# 3. Run dev server
npm run dev

# 4. Production build
npm run build
npm run preview
```

The dev server runs on **http://localhost:8080**.

---

## 📁 Project Structure

```
src/
├── components/      # Reusable UI + layout (UserLayout, AdminLayout, ProductCard)
│   └── ui/          # shadcn/ui primitives
├── contexts/        # AuthContext, CartContext
├── hooks/           # useProducts, useOrders, useFavorites, ...
├── integrations/
│   └── supabase/    # Auto-generated client & types
├── lib/             # recommendations.ts, trackClick.ts, utils.ts
├── pages/           # Public + user pages
│   └── admin/       # Admin dashboard pages
└── index.css        # Design tokens (HSL semantic colors)
supabase/
└── migrations/      # SQL migrations
```

---

## 🖼️ Screenshots

> _Add screenshots here_

- `docs/screenshots/home.png` – Personalized homepage
- `docs/screenshots/product.png` – Product detail
- `docs/screenshots/admin.png` – Admin dashboard

---

## 🔮 Future Improvements

- AI chat assistant for product Q&A 
- Multi-language support (Arabic / English)
- Discount codes & promotional bundles
- Push notifications for order status
- Native mobile app (React Native)
- Vector-search powered semantic recommendations

---

## 📜 License

Private project — all rights reserved.
