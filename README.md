# Restaurant Order Tracker 🍽️

A mobile-first QR restaurant ordering system built with Express + SQLite backend and React frontend. Customers scan a QR code at their table to view the menu and place orders directly from their phone. Restaurant owners manage everything from a mobile-friendly admin panel.

## Features

### Customer Side (QR Menu)
- Browse menu by categories
- Add items to cart
- Place orders from table
- Real-time order status tracking (Pending → Preparing → Done)
- Offline mode support

### Admin Panel
- Mobile-first bottom tab navigation
- Dashboard with daily stats (orders, revenue)
- Live order management with status updates
- Menu CRUD (add/edit/delete items & categories)
- Table management with auto-generated QR codes
- Pro features showcase with upgrade CTA

## Tech Stack

- **Backend:** Node.js, Express, SQLite (sql.js)
- **Frontend:** React 18, Vite, React Router

## Quick Start

### Prerequisites
- Node.js 18+

### 1. Backend
```bash
cd backend
npm install
npm run dev
```
Starts API server at `http://localhost:3001`

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Starts dev server at `http://localhost:5173`

## Usage

1. Open `http://localhost:5173` → redirected to login
2. **Register** your restaurant account
3. **Menu tab** → add categories and food items
4. **Tables tab** → add tables (QR codes generated automatically)
5. Open a table's menu URL or scan its QR code to order as a customer

## Project Structure

```
backend/
├── server.js           # Express app entry
├── db.js               # SQLite setup + query helpers
├── middleware/auth.js   # JWT authentication
└── routes/
    ├── auth.js         # Register/login
    ├── menu.js         # Categories & menu items
    ├── orders.js       # Order placement & management
    └── tables.js       # Table & QR code management

frontend/
├── src/
├── ├── App.jsx         # Routing
│   ├── index.css       # Mobile-first design system
│   ├── context/AuthContext.jsx
│   └── pages/
│       ├── CustomerMenu.jsx      # QR menu with cart
│       ├── OrderConfirmation.jsx # Status steps
│       ├── AdminLogin.jsx
│       ├── AdminHome.jsx         # Dashboard
│       ├── AdminOrders.jsx       # Order management
│       ├── AdminMenu.jsx         # Menu CRUD
│       ├── AdminTables.jsx       # Tables + QR
│       └── AdminSettings.jsx     # Pro features
└── components/
    └── AdminMobileLayout.jsx     # Bottom nav
```
