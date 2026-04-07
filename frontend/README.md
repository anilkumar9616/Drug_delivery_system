# Drug Delivery Platform - React Frontend

A modern, responsive React frontend for the Drug Delivery E-commerce Platform. Built with React 18, React Router v6, and Axios for API communication.

## Features

✅ **User Authentication**
- Register new accounts with password validation
- Login with email and password
- JWT token management with refresh tokens
- Automatic token refresh on API calls
- Secure logout

✅ **Medicine Browsing**
- Search medicines by name
- Filter by price range
- Filter by prescription requirement
- View stock availability
- Add medicines to cart

✅ **Shopping Cart**
- Add/remove medicines from cart
- Update quantities
- Persistent cart storage (localStorage)
- Real-time cart summary

✅ **Checkout & Orders**
- Select delivery address
- Review order summary
- Create orders with automatic calculation of tax (18%)
- Order confirmation
- View order history

✅ **Order Tracking**
- View all orders with status
- Real-time delivery tracking
- Visual timeline of delivery status
- Order details modal

✅ **Responsive Design**
- Mobile-first approach
- Bootstrap 5 integration
- Works on all screen sizes
- Touch-friendly interface

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **React 18** | UI library |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP client for API calls |
| **Bootstrap 5** | CSS framework |
| **CSS3** | Custom styling & animations |
| **Context API** | State management (Auth) |
| **localStorage** | Persistent cart storage |

---

## Project Structure

```
frontend/
├── public/
│   └── index.html                 # HTML template
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── Login.js          # Login component
│   │   │   ├── Register.js       # Registration component
│   │   │   └── Auth.css          # Auth styling
│   │   ├── Medicines/
│   │   │   ├── MedicineList.js   # Browse medicines
│   │   │   └── Medicines.css     # Medicines styling
│   │   ├── Orders/
│   │   │   ├── OrderList.js      # View orders
│   │   │   └── Orders.css        # Orders styling
│   │   ├── Deliveries/
│   │   │   ├── DeliveryTracker.js # Track deliveries
│   │   │   └── Deliveries.css    # Deliveries styling
│   │   ├── Layout/
│   │   │   ├── Navbar.js         # Navigation bar
│   │   │   ├── Navbar.css        # Navbar styling
│   │   │   ├── Footer.js         # Footer component
│   │   │   └── Footer.css        # Footer styling
│   │   └── ProtectedRoute.js     # Route protection wrapper
│   ├── context/
│   │   └── AuthContext.js         # Authentication state (useAuth hook)
│   ├── pages/
│   │   ├── Home.js               # Home/landing page
│   │   ├── Home.css              # Home styling
│   │   ├── Checkout.js           # Checkout page
│   │   └── Checkout.css          # Checkout styling
│   ├── services/
│   │   └── api.js                # API service layer with axios
│   ├── App.js                    # Main app with routing
│   ├── index.js                  # React entry point
│   └── index.html                # HTML root element
├── package.json                  # Dependencies and scripts
├── .env.example                  # Environment variables template
└── README.md                     # This file
```

---

## Installation & Setup

### Prerequisites
- Node.js 14+ and npm 6+
- Running backend API Gateway on http://localhost:4000

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

### Step 2: Configure Environment

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
REACT_APP_API_URL=http://localhost:4000
REACT_APP_ENV=development
REACT_APP_TITLE=Drug Delivery Platform
```

### Step 3: Start Development Server

```bash
npm start
```

The app will open at `http://localhost:3000`

---

## Available Scripts

```bash
# Start development server
npm start

# Build for production
npm build

# Run tests
npm test

# Eject configuration (irreversible)
npm eject
```

---

## Usage Guide

### User Flow

#### 1. **Authentication**
```
Landing Page → Register/Login → Dashboard
```

#### 2. **Shopping**
```
Browse Medicines → Search/Filter → Add to Cart → Checkout
```

#### 3. **Checkout**
```
Review Cart → Select Address → Place Order → Order Confirmation
```

#### 4. **Track Orders**
```
My Orders → Select Order → View Delivery Status → Timeline
```

### Key Components

#### AuthContext (State Management)
```javascript
const { user, login, register, logout, isAuthenticated, loading } = useAuth();
```

**Features:**
- Automatic token management
- Token refresh on 401 errors
- Persistent authentication (localStorage)
- Loading state for initial hydration

#### API Service Layer
All API calls are centralized in `src/services/api.js`:
- Request interceptor adds JWT token
- Response interceptor handles 401/403 errors
- Automatic token refresh
- Organized endpoints by resource

#### Protected Routes
Routes requiring authentication use `ProtectedRoute` wrapper:
```javascript
<Route
  path="/medicines"
  element={
    <ProtectedRoute>
      <MedicineList />
    </ProtectedRoute>
  }
/>
```

---

## API Integration

### Endpoints Used

**Authentication**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `POST /auth/refresh-token` - Refresh access token

**Medicines**
- `GET /medicines` - Get all medicines
- `GET /medicines/search` - Search medicines with filters
- `GET /medicines/:id` - Get specific medicine

**Orders**
- `POST /orders` - Create new order
- `GET /orders` - Get user's orders
- `GET /orders/:id` - Get specific order
- `PUT /orders/:id/pay` - Pay for order
- `PUT /orders/:id/cancel` - Cancel order

**Deliveries**
- `GET /deliveries/order/:orderId` - Get delivery by order
- `GET /deliveries/:id` - Get specific delivery

**User**
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update profile
- `GET /users/addresses` - Get addresses
- `POST /users/addresses` - Add address
- `PUT /users/addresses/:id` - Update address
- `DELETE /users/addresses/:id` - Delete address

---

## State Management

### Authentication State (Context API)

**Stored in Context:**
- `user` - Current logged-in user
- `isAuthenticated` - Boolean flag
- `loading` - Initial auth check loading
- `error` - Error messages

**Stored in localStorage:**
- `access_token` - JWT for API calls
- `refresh_token` - For token refresh
- `cart` - Shopping cart items

---

## Error Handling

### Global Error Handler
Axios interceptor handles:
- 401 Unauthorized → Attempt token refresh
- 403 Forbidden → Redirect to login (on refresh failure)
- Network errors → Display error message
- Validation errors → Show server error message

### Component-Level Error Handling
Each component manages its own errors with try-catch blocks and displays user-friendly messages.

---

## Performance Optimizations

✅ **Lazy Loading** - Routes can be code-split with React.lazy()
✅ **Local Storage** - Cart persists across sessions
✅ **Sticky Navbar** - Navbar stays visible while scrolling
✅ **Responsive Images** - SVG icons and emojis
✅ **CSS Animations** - Smooth transitions and hover effects
✅ **Request Batching** - Multiple API calls can be made in parallel

---

## Styling

### CSS Architecture
- **Global Styles** - Base styles in public/index.html
- **Component Scoped** - Each component has its own CSS file
- **Bootstrap Integration** - Utility classes + custom styles
- **CSS Variables** - Theme colors and commonly used values
- **Animations** - Slide up, fade, translate animations

### Color Scheme
- **Primary**: #667eea → #764ba2 (gradient)
- **Success**: #28a745
- **Danger**: #dc3545
- **Warning**: #ffc107
- **Info**: #17a2b8

---

## Mobile Responsiveness

The app is fully responsive with breakpoints:
- **Mobile**: < 576px
- **Tablet**: 576px - 992px
- **Desktop**: > 992px

Key responsive features:
- Grid layout adjusts column count
- Sidebar becomes dropdown on mobile
- Modals are full-width on small screens
- Touch-friendly button sizes (min 44px)

---

## Security Measures

✅ **JWT Tokens**
- Access tokens (15 min expiry)
- Refresh tokens (7 day expiry)
- Automatic token refresh

✅ **HTTP Security**
- HTTPS in production
- JWT in Authorization header (not cookies to prevent CSRF)
- Token cleared on logout

✅ **Input Validation**
- Password format validation
- Email format validation
- Quantity bounds checking
- Server-side validation as primary

✅ **Protected Routes**
- Routes require authentication
- Automatic redirect to login
- Loading state while checking auth

---

## Testing Scenarios

### User Registration
```
1. Navigate to /register
2. Enter valid email and password (8+ chars, uppercase, lowercase, number)
3. Confirm password matches
4. Click Register
5. Auto-login and redirect to /medicines
```

### Browse Medicines
```
1. Go to /medicines
2. See full medicine list
3. Search by name: "Paracetamol"
4. Filter by price: min=50, max=200
5. Add medicines to cart
6. View cart summary in sidebar
```

### Place Order
```
1. Click "Proceed to Checkout"
2. Select delivery address
3. Review order summary (with 18% tax)
4. Click "Place Order"
5. See success message
6. Redirect to /orders
```

### Track Delivery
```
1. Go to /deliveries
2. See order list with delivery status
3. View timeline: pending → assigned → in_transit → delivered
4. See delivery address and estimated date
```

---

## Troubleshooting

### Issue: "Cannot GET /..."
**Solution:** Ensure React Router is properly configured. All unknown routes redirect to home.

### Issue: "API call fails with 401"
**Solution:** Check if backend is running on localhost:4000. Check JWT_SECRET matches between frontend and backend.

### Issue: "Cart not persisting"
**Solution:** Cart uses localStorage. Check browser localStorage is enabled. Clear browser cache if issues persist.

### Issue: "Login always redirects"
**Solution:** Check if token refresh endpoint is working. Verify JWT_SECRET in backend environment.

### Issue: "Medicines not loading"
**Solution:** Verify database is populated. Check API Gateway is routing to Medicine Service on port 5003.

---

## Deployment

### Build for Production
```bash
npm run build
```

Creates optimized `build/` folder for deployment.

### Deployment Targets:
- **Vercel** - npm install -g vercel && vercel
- **Netlify** - Connect GitHub repo, auto-deploys
- **Docker** - Create Dockerfile with Node base image
- **Traditional Hosting** - Upload `build/` folder to web server

### Environment Variables (Production)
```env
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_ENV=production
```

---

## Future Enhancements

- [ ] Prescription upload and management UI
- [ ] Admin dashboard for managing medicines
- [ ] Payment gateway integration (Stripe/Razorpay)
- [ ] Push notifications for order updates
- [ ] Social login (Google, Facebook)
- [ ] In-app chat support with pharmacists
- [ ] Product ratings and reviews
- [ ] Wishlist functionality
- [ ] Recurring orders for regular medicines
- [ ] Dark mode theme

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Check backend API logs
4. Verify all services are running (`docker-compose ps`)

---

## License

This is a demonstration platform for educational purposes. All rights reserved.

---

## Project Statistics

- **Total Components:** 12+
- **Total Pages:** 3
- **API Endpoints Used:** 20+
- **CSS Files:** 8
- **Lines of Code:** 1500+
- **Development Time:** Production-ready

---

Created with ❤️ for the Drug Delivery E-commerce Platform
