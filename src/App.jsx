import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Dashboard, Category, Brand, Order, Product, Warehouse, Customer, Login } from './pages';
import {
  Header,
  Sidebar,
  CreateCategory,
  CreateBrand,
  UpdateCategory,
  UpdateBrand,
  CreateProduct,
  UpdateProduct,
} from './components';
import { routeTitleMap } from './config/navigationConfig';
import { ToastContainer } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import OrderDetail from './pages/Order/OrderDetail';
import GiftManagement from './pages/Gift/Gift';
import AddGift from './pages/Gift/AddGift';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  let role = null;

  try {
    if (token) {
      const decodedToken = jwtDecode(token);
      role = decodedToken.scope;
    }
  } catch (e) {
    console.error('Invalid token:', e);
    localStorage.removeItem('token');
  }

  if (role !== 'ADMIN') {
    console.warn('Access denied: User role is not ADMIN, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState({});

  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  useEffect(() => {
    if (!isLoginPage) {
      const matchedPath =
        Object.keys(routeTitleMap).find(
          (path) => location.pathname === path || location.pathname.startsWith(path + '/'),
        ) || '/';

      const title = routeTitleMap[matchedPath] || 'Dashboard';

      setCurrentPage({
        path: location.pathname,
        title: title,
      });
    }
    console.log('Current path:', location.pathname); // Debug route
  }, [location.pathname, isLoginPage]);

  return (
    <>
      <ToastContainer />
      {isLoginPage ? (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50">
          <div className="flex h-screen">
            <Sidebar
              isMobileMenuOpen={isMobileMenuOpen}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                currentPageTitle={currentPage.title}
              />

              <main className="flex-1 overflow-y-auto bg-gray-50">
                <Routes>
                  <Route path="/" exact={true} element={<Navigate to="/dashboard" />} />
                  <Route
                    path="/dashboard"
                    exact={true}
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/products/brand-management"
                    element={
                      <ProtectedRoute>
                        <Brand />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/products/brand-management/add"
                    element={
                      <ProtectedRoute>
                        <CreateBrand />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/products/brand-management/edit/:brandId"
                    element={
                      <ProtectedRoute>
                        <UpdateBrand />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/products/category-management"
                    element={
                      <ProtectedRoute>
                        <Category />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/products/category-management/add"
                    element={
                      <ProtectedRoute>
                        <CreateCategory />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/products/category-management/edit/:categoryId"
                    element={
                      <ProtectedRoute>
                        <UpdateCategory />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/products/product-management"
                    element={
                      <ProtectedRoute>
                        <Product />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/products/product-management/add"
                    element={
                      <ProtectedRoute>
                        <CreateProduct />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/products/product-management/edit/:productId"
                    element={
                      <ProtectedRoute>
                        <UpdateProduct />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      <ProtectedRoute>
                        <Order />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders/view/:id"
                    element={
                      <ProtectedRoute>
                        <OrderDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/customers"
                    element={
                      <ProtectedRoute>
                        <Customer />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/warehouse"
                    element={
                      <ProtectedRoute>
                        <Warehouse />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/gifts"
                    element={
                      <ProtectedRoute>
                        <GiftManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/add-gift"
                    element={
                      <ProtectedRoute>
                        <AddGift />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </main>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
