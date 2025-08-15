'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, FileText, CheckCircle, XCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../../service/api';
import { getImageUrl } from '../../common/commonFunc';

const OrderDetail = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [orderStatuses, setOrderStatuses] = useState([]);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const statusMap = {
    COMPLETED: {
      display: 'Đã hoàn thành',
      color: 'bg-green-500 text-white border border-green-300',
    },
    PENDING: {
      display: 'Đang chờ xử lý',
      color: 'bg-yellow-400 text-white border border-yellow-200',
    },
    UNCOMPLETED: {
      display: 'Chưa hoàn thành',
      color: 'bg-red-500 text-white border border-red-300',
    },
    PROCESSING: {
      display: 'Đã đặt đơn',
      color: 'bg-blue-500 text-white border border-blue-300',
    },
    APPROVED: {
      display: 'Đã chấp nhận',
      color: 'bg-green-500 text-white border border-green-300',
    },
    CANCELED: {
      display: 'Đã hoàn đơn',
      color: 'bg-red-500 text-white border border-red-300',
    },
    REFUSED: {
      display: 'Đã từ chối',
      color: 'bg-red-600 text-white border border-red-300',
    },
    DELIVERING: {
      display: 'Đang vận chuyển',
      color: 'bg-blue-400 text-white border border-blue-200',
    },
    DELIVERED: {
      display: 'Đã giao hàng',
      color: 'bg-green-600 text-white border border-green-300',
    },
    PAID: {
      display: 'Đã thanh toán',
      color: 'bg-emerald-500 text-white border border-emerald-300',
    },
  };

  const getPaymentMethodDisplay = (payment) => {
    if (payment === 'bank transfer') return 'Thanh toán sau khi nhận hàng';
    if (payment === 'PayPal') return 'Thanh toán bằng MoMo';
    return payment || 'Không xác định';
  };

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/order/${id}`);
      if (response.data.result) {
        setOrder(response.data.result);
      } else {
        setError(response?.data?.message || 'Không thể tải chi tiết đơn hàng');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      setError(error.response?.data?.message || 'Lỗi kết nối API');
    }
  };

  const fetchCartItems = async () => {
    try {
      const response = await api.get(`/cart/order/${id}`);
      if (response.data.result) {
        setCartItems(response.data.result);
      } else {
        setError(response?.data?.message || 'Không thể tải sản phẩm trong đơn hàng');
      }
    } catch (error) {
      console.error('Error fetching cart items:', error);
      setError(error.response?.data?.message || 'Lỗi kết nối API');
    }
  };

  const fetchOrderStatuses = async () => {
    try {
      const response = await api.get(`/order-status/${id}`);
      if (response.data.result) {
        setOrderStatuses(response.data.result);
      } else {
        setError(response?.data?.message || 'Không thể tải lịch sử trạng thái');
      }
    } catch (error) {
      console.error('Error fetching order statuses:', error);
      setError(error.response?.data?.message || 'Lỗi kết nối API');
    }
  };

  const handleOrderAction = async (status, description) => {
    try {
      const payload = {
        order_id: id,
        status,
        description,
      };
      await api.post('/order-status', payload);
      await Promise.all([fetchOrder(), fetchOrderStatuses()]);
      setShowRejectForm(false);
      setRejectReason('');
    } catch (error) {
      console.error('Error updating order status:', error);
      setError(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái đơn hàng');
    }
  };

  const handleAccept = async () => {
    try {
      // Tạo payload cho API fraud/predict
      const fraudPayload = {
        user_id: order.user_id || 'unknown',
        'Transaction Date': order.date,
        'Transaction Amount': order.amount / 25228 || 0,
        'Payment Method': order.payment || 'unknown',
        'Device Used': order.payment, // Giả định không có thông tin thiết bị
        'Transaction Hour': order.date ? new Date(order.date).getHours() : 0,
        Quantity: cartItems.reduce((sum, item) => sum + item.quantity, 0) || 1,
      };

      // Gọi API kiểm tra gian lận
      const fraudResponse = await api.post('/fraud/predict', fraudPayload);
      const { prediction, probability } = fraudResponse.data.result;

      // Hiển thị Swal để xác nhận
      const isFraud = prediction === 1;
      const swalConfig = {
        title: isFraud ? 'Cảnh báo gian lận' : 'Xác nhận chấp nhận đơn',
        text: isFraud
          ? `Giao dịch có khả năng gian lận (${(probability * 100).toFixed(2)}%). Bạn có chắc muốn chấp nhận đơn hàng?`
          : 'Bạn có chắc muốn chấp nhận đơn hàng này?',
        icon: isFraud ? 'warning' : 'question',
        showCancelButton: true,
        confirmButtonText: 'Chấp nhận',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#22c55e',
        cancelButtonColor: '#ef4444',
      };

      const result = await Swal.fire(swalConfig);
      if (result.isConfirmed) {
        await handleOrderAction('APPROVED', 'Đã chấp nhận đơn');
        Swal.fire({
          title: 'Thành công',
          text: 'Đơn hàng đã được chấp nhận!',
          icon: 'success',
          confirmButtonColor: '#22c55e',
        });
      }
    } catch (error) {
      console.error('Error checking fraud:', error);
      setError(error.response?.data?.message || 'Lỗi khi kiểm tra gian lận');
      Swal.fire({
        title: 'Lỗi',
        text: error.response?.data?.message || 'Lỗi khi kiểm tra gian lận',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    }
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      setError('Vui lòng nhập lý do từ chối');
      return;
    }
    handleOrderAction('REFUSED', rejectReason);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        await Promise.all([fetchOrder(), fetchCartItems(), fetchOrderStatuses()]);
      } catch (error) {
        setError('Lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const truncateText = (text, maxLength) => {
    if (text?.length <= maxLength) return text || '';
    return text.substring(0, maxLength) + '...';
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleString('vi-VN') : '';
  };

  const hasApprovedStatus = orderStatuses.some(
    (status) => status.status.toUpperCase() === 'APPROVED',
  );
  const isPaid = orderStatuses.some((status) => status.status.toUpperCase() === 'PAID');
  const isOnlyProcessing =
    orderStatuses.length === 1 && orderStatuses[0]?.status.toUpperCase() === 'PROCESSING';

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
            <Link
              to="/orders"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Quay lại danh sách đơn hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 bg-white min-h-screen">
        <div className="text-center text-gray-600">Không tìm thấy đơn hàng</div>
        <Link
          to="/orders"
          className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Quay lại danh sách đơn hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <Link
          to="/orders"
          className="inline-flex items-center px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách đơn hàng
        </Link>
      </div>

      {/* Order Information */}
      <div className="bg-white rounded shadow-md mb-6">
        <div className="bg-[#00D5BE] text-white p-3 rounded-t">
          <h2 className="text-base font-semibold">CHI TIẾT ĐƠN HÀNG #{order.id}</h2>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-bold text-black">Tên khách hàng</p>
            <p className="text-gray-900">{order.name}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-black">Số điện thoại</p>
            <p className="text-gray-900">{order.phone}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-black">Địa chỉ</p>
            <p className="text-gray-900">{order.fulladdress}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-black">Tổng tiền</p>
            <p className="text-gray-900">{(order.amount || 0).toLocaleString('vi-VN')} VNĐ</p>
          </div>
          <div>
            <p className="text-sm font-bold text-black">Trạng thái</p>
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-[0.3rem] ${
                statusMap[order.status.toUpperCase()]?.color || 'bg-gray-100 text-gray-800'
              }`}
            >
              {statusMap[order.status.toUpperCase()]?.display || order.status}
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-black">Ngày đặt hàng</p>
            <p className="text-gray-900">{formatDate(order.date)}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-black">Phương thức thanh toán</p>
            <p className="text-gray-900">{getPaymentMethodDisplay(order.payment)}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-black">Ghi chú</p>
            <p className="text-gray-900">{order.note || 'Không có'}</p>
          </div>
        </div>
      </div>

      {/* Order Processing (only shown if only PROCESSING exists) */}
      {isOnlyProcessing && (
        <div className="bg-white rounded shadow-md mb-6">
          <div className="bg-[#00D5BE] text-white p-3 rounded-t">
            <h2 className="text-base font-semibold">XỬ LÝ ĐƠN</h2>
          </div>
          <div className="p-4">
            <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
              <button
                onClick={handleAccept}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Chấp nhận đơn
              </button>
              <button
                onClick={() => setShowRejectForm(!showRejectForm)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Từ chối đơn
              </button>
            </div>
            {showRejectForm && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do từ chối
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="Nhập lý do từ chối..."
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleReject}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  >
                    Xác nhận từ chối
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Status (only shown if APPROVED exists) */}
      {hasApprovedStatus && (
        <div className="bg-white rounded shadow-md mb-6">
          <div className="bg-[#00D5BE] text-white p-3 rounded-t">
            <h2 className="text-base font-semibold">THANH TOÁN</h2>
          </div>
          <div className="p-4">
            <div className="flex items-center">
              {isPaid ? (
                <CheckCircle className="w-6 h-6 mr-2 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 mr-2 text-gray-400" />
              )}
              <p className="text-sm font-medium text-gray-900">
                Trạng thái thanh toán: {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </p>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Phương thức thanh toán: {getPaymentMethodDisplay(order.payment)}
            </p>
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="bg-white rounded shadow-md mb-6">
        <div className="bg-[#00D5BE] text-white p-3 rounded-t">
          <h2 className="text-base font-semibold">
            SẢN PHẨM TRONG ĐƠN HÀNG ({cartItems.length} mục)
          </h2>
        </div>
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Sản phẩm</th>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Hình ảnh</th>
                <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Thuộc tính</th>
                <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">Giá</th>
                <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Số lượng</th>
                <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">Tổng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cartItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-100">
                  <td className="px-4 py-3 text-sm text-gray-900">{truncateText(item.name, 30)}</td>
                  <td className="px-4 py-3 flex justify-center">
                    <img
                      src={getImageUrl(item.image) || '/placeholder-image.jpg'}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {item.attribute_values
                      ?.map((attr) => `${attr.attribute_id}: ${attr.id}`)
                      .join(', ') || 'Không có'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    {(item.price || 0).toLocaleString('vi-VN')} VNĐ
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-900">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    {((item.price || 0) * (item.quantity || 0)).toLocaleString('vi-VN')} VNĐ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="lg:hidden">
          <div className="divide-y divide-gray-200">
            {cartItems.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-start space-x-3">
                    <img
                      src={getImageUrl(item.image) || '/placeholder-image.jpg'}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {truncateText(item.name, 30)}
                      </p>
                      <div className="text-xs text-gray-500 mt-1">
                        Thuộc tính:{' '}
                        {item.attribute_values
                          ?.map((attr) => `${attr.attribute_id}: ${attr.id}`)
                          .join(', ') || 'Không có'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Giá: {(item.price || 0).toLocaleString('vi-VN')} VNĐ
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Số lượng: {item.quantity}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Tổng: {((item.price || 0) * (item.quantity || 0)).toLocaleString('vi-VN')}{' '}
                        VNĐ
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {cartItems.length === 0 && (
          <div className="text-center py-8 text-gray-600">Không có sản phẩm trong đơn hàng</div>
        )}
      </div>

      {/* Order Status Timeline */}
      <div className="bg-white rounded shadow-md">
        <div className="bg-[#00D5BE] text-white p-3 rounded-t">
          <h2 className="text-base font-semibold">LỊCH SỬ TRẠNG THÁI</h2>
        </div>
        <div className="p-4">
          {orderStatuses.length > 0 ? (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300" />
              {orderStatuses.map((status, index) => (
                <div key={index} className="relative flex items-start mb-6">
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full z-10" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {statusMap[status.status.toUpperCase()]?.display || status.status}
                    </p>
                    <p className="text-sm text-gray-600">
                      {status.description || 'Không có mô tả'}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(status.update_day)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">Chưa có lịch sử trạng thái</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
