'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, User, Menu, X, Lock, CircleX } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../service/api';
import Swal from 'sweetalert2';

// Hàm chuyển đổi không dấu
const removeDiacritics = (str) => {
  return str
    ? str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
    : '';
};

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const itemsPerPage = 5;

  // Danh sách trạng thái khách hàng và tên tiếng Việt
  const statusMap = {
    NEW: { display: 'Người mới', color: 'bg-blue-100 text-blue-800' },
    NORMAL: { display: 'Hoạt động', color: 'bg-green-100 text-green-800' },
    BLOCK: { display: 'Đã dừng', color: 'bg-red-100 text-red-800' },
  };

  const allStatuses = Object.keys(statusMap);

  // Hàm fetch danh sách khách hàng
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user');
      const mappedCustomers = response.data.result.map((user) => ({
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        totalOrders: user.order_placed,
        totalSpent: user.expend,
        status: user.status,
        reputation: user.reputation,
      }));
      setCustomers(mappedCustomers);
      setLoading(false);
    } catch (err) {
      setError('Không thể tải danh sách khách hàng');
      setLoading(false);
    }
  };

  // Gọi API khi component mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Thống kê trạng thái
  const statusCounts = useMemo(() => {
    const counts = {};
    allStatuses.forEach((status) => {
      counts[status] = 0; // Khởi tạo tất cả trạng thái với giá trị 0
    });
    customers.forEach((customer) => {
      const status = customer.status?.toUpperCase();
      if (allStatuses.includes(status)) {
        counts[status] = (counts[status] || 0) + 1;
      }
    });
    return counts;
  }, [customers]);

  // Lọc khách hàng theo tên, SĐT, email và trạng thái
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchesSearch =
        removeDiacritics(customer.name)
          .toLowerCase()
          .includes(removeDiacritics(searchTerm).toLowerCase()) ||
        (customer.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        removeDiacritics(customer.email)
          .toLowerCase()
          .includes(removeDiacritics(searchTerm).toLowerCase());
      const matchesStatus = statusFilter ? customer.status === statusFilter : true;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, customers]);

  // Phân trang dữ liệu
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentCustomers = filteredCustomers.slice(startIndex, endIndex);
    return { totalPages, startIndex, endIndex, currentCustomers };
  }, [filteredCustomers, currentPage]);

  const { totalPages, startIndex, endIndex, currentCustomers } = paginationData;

  // Cắt ngắn văn bản để hiển thị
  const truncateText = (text, maxLength) => {
    if (!text) return 'Đang cập nhật';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Xử lý hiển thị giá trị
  const displayValue = (value) => {
    return value ?? 'Đang cập nhật';
  };

  // Xóa tìm kiếm
  const clearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Xóa bộ lọc trạng thái
  const clearStatusFilter = () => {
    setStatusFilter('');
    setCurrentPage(1);
  };

  // Khóa tài khoản
  const handleBlockCustomer = async (id) => {
    const result = await Swal.fire({
      title: 'Xác nhận khóa tài khoản',
      text: 'Bạn có chắc việc dừng hoạt động tài khoản này không?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy',
    });

    if (result.isConfirmed) {
      try {
        await api.put(`/user/${id}/block`);
        await fetchCustomers(); // Fetch lại danh sách sau khi khóa
        Swal.fire('Đã khóa!', `Tài khoản đã được khóa thành công.`, 'success');
      } catch (error) {
        console.error(error);
        Swal.fire('Thất bại!', `Không thể khóa tài khoản.`, 'error');
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Đang tải dữ liệu...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  return (
    <div className="p-3 sm:p-6 bg-white min-h-screen">
      {/* Header Tabs */}
      <div className="mb-4 sm:mb-6">
        <div className="sm:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-full px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center transition-colors cursor-pointer touch-manipulation"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4 mr-2" /> : <Menu className="w-4 h-4 mr-2" />}
            MENU
          </button>
          {isMobileMenuOpen && (
            <div className="mt-2 space-y-2 bg-white border border-gray-200 rounded shadow-lg p-2">
              <Link
                to="view"
                className="w-full px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center transition-colors cursor-pointer touch-manipulation"
              >
                <User className="w-4 h-4 mr-2" />
                XEM CHI TIẾT
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 sm:mb-6">
        {allStatuses.map((status) => {
          const iconBgColor =
            {
              NEW: 'bg-blue-600',
              NORMAL: 'bg-green-600',
              BLOCK: 'bg-red-600',
            }[status] || 'bg-gray-600';

          return (
            <div
              key={status}
              className={`border border-gray-200 rounded p-4 ${statusMap[status].color}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{statusMap[status].display}</p>
                  <p className="text-2xl font-bold">{statusCounts[status] || 0}</p>
                </div>
                <div
                  className={`w-8 h-8 ${iconBgColor} rounded-full flex items-center justify-center`}
                >
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded p-3 sm:p-4 mb-4 sm:mb-6 border-gray-100 border">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm theo tên, SĐT hoặc email..."
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm pl-10 pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <CircleX className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
            <div className="flex items-center space-x-2">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tất cả</option>
                {allStatuses.map((status) => (
                  <option key={status} value={status}>
                    {statusMap[status].display} ({statusCounts[status] || 0})
                  </option>
                ))}
              </select>
              {statusFilter && (
                <button
                  onClick={clearStatusFilter}
                  className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  <CircleX className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded shadow-md">
        <div className="bg-[#00D5BE] text-white p-3 rounded-t flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <h2 className="text-base font-semibold">
            QUẢN LÝ KHÁCH HÀNG ({filteredCustomers.length} mục)
          </h2>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">STT</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Họ tên</th>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">SĐT</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Email</th>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Tổng đơn</th>
                <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">Tổng chi</th>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Uy tín</th>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentCustomers.map((customer, index) => (
                <tr key={customer.id} className="hover:bg-gray-100">
                  <td className="px-4 py-3 text-sm text-gray-900 text-center">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    <Link
                      to={`view/${customer.id}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer touch-manipulation"
                      title={customer.name || 'Đang cập nhật'}
                    >
                      {truncateText(customer.name, 30)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-center">
                    {displayValue(customer.phone)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {truncateText(customer.email, 30)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-center">
                    {displayValue(customer.totalOrders)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {customer.totalSpent
                      ? customer.totalSpent.toLocaleString('vi-VN') + ' VNĐ'
                      : '0 VNĐ'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex justify-center w-20 px-2 py-1 text-xs font-semibold rounded-sm ${
                        customer.status && statusMap[customer.status]?.color
                          ? statusMap[customer.status].color
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {customer.status && statusMap[customer.status]?.display
                        ? statusMap[customer.status].display
                        : 'Đang cập nhật'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-center">
                    {displayValue(customer.reputation)}
                  </td>
                  <td className="px-4 py-3 text-center flex justify-center">
                    <button
                      className={`
                        px-3 py-2 rounded text-xs flex items-center justify-center touch-manipulation
                        ${
                          customer.status === 'BLOCK'
                            ? 'bg-red-300 text-white opacity-50 cursor-not-allowed'
                            : 'bg-red-500 text-white hover:bg-red-600 cursor-pointer'
                        }
                      `}
                      disabled={customer.status === 'BLOCK'}
                      onClick={() => handleBlockCustomer(customer.id)}
                    >
                      <Lock className="w-3 h-3 mr-1" />
                      Khóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden">
          <div className="divide-y divide-gray-200">
            {currentCustomers.map((customer, index) => (
              <div key={customer.id} className="p-4 hover:bg-gray-50">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`view/${customer.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline text-left cursor-pointer touch-manipulation block w-full"
                        title={customer.name || 'Đang cập nhật'}
                      >
                        {startIndex + index + 1} - {truncateText(customer.name, 30)}
                      </Link>
                      <div className="text-xs text-gray-500 mt-1">
                        SĐT: {displayValue(customer.phone)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Email: {truncateText(customer.email, 30)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Tổng đơn hàng: {displayValue(customer.totalOrders)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Tổng chi tiêu:{' '}
                        {displayValue(
                          customer.totalSpent
                            ? customer.totalSpent.toLocaleString('vi-VN') + ' VNĐ'
                            : null,
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Uy tín: {displayValue(customer.reputation)}
                      </div>
                      <div className="mt-1">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            customer.status && statusMap[customer.status]?.color
                              ? statusMap[customer.status].color
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {customer.status && statusMap[customer.status]?.display
                            ? statusMap[customer.status].display
                            : 'Đang cập nhật'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    {/* <Link
                      to={`view/${customer.id}`}
                      className="px-3 py-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center cursor-pointer touch-manipulation"
                    >
                      <User className="w-3 h-3 mr-1" />
                      Xem
                    </Link> */}
                    <button
                      className={`px-3 py-2 rounded text-xs flex items-center touch-manipulation
                      ${
                        customer.status === 'BLOCK'
                          ? 'bg-red-300 text-white opacity-50 cursor-not-allowed'
                          : 'bg-red-500 text-white hover:bg-red-600 cursor-pointer'
                      }
                    `}
                      disabled={customer.status === 'BLOCK'}
                      onClick={() => handleBlockCustomer(customer.id)}
                    >
                      <Lock className="w-3 h-3 mr-1" />
                      Khóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredCustomers.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            {searchTerm || statusFilter
              ? 'Không có khách hàng nào phù hợp với điều kiện lọc'
              : 'Chưa có khách hàng nào'}
          </div>
        )}

        {/* Pagination */}
        {filteredCustomers.length > 0 && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              <div className="text-sm text-gray-700">
                Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredCustomers.length)} của{' '}
                {filteredCustomers.length} mục
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center touch-manipulation"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Trước
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm border rounded touch-manipulation ${
                        currentPage === page
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center touch-manipulation"
                >
                  Sau
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;
