# Implementation Plan: Local LAN/Desktop Sales Management System

This document outlines the step-by-step plan to build the Sales Management System based on the defined requirements.

## Phase 1: Foundation & Design System

### 1.1 Project Setup & Configuration
- [ ] **Clean & Reset**: Ensure `src` is clean (Completed).
- [ ] **Dependencies**: Install necessary packages (`react-router-dom`, `lucide-react`, `clsx`, `tailwind-merge`, `recharts`, `axios`, `date-fns`).
- [ ] **Tailwind Config**: Configure `tailwind.config.js` with the project's color palette (Professional/Premium look).
- [ ] **Global Styles**: Define base styles, typography, and CSS variables in `index.css`.

### 1.2 Core UI Primitives (Components/ui)
Build reusable, styled components to ensure consistency.
- [ ] **Button**: Variants (primary, secondary, danger, ghost), sizes (sm, md, lg).
- [ ] **Input**: Text inputs with label, error state, and icon support.
- [ ] **Card**: Container with consistent padding, shadow, and border radius.
- [ ] **Badge/Status**: For displaying stock status (Low, Out, Good) and user roles.
- [ ] **Modal**: Reusable dialog for forms and confirmations (with backdrop and animations).
- [ ] **DataTable**: A flexible table component with support for headers, rows, and potentially sorting/pagination props.

### 1.3 Layout Architecture (Components/layout)
- [ ] **MainLayout**:
    - Sidebar navigation (collapsible/responsive).
    - Top Header (User profile, logout, notifications).
    - Content area wrapper.
- [ ] **AuthLayout**:
    - Centered layout for login screens with branding.

---

## Phase 2: Authentication & User Management

### 2.1 Authentication Module
- [ ] **Login Page**:
    - Form with Email/Username and Password.
    - Validation logic.
    - Mock authentication service (initially) -> Connect to Backend later.
- [ ] **Auth Context**:
    - Manage user session state (user, role, token).
    - Protected Routes wrapper (redirect to login if unauthorized).

### 2.2 User Management (Admin Only)
- [ ] **User List Page**: Display all users.
- [ ] **Add/Edit User Modal**: Form to create users and assign roles (Admin/Cashier).

---

## Phase 3: Inventory Management

### 3.1 Product Catalog
- [ ] **Product List Page**:
    - Table displaying Name, SKU, Category, Price, Stock, Status.
    - Search and Filter functionality.
- [ ] **Product Form (Add/Edit)**:
    - Fields: Name, SKU, Category, Cost Price, Selling Price, Reorder Level, Supplier.
    - Image upload placeholder.

### 3.2 Stock Operations
- [ ] **Stock Entry (Purchase)**:
    - Form to add incoming stock from suppliers.
    - Updates "Stock on Hand".
- [ ] **Stock Adjustment**:
    - Form to log damages/shrinkage.
    - Reason codes (Damaged, Expired, Lost).

---

## Phase 4: Point of Sale (POS) Terminal

### 4.1 POS Interface
- [ ] **POS Layout**: Full-screen optimized layout.
- [ ] **Product Grid**:
    - Visual cards for products.
    - Category tabs for quick filtering.
    - Search bar (barcode scanner compatible - focuses automatically).
- [ ] **Cart Panel**:
    - List of selected items.
    - Quantity controls (+/-).
    - Remove item button.
    - Real-time Total, Tax, and Discount calculation.

### 4.2 Checkout Process
- [ ] **Checkout Modal**:
    - Payment Method selection (Cash, Card, Transfer).
    - Amount Tendered & Change Due calculation.
    - "Complete Sale" action.
- [ ] **Receipt Preview**:
    - Simple printable view of the transaction.

---

## Phase 5: Dashboard & Reporting

### 5.1 Dashboard
- [ ] **Stats Cards**:
    - Total Sales (Today).
    - Transactions Count.
    - Low Stock Alerts (Count).
- [ ] **Sales Chart**:
    - Line/Bar chart showing sales trends (using `recharts`).

### 5.2 Reports
- [ ] **Sales Report Page**:
    - Date range picker.
    - Summary table of sales.
- [ ] **Top Products**:
    - List of best-selling items by quantity/revenue.

---

## Phase 6: Backend & Database (Node.js + SQLite)

### 6.1 Server Setup
- [ ] **Express Server**: Setup `server/index.js`.
- [ ] **Database Setup**: Initialize SQLite database (`database.sqlite`).
- [ ] **Prisma/Sequelize**: Setup ORM (optional, or raw SQL) for schema management.

### 6.2 API Development
- [ ] **Auth API**: Login, Verify Token.
- [ ] **Products API**: CRUD for products.
- [ ] **Inventory API**: Stock updates, Adjustments.
- [ ] **Sales API**: Record transaction, Update stock (atomic transaction).
- [ ] **Users API**: Manage staff accounts.

### 6.3 Integration
- [ ] Connect Frontend services to Backend APIs.
- [ ] Replace mock data with real DB data.

---

## Phase 7: Polish & Deployment

### 7.1 Final Polish
- [ ] **Error Handling**: Graceful error messages (Toast notifications).
- [ ] **Loading States**: Skeletons or spinners during data fetch.
- [ ] **Responsive Check**: Ensure tablet/desktop compatibility.

### 7.2 Offline/Local Setup
- [ ] **Electron (Optional)**: Wrap for desktop app experience.
- [ ] **Network Access**: Instructions for accessing via LAN IP.
