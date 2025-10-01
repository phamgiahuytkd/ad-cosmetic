'use client';

import { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, Edit, Trash2, Plus, Image, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../../service/api';
import { formatToVietnamTime, getImageUrl } from '../../common/commonFunc';

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

const Gift = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gifts, setGifts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/gift');
        if (response.data.result) {
          setGifts(response.data.result);
          console.log('Gift data:', response.data.result);
        } else {
          setError(response?.data?.message || 'Không thể tải danh sách quà tặng');
        }
      } catch (error) {
        setError(error.response?.data?.message || 'Lỗi khi tải dữ liệu');
        console.error('Error fetching gifts:', error);
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

  // Filter gifts based on search term and date range
  const filteredGifts = useMemo(() => {
    return gifts.filter((gift) => {
      const searchLower = removeDiacritics(searchTerm).toLowerCase();
      const matchesSearch =
        removeDiacritics(gift.name || '')
          .toLowerCase()
          .includes(searchLower) || gift.id.toString().toLowerCase().includes(searchLower);

      const giftStartDate = new Date(gift.start_day);
      const giftEndDate = new Date(gift.end_day);
      const filterStart = startDateFilter ? new Date(startDateFilter) : null;
      const filterEnd = endDateFilter ? new Date(endDateFilter) : null;

      const matchesDateRange =
        (!filterStart || giftStartDate >= filterStart) && (!filterEnd || giftEndDate <= filterEnd);

      return matchesSearch && matchesDateRange;
    });
  }, [gifts, searchTerm, startDateFilter, endDateFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredGifts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentGifts = filteredGifts.slice(startIndex, endIndex);

  // Delete Gift
  const handleDeleteGift = async (giftId) => {
    const result = await Swal.fire({
      title: 'Xác nhận',
      text: 'Bạn có chắc muốn xóa quà tặng này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/gift/${giftId}`);
        setGifts(gifts.filter((gift) => gift.id !== giftId));
        Swal.fire({
          title: 'Thành công',
          text: 'Đã xóa quà tặng thành công!',
          icon: 'success',
          confirmButtonColor: '#22c55e',
        });
      } catch (error) {
        console.error('Error deleting gift:', error);
        setError(error.response?.data?.message || 'Lỗi khi xóa quà tặng');
        Swal.fire({
          title: 'Lỗi',
          text: error.response?.data?.message || 'Lỗi khi xóa quà tặng',
          icon: 'error',
          confirmButtonColor: '#ef4444',
        });
      }
    }
  };

  // Navigate to Edit Page
  const handleEditGift = (id) => {
    navigate(`/gifts/edit/${id}`);
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
              className="px-4 py-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center cursor-pointer touch-manipulation"
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
          to="/gifts/add"
          className="shadow-md px-4 py-2 text-sm uppercase bg-green-500 text-white rounded hover:bg-green-600 flex items-center cursor-pointer touch-manipulation"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm quà tặng mới
        </Link>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-sm p-3 sm:p-4 mb-4 sm:mb-6 shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm quà tặng
            </label>
            <input
              type="text"
              placeholder="Tìm theo mã hoặc tên"
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

      {/* Gift List */}
      <div className="bg-white rounded shadow-md">
        <div className="bg-[var(--color-title)] text-white p-3 rounded-t flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <h2 className="text-base font-semibold">QUẢN LÝ QUÀ TẶNG ({filteredGifts.length} mục)</h2>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">STT</th>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Hình ảnh</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                  Tên biến thể
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Thuộc tính</th>
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
              {currentGifts.map((gift, index) => (
                <tr key={gift.id} className="hover:bg-gray-100">
                  <td className="px-4 py-3 text-sm text-gray-900 text-center">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {gift.image ? (
                      <img
                        src={getImageUrl(gift.image)}
                        alt={gift.name}
                        className="w-16 h-16 object-cover rounded mx-auto"
                      />
                    ) : (
                      <Image className="w-16 h-16 text-gray-400 mx-auto" />
                    )}
                  </td>
                  <td
                    className="px-4 py-3 text-sm text-gray-900 font-medium max-w-xs truncate"
                    title={gift.name}
                  >
                    {gift.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {gift.attribute_values && gift.attribute_values.length > 0
                      ? gift.attribute_values
                          .map((attr) => `${attr.attribute_id}: ${attr.id}`)
                          .join(', ')
                      : 'N/A'}
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-900 text-center">
                    {formatToVietnamTime(gift.start_day)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-center">
                    {formatToVietnamTime(gift.end_day)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center space-x-2">
                      <Link
                        to={`/gifts/edit/${gift.id}`}
                        className="px-3 py-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center cursor-pointer touch-manipulation"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Sửa
                      </Link>
                      <button
                        onClick={() => handleDeleteGift(gift.id)}
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
            {currentGifts.map((gift, index) => (
              <div key={gift.id} className="p-4 hover:bg-gray-50">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {gift.image ? (
                            <img
                              src={getImageUrl(gift.image)}
                              alt={gift.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <Image className="w-16 h-16 text-gray-400" />
                          )}
                        </div>
                        <div className="font-medium max-w-xs truncate" title={gift.name}>
                          {startIndex + index + 1} - {gift.name}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        <strong className="mr-3 text-gray-800 font-medium">Thuộc tính:</strong>
                        {gift.attribute_values && gift.attribute_values.length > 0
                          ? gift.attribute_values
                              .map((attr) => `${attr.attribute_id}: ${attr.id}`)
                              .join(', ')
                          : 'N/A'}
                      </div>

                      <div className="text-sm text-gray-500 mt-1">
                        <strong className="mr-3 text-gray-800 font-medium">Ngày bắt đầu:</strong>
                        {formatToVietnamTime(gift.start_day)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        <strong className="mr-3 text-gray-800 font-medium">Ngày kết thúc:</strong>
                        {formatToVietnamTime(gift.end_day)}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Link
                      to={`/gifts/edit/${gift.id}`}
                      className="px-3 py-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center cursor-pointer touch-manipulation"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Sửa
                    </Link>
                    <button
                      onClick={() => handleDeleteGift(gift.id)}
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
        {filteredGifts.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            {searchTerm || startDateFilter || endDateFilter
              ? 'Không tìm thấy quà tặng nào phù hợp'
              : 'Chưa có quà tặng'}
          </div>
        )}

        {/* Pagination */}
        {filteredGifts.length > 0 && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              <div className="text-sm text-gray-700">
                Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredGifts.length)} của{' '}
                {filteredGifts.length} mục
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm border rounded ${
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
    </div>
  );
};

export default Gift;
