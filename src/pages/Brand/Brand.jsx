'use client';

import { useEffect, useState } from 'react';
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
} from 'lucide-react';
// import * as apis from "../../service"
import { Link } from 'react-router-dom';
import api from '../../service/api';
import { getImageUrl } from '../../common/commonFunc';

const Brand = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [brands, setBrands] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const getAllBrand = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/brand');

      if (response.data.result) {
        setBrands(response.data.result);
      } else {
        setError(response?.data?.message || 'Không thể tải danh sách thương hiệu');
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      setError('Lỗi kết nối API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllBrand();
  }, []);

  // Auto filter when search term or status changes
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter]);

  const filteredBrands = brands.filter((brand) => {
    const matchesSearch = brand.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === '' ||
      (statusFilter === 'true' && brand.isActive) ||
      (statusFilter === 'false' && !brand.isActive);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredBrands.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBrands = filteredBrands.slice(startIndex, endIndex);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(brands.map((brand) => brand.id));
    } else {
      setSelectedItems([]);
    }
  };

  // const handleSelectItem = (id) => {
  //   setSelectedItems((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  // }

  // const handleToggleActive = async (brandId, currentStatus) => {
  //   try {
  //     const response = await apis.apiUpdateBrandVisibility(brandId, {
  //       isActive: !currentStatus,
  //     })

  //     if (response.success) {
  //       setBrands((prev) =>
  //         prev.map((brand) => (brand._id === brandId ? { ...brand, isActive: !brand.isActive } : brand)),
  //       )
  //     } else {
  //       setError(response.msg || "Không thể cập nhật trạng thái thương hiệu")
  //     }
  //   } catch (error) {
  //     console.error("Error toggling brand status:", error)
  //     setError("Lỗi khi thay đổi trạng thái thương hiệu")
  //   }
  // }

  // Statistics
  const totalBrands = brands.length;
  const activeBrands = brands.filter((brand) => brand.isActive).length;
  const inactiveBrands = totalBrands - activeBrands;

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
              // onClick={getAllBrand}
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
        {/* Desktop buttons */}
        <div className="hidden sm:flex space-x-1 rounded-lg p-1">
          <Link
            to="add"
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-sm hover:bg-blue-600 flex items-center transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            THÊM THƯƠNG HIỆU
          </Link>
          <button className="px-4 py-2 text-sm bg-green-500 text-white rounded-sm hover:bg-green-600 flex items-center transition-colors cursor-pointer">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            THÊM THƯƠNG HIỆU BẰNG EXCEL
          </button>
          <Link
            to="/products/product-management"
            className="px-4 py-2 text-sm bg-orange-500 text-white rounded-sm hover:bg-orange-600 flex items-center transition-colors cursor-pointer"
          >
            <Package className="w-4 h-4 mr-2" />
            QUẢN LÝ SẢN PHẨM
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="sm:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-full px-4 py-3 bg-blue-500 text-white rounded-sm hover:bg-blue-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4 mr-2" /> : <Menu className="w-4 h-4 mr-2" />}
            MENU
          </button>

          {/* Mobile dropdown menu */}
          {isMobileMenuOpen && (
            <div className="mt-2 space-y-2 bg-white border border-gray-200 rounded-sm shadow-lg p-2">
              <Link
                to="add"
                className="w-full px-4 py-2 text-sm bg-blue-500 text-white rounded-sm hover:bg-blue-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                THÊM THƯƠNG HIỆU
              </Link>
              <button className="w-full px-4 py-2 text-sm bg-green-500 text-white rounded-sm hover:bg-green-600 flex items-center justify-center transition-colors cursor-pointer">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                THÊM THƯƠNG HIỆU BẰNG EXCEL
              </button>
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
              <p className="text-sm font-medium text-blue-600">Tổng thương hiệu</p>
              <p className="text-2xl font-bold text-blue-800">{totalBrands}</p>
            </div>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Đang hoạt động</p>
              <p className="text-2xl font-bold text-green-800">{activeBrands}</p>
            </div>
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Eye className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Không hoạt động</p>
              <p className="text-2xl font-bold text-red-800">{inactiveBrands}</p>
            </div>
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <EyeOff className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-sm p-3 sm:p-4 mb-4 sm:mb-6 border-gray-100 border">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tên thương hiệu</label>
            <input
              type="text"
              placeholder="Tên thương hiệu"
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
              <option value="">Tất cả ({totalBrands})</option>
              <option value="true">Hoạt động ({activeBrands})</option>
              <option value="false">Không hoạt động ({inactiveBrands})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Brand List */}
      <div className="bg-white rounded-sm shadow-md">
        {/* Header */}
        <div className="bg-[#00D5BE] text-white p-3 rounded-t-sm flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <h2 className="text-base font-semibold">
            QUẢN LÝ THƯƠNG HIỆU ({filteredBrands.length} mục)
          </h2>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <button className="w-full sm:w-auto px-2 py-1 bg-white bg-opacity-90 rounded text-xs hover:bg-yellow-400 hover:text-white text-gray-700 font-medium flex items-center justify-center border border-white border-opacity-30 transition-all duration-200 cursor-pointer">
              <Download className="w-3 h-3 mr-1" />
              XUẤT EXCEL
            </button>
            <button
              className="w-full sm:w-auto px-2 py-1 bg-red-500 rounded text-xs hover:bg-red-600 cursor-pointer disabled:opacity-50"
              disabled={selectedItems.length === 0}
            >
              Xóa đã chọn ({selectedItems.length})
            </button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedItems.length === brands.length && brands.length > 0}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">STT</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Hình ảnh</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Tên thương hiệu
                </th>
                {/* <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Trạng thái</th> */}
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Hoạt động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentBrands.map((brand, index) => (
                <tr key={brand.id} className="hover:bg-gray-100">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(brand.id)}
                      // onChange={() => handleSelectItem(brand._id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{startIndex + index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center flex-shrink-0">
                      {brand.image ? (
                        <img
                          src={getImageUrl(brand.image) || '/placeholder.svg'}
                          alt={brand.name}
                          className="w-full h-full object-contain rounded"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-full h-full bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs ${
                          brand.image ? 'hidden' : 'flex'
                        }`}
                      >
                        <span>📷</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{brand.name}</td>
                  {/* <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        brand.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {brand.isActive ? "Hoạt động" : "Không hoạt động"}
                    </span>
                  </td> */}
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <Link
                        to={`edit/${brand.id}`}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center cursor-pointer"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Sửa
                      </Link>
                      <button
                        // onClick={() => handleToggleActive(brand.id, brand.isActive)}
                        className={`px-3 py-1 rounded text-xs flex items-center cursor-pointer transition-colors ${
                          brand.isActive
                            ? 'bg-orange-500 text-white hover:bg-orange-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {brand.isActive ? (
                          <>
                            <EyeOff className="w-3 h-3 mr-1" />
                            Ẩn
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            Hiện
                          </>
                        )}
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
          {/* Select All Mobile */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={selectedItems.length === brands.length && brands.length > 0}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Chọn tất cả</span>
            </label>
          </div>

          {/* Brand Cards */}
          <div className="divide-y divide-gray-200">
            {currentBrands.map((brand, index) => (
              <div key={brand.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(brand._id)}
                    // onChange={() => handleSelectItem(brand._id)}
                    className="rounded border-gray-300 mt-1 flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center flex-shrink-0">
                          {brand.logoUrl ? (
                            <img
                              src={brand.logoUrl || '/placeholder.svg'}
                              alt={brand.name}
                              className="w-full h-full object-contain rounded"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-full h-full bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm ${
                              brand.logoUrl ? 'hidden' : 'flex'
                            }`}
                          >
                            <span>📷</span>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            #{startIndex + index + 1} - {brand.name}
                          </div>
                          <div className="mt-1">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                brand.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {brand.isActive ? 'Hoạt động' : 'Không hoạt động'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2 flex-shrink-0">
                        <Link
                          to={`edit/${brand._id}`}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center cursor-pointer"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Sửa
                        </Link>
                        <button
                          // onClick={() => handleToggleActive(brand._id, brand.isActive)}
                          className={`px-3 py-1 rounded text-xs flex items-center cursor-pointer transition-colors ${
                            brand.isActive
                              ? 'bg-orange-500 text-white hover:bg-orange-600'
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          {brand.isActive ? (
                            <>
                              <EyeOff className="w-3 h-3 mr-1" />
                              Ẩn
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 mr-1" />
                              Hiện
                            </>
                          )}
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
        {filteredBrands.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || statusFilter
              ? 'Không có thương hiệu nào phù hợp với điều kiện lọc'
              : 'Chưa có thương hiệu nào'}
          </div>
        )}

        {/* Pagination */}
        {filteredBrands.length > 0 && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
              <div className="text-sm text-gray-700">
                Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredBrands.length)} của{' '}
                {filteredBrands.length} mục
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

export default Brand;
