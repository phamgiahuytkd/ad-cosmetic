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
import { ProductDetailModal } from '../../components';
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

const Product = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const itemsPerPage = 20; // Tăng lên 20 sản phẩm mỗi trang

  const getAllProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/product');

      if (response.data.result) {
        setProducts(response.data.result);
      } else {
        setError(response?.data?.message || 'Không thể tải danh sách sản phẩm');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Lỗi kết nối API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllProducts();
  }, []);

  // Auto filter when search term or status changes
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter]);

  // Lọc sản phẩm theo tên, thương hiệu, danh mục (không dấu) và trạng thái stock
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        removeDiacritics(product.name || '')
          .toLowerCase()
          .includes(removeDiacritics(searchTerm).toLowerCase()) ||
        removeDiacritics(product.brand || '')
          .toLowerCase()
          .includes(removeDiacritics(searchTerm).toLowerCase()) ||
        removeDiacritics(product.category || '')
          .toLowerCase()
          .includes(removeDiacritics(searchTerm).toLowerCase());

      const matchesStatus =
        statusFilter === '' ||
        (statusFilter === 'in_stock' && (product.stock || 0) > 0) ||
        (statusFilter === 'out_of_stock' && (product.stock || 0) === 0);

      return matchesSearch && matchesStatus;
    });
  }, [products, searchTerm, statusFilter]);

  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProducts = filteredProducts.slice(startIndex, endIndex);

    return {
      totalPages,
      startIndex,
      endIndex,
      currentProducts,
    };
  }, [filteredProducts, currentPage, itemsPerPage]);

  const { totalPages, startIndex, endIndex, currentProducts } = paginationData;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(products.map((product) => product.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleProductClick = (product, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // Thống kê trạng thái
  const totalProducts = products.length;
  const inStockProducts = products.filter((product) => (product.stock || 0) > 0).length;
  const outOfStockProducts = products.filter((product) => (product.stock || 0) === 0).length;

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
              onClick={getAllProducts}
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
            THÊM SẢN PHẨM
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="sm:hidden">
          <div className="mt-2 space-y-2 bg-white border border-gray-200 rounded-sm shadow-lg p-2">
            <Link
              to="add"
              className="w-full px-4 py-2 text-sm bg-blue-500 text-white rounded-sm hover:bg-blue-600 flex items-center justify-center transition-colors cursor-pointer touch-manipulation"
            >
              <Plus className="w-4 h-4 mr-2" />
              THÊM SẢN PHẨM
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 sm:mb-6">
        <div className="bg-white shadow-md rounded-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Tổng sản phẩm</p>
              <p className="text-2xl font-bold text-blue-800">{totalProducts}</p>
            </div>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-green-50 shadow-md rounded-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Còn hàng</p>
              <p className="text-2xl font-bold text-green-800">{inStockProducts}</p>
            </div>
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-red-50 shadow-md rounded-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Hết hàng</p>
              <p className="text-2xl font-bold text-red-800">{outOfStockProducts}</p>
            </div>
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-sm p-3 sm:p-4 mb-4 sm:mb-6 shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
            <input
              type="text"
              placeholder="Tên, danh mục, thương hiệu"
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
              <option value="">Tất cả ({totalProducts})</option>
              <option value="in_stock">Còn hàng ({inStockProducts})</option>
              <option value="out_of_stock">Hết hàng ({outOfStockProducts})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-sm shadow-md">
        {/* Header */}
        <div className="bg-[var(--color-title)] text-white p-3 rounded-t-sm flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <h2 className="text-base font-semibold">
            QUẢN LÝ SẢN PHẨM ({filteredProducts.length} mục)
          </h2>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">STT</th>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Hình ảnh</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                  Tên sản phẩm
                </th>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Thương hiệu</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Danh mục</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Trạng thái</th>
                <th className="px-6 py-3 text-right text-sm font-bold text-gray-700">Hoạt động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentProducts.map((product, index) => (
                <tr key={product.id} className="hover:bg-gray-100">
                  <td className="px-4 py-3 text-sm text-gray-900 text-center">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-4 py-3 flex items-center justify-center">
                    <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center flex-shrink-0">
                      <img
                        src={getImageUrl(product.image) || '/placeholder.svg'}
                        alt={product.name}
                        className="w-full h-full object-cover object-center rounded cursor-pointer hover:scale-105 transition-transform"
                        onClick={(e) => handleProductClick(product, e)}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div
                        className={`w-full h-full bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs ${
                          product.image ? 'hidden' : 'flex'
                        }`}
                      >
                        <span>📷</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium max-w-xs">
                    <button
                      onClick={(e) => handleProductClick(product, e)}
                      className="text-blue-600 hover:text-blue-800 hover:underline text-left font-medium cursor-pointer touch-manipulation"
                      title={product.name}
                    >
                      {truncateText(product.name, 40)}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{product.brand || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{product.category || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-sm ${
                        (product.stock || 0) > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {(product.stock || 0) > 0 ? 'Còn hàng' : 'Hết hàng'}
                    </span>
                  </td>
                  <td className="px-4 py-3 items-center justify-end">
                    <div className="flex items-center justify-end">
                      <Link
                        to={`edit/${product.id}`}
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
            {currentProducts.map((product, index) => (
              <div key={product.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start space-x-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div
                          className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center flex-shrink-0 cursor-pointer"
                          onClick={(e) => handleProductClick(product, e)}
                        >
                          <img
                            src={getImageUrl(product.image) || '/placeholder.svg'}
                            alt={product.name}
                            className="w-full h-full object-cover rounded"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div
                            className={`w-full h-full bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm ${
                              product.image ? 'hidden' : 'flex'
                            }`}
                          >
                            <span>📷</span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <button
                            onClick={(e) => handleProductClick(product, e)}
                            className="text-sm font-medium hover:text-blue-600 hover:underline text-left cursor-pointer touch-manipulation block w-full"
                            title={product.name}
                          >
                            {startIndex + index + 1} - {truncateText(product.name, 30)}
                          </button>
                          <div className="text-xs text-gray-500 mt-1">
                            {product.brand || 'N/A'} • {product.category || 'N/A'}
                          </div>
                          <div className="mt-1">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-sm ${
                                (product.stock || 0) > 0
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {(product.stock || 0) > 0 ? 'Còn hàng' : 'Hết hàng'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 flex-shrink-0">
                        <Link
                          to={`edit/${product.id}`}
                          className="px-3 py-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center cursor-pointer touch-manipulation"
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
        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || statusFilter
              ? 'Không có sản phẩm nào phù hợp với điều kiện lọc'
              : 'Chưa có sản phẩm nào'}
          </div>
        )}

        {/* Pagination */}
        {filteredProducts.length > 0 && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              <div className="text-sm text-gray-700">
                Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredProducts.length)} của{' '}
                {filteredProducts.length} mục
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

      {/* Product Detail Modal */}
      <ProductDetailModal
        productId={selectedProduct?.id}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
      />
    </div>
  );
};

export default Product;
