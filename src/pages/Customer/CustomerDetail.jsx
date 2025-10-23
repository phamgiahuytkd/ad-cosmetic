'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import {
  displayValue,
  formatDateTimeVN,
  getImageUrl,
  statusMap,
  truncateText,
} from '../../common/commonFunc'; // Giả sử có hàm này
import api from '../../service/api';
import Swal from 'sweetalert2';

// Đăng ký Chart.js components cho Doughnut (dùng làm gauge)
ChartJS.register(ArcElement, Title, Tooltip, Legend);

const CustomerDetail = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customer, setCustomer] = useState({
    avatar: null,
    full_name: null,
    phone: null,
    email: null,
    reputation: null, // Điểm uy tín từ 0-100
    total_orders: null,
    total_accumulated_money: null, // VND
    isLocked: false,
    create_day: null,
    date_of_birth: null,
  });
  const [orderStats, setOrderStats] = useState({
    processing_orders: null,
    success_orders: null,
    failed_orders: null,
    fraud_orders: null,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topPurchasedProducts, setTopPurchasedProducts] = useState([]);
  const [topPurchasedGifts, setTopPurchasedGifts] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  const { id } = useParams();

  const getAge = (dateOfBirth) => {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Nếu chưa đến sinh nhật trong năm nay thì trừ đi 1
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  // Hàm fetch dữ liệu (dùng dữ liệu ảo)
  const fetchCustomerData = async () => {
    setLoading(true);
    setError('');
    try {
      setLoading(true);
      const response = await api.get(`/user/${id}`);
      const response2 = await api.get(`/user/${id}/overview`);
      const response3 = await api.get(`/user/${id}/recent-orders`);
      const response4 = await api.get(`/user/${id}/top-user-product`);
      const response5 = await api.get(`/user/${id}/top-user-gift`);
      if (response.data.result && response2.data.result) {
        const { full_name, email, phone, reputation, avatar, create_day, date_of_birth, stop_day } =
          response.data.result;
        const {
          total_accumulated_money,
          total_orders,
          processing_orders,
          success_orders,
          failed_orders,
          fraud_orders,
        } = response2.data.result;
        setCustomer({
          full_name,
          email,
          phone,
          avatar,
          reputation,
          total_orders,
          total_accumulated_money,
          create_day,
          date_of_birth,
          isLocked: stop_day ? true : false,
        });
        setOrderStats({
          processing_orders,
          success_orders,
          failed_orders,
          fraud_orders,
        });
        if (response3.data.result) {
          setRecentOrders(response3.data.result);
        }

        if (response4.data.result) {
          setTopPurchasedProducts(response4.data.result);
        }
        if (response5.data.result) {
          setTopPurchasedGifts(response5.data.result);
        }
      } else {
        setErrorMessage(response?.data?.message || 'Không thể tải thông tin admin');
      }
    } catch (error) {
      console.error('Error fetching admin profile:', error);
      setErrorMessage(error.response?.data?.message || 'Lỗi kết nối API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, []);

  // Dữ liệu cho Gauge chart (dùng Doughnut để làm gauge)
  const gaugeChartData = {
    datasets: [
      {
        data: [customer.reputation, 100 - customer.reputation],
        backgroundColor: ['#00D5BE', '#e0e0e0'],
        borderWidth: 0,
      },
    ],
  };

  const gaugeChartOptions = {
    responsive: true,
    cutout: '70%',
    circumference: 180,
    rotation: 270,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
      title: { display: true, text: 'Điểm uy tín', position: 'bottom' },
    },
    elements: {
      arc: {
        borderWidth: 0,
      },
    },
  };

  // Hàm xử lý khóa tài khoản với SweetAlert2
  const handleLockAccount = async () => {
    const isLocked = customer?.isLocked;
    const actionText = isLocked ? 'mở khóa' : 'khóa';
    const apiEndpoint = isLocked ? `/user/${id}/unblock` : `/user/${id}/block`;
    const successMessage = isLocked ? 'Tài khoản đã được mở khóa.' : 'Tài khoản đã được khóa.';

    // Biến kiểm tra hold (đặt ở scope bên ngoài Swal để preConfirm có thể kiểm tra)
    let isCompleted = false;

    const result = await Swal.fire({
      title: `Xác nhận ${actionText} tài khoản?`,
      text: `Nhấn và giữ nút "Xác nhận" trong 5 giây để ${actionText}.`,
      icon: isLocked ? 'info' : 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy',
      confirmButtonColor: isLocked ? '#22c55e' : '#3b82f6',
      allowOutsideClick: false,
      allowEscapeKey: true, // cho phép ESC hủy
      didOpen: () => {
        const confirmButton = Swal.getConfirmButton();
        if (!confirmButton) return;

        // disable confirm theo mặc định (ngăn nhấn 1 cái)
        confirmButton.disabled = true;

        // tạo progress overlay
        confirmButton.style.position = 'relative';
        confirmButton.style.overflow = 'hidden';
        confirmButton.style.zIndex = '1';
        confirmButton.style.opacity = '1';

        const progress = document.createElement('div');
        progress.style.position = 'absolute';
        progress.style.left = '0';
        progress.style.top = '0';
        progress.style.height = '100%';
        progress.style.width = '0%';
        progress.style.background = isLocked
          ? 'linear-gradient(to right, #22c55e, #3b82f6)'
          : 'linear-gradient(to right, #3b82f6, #ef4444)';
        progress.style.transition = 'width 0.1s linear';
        progress.style.zIndex = '0';
        confirmButton.appendChild(progress);

        let holdTime = 0;
        let holdInterval = null;
        isCompleted = false;

        const updateHold = (delta) => {
          holdTime = Math.min(Math.max(holdTime + delta, 0), 5000);
          const percent = Math.min((holdTime / 5000) * 100, 100);
          progress.style.width = `${percent}%`;
          if (holdTime >= 5000 && !isCompleted) {
            isCompleted = true;
            clearInterval(holdInterval);
            confirmButton.disabled = false;
            // small visual feedback
            progress.style.width = '100%';
            progress.style.background = isLocked ? '#3b82f6' : '#ef4444';
            Swal.resetValidationMessage();
            // 0.15s sau để UX mượt, sau đó auto click confirm
            setTimeout(() => {
              // auto-confirm khi đã hold đủ
              Swal.clickConfirm();
            }, 150);
          }
        };

        const startHold = (e) => {
          // bắt đầu tăng dần (bảo đảm clear trước)
          if (holdInterval) clearInterval(holdInterval);
          // immediate small increment to show responsiveness
          updateHold(100);
          holdInterval = setInterval(() => updateHold(100), 100);
        };

        const cancelHold = () => {
          if (holdInterval) {
            clearInterval(holdInterval);
            holdInterval = null;
          }
          if (!isCompleted) {
            // reset progress nếu chưa hoàn thành 5s
            holdTime = 0;
            progress.style.width = '0%';
            Swal.resetValidationMessage();
          }
          // nếu đã completed thì do đã auto click confirm nên không cần xử lý
        };

        // Hỗ trợ pointer, mouse, touch
        confirmButton.addEventListener('pointerdown', startHold);
        confirmButton.addEventListener('pointerup', cancelHold);
        confirmButton.addEventListener('pointerleave', cancelHold);

        confirmButton.addEventListener('mousedown', startHold);
        confirmButton.addEventListener('mouseup', cancelHold);
        confirmButton.addEventListener('mouseleave', cancelHold);

        confirmButton.addEventListener('touchstart', startHold, { passive: true });
        confirmButton.addEventListener('touchend', cancelHold);

        // cleanup khi đóng popup (tránh leak event)
        Swal.getPopup().addEventListener('swalClose', () => {
          try {
            confirmButton.removeEventListener('pointerdown', startHold);
            confirmButton.removeEventListener('pointerup', cancelHold);
            confirmButton.removeEventListener('pointerleave', cancelHold);
            confirmButton.removeEventListener('mousedown', startHold);
            confirmButton.removeEventListener('mouseup', cancelHold);
            confirmButton.removeEventListener('mouseleave', cancelHold);
            confirmButton.removeEventListener('touchstart', startHold);
            confirmButton.removeEventListener('touchend', cancelHold);
          } catch (err) {
            // ignore
          }
        });
      },

      // preConfirm bảo vệ một lớp nữa: nếu vì lý do nào đó confirm được gọi mà isCompleted false thì chặn
      preConfirm: () => {
        return new Promise((resolve, reject) => {
          if (!isCompleted) {
            Swal.showValidationMessage('Bạn phải giữ nút ít nhất 5 giây để xác nhận.');
            reject(new Error('hold-not-completed'));
          } else {
            resolve(true);
          }
        });
      },
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await api.put(apiEndpoint);
        setCustomer((prev) => ({ ...prev, isLocked: !prev.isLocked }));
        Swal.fire('Thành công!', successMessage, 'success');
      } catch (error) {
        console.error('Error toggling account:', error);
        Swal.fire('Lỗi!', 'Không thể thực hiện hành động. Vui lòng thử lại.', 'error');
      } finally {
        setLoading(false);
        fetchCustomerData();
      }
    }
  };

  return (
    <div
      id="customer-detail-container"
      className="p-3 sm:p-6 bg-[var(--color-bg)] shadow-lg min-h-screen relative"
    >
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-sm">{errorMessage}</div>
      )}
      <div className="mb-6">
        <button
          onClick={() => window.history.back()}
          className="shadow-md px-4 py-2 text-sm bg-rose-50 text-gray-700 rounded-sm hover:bg-rose-100 flex items-center"
          disabled={loading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> QUẢN LÝ KHÁCH HÀNG
        </button>
      </div>
      {/* Tiêu đề */}
      <div className="bg-[var(--color-title)] text-white p-3 rounded-lg flex justify-between items-center">
        <h2 className="text-base font-semibold">CHI TIẾT KHÁCH HÀNG</h2>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white">
          <ArrowLeft size={20} />
          Quay lại
        </button>
      </div>

      {/* Nội dung chính */}
      <div className="pt-4">
        {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}
        {loading ? (
          <div className="text-center text-gray-500">Đang tải...</div>
        ) : (
          <>
            {/* Nhóm 1: Thông tin khách hàng và điểm uy tín */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* Ô bên trái: Thông tin khách hàng */}
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex flex-col items-center gap-4">
                  {/* Avatar chính giữa */}
                  <div className="relative">
                    <img
                      src={getImageUrl(customer.avatar) || '/img/no-avatar.png'}
                      alt="Avatar"
                      className="w-32 h-32 object-cover rounded-full border-4 border-[#00D5BE]"
                    />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-700">
                      {customer.full_name || 'Chưa ập nhật'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Số điện thoại: {customer.phone || 'Chưa cập nhật'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Độ tuổi: {getAge(customer?.date_of_birth) || 'Chưa cập nhật'}
                    </p>
                    <p className="text-sm text-gray-600">Email: {customer.email}</p>
                    <p className="text-sm text-gray-600">
                      Ngày tạo TK: {formatDateTimeVN(customer?.create_day)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ô bên phải: Điểm uy tín và các thông tin khác */}
              <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
                {/* Gauge chart trên */}
                <div className="relative w-48 h-48 mb-4">
                  <Doughnut data={gaugeChartData} options={gaugeChartOptions} />
                  {/* Điểm số chính giữa biểu đồ */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#00D5BE]">{customer.reputation}</div>
                      <div className="text-sm font-normal text-gray-600">/100</div>
                    </div>
                  </div>
                </div>

                {/* Thông tin dưới */}
                <div className="flex w-full gap-4">
                  <div className="flex-1">
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700">Tổng tiền tích lũy</h3>
                      <p className="text-2xl font-bold text-[#8e32e9]">
                        {(customer.total_accumulated_money / 1000000).toFixed(1)}M VND
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Tổng đơn hàng</h3>
                      <p className="text-2xl font-bold text-[#f9a8d4]">{customer.total_orders}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={handleLockAccount}
                      className={`px-4 py-2 rounded text-white ${
                        customer.isLocked ? 'bg-green-500' : 'bg-red-500'
                      } hover:opacity-90 transition-colors`}
                    >
                      {customer.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Nhóm 2: Thống kê đơn hàng - Đảo thứ tự */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#60a5fa]">
                <h3 className="text-sm font-medium text-gray-700">Đơn đang diễn ra</h3>
                <p className="text-2xl font-bold text-[#60a5fa]">{orderStats.processing_orders}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#00D5BE]">
                <h3 className="text-sm font-medium text-gray-700">Đơn thành công</h3>
                <p className="text-2xl font-bold text-[#00D5BE]">{orderStats.success_orders}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#ef4444]">
                <h3 className="text-sm font-medium text-gray-700">Đơn thất bại</h3>
                <p className="text-2xl font-bold text-[#ef4444]">{orderStats.failed_orders}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#f59e0b]">
                <h3 className="text-sm font-medium text-gray-700">Đơn gian lận</h3>
                <p className="text-2xl font-bold text-[#f59e0b]">{orderStats.fraud_orders}</p>
              </div>
            </div>

            {/* Bảng đơn hàng gần nhất */}
            <div className="bg-[#BBE9FF] p-4 rounded-lg shadow-md mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-semibold text-gray-700">ĐƠN HÀNG GẦN NHẤT</h3>
              </div>
              <div className="max-h-80 overflow-y-auto border-[1px] border-[#ddd] rounded">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left">Tên khách hàng</th>
                      <th className="px-4 py-3 text-left">Số điện thoại</th>
                      <th className="px-4 py-3 text-left">Địa chỉ</th>
                      <th className="px-4 py-3 text-right">Tổng tiền</th>
                      <th className="px-4 py-3 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#FFF]">
                    {recentOrders.length > 0 ? (
                      recentOrders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-t-[1px] border-[#ddd] hover:bg-gray-100"
                          onClick={() => navigate(`/orders/view/${order.id}`)}
                        >
                          <td className="px-4 py-3 ">{truncateText(order.name, 30)}</td>
                          <td className="px-4 py-3 ">{displayValue(order.phone)}</td>
                          <td className="px-4 py-3 ">{truncateText(order.fulladdress, 40)}</td>
                          <td className="px-4 py-3 text-right ">
                            {(order.amount || 0).toLocaleString('vi-VN')} VNĐ
                          </td>
                          <td className="px-4 py-3 flex justify-center">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-sm ${
                                statusMap[order.status?.toUpperCase()]?.color ||
                                'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {statusMap[order.status?.toUpperCase()]?.display ||
                                displayValue(order.status)}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-4 py-3 text-center">
                          Không có dữ liệu
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sản phẩm được mua nhiều nhất */}
            <div className="bg-[#F5EFFF] p-4 rounded-lg shadow-md mb-6">
              <h3 className="text-base font-semibold text-gray-700 mb-4">
                SẢN PHẨM ĐƯỢC MUA NHIỀU NHẤT
              </h3>
              <div className="max-h-80 overflow-y-auto border-[1px] border-[#ddd] rounded">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Hình ảnh</th>
                      <th className="px-4 py-3">Tên sản phẩm</th>
                      <th className="px-4 py-3 text-center">Số lượng mua</th>
                      <th className="px-4 py-3 text-right">Tổng chi</th>
                      <th className="px-4 py-3 text-center">Tồn kho</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#FFF]">
                    {topPurchasedProducts.length > 0 ? (
                      topPurchasedProducts.map((product) => (
                        <tr
                          key={product[0]}
                          className="border-t-[1px] border-[#ddd] hover:bg-gray-100"
                          onClick={() => navigate(`/products/edit/${product[0]}`)}
                        >
                          <td className="px-4 py-3">
                            <img
                              src={getImageUrl(product[1]) || '/placeholder.png'}
                              alt={product[2]}
                              className="w-12 h-12 object-cover rounded"
                            />
                          </td>
                          <td className="px-4 py-3">{product[2]}</td>
                          <td className="px-4 py-3 text-center">{product[3]}</td>
                          <td className="px-4 py-3 text-right">
                            {(product[4] / 1000).toFixed(1)}K VND
                          </td>
                          <td className="px-4 py-3 text-center">{product[5]}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-4 py-3 text-center">
                          Không có dữ liệu
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quà tặng được mua nhiều nhất */}
            <div className="bg-[#D2E0FB] p-4 rounded-lg shadow-md mb-6">
              <h3 className="text-base font-semibold text-gray-700 mb-4">
                QUÀ TẶNG ĐƯỢC MUA NHIỀU NHẤT
              </h3>
              <div className="max-h-80 overflow-y-auto border-[1px] border-[#ddd] rounded">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Hình ảnh</th>
                      <th className="px-4 py-3">Tên quà tặng</th>
                      <th className="px-4 py-3">Phân phối</th>
                      <th className="px-4 py-3">Thuộc tính</th>
                      <th className="px-4 py-3">Ngày bắt đầu</th>
                      <th className="px-4 py-3">Ngày kết thúc</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#FFF]">
                    {topPurchasedGifts.length > 0 ? (
                      topPurchasedGifts.map((gift) => (
                        <tr
                          key={gift[0]}
                          className="border-t-[1px] border-[#ddd] hover:bg-gray-100"
                        >
                          <td className="px-4 py-3">
                            <img
                              src={getImageUrl(gift[3]) || '/placeholder.png'}
                              alt={gift[2]}
                              className="w-12 h-12 object-cover rounded"
                            />
                          </td>
                          <td className="px-4 py-3">{gift[2]}</td>
                          <td className="px-4 py-3">{gift[8]}</td>
                          <td className="px-4 py-3">
                            {(() => {
                              try {
                                const attrs = JSON.parse(gift[4] || '[]');
                                return attrs.map((a) => `${a.attribute_id}: ${a.id}`).join(', ');
                              } catch (e) {
                                return 'Không có';
                              }
                            })()}
                          </td>
                          <td className="px-4 py-3">{formatDateTimeVN(gift[6])}</td>
                          <td className="px-4 py-3">{formatDateTimeVN(gift[7])}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-4 py-3 text-center">
                          Không có dữ liệu
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerDetail;
