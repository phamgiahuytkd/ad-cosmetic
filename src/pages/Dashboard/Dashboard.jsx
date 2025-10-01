'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import api from '../../service/api';
import { formatDateTimeVN, getImageUrl } from '../../common/commonFunc';

// Đăng ký Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

// Đặt app element cho accessibility
Modal.setAppElement('#root');

// Hàm định dạng ngày thành YYYY-MM-DD
const formatDateToYYYYMMDD = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date)) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProductsSold: 0,
    totalProfit: 0,
    averageOrderValue: 0,
    topProducts: [],
    lowStockProducts: [],
    giftStats: [],
    categoryRevenue: [],
    brandRevenue: [],
    revenueData: [],
  });
  const [timeFilter, setTimeFilter] = useState('DAY');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Mặc định ngày hiện tại

  // Hàm lấy thống kê
  const fetchStats = async () => {
    try {
      // Kiểm tra và định dạng ngày
      const formattedDate = formatDateToYYYYMMDD(selectedDate);
      if (!formattedDate) {
        setError('Vui lòng chọn một ngày hợp lệ');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      const response1 = await api.get(`/statistical/overview/${timeFilter}/${formattedDate}`);
      const overview = response1.data.result;
      const response2 = await api.get(
        `/statistical/revenue-by-category/${timeFilter}/${formattedDate}`,
      );
      const revenueByCategory = response2.data.result;
      const response_brand = await api.get(
        `/statistical/revenue-by-brand/${timeFilter}/${formattedDate}`,
      );
      const revenueByBrand = response_brand.data.result;
      const response3 = await api.get(
        `/statistical/revenue-by-date/${timeFilter}/${formattedDate}`,
      );
      const revenueByDate = response3.data.result;
      const response4 = await api.get(
        `/statistical/top-selling-product/${timeFilter}/${formattedDate}`,
      );
      const topProducts = response4.data.result;
      const response5 = await api.get('/statistical/lowest-stock');
      const lowestStockProductVariant = response5.data.result;
      const response6 = await api.get(
        `/statistical/top-gift-selected/${timeFilter}/${formattedDate}`,
      );
      const topGiftSelected = response6.data.result;
      console.log(lowestStockProductVariant);
      setStats((prevStats) => ({
        ...prevStats,
        totalRevenue: overview.total_revenue,
        totalOrders: overview.total_orders,
        totalProductsSold: overview.total_sold_products,
        averageOrderValue: overview.average_order,
        categoryRevenue: revenueByCategory,
        brandRevenue: revenueByBrand,
        revenueData: revenueByDate,
        topProducts: topProducts,
        lowStockProducts: lowestStockProductVariant,
        giftStats: topGiftSelected,
      }));

      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Lỗi khi tải dữ liệu thống kê');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeFilter, selectedDate]); // Thêm selectedDate vào dependency array

  // Dữ liệu cho biểu đồ doanh thu
  const revenueChartData = {
    labels: stats.revenueData.map((item) => item[0]),
    datasets: [
      {
        label: 'Doanh thu (VND)',
        data: stats.revenueData.map((item) => item[1]),
        borderColor: '#00D5BE',
        backgroundColor: 'rgba(0, 213, 190, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const revenueChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Doanh thu theo thời gian' },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Doanh thu (VND)' },
        ticks: {
          callback: (value) => `${(value / 1000).toFixed(1)}K`,
        },
      },
      x: {
        title: { display: true, text: 'Thời gian' },
      },
    },
  };

  // Dữ liệu cho biểu đồ danh mục
  const categoryChartData = {
    labels: stats.categoryRevenue.map((item) => item.name),
    datasets: [
      {
        label: 'Doanh thu theo danh mục',
        data: stats.categoryRevenue.map((item) => item.revenue),
        backgroundColor: ['#00D5BE', '#f9a8d4', '#8e32e9', '#ffde73', '#60a5fa', '#a3a3a3'],
        borderColor: ['#fff'],
        borderWidth: 1,
      },
    ],
  };

  const categoryChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Phân bổ doanh thu theo danh mục' },
    },
  };

  // Dữ liệu cho biểu đồ thương hiệu
  const brandChartData = {
    labels: stats.brandRevenue.map((item) => item.name),
    datasets: [
      {
        label: 'Doanh thu theo thương hiệu',
        data: stats.brandRevenue.map((item) => item.revenue),
        backgroundColor: ['#00D5BE', '#f9a8d4', '#8e32e9', '#ffde73', '#60a5fa', '#a3a3a3'],
        borderColor: ['#fff'],
        borderWidth: 1,
      },
    ],
  };

  const brandChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Phân bổ doanh thu theo thương hiệu' },
    },
  };

  return (
    <div
      id="dashboard-container"
      className="p-3 sm:p-6 bg-[var(--color-bg)] shadow-lg min-h-screen relative"
    >
      {/* Tiêu đề và bộ lọc */}
      <div className="bg-[var(--color-title)] text-white p-3 rounded-lg flex justify-between items-center">
        <h2 className="text-base font-semibold">THỐNG KÊ BÁN HÀNG</h2>
        <div className="flex items-center gap-2">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="p-2 rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="DAY">Theo ngày</option>
            <option value="WEEK">Theo tuần</option>
            <option value="MONTH">Theo tháng</option>
            <option value="YEAR">Theo năm</option>
            <option value="ALL">Tất cả</option>
          </select>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-2 rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Nội dung chính */}
      <div className="pt-4">
        {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}
        {loading ? (
          <div className="text-center text-gray-500">Đang tải...</div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#00D5BE]">
                <h3 className="text-sm font-medium text-gray-700">Tổng doanh thu</h3>
                <p className="text-2xl font-bold text-[#00D5BE]">
                  {(stats.totalRevenue / 1000000).toFixed(1)}M VND
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#f9a8d4]">
                <h3 className="text-sm font-medium text-gray-700">Tổng đơn hàng</h3>
                <p className="text-2xl font-bold text-[#f9a8d4]">{stats.totalOrders}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#8e32e9]">
                <h3 className="text-sm font-medium text-gray-700">Sản phẩm bán ra</h3>
                <p className="text-2xl font-bold text-[#8e32e9]">{stats.totalProductsSold}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#ffde73]">
                <h3 className="text-sm font-medium text-gray-700">Giá trị đơn hàng TB</h3>
                <p className="text-2xl font-bold text-[#ffde73]">
                  {(stats.averageOrderValue / 1000).toFixed(1)}k VND
                </p>
              </div>
            </div>

            {/* Biểu đồ */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              {/* Biểu đồ Doanh thu theo thời gian (full width) */}
              <div className="bg-white p-4 rounded-lg shadow-md">
                <Line data={revenueChartData} options={revenueChartOptions} />
              </div>

              {/* Hai biểu đồ Pie song song: Danh mục và Thương hiệu */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <Pie data={categoryChartData} options={categoryChartOptions} />
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <Pie data={brandChartData} options={brandChartOptions} />
                </div>
              </div>
            </div>

            {/* Top sản phẩm bán chạy */}
            <div className="bg-[#BBE9FF] p-4 rounded-lg shadow-md mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-semibold text-gray-700">SẢN PHẨM BÁN CHẠY</h3>
              </div>
              <div className="max-h-80 overflow-y-auto border-[1px] border-[#ddd] rounded">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Hình ảnh</th>
                      <th className="px-4 py-3">Tên sản phẩm</th>
                      <th className="px-4 py-3">Số lượng bán</th>
                      <th className="px-4 py-3">Doanh thu</th>
                      <th className="px-4 py-3">Tồn kho</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#FFF]">
                    {stats.topProducts.length > 0 ? (
                      stats.topProducts.map((product) => (
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
                          <td className="px-4 py-3">{product[3]}</td>
                          <td className="px-4 py-3">{(product[4] / 1000).toFixed(1)}K VND</td>
                          <td className="px-4 py-3">{product[5]}</td>
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

            {/* Sản phẩm tồn kho thấp */}
            <div className="bg-[#F5EFFF] p-4 rounded-lg shadow-md mb-6">
              <h3 className="text-base font-semibold text-gray-700 mb-4">SẢN PHẨM TỒN KHO THẤP</h3>
              <div className="max-h-80 overflow-y-auto border-[1px] border-[#ddd] rounded">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Hình ảnh</th>
                      <th className="px-4 py-3">Tên sản phẩm</th>
                      <th className="px-4 py-3">Thuộc tính</th>
                      <th className="px-4 py-3">Tồn kho</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#FFF]">
                    {stats.lowStockProducts.length > 0 ? (
                      stats.lowStockProducts.map((product) => (
                        <tr
                          key={product[0]}
                          className="border-t-[1px] border-[#ddd] hover:bg-gray-100"
                          onClick={() => navigate(`/products/edit/${product[14]}`)}
                        >
                          <td className="px-4 py-3">
                            <img
                              src={getImageUrl(product[4]) || '/placeholder.png'}
                              alt={product[1]}
                              className="w-12 h-12 object-cover rounded"
                            />
                          </td>
                          <td className="px-4 py-3">{product[1]}</td>
                          <td className="px-4 py-3">
                            {(() => {
                              try {
                                const attrs = JSON.parse(product[2] || '[]');
                                return attrs.map((a) => `${a.attribute_id}: ${a.id}`).join(', ');
                              } catch (e) {
                                return 'Không có';
                              }
                            })()}
                          </td>
                          <td className="px-4 py-3">{product[6]}</td>
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

            {/* Thống kê quà tặng */}
            <div className="bg-[#D2E0FB] p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-semibold text-gray-700">THỐNG KÊ QUÀ TẶNG</h3>
                <button
                  onClick={() => navigate('/gifts')}
                  className="px-2 py-1 bg-[#8967B3] text-sm text-[#FFF] rounded hover:bg-[#624E88] transition-colors"
                >
                  Xem chi tiết
                </button>
              </div>
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
                    {stats.giftStats.length > 0 ? (
                      stats.giftStats.map((gift) => (
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

export default Dashboard;
