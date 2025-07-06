"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "react-toastify"
import api from "../../service/api"
import { jwtDecode } from "jwt-decode"
import Swal from "sweetalert2"

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

const onSubmit = async (data) => {
  try {
    setIsLoading(true);
    localStorage.removeItem("token");

    const response = await api.post("/auth/login", {
      email: data.username,
      password: data.password,
    });

    const token = response.data?.result?.token;

    if (token) {
      const decoded = jwtDecode(token);
      const role = decoded.scope; // hoặc decoded?.role tùy backend

      if (role === "ADMIN") {
        localStorage.setItem("token", token);

        Swal.fire({
          title: "Thành công",
          text: "Đăng nhập thành công!",
          icon: "success",
          timer: 2500,
          showConfirmButton: false,
        });

        navigate("/dashboard");
      } else {
        Swal.fire({
          title: "Từ chối truy cập",
          text: "Bạn không có quyền truy cập hệ thống admin!",
          icon: "error",
          timer: 2500,
          showConfirmButton: false,
        });

        localStorage.removeItem("token");
      }
    } else {
      Swal.fire({
        title: "Lỗi",
        text: "Không nhận được token từ máy chủ!",
        icon: "error",
        timer: 2500,
        showConfirmButton: false,
      });
    }
  } catch (error) {
    Swal.fire({
      title: "Lỗi",
      text: error.response?.data?.message || "Đăng nhập thất bại!",
      icon: "error",
      timer: 2500,
      showConfirmButton: false,
    });

    localStorage.removeItem("token");
  } finally {
    setIsLoading(false);
  }
};


  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4 sm:p-6">
      <section className="bg-white p-6 sm:p-8 md:p-10 rounded-2xl shadow-2xl w-full sm:w-11/12 md:w-3/4 lg:w-1/2 xl:w-1/3 transform transition-all active:scale-100 sm:hover:scale-105 duration-300">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-teal-600 mb-2">Admin Panel</h1>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700">Đăng Nhập</h2>
          <div className="border-b-2 border-teal-500 w-16 mx-auto mt-4" />
        </div>

        <form className="space-y-4 sm:space-y-6" 
        onSubmit={handleSubmit(onSubmit)}
         aria-label="Admin Login Form">
          <div>
            <label htmlFor="username" className="block text-sm sm:text-base font-semibold text-gray-800 mb-2">
              Email / Tên đăng nhập <span className="text-red-500">*</span>
            </label>
            <input
              id="username"
              type="email"
              autoComplete="email"
              autoFocus
              {...register("username", {
                required: "Email là bắt buộc",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Email không hợp lệ",
                },
              })}
              className={`mt-1 w-full px-4 py-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition duration-200 text-sm sm:text-base ${
                errors.username ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="admin@example.com"
              aria-invalid={errors.username ? "true" : "false"}
              disabled={isLoading}
            />
            {errors.username && (
              <p className="text-red-500 text-xs sm:text-sm mt-1 animate-pulse" role="alert">
                {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm sm:text-base font-semibold text-gray-800 mb-2">
              Mật khẩu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                {...register("password", {
                  required: "Mật khẩu là bắt buộc",
                  minLength: {
                    value: 6,
                    message: "Mật khẩu phải có ít nhất 6 ký tự",
                  },
                })}
                className={`mt-1 w-full px-4 py-3 pr-12 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition duration-200 text-sm sm:text-base ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Nhập mật khẩu"
                aria-invalid={errors.password ? "true" : "false"}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 transition-colors"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs sm:text-sm mt-1 animate-pulse" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 active:bg-teal-800 focus:ring-4 focus:ring-teal-300 focus:outline-none transition duration-200 transform active:scale-95 sm:hover:scale-105 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            aria-label="Đăng nhập"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              "Đăng Nhập"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs sm:text-sm text-gray-500">Chỉ dành cho quản trị viên hệ thống</p>
        </div>
      </section>
    </main>
  )
}

export default Login
