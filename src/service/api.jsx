// src/services/api.js
import axios from "axios";
import {jwtDecode} from "jwt-decode";

// Cấu hình cơ bản cho axios
const api = axios.create({
  baseURL: "http://localhost:8080/iCommerce", // Địa chỉ của backend
  headers: {
    "Content-Type": "application/json",
  },
});

// Biến toàn cục để tránh làm mới token đồng thời
let isRefreshing = false;
let refreshSubscribers = [];

// Hàm để thêm các yêu cầu đang chờ đợi làm mới token
function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

// Thông báo tất cả các yêu cầu chờ làm mới token
function onRefreshed(newToken) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

// Hàm kiểm tra token hết hạn trước 5 giây
function isTokenExpiredBefore5Seconds(exp) {
  const currentTime = Math.floor(Date.now() / 1000); // Thời gian hiện tại (giây)
  const expirationTimeBefore5Seconds = exp - 5;
  return expirationTimeBefore5Seconds < currentTime;
}

// Interceptor để tự động thêm JWT token vào header
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("token"); // Lấy token từ localStorage

  if (token) {
    const decodedToken = jwtDecode(token);
    const expiredBefore5Seconds = isTokenExpiredBefore5Seconds(decodedToken.exp);

    if (expiredBefore5Seconds) {
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const response = await axios.post("http://localhost:8080/iCommerce/auth/refresh", {
            token: token,
          });

          const newToken = response.data.result.token;
          localStorage.setItem("token", newToken);
          isRefreshing = false;
          onRefreshed(newToken);
          config.headers.Authorization = `Bearer ${newToken}`;
        } catch (error) {
          isRefreshing = false;
          localStorage.removeItem("token");
          window.location.href = "/auth/login"; // Điều hướng đến trang login
          throw error;
        }
      }

      // Chờ cho đến khi token mới được làm mới
      await new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          config.headers.Authorization = `Bearer ${newToken}`;
          resolve();
        });
      });
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
