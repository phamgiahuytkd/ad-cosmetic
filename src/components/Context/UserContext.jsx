// UserContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../../service/api';
// path tới axios instance của bạn

// 1️⃣ Tạo context
const UserContext = createContext();

// 2️⃣ Tạo provider
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 3️⃣ Hàm fetch user
  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/logged');
      if (response.data.result) {
        setUser(response.data.result);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // 4️⃣ Tự động fetch khi mount
  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, fetchUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

// 5️⃣ Custom hook để dễ dùng
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
