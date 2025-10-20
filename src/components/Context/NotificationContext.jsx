import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../../service/api';
// ✅ import axios instance

export const NotificationContext = createContext();

export const NotificationProvider = ({ children, userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // ⚙️ Hàm fetch thông báo từ API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/notify`);
      setNotifications(res.data.result || []);
      console.log('thoong bao');
      console.log(res.data.result);
    } catch (err) {
      console.error('❌ Lỗi khi lấy thông báo:', err);
    } finally {
      setLoading(false);
    }
  };

  // ⚙️ Gọi API khi userId thay đổi (đăng nhập xong)
  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        loading,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// ✅ Hook tiện dụng để gọi nhanh
export const useNotifications = () => useContext(NotificationContext);
