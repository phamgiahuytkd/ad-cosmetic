'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, FileText, Menu, X, CircleX } from 'lucide-react';
import { Link } from 'react-router-dom';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import api from '../../service/api';
import { displayValue, statusMap, truncateText } from '../../common/commonFunc';
import { useNotifications } from '../../components/Context/NotificationContext';

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

const Orders = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [amountRange, setAmountRange] = useState([0, 10000000]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // Tăng lên 20 sản phẩm mỗi trang
  const { notifications, fetchNotifications } = useNotifications();

  // Danh sách bốn trạng thái chính và tên tiếng Việt
  const allStatuses = Object.keys(statusMap);

  // Lấy danh sách đơn hàng từ API
  const getAllOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/order/allorder/all`);
      if (response.data.result) {
        setOrders(response.data.result); // API trả về List<OrderResponse>
        const amounts = response.data.result.map((order) => order.amount || 0);
        setAmountRange([Math.min(...amounts), Math.max(...amounts)]);
      } else {
        setError(response?.data?.message || 'Không thể tải danh sách đơn hàng');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Lỗi kết nối API');
    } finally {
      setLoading(false);
    }
  };

  // Gọi API khi component mount
  useEffect(() => {
    getAllOrders();
  }, [notifications]);

  // Thống kê trạng thái
  const statusCounts = useMemo(() => {
    const counts = {};
    allStatuses.forEach((status) => {
      counts[status] = 0; // Khởi tạo tất cả trạng thái với giá trị 0
    });
    orders.forEach((order) => {
      const status = order.status?.toUpperCase();
      if (allStatuses.includes(status)) {
        counts[status] = (counts[status] || 0) + 1;
      }
    });
    return counts;
  }, [orders]);

  // Lọc đơn hàng theo tên, SĐT, ID, giá trị đơn hàng và trạng thái
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        removeDiacritics(order.name || '')
          .toLowerCase()
          .includes(removeDiacritics(searchTerm).toLowerCase()) ||
        (order.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.amount || 0).toString().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter ? order.status?.toUpperCase() === statusFilter : true;
      const matchesAmount =
        (order.amount || 0) >= amountRange[0] && (order.amount || 0) <= amountRange[1];
      return matchesSearch && matchesStatus && matchesAmount;
    });
  }, [orders, searchTerm, statusFilter, amountRange]);

  // Phân trang dữ liệu
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentOrders = filteredOrders.slice(startIndex, endIndex);
    return { totalPages, startIndex, endIndex, currentOrders };
  }, [filteredOrders, currentPage]);

  const { totalPages, startIndex, endIndex, currentOrders } = paginationData;

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

  // Tìm giá trị min/max của amount để cấu hình thanh kéo
  const amountBounds = useMemo(() => {
    const amounts = orders.map((order) => order.amount || 0);
    return {
      min: amounts.length > 0 ? Math.min(...amounts) : 0,
      max: amounts.length > 0 ? Math.max(...amounts) : 10000000,
    };
  }, [orders]);

  // Xóa bộ lọc giá trị đơn hàng
  const clearAmountRange = () => {
    setAmountRange([amountBounds.min, amountBounds.max]);
    setCurrentPage(1);
  };

  // Hàm tạo danh sách trang hiển thị (tối đa 3 trang liền kề, với ellipsis)
  const getPageNumbers = () => {
    const delta = 1; // Hiển thị 1 trang trước và sau (tổng 3 trang xung quanh currentPage)
    const rangeWithDots = [];

    let left = Math.max(1, currentPage - delta);
    let right = Math.min(totalPages, currentPage + delta);

    if (left > 1) {
      rangeWithDots.push(1);
      if (left > 2) {
        rangeWithDots.push('...');
      }
    }

    for (let i = left; i <= right; i++) {
      rangeWithDots.push(i);
    }

    if (right < totalPages) {
      if (right < totalPages - 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (loading) {
    return (
      <div className="p-6 bg-white min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <button
              onClick={getAllOrders}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 bg-[var(--color-bg)] min-h-screen">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4 sm:mb-6">
        {allStatuses.map((status) => {
          const iconBgColor =
            {
              PROCESSING: 'bg-blue-600',
              PENDING: 'bg-yellow-600',
              COMPLETED: 'bg-green-600',
              UNCOMPLETED: 'bg-red-600',
              PENALTY: 'bg-red-600',
            }[status] || 'bg-gray-600';

          return (
            <div
              key={status}
              className={`shadow-md rounded p-4 ${status === 'PROCESSING' ? 'bg-white' : ''} ${statusMap[status].color}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{statusMap[status].display}</p>
                  <p className="text-2xl font-bold">{statusCounts[status] || 0}</p>
                </div>
                <div
                  className={`w-8 h-8 ${iconBgColor} rounded-full flex items-center justify-center`}
                >
                  <FileText className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded p-3 sm:p-4 mb-4 sm:mb-6 shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm theo tên, SĐT, ID, hoặc giá trị đơn hàng..."
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Giá trị đơn hàng</label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 px-4">
                <Slider
                  range
                  min={amountBounds.min}
                  max={amountBounds.max}
                  value={amountRange}
                  onChange={(value) => setAmountRange(value)}
                  trackStyle={[{ backgroundColor: '#3b82f6' }]}
                  handleStyle={[{ borderColor: '#3b82f6' }, { borderColor: '#3b82f6' }]}
                />
                <div className="flex justify-between text-xs text-gray-600 mt-2">
                  <span>{amountRange[0].toLocaleString('vi-VN')} VNĐ</span>
                  <span>{amountRange[1].toLocaleString('vi-VN')} VNĐ</span>
                </div>
              </div>
              {(amountRange[0] !== amountBounds.min || amountRange[1] !== amountBounds.max) && (
                <button
                  onClick={clearAmountRange}
                  className="px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  <CircleX className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order List */}
      <div className="bg-white rounded shadow-md">
        <div className="bg-[var(--color-title)] text-white p-3 rounded-t flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <h2 className="text-base font-semibold">
            QUẢN LÝ ĐƠN HÀNG ({filteredOrders.length} mục)
          </h2>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">STT</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                  Tên khách hàng
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                  Số điện thoại
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Địa chỉ</th>
                <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">Tổng tiền</th>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentOrders.map((order, index) => (
                <tr key={order.id} className="hover:bg-gray-100">
                  <td className="px-4 py-3 text-sm text-gray-900 text-center">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    {truncateText(order.name, 30)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{displayValue(order.phone)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {truncateText(order.fulladdress, 40)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    {(order.amount || 0).toLocaleString('vi-VN')} VNĐ
                  </td>
                  <td className="px-4 py-3 flex justify-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-sm ${
                        statusMap[order.status?.toUpperCase()]?.color || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {statusMap[order.status?.toUpperCase()]?.display ||
                        displayValue(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <Link
                      to={`view/${order.id}`}
                      className="px-3 py-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center justify-center cursor-pointer touch-manipulation"
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Xem
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden">
          <div className="divide-y divide-gray-200">
            {currentOrders.map((order, index) => (
              <div key={order.id} className="p-4 hover:bg-gray-50">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="min-w-0 flex-1">
                      <div
                        to={`view/${order.id}`}
                        className="font-medium"
                        title={order.name || 'Đang cập nhật'}
                      >
                        {startIndex + index + 1} - {truncateText(order.name, 30)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        <strong className="mr-[2.75rem] text-gray-800 font-medium">ID:</strong>{' '}
                        {displayValue(order.id)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        <strong className="mr-8 text-gray-800 font-medium">SĐT:</strong>{' '}
                        {displayValue(order.phone)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        <strong className="mr-3 text-gray-800 font-medium">Địa chỉ:</strong>{' '}
                        {truncateText(order.fulladdress, 40)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        <strong className="mr-3 text-gray-800 font-medium">Tổng tiền:</strong>{' '}
                        {(order.amount || 0).toLocaleString('vi-VN')} VNĐ
                      </div>
                      <div className="mt-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-sm ${
                            statusMap[order.status?.toUpperCase()]?.color ||
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {statusMap[order.status?.toUpperCase()]?.display ||
                            displayValue(order.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Link
                      to={`view/${order.id}`}
                      className="px-3 py-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center cursor-pointer touch-manipulation"
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Xem
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            {searchTerm ||
            statusFilter ||
            amountRange[0] !== amountBounds.min ||
            amountRange[1] !== amountBounds.max
              ? 'Không có đơn hàng nào phù hợp với điều kiện lọc'
              : 'Chưa có đơn hàng nào'}
          </div>
        )}

        {/* Pagination */}
        {filteredOrders.length > 0 && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              <div className="text-sm text-gray-700">
                Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredOrders.length)} của{' '}
                {filteredOrders.length} mục
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
                  {getPageNumbers().map((page, index) => (
                    <span key={index}>
                      {page === '...' ? (
                        <span className="px-3 py-1 text-sm text-gray-700">...</span>
                      ) : (
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 text-sm border rounded touch-manipulation ${
                            currentPage === page
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      )}
                    </span>
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

export default Orders;
