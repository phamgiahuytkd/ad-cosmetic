"use client"

import { useState, useRef, useEffect } from "react"
import { X, Package, Star, ShoppingCart, Barcode, Check, Loader2, Edit } from "lucide-react"
// import * as apis from "../../service"

const ProductDetailModal = ({ product, isOpen, onClose }) => {
  const [updatingStatus, setUpdatingStatus] = useState(null)
  const [productItems, setProductItems] = useState(product?.productItems)
  const [openDropdown, setOpenDropdown] = useState(null)
  const dropdownRef = useRef(null)

  const formatPrice = (price) => {
    if (!price && price !== 0) return "N/A"
    return price.toLocaleString("vi-VN") + "đ"
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "out_of_stock":
        return "bg-red-100 text-red-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "active":
        return "Hoạt động"
      case "out_of_stock":
        return "Hết hàng"
      case "inactive":
        return "Không hoạt động"
      default:
        return "Không xác định"
    }
  }

  // Thêm function này sau các function formatPrice, getStatusColor, getStatusText
  const renderVideoPlayer = (videoUrl) => {
    if (!videoUrl) return null

    // YouTube video
    if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
      let videoId = ""
      if (videoUrl.includes("youtube.com/watch?v=")) {
        videoId = videoUrl.split("v=")[1]?.split("&")[0]
      } else if (videoUrl.includes("youtu.be/")) {
        videoId = videoUrl.split("youtu.be/")[1]?.split("?")[0]
      }

      if (videoId) {
        return (
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="Product Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )
      }
    }

    // Vimeo video
    if (videoUrl.includes("vimeo.com")) {
      const videoId = videoUrl.split("vimeo.com/")[1]?.split("?")[0]
      if (videoId) {
        return (
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              src={`https://player.vimeo.com/video/${videoId}`}
              title="Product Video"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        )
      }
    }

    // Direct video file (mp4, webm, etc.)
    if (videoUrl.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
      return (
        <video className="w-full h-auto rounded-lg" controls preload="metadata">
          <source src={videoUrl} type="video/mp4" />
          Trình duyệt của bạn không hỗ trợ video.
        </video>
      )
    }

    // Fallback: show link
    return (
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-gray-600 mb-2">Video URL:</p>
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline break-all text-sm cursor-pointer"
        >
          {videoUrl}
        </a>
      </div>
    )
  }

  // Thêm function để cập nhật trạng thái
  // const handleStatusChange = async (productItemId, newStatus) => {
  //   try {
  //     setUpdatingStatus(productItemId)
  //     await apis.updateProductItemStatus(productItemId, { status: newStatus })

  //     // Cập nhật state local sau khi API thành công
  //     setProductItems((prevItems) =>
  //       prevItems.map((item) => (item._id === productItemId ? { ...item, status: newStatus } : item)),
  //     )

  //     // Hiển thị thông báo thành công (nếu có)
  //     // toast.success("Cập nhật trạng thái thành công")
  //   } catch (error) {
  //     console.error("Error updating status:", error)
  //     // toast.error("Không thể cập nhật trạng thái")
  //   } finally {
  //     setUpdatingStatus(null)
  //   }
  // }

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (product && product.productItems) {
      setProductItems(product.productItems)
    }
  }, [product])

  if (!isOpen || !product) return null

  console.log("Product items in modal:", productItems)

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00D5BE] to-[#17a2b8] text-white p-4 sm:p-6 rounded-t-lg flex justify-between items-start sticky top-0 z-10">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-lg sm:text-xl font-bold">CHI TIẾT SẢN PHẨM</h2>
            <p className="text-sm opacity-90 mt-1 break-words">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all flex-shrink-0 touch-manipulation cursor-pointer"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Thông tin tổng quan */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
            {/* Cột 1: Hình ảnh chính */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                  Hình ảnh chính
                </h3>
                <img
                  src={product.thumbUrl || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-48 sm:h-64 object-contain border rounded-lg bg-white"
                />
              </div>

              {/* Thống kê nhanh */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg text-center">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">{product.viewCount || 0}</div>
                  <div className="text-xs sm:text-sm text-blue-800">Lượt xem</div>
                </div>
                <div className="bg-green-50 p-3 sm:p-4 rounded-lg text-center">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">{product.soldCount || 0}</div>
                  <div className="text-xs sm:text-sm text-green-800">Đã bán</div>
                </div>
                <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg text-center">
                  <div className="text-xl sm:text-2xl font-bold text-yellow-600 flex items-center justify-center">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                    {product.ratingAvg || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-yellow-800">Đánh giá</div>
                </div>
                <div className="bg-purple-50 p-3 sm:p-4 rounded-lg text-center">
                  <div className="text-xl sm:text-2xl font-bold text-purple-600">{product.reviewCount || 0}</div>
                  <div className="text-xs sm:text-sm text-purple-800">Bình luận</div>
                </div>
              </div>
            </div>

            {/* Cột 2-3: Thông tin chi tiết */}
            <div className="lg:col-span-2 space-y-6">
              {/* Thông tin cơ bản */}
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-4">Thông tin cơ bản</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row">
                      <span className="font-medium text-gray-600 sm:w-32 mb-1 sm:mb-0">Tên sản phẩm:</span>
                      <span className="flex-1 font-semibold break-words">{product.name}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row">
                      <span className="font-medium text-gray-600 sm:w-32 mb-1 sm:mb-0">Thương hiệu:</span>
                      <span className="flex-1 text-blue-600 font-semibold">{product.brand?.name || "N/A"}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row">
                      <span className="font-medium text-gray-600 sm:w-32 mb-1 sm:mb-0">Danh mục:</span>
                      <span className="flex-1 text-green-600 font-semibold">{product.category?.name || "N/A"}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row">
                      <span className="font-medium text-gray-600 sm:w-32 mb-1 sm:mb-0">Trạng thái:</span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${product.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                      >
                        {product.isActive ? "Hoạt động" : "Không hoạt động"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Video URL */}
              {product.videoUrl && (
                <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-4">Video giới thiệu</h3>
                  {renderVideoPlayer(product.videoUrl)}
                </div>
              )}
            </div>
          </div>

          {/* Mô tả ngắn */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Mô tả ngắn</h3>
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <p>{product.shortDescription}</p>
            </div>
          </div>

          {/* Mô tả sản phẩm */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Mô tả sản phẩm</h3>
            <div
              className="prose max-w-none bg-gray-100 p-4 sm:p-6 rounded-lg text-sm sm:text-base"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>

          {/* Hình ảnh nổi bật */}
          {product.featuredImages && product.featuredImages.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Hình ảnh nổi bật</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {product.featuredImages.map((img, index) => (
                  <div key={index} className="bg-gray-50 p-2 rounded-lg">
                    <img
                      src={img.image || "/placeholder.svg"}
                      alt={`Featured ${index + 1}`}
                      className="w-full h-24 sm:h-32 object-contain rounded border bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Thông số kỹ thuật */}
          {product.specifications && product.specifications.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-semibold mb-4">Thông số kỹ thuật</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {product.specifications.map((spec, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <h4 className="font-semibold mb-3 text-blue-600 text-base sm:text-lg">{spec.group}</h4>
                    <div className="space-y-2">
                      {spec.items?.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-gray-200 last:border-b-0"
                        >
                          <span className="font-medium text-gray-700 text-sm">{item.label}:</span>
                          <span className="text-gray-900 font-semibold text-sm break-words">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mục sản phẩm */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" />
              Mục sản phẩm ({productItems?.length || 0} mục)
            </h3>
            <div className="space-y-4 sm:space-y-6">
              {productItems?.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 sm:p-6 bg-white shadow-sm">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Hình ảnh và thông tin cơ bản */}
                    <div className="lg:col-span-1">
                      <div className="flex items-start space-x-3 sm:space-x-4">
                        <img
                          src={item.thumbUrl || "/placeholder.svg"}
                          alt={item.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-contain border rounded bg-gray-50 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base sm:text-lg text-gray-900 break-words">{item.name}</h4>
                          <div className="mt-2 space-y-1">
                            <div className="space-y-2">
                              <div className="flex items-center text-xs sm:text-sm">
                                <Barcode className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-gray-500 flex-shrink-0" />
                                <span className="font-mono break-all">{item.barcode}</span>
                              </div>
                              {item.barcodeImageUrl && (
                                <img
                                  src={item.barcodeImageUrl || "/placeholder.svg"}
                                  alt={`Barcode ${item.barcode}`}
                                  className="h-12 sm:h-16 object-contain bg-white p-2 rounded border"
                                />
                              )}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600">SKU: {item.sku}</div>

                            {/* Dropdown để thay đổi trạng thái */}
                            <div className="relative mt-2">
                              <div className="flex items-center">
                                <span
                                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}
                                >
                                  {getStatusText(item.status)}
                                </span>

                                {/* Dropdown button */}
                                <div className="relative ml-2">
                                  <button
                                    className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-1 px-2 rounded-md flex items-center cursor-pointer"
                                    onClick={() => {
                                      setOpenDropdown(openDropdown === item._id ? null : item._id)
                                    }}
                                    disabled={updatingStatus === item._id}
                                  >
                                    {updatingStatus === item._id ? (
                                      <>
                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                        Đang cập nhật...
                                      </>
                                    ) : (
                                      <>
                                        <Edit className="w-3 h-3 mr-1" />
                                        Đổi trạng thái
                                      </>
                                    )}
                                  </button>

                                  {/* Dropdown menu */}
                                  {openDropdown === item._id && (
                                    <div
                                      ref={dropdownRef}
                                      className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10 dropdown-menu"
                                    >
                                      <ul className="py-1 text-sm">
                                        <li>
                                          <button
                                            // onClick={() => {
                                            //   handleStatusChange(item._id, "active")
                                            //   setOpenDropdown(null)
                                            // }}
                                            className="w-full text-left px-4 py-2 hover:bg-green-50 flex items-center cursor-pointer"
                                            disabled={item.status === "active" || updatingStatus === item._id}
                                          >
                                            {item.status === "active" && (
                                              <Check className="w-3 h-3 mr-1 text-green-600" />
                                            )}
                                            <span
                                              className={item.status === "active" ? "font-medium text-green-600" : ""}
                                            >
                                              Hoạt động
                                            </span>
                                          </button>
                                        </li>
                                        <li>
                                          <button
                                            // onClick={() => {
                                            //   handleStatusChange(item._id, "out_of_stock")
                                            //   setOpenDropdown(null)
                                            // }}
                                            className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center cursor-pointer"
                                            disabled={item.status === "out_of_stock" || updatingStatus === item._id}
                                          >
                                            {item.status === "out_of_stock" && (
                                              <Check className="w-3 h-3 mr-1 text-red-600" />
                                            )}
                                            <span
                                              className={
                                                item.status === "out_of_stock" ? "font-medium text-red-600" : ""
                                              }
                                            >
                                              Hết hàng
                                            </span>
                                          </button>
                                        </li>
                                        <li>
                                          <button
                                            // onClick={() => {
                                            //   handleStatusChange(item._id, "inactive")
                                            //   setOpenDropdown(null)
                                            // }}
                                            className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center cursor-pointer"
                                            disabled={item.status === "inactive" || updatingStatus === item._id}
                                          >
                                            {item.status === "inactive" && (
                                              <Check className="w-3 h-3 mr-1 text-gray-600" />
                                            )}
                                            <span
                                              className={item.status === "inactive" ? "font-medium text-gray-600" : ""}
                                            >
                                              Không hoạt động
                                            </span>
                                          </button>
                                        </li>
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Giá và kho */}
                    <div className="lg:col-span-1">
                      <div className="space-y-3">
                        <div>
                          <span className="text-xs sm:text-sm text-gray-600">Giá bán lẻ:</span>
                          <div className="text-base sm:text-lg font-bold text-green-600">
                            {formatPrice(item.retailPrice)}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm text-gray-600">Giá nhập:</span>
                          <div className="text-base sm:text-lg font-bold text-blue-600">
                            {formatPrice(item.wholesalePrice)}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm text-gray-600">Tồn kho:</span>
                          <div className="text-base sm:text-lg font-bold text-purple-600">
                            {item.inventory?.[0]?.quantity || 0} sản phẩm
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Thuộc tính */}
                    <div className="lg:col-span-1">
                      <div>
                        <span className="text-xs sm:text-sm text-gray-600 font-medium">Thuộc tính:</span>
                        <div className="mt-2 space-y-2">
                          {item.attributes?.map((attr, attrIndex) => (
                            <div key={attrIndex} className="bg-gray-100 px-2 sm:px-3 py-2 rounded-lg">
                              <span className="font-medium text-gray-700 text-xs sm:text-sm">{attr.code}:</span>
                              <span className="ml-2 text-gray-900 text-xs sm:text-sm break-words">{attr.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hình ảnh bổ sung */}
                  {item.images && item.images.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <span className="text-xs sm:text-sm text-gray-600 font-medium">Hình ảnh bổ sung:</span>
                      <div className="mt-2 grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {item.images.map((img, imgIndex) => (
                          <img
                            key={imgIndex}
                            src={img.image || "/placeholder.svg"}
                            alt={`${item.name} ${imgIndex + 1}`}
                            className="w-full h-12 sm:h-16 object-contain border rounded bg-gray-50"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 sm:px-6 py-4 rounded-b-lg flex justify-end sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors touch-manipulation cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailModal
