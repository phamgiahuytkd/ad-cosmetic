import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import * as apis from '../../service';
import {
  Bell,
  User,
  LogOut,
  ChevronDown,
  UserCheck,
  ShoppingCart,
  Package,
  Users,
  X,
  Menu,
} from 'lucide-react';
import api from '../../service/api';
import { getImageUrl } from '../../common/commonFunc';
import { useNotifications } from '../Context/NotificationContext';
import { useUser } from '../Context/UserContext';

const Header = ({ isMobileMenuOpen, setIsMobileMenuOpen, currentPageTitle }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();
  const { notifications, loading: notificationsLoading, fetchNotifications } = useNotifications();
  const { user, loading, fetchUser, error } = useUser(); // Use loading and error from context

  const unreadCount = notifications.filter((n) => n.id).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    setIsNotificationOpen(false);
  };

  const toggleNotification = () => {
    setIsNotificationOpen(!isNotificationOpen);
    setIsDropdownOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsDropdownOpen(false);
    setIsNotificationOpen(false);
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    try {
      await api.post('/auth/logout', { token });
      localStorage.removeItem('token'); // Remove token immediately
      fetchUser(); // Refresh user context
      navigate('/login');
    } catch (error) {
      alert(error.response?.data?.message || 'Đăng xuất thất bại');
    }
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleGoToSeenNotify = async (id) => {
    try {
      await api.delete(`/notify/${id}`);
      fetchNotifications();
      navigate(`/orders/view/${id}`);
    } catch (error) {
      console.error(error.response?.data?.message || 'Lỗi khi xử lý thông báo');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ORDER':
        return <ShoppingCart className="w-4 h-4 text-blue-500" />;
      case 'STOCK':
        return <Package className="w-4 h-4 text-orange-500" />;
      case 'PAID':
        return <Users className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <h1 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
            {currentPageTitle}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative" ref={notificationRef}>
            <div
              className="cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
              onClick={toggleNotification}
              aria-label="Toggle notifications"
            >
              <Bell className="w-5 h-5 text-gray-500 hover:text-gray-700 transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </span>
              )}
            </div>

            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-800">Thông báo</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsNotificationOpen(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      aria-label="Close notifications"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500 mx-auto mb-2" />
                      <p className="text-sm">Đang tải thông báo...</p>
                    </div>
                  ) : notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0 ${notification.id ? 'bg-blue-50' : ''}`}
                        onClick={() => handleGoToSeenNotify(notification.type_id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4
                                className={`text-sm font-medium ${notification.id ? 'text-gray-900' : 'text-gray-700'}`}
                              >
                                {notification.title}
                              </h4>
                              {notification.count > 0 && (
                                <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full font-medium">
                                  {notification.count}
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-sm mt-1 ${notification.id ? 'text-gray-600' : 'text-gray-500'}`}
                            >
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                          </div>
                          {!notification.id && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Không có thông báo nào</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={dropdownRef}>
            <div
              className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
              onClick={toggleDropdown}
              aria-label="Toggle user menu"
            >
              <div className="w-8 h-8 bg-teal-500 rounded-full overflow-hidden flex items-center justify-center">
                <img
                  src={getImageUrl(user?.avatar) || '/img/no-avatar.png'}
                  alt="avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>

              {loading ? (
                <div className="hidden md:block w-20 h-4 bg-gray-200 rounded animate-pulse" />
              ) : (
                <span className="hidden md:block text-sm text-gray-700">
                  {user?.full_name || 'Chưa có thông tin'}
                </span>
              )}
              <ChevronDown
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </div>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  {loading ? (
                    <>
                      <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-1" />
                      <div className="w-32 h-3 bg-gray-200 rounded animate-pulse" />
                    </>
                  ) : error ? (
                    <>
                      <p className="text-sm font-medium text-gray-800">Khách</p>
                      <p className="text-xs text-gray-500">Vui lòng đăng nhập</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-800">
                        {user?.full_name || 'Chưa có thông tin'}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </>
                  )}
                </div>

                <div className="py-1">
                  <button
                    onClick={handleProfile}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 mr-3" />
                    Thông tin cá nhân
                  </button>
                </div>

                <div className="border-t border-gray-100 my-1" />

                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
