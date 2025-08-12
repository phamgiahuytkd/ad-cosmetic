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
} from 'lucide-react';
import { Link } from 'react-router-dom';
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

const Category = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const getAllCategory = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/category');
      if (response.data.result) {
        setCategories(response.data.result);
      } else {
        setError(response?.data?.message || 'Không thể tải danh sách danh mục');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Lỗi kết nối API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllCategory();
  }, []);

  // Auto filter when search term or status changes
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter]);

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const matchesSearch =
        removeDiacritics(category.name || '')
          .toLowerCase()
          .includes(removeDiacritics(searchTerm).toLowerCase()) ||
        category.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === '' ||
        (statusFilter === 'with_products' && (category.product_quantity || 0) > 0) ||
        (statusFilter === 'no_products' && (category.product_quantity || 0) === 0);
      return matchesSearch && matchesStatus;
    });
  }, [categories, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCategories = filteredCategories.slice(startIndex, endIndex);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(categories.map((cat) => cat.id));
    } else {
      setSelectedItems([]);
    }
  };

  // Statistics
  const totalCategories = categories.length;
  const categoriesWithProducts = categories.filter((cat) => (cat.product_quantity || 0) > 0).length;
  const categoriesWithoutProducts = categories.filter(
    (cat) => (cat.product_quantity || 0) === 0,
  ).length;

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
              onClick={getAllCategory}
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
    <div className="p-3 sm:p-6 bg-white min-h-screen">
      {/* Header Tabs */}
      <div className="mb-4 sm:mb-6">
        <div className="hidden sm:flex space-x-1 rounded-lg p-1">
          <Link
            to="add"
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-sm hover:bg-blue-600 flex items-center transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            THÊM DANH MỤC
          </Link>
          <Link
            to="/products/product-management"
            className="px-4 py-2 text-sm bg-orange-500 text-white rounded-sm hover:bg-orange-600 flex items-center transition-colors cursor-pointer"
          >
            <Package className="w-4 h-4 mr-2" />
            QUẢN LÝ SẢN PHẨM
          </Link>
        </div>

        <div className="sm:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-full px-4 py-3 bg-blue-500 text-white rounded-sm hover:bg-blue-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4 mr-2" /> : <Menu className="w-4 h-4 mr-2" />}
            MENU
          </button>
          {isMobileMenuOpen && (
            <div className="mt-2 space-y-2 bg-white border border-gray-200 rounded-sm shadow-lg p-2">
              <Link
                to="add"
                className="w-full px-4 py-2 text-sm bg-blue-500 text-white rounded-sm hover:bg-blue-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                THÊM DANH MỤC
              </Link>
              <Link
                to="/products/product-management"
                className="w-full px-4 py-2 text-sm bg-orange-500 text-white rounded-sm hover:bg-orange-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Package className="w-4 h-4 mr-2" />
                QUẢN LÝ SẢN PHẨM
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 sm:mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Tổng danh mục</p>
              <p className="text-2xl font-bold text-blue-800">{totalCategories}</p>
            </div>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Có sản phẩm</p>
              <p className="text-2xl font-bold text-green-800">{categoriesWithProducts}</p>
            </div>
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Không sản phẩm</p>
              <p className="text-2xl font-bold text-red-800">{categoriesWithoutProducts}</p>
            </div>
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-sm p-3 sm:p-4 mb-4 sm:mb-6 border-gray-100 border">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tên danh mục</label>
            <input
              type="text"
              placeholder="Tên danh mục"
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
              <option value="">Tất cả ({totalCategories})</option>
              <option value="with_products">
                Có sản phẩm ({categories.filter((c) => (c.product_quantity || 0) > 0).length})
              </option>
              <option value="no_products">
                Không sản phẩm ({categories.filter((c) => (c.product_quantity || 0) === 0).length})
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Category List */}
      <div className="bg-white rounded-sm shadow-md">
        {/* Header */}
        <div className="bg-[#00D5BE] text-white p-3 rounded-t-sm flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <h2 className="text-base font-semibold">
            QUẢN LÝ DANH MỤC ({filteredCategories.length} mục)
          </h2>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">STT</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Hình ảnh</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                  Tên danh mục
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Số lượng SP</th>
                <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">Hoạt động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentCategories.map((category, index) => (
                <tr key={category.id} className="hover:bg-gray-100">
                  <td className="px-4 py-3 text-sm text-gray-900">{startIndex + index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center flex-shrink-0">
                      {category.image ? (
                        <img
                          src={getImageUrl(category.image) || '/placeholder.svg'}
                          alt={category.name}
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-full h-full bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs ${
                          category.image ? 'hidden' : 'flex'
                        }`}
                      >
                        <span>📷</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{category.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {category.product_quantity || 0}
                  </td>
                  <td className="px-4 py-3 items-center justify-end">
                    <div className="flex items-center justify-end">
                      <Link
                        to={`edit/${category.id}`}
                        className="px-6 py-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center cursor-pointer touch-manipulation"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Sửa
                      </Link>
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
            {currentCategories.map((category, index) => (
              <div key={category.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start space-x-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center flex-shrink-0">
                          {category.image ? (
                            <img
                              src={getImageUrl(category.image) || '/placeholder.svg'}
                              alt={category.name}
                              className="w-full h-full object-cover rounded"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-full h-full bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm ${
                              category.image ? 'hidden' : 'flex'
                            }`}
                          >
                            <span>📷</span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {startIndex + index + 1} - {category.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Số lượng SP: {category.product_quantity || 0}
                          </div>
                          <div className="mt-1">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                category.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {category.isActive ? 'Hoạt động' : 'Không hoạt động'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 flex-shrink-0">
                        <Link
                          to={`edit/${category.id}`}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center cursor-pointer"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Sửa
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || statusFilter
              ? 'Không có danh mục nào phù hợp với điều kiện lọc'
              : 'Chưa có danh mục nào'}
          </div>
        )}

        {/* Pagination */}
        {filteredCategories.length > 0 && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              <div className="text-sm text-gray-700">
                Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredCategories.length)} của{' '}
                {filteredCategories.length} mục
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

export default Category;
