'use client';

import { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, Edit, Trash2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../../service/api';
import { formatToVietnamTime } from '../../common/commonFunc';

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

const Voucher = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vouchers, setVouchers] = useState([]);
  const [editVoucherId, setEditVoucherId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // Tăng lên 20 hàng mỗi trang
  const navigate = useNavigate();
  const [editForm, setEditForm] = useState({
    code: '',
    percent: '',
    min_order_amount: '',
    max_amount: '',
    start_day: '',
    end_day: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/voucher');
        if (response.data.result) {
          setVouchers(response.data.result);
        } else {
          setError(response?.data?.message || 'Không thể tải danh sách mã giảm giá');
        }
      } catch (error) {
        setError('Lỗi khi tải dữ liệu');
        console.error('Error fetching vouchers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDateFilter, endDateFilter]);

  // Filter vouchers based on search term and date range
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((voucher) => {
      const searchLower = removeDiacritics(searchTerm).toLowerCase();
      const matchesSearch =
        removeDiacritics(voucher.code || '')
          .toLowerCase()
          .includes(searchLower) || voucher.id.toString().toLowerCase().includes(searchLower);

      const voucherStartDate = new Date(voucher.start_day);
      const voucherEndDate = new Date(voucher.end_day);
      const filterStart = startDateFilter ? new Date(startDateFilter) : null;
      const filterEnd = endDateFilter ? new Date(endDateFilter) : null;

      const matchesDateRange =
        (!filterStart || voucherStartDate >= filterStart) &&
        (!filterEnd || voucherEndDate <= filterEnd);

      return matchesSearch && matchesDateRange;
    });
  }, [vouchers, searchTerm, startDateFilter, endDateFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredVouchers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVouchers = filteredVouchers.slice(startIndex, endIndex);

  // Delete Voucher
  const handleDeleteVoucher = async (voucherId) => {
    const result = await Swal.fire({
      title: 'Xác nhận',
      text: 'Bạn có chắc muốn xóa mã giảm giá này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/voucher/${voucherId}`);
        setVouchers(vouchers.filter((voucher) => voucher.id !== voucherId));
        Swal.fire({
          title: 'Thành công',
          text: 'Đã xóa mã giảm giá thành công!',
          icon: 'success',
          confirmButtonColor: '#22c55e',
        });
      } catch (error) {
        console.error('Error deleting voucher:', error);
        setError(error.response?.data?.message || 'Lỗi khi xóa mã giảm giá');
        Swal.fire({
          title: 'Lỗi',
          text: error.response?.data?.message || 'Lỗi khi xóa mã giảm giá',
          icon: 'error',
          confirmButtonColor: '#ef4444',
        });
      }
    }
  };

  // Open Edit Form
  const handleEditVoucher = (id) => {
    const voucher = vouchers.find((v) => v.id === id);
    if (voucher) {
      setEditVoucherId(id);
      setEditForm({
        code: voucher.code,
        percent: voucher.percent,
        min_order_amount: voucher.min_order_amount,
        max_amount: voucher.max_amount,
        start_day: voucher.start_day.slice(0, 16), // Format for datetime-local
        end_day: voucher.end_day.slice(0, 16), // Format for datetime-local
      });
    }
  };

  // Cancel Edit
  const handleCancelEdit = () => {
    setEditVoucherId(null);
    setEditForm({
      code: '',
      percent: '',
      min_order_amount: '',
      max_amount: '',
      start_day: '',
      end_day: '',
    });
  };

  // Update Voucher
  const handleUpdateVoucher = async () => {
    try {
      setLoading(true);
      setError('');

      // Validate input
      if (
        !editForm.code ||
        !editForm.percent ||
        !editForm.min_order_amount ||
        !editForm.max_amount ||
        !editForm.start_day ||
        !editForm.end_day
      ) {
        setError('Vui lòng nhập đầy đủ thông tin mã giảm giá');
        return;
      }
      if (parseFloat(editForm.percent) <= 0 || parseFloat(editForm.percent) > 100) {
        setError('Mức giảm giá phải từ 1 đến 100%');
        return;
      }
      if (parseFloat(editForm.min_order_amount) < 0) {
        setError('Giá trị đơn hàng tối thiểu phải lớn hơn hoặc bằng 0');
        return;
      }
      if (parseFloat(editForm.max_amount) < 0) {
        setError('Giá trị giảm tối đa phải lớn hơn hoặc bằng 0');
        return;
      }
      if (new Date(editForm.start_day) > new Date(editForm.end_day)) {
        setError('Ngày bắt đầu phải trước ngày kết thúc');
        return;
      }

      const payload = {
        code: editForm.code,
        percent: parseFloat(editForm.percent),
        min_order_amount: parseFloat(editForm.min_order_amount),
        max_amount: parseFloat(editForm.max_amount),
        start_day: editForm.start_day,
        end_day: editForm.end_day,
      };

      const response = await api.put(`/voucher/${editVoucherId}`, payload);
      setVouchers(
        vouchers.map((voucher) => (voucher.id === editVoucherId ? response.data.result : voucher)),
      );
      Swal.fire({
        title: 'Thành công',
        text: 'Đã cập nhật mã giảm giá thành công!',
        icon: 'success',
        confirmButtonColor: '#22c55e',
      });
      handleCancelEdit();
    } catch (error) {
      console.error('Error updating voucher:', error);
      setError(error.response?.data?.message || 'Lỗi khi cập nhật mã giảm giá');
      Swal.fire({
        title: 'Lỗi',
        text: error.response?.data?.message || 'Lỗi khi cập nhật mã giảm giá',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleString('vi-VN') : '';
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
      <div className="p-3 sm:p-6 bg-[var(--color-bg)] min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 sm:p-6 bg-[var(--color-bg)] min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <Link
              to="/orders"
              className="px-4 py-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center justify-center cursor-pointer touch-manipulation"
            >
              Quay lại danh sách đơn hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 bg-[var(--color-bg)] min-h-screen">
      {/* Header */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:space-x-4">
        <Link
          to="/vouchers/add"
          className="shadow-md px-4 py-2 text-sm uppercase bg-green-500 text-white rounded hover:bg-green-600 flex items-center cursor-pointer touch-manipulation"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm mã giảm giá mới
        </Link>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-sm p-3 sm:p-4 mb-4 sm:mb-6 shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm mã giảm giá
            </label>
            <input
              type="text"
              placeholder="Tìm theo mã hoặc ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu</label>
            <input
              type="datetime-local"
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ngày kết thúc</label>
            <input
              type="datetime-local"
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Voucher List */}
      <div className="bg-white rounded shadow-md">
        <div className="bg-[var(--color-title)] text-white p-3 rounded-t flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <h2 className="text-base font-semibold">
            QUẢN LÝ MÃ GIẢM GIÁ ({filteredVouchers.length} mục)
          </h2>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">STT</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Mã giảm giá</th>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">
                  Mức giảm (%)
                </th>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">
                  Đơn hàng tối thiểu
                </th>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">
                  Giảm tối đa
                </th>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">
                  Ngày bắt đầu
                </th>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">
                  Ngày kết thúc
                </th>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentVouchers.map((voucher, index) => (
                <tr key={voucher.id} className="hover:bg-gray-100">
                  <td className="px-4 py-3 text-sm text-gray-900 text-center">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{voucher.code}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-center">
                    {voucher.percent}%
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-center">
                    {voucher.min_order_amount.toLocaleString('vi-VN')} VNĐ
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-center">
                    {voucher.max_amount.toLocaleString('vi-VN')} VNĐ
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-center">
                    {formatToVietnamTime(voucher.start_day)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-center">
                    {formatToVietnamTime(voucher.end_day)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center space-x-2">
                      <Link
                        to={`/vouchers/edit/${voucher.id}`}
                        onClick={() => handleEditVoucher(voucher.id)}
                        className="px-3 py-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center cursor-pointer touch-manipulation"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Sửa
                      </Link>
                      <button
                        onClick={() => handleDeleteVoucher(voucher.id)}
                        className="px-3 py-2 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex items-center cursor-pointer touch-manipulation"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden">
          <div className="divide-y divide-gray-200">
            {currentVouchers.map((voucher, index) => (
              <div key={voucher.id} className="p-4 hover:bg-gray-50">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium" title={voucher.code}>
                        {startIndex + index + 1} - {voucher.code}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        <strong className="mr-3 text-gray-800 font-medium">Mức giảm:</strong>{' '}
                        {voucher.percent}%
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        <strong className="mr-3 text-gray-800 font-medium">
                          Đơn hàng tối thiểu:
                        </strong>{' '}
                        {voucher.min_order_amount.toLocaleString('vi-VN')} VNĐ
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        <strong className="mr-3 text-gray-800 font-medium">Giảm tối đa:</strong>{' '}
                        {voucher.max_amount.toLocaleString('vi-VN')} VNĐ
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        <strong className="mr-3 text-gray-800 font-medium">Ngày bắt đầu:</strong>{' '}
                        {formatToVietnamTime(voucher.start_day)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        <strong className="mr-3 text-gray-800 font-medium">Ngày kết thúc:</strong>{' '}
                        {formatToVietnamTime(voucher.end_day)}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Link
                      to={`/vouchers/edit/${voucher.id}`}
                      onClick={() => handleEditVoucher(voucher.id)}
                      className="px-3 py-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center cursor-pointer touch-manipulation"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Sửa
                    </Link>
                    <button
                      onClick={() => handleDeleteVoucher(voucher.id)}
                      className="px-3 py-2 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex items-center cursor-pointer touch-manipulation"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredVouchers.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            {searchTerm || startDateFilter || endDateFilter
              ? 'Không tìm thấy mã giảm giá nào phù hợp'
              : 'Chưa có mã giảm giá'}
          </div>
        )}

        {/* Pagination */}
        {filteredVouchers.length > 0 && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              <div className="text-sm text-gray-700">
                Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredVouchers.length)} của{' '}
                {filteredVouchers.length} mục
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
                          className={`px-3 py-1 text-sm border rounded ${
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
                  className="px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  Sau
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Form */}
      {editVoucherId && (
        <div className="bg-white rounded shadow-md mt-6">
          <div className="bg-[var(--color-title)] text-white p-3 rounded-t">
            <h2 className="text-base font-semibold">CHỈNH SỬA MÃ GIẢM GIÁ</h2>
          </div>
          <div className="p-4">
            {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mã giảm giá</label>
                <input
                  type="text"
                  value={editForm.code}
                  onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Nhập mã giảm giá..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mức giảm (%)</label>
                <input
                  type="number"
                  value={editForm.percent}
                  onChange={(e) => setEditForm({ ...editForm, percent: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Nhập mức giảm giá..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá trị đơn hàng tối thiểu (VNĐ)
                </label>
                <input
                  type="number"
                  value={editForm.min_order_amount}
                  onChange={(e) => setEditForm({ ...editForm, min_order_amount: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Nhập giá trị đơn hàng tối thiểu..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá trị giảm tối đa (VNĐ)
                </label>
                <input
                  type="number"
                  value={editForm.max_amount}
                  onChange={(e) => setEditForm({ ...editForm, max_amount: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Nhập giá trị giảm tối đa..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu</label>
                <input
                  type="datetime-local"
                  value={editForm.start_day}
                  onChange={(e) => setEditForm({ ...editForm, start_day: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày kết thúc
                </label>
                <input
                  type="datetime-local"
                  value={editForm.end_day}
                  onChange={(e) => setEditForm({ ...editForm, end_day: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 flex items-center cursor-pointer touch-manipulation"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateVoucher}
                disabled={loading}
                className={`px-4 py-2 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600 flex items-center cursor-pointer touch-manipulation ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Đang xử lý...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Voucher;
