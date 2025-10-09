'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Download,
  FileText,
  Plus,
  FileSpreadsheet,
  Package,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Trash2,
  Edit,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../../service/api';
import { getImageUrl } from '../../common/commonFunc';

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

const Poster = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [posters, setPosters] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // Tăng lên 20 áp phích mỗi trang

  const getAllPosters = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/poster');

      if (response.data.result) {
        setPosters(response.data.result);
        console.log(response.data.result);
      } else {
        setError(response?.data?.message || 'Không thể tải danh sách áp phích');
      }
    } catch (error) {
      console.error('Error fetching posters:', error);
      setError('Lỗi kết nối API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllPosters();
  }, []);

  // Auto reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const filteredPosters = useMemo(() => {
    return posters.filter((poster) => {
      const matchesSearch =
        removeDiacritics(poster.title || '')
          .toLowerCase()
          .includes(removeDiacritics(searchTerm).toLowerCase()) ||
        poster.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === '' ||
        (statusFilter === 'active' && poster.is_active) ||
        (statusFilter === 'inactive' && !poster.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [posters, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredPosters.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPosters = filteredPosters.slice(startIndex, endIndex);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(posters.map((poster) => poster.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleDelete = async (posterId) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Xác nhận xóa',
      text: 'Bạn có chắc chắn muốn xóa áp phích này? Hành động này không thể hoàn tác.',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/poster/${posterId}`);
        Swal.fire({
          icon: 'success',
          title: 'Thành công',
          text: 'Đã xóa áp phích thành công.',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'OK',
        });
        setPosters((prevPosters) => prevPosters.filter((poster) => poster.id !== posterId));
      } catch (err) {
        console.error('Delete error:', err);
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: err.response?.data?.message || 'Có lỗi xảy ra khi xóa áp phích. Vui lòng thử lại.',
          confirmButtonColor: '#d33',
          confirmButtonText: 'OK',
        });
      }
    }
  };

  // Statistics
  const totalPosters = posters.length;
  const activePosters = posters.filter((poster) => poster.is_active).length;
  const inactivePosters = posters.filter((poster) => !poster.is_active).length;

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
          <span className="ml-2 text-gray-500">Đang tải dữ liệu...</span>
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
              onClick={getAllPosters}
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
      {/* Header Tabs */}
      <div className="mb-4 sm:mb-6">
        {/* Desktop buttons */}
        <div className="hidden sm:flex space-x-1 rounded-lg p-1">
          <Link
            to="add"
            className="shadow-md px-4 py-2 text-sm bg-green-500 text-white rounded-sm hover:bg-green-600 flex items-center transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            THÊM ÁP PHÍCH
          </Link>
        </div>

        {/* Mobile menu */}
        <div className="sm:hidden">
          <div className="mt-2 space-y-2 bg-white border border-gray-200 rounded-sm shadow-lg p-2">
            <Link
              to="add"
              className="w-full px-4 py-2 text-sm bg-blue-500 text-white rounded-sm hover:bg-blue-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" />
              THÊM ÁP PHÍCH
            </Link>
            <Link
              to="/products/product-management"
              className="w-full px-4 py-2 text-sm bg-orange-500 text-white rounded-sm hover:bg-orange-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Package className="w-4 h-4 mr-2" />
              QUẢN LÝ SẢN PHẨM
            </Link>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-sm p-3 sm:p-4 mb-4 sm:mb-6 shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề áp phích</label>
            <input
              type="text"
              placeholder="Tiêu đề áp phích"
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả ({totalPosters})</option>
              <option value="active">Đang hoạt động ({activePosters})</option>
              <option value="inactive">Không hoạt động ({inactivePosters})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Poster List */}
      <div className="bg-white rounded-sm shadow-md">
        {/* Header */}
        <div className="bg-[var(--color-title)] text-white p-3 rounded-t-sm flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <h2 className="text-base font-semibold">
            QUẢN LÝ ÁP PHÍCH ({filteredPosters.length} mục)
          </h2>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">STT</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Hình ảnh</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Đường dẫn</th>
                <th className="px-12 py-3 text-right text-sm font-bold text-gray-700">Hoạt động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentPosters.map((poster, index) => (
                <tr key={poster.id} className="hover:bg-gray-100">
                  <td className="px-4 py-3 text-sm text-gray-900">{startIndex + index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center flex-shrink-0">
                      {poster.image ? (
                        <img
                          src={getImageUrl(poster.image) || '/placeholder.svg'}
                          alt={poster.title}
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-full h-full bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs ${
                          poster.image ? 'hidden' : 'flex'
                        }`}
                      >
                        <span>📷</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    <Link to={poster.link || ''} className="text-blue-500 hover:underline">
                      {poster.link}
                    </Link>
                  </td>
                  <td className="px-4 py-3 items-center justify-end">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        to={`edit/${poster.id}`}
                        className="px-3 py-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center cursor-pointer touch-manipulation"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Sửa
                      </Link>
                      <button
                        onClick={() => handleDelete(poster.id)}
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
        <div className="sm:hidden">
          <div className="divide-y divide-gray-200">
            {currentPosters.map((poster, index) => (
              <div key={poster.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start space-x-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center flex-shrink-0">
                          {poster.image ? (
                            <img
                              src={getImageUrl(poster.image) || '/placeholder.svg'}
                              alt={poster.title}
                              className="w-full h-full object-cover rounded"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-full h-full bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm ${
                              poster.image ? 'hidden' : 'flex'
                            }`}
                          >
                            <span>📷</span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {startIndex + index + 1} -{' '}
                            <Link to={poster.link || ''} className="text-blue-500 hover:underline">
                              {poster.link}
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 flex-shrink-0">
                        <Link
                          to={`edit/${poster.id}`}
                          className="px-3 py-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center cursor-pointer"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Sửa
                        </Link>
                        <button
                          onClick={() => handleDelete(poster.id)}
                          className="px-3 py-2 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex items-center cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredPosters.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || statusFilter
              ? 'Không có áp phích nào phù hợp với điều kiện lọc'
              : 'Chưa có áp phích nào'}
          </div>
        )}

        {/* Pagination */}
        {filteredPosters.length > 0 && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              <div className="text-sm text-gray-700">
                Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredPosters.length)} của{' '}
                {filteredPosters.length} mục
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
    </div>
  );
};

export default Poster;
