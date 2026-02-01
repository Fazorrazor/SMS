# Sales & Reports Implementation Task List

## 1. Sales Component Enhancements (`src/pages/Sales.tsx`)
- [x] Basic layout with header and stats.
- [x] Revenue trend chart (last 7 days).
- [x] Transaction history table.
- [x] **Search & Filter**: Implement search by Order ID and filter by payment method.
- [x] **Date Range Selector**: Implement a functional date range picker (Today, Yesterday, Last 7 Days, Last 30 Days, Custom).
- [x] **Sale Details Modal**: Create a modal to view all items, prices, and quantities for a selected transaction.
- [x] **Export Functionality**: Implement CSV export for the current view of transactions (Enhanced with detailed metrics).
- [x] **Void Sale**: Add ability to void/delete a sale (restores stock).

## 2. Reports Component (New Features)
- [x] **Daily Sales Summary**: A view that groups sales by date to show:
    - Total items sold per day.
    - Total revenue per day.
    - [x] Total profit per day (Revenue - Cost).
- [x] **Product Performance**:
    - Top selling products by quantity.
    - Top revenue-generating products.
- [x] **Category Analysis**: Revenue breakdown by product category.
- [x] **Inventory Valuation**: Total value of current stock (Cost price vs Selling price).

## 3. Backend Enhancements (`server/index.js`)
- [x] **Void Sale Endpoint**: `DELETE /api/sales/:id` that also increments product stock.
- [x] **Advanced Filtering**: Support date range filtering in `GET /api/sales`.
- [x] **Reports Endpoint**: Dedicated endpoint for aggregated report data.

## 4. UI/UX Polishing
- [x] Add loading states for report generation.
- [x] Improve chart tooltips and interactivity.
- [x] Ensure mobile responsiveness for all report tables.
