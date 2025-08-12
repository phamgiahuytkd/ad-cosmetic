'use client';

import ReactModal from 'react-modal';
import { X, Package, Star, ShoppingCart, Barcode, Check, Edit, Loader2 } from 'lucide-react';
import { getImageUrl } from '../../common/commonFunc';
import { useEffect, useState } from 'react';
import api from '../../service/api';
import ReactStars from 'react-rating-stars-component';
import { TiStarFullOutline } from 'react-icons/ti';

ReactModal.setAppElement('#root');

const ProductDetailModal = ({ productId, isOpen, onClose }) => {
  const [product, setProduct] = useState(null);
  const [productVariant, setProductVariant] = useState([]);

  useEffect(() => {
    if (!productId || !isOpen) return; // chỉ fetch khi mở modal
    api
      .get(`/product/${productId}/admin`)
      .then((res) => {
        setProduct(res.data.result);
      })
      .catch((err) => {
        console.error(err.response?.data?.message || 'Lỗi không xác định');
      });
  }, [productId, isOpen]);

  useEffect(() => {
    api
      .get(`/product-variant/${productId}`)
      .then((response) => {
        setProductVariant(response.data.result);
        console.log(response.data.result);
      })
      .catch((error) => {
        console.error(error.response?.data?.message || 'Lỗi không xác định');
      });
  }, [productId]);

  if (!isOpen) return null; // không render khi modal đóng

  if (!product) {
    return (
      <ReactModal isOpen={isOpen} onRequestClose={onClose}>
        <div className="p-4">Đang tải dữ liệu...</div>
      </ReactModal>
    );
  }

  // Tạm thời dùng dữ liệu mẫu
  const productItems = new Array(2).fill(0).map((_, i) => ({
    name: `Sản phẩm phụ ${i + 1}`,
    barcode: `123456789${i}`,
    barcodeImageUrl: '',
    sku: `SKU-${i + 1}`,
    status: i === 0 ? 'active' : 'out_of_stock',
    thumbUrl: '',
    retailPrice: 200000,
    wholesalePrice: 150000,
    inventory: [{ quantity: 10 * (i + 1) }],
    attributes: [
      { code: 'color', value: 'Đỏ' },
      { code: 'size', value: 'M' },
    ],
    images: [],
    _id: `item-${i}`,
  }));

  const formatPrice = (value) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value || 0);

  const getStatusColor = (status) => {
    switch (status) {
      case 0:
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-green-100 text-green-700';
    }
  };

  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      textMain: 'text-blue-600',
      textSub: 'text-blue-800',
    },
    green: {
      bg: 'bg-green-50',
      textMain: 'text-green-600',
      textSub: 'text-green-800',
    },
    yellow: {
      bg: 'bg-yellow-50',
      textMain: 'text-yellow-600',
      textSub: 'text-yellow-800',
    },
    purple: {
      bg: 'bg-purple-50',
      textMain: 'text-purple-600',
      textSub: 'text-purple-800',
    },
  };

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Chi tiết sản phẩm"
      ariaHideApp={false}
      style={{
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 1000,
        },
        content: {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90vw',
          maxWidth: '60rem',
          height: '90vh',
          padding: 0,
          border: 'none',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      <div className="bg-white w-full h-full flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00D5BE] to-[#17a2b8] text-white p-4 sm:p-6 flex justify-between items-start flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-lg sm:text-xl font-bold">CHI TIẾT SẢN PHẨM</h2>
            <p className="text-sm opacity-90 mt-1 break-words">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          {/* Hình ảnh chính */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center">
              <Package className="w-4 h-4 mr-2 text-blue-600" />
              Hình ảnh chính
            </h3>
            <div className="w-full h-48 sm:h-64 flex items-center justify-center overflow-hidden bg-white border rounded-lg">
              <img
                src={getImageUrl(product.image) || '/placeholder.svg'}
                alt={product.name}
                className="w-full h-full object-cover sm:object-contain"
              />
            </div>
          </div>

          {/* Thống kê */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 mb-6">
            {[
              {
                label: 'Lượt xem',
                value: product.view || 0,
                color: 'blue',
              },
              {
                label: 'Đã bán',
                value: product.sold || 0,
                color: 'green',
              },
              {
                label: 'Đánh giá',
                value: (
                  <>
                    {product.star || 0.0}
                    <TiStarFullOutline className="w-4 h-4 ml-1 mt-1" />
                  </>
                ),
                color: 'yellow',
              },
              {
                label: 'Bình luận',
                value: product.comment || 0,
                color: 'purple',
              },
            ].map((stat, idx) => {
              const color = colorMap[stat.color];

              return (
                <div key={idx} className={`${color.bg} p-3 sm:p-4 rounded-lg text-center`}>
                  <div
                    className={`text-xl sm:text-2xl font-bold ${color.textMain} flex justify-center items-center`}
                  >
                    {stat.value}
                  </div>
                  <div className={`text-xs sm:text-sm ${color.textSub}`}>{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* Mô tả, hướng dẫn, thành phần */}
          {[
            { title: 'Mô tả', content: product.description },
            { title: 'Hướng dẫn', content: product.instruction },
            { title: 'Thành phần', content: product.ingredient },
          ].map((section, index) => (
            <div className="mb-6" key={index}>
              <h3 className="text-base sm:text-lg font-semibold mb-2">{section.title}</h3>
              <div
                className="prose bg-gray-100 p-4 rounded text-sm"
                dangerouslySetInnerHTML={{ __html: section.content || '' }}
              />
            </div>
          ))}

          {/* Mục sản phẩm */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center">
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" />
              Mục sản phẩm ({productVariant.length} mục)
            </h3>
            <div className="space-y-4 sm:space-y-6">
              {productVariant.map((item, i) => (
                <div key={i} className="border rounded-lg p-4 sm:p-6 bg-white shadow-sm">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="lg:col-span-1 flex items-start space-x-4">
                      <div>
                        <img
                          alt={item.id}
                          src={getImageUrl(item.image) || '/placeholder.svg'}
                          className="w-20 h-20 object-cover border rounded bg-gray-50"
                        />
                      </div>
                      <div className="flex flex-col justify-between h-20">
                        {' '}
                        {/* hoặc h-full nếu cha đã giới hạn */}
                        <ReactStars
                          key={item?.id}
                          count={5} // tổng số sao
                          value={item?.star} // số sao thực tế (ví dụ: 4.5)
                          size={24} // kích thước sao
                          isHalf={true} // cho phép hiển thị nửa sao
                          edit={false} // tắt tương tác (chỉ hiển thị)
                          activeColor="#ffd700" // màu sao vàng
                          classNames="user-product-display-stars"
                        />
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item?.stock)}`}
                        >
                          {item.stock === 0 ? 'Kho trống' : 'Số lượng: ' + item?.stock}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Giá Khuyến mãi</div>
                      <div className="text-base font-bold text-green-600">
                        {item.percent ? formatPrice(item.price) : 'Không'}
                      </div>
                      <div className="text-xs text-gray-600 mt-2">Giá gốc</div>
                      <div className="text-base font-bold text-blue-600">
                        {formatPrice((item?.price * 100) / (100 - item?.percent))}
                      </div>
                      <div className="text-xs text-gray-600 mt-2">Phần trăm</div>
                      <div className="text-base font-bold text-purple-600">
                        {' '}
                        {item.percent ? item.percent + ' %' : 'Không'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Thuộc tính:</div>
                      <div className="mt-2 space-y-1">
                        {item.attribute_values.map((attr, idx) => (
                          <div key={idx} className="bg-gray-100 px-2 py-1 rounded text-sm">
                            {attr.attribute_id} : <strong>{attr.id}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 sm:px-6 py-4 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </ReactModal>
  );
};

export default ProductDetailModal;
