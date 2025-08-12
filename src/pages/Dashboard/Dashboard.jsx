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

// Dữ liệu ảo

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
    revenueData: [],
  });
  const [timeFilter, setTimeFilter] = useState('WEEK');

  // Sử dụng dữ liệu ảo
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response1 = await api.get(`/statistical/overview/${timeFilter}`);
      const overview = response1.data.result;
      const response2 = await api.get(`/statistical/revenue-by-category/${timeFilter}`);
      const revenueByCategory = response2.data.result;
      const response3 = await api.get(`/statistical/revenue-by-date/${timeFilter}`);
      const revenueByDate = response3.data.result;
      const response4 = await api.get(`/statistical/top-selling-product/${timeFilter}`);
      const topProducts = response4.data.result;
      const response5 = await api.get('/statistical/lowest-stock');
      const lowestStockProductVariant = response5.data.result;
      const response6 = await api.get(`/statistical/top-gift-selected/${timeFilter}`);
      const topGiftSelected = response6.data.result;
      console.log(lowestStockProductVariant);
      setStats((prevStats) => ({
        ...prevStats,
        totalRevenue: overview.total_revenue,
        totalOrders: overview.total_orders,
        totalProductsSold: overview.total_sold_products,
        averageOrderValue: overview.average_order,
        categoryRevenue: revenueByCategory,
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
  }, [timeFilter]);

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

  return (
    <div id="dashboard-container" className="p-3 sm:p-6 bg-white min-h-screen relative">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <Link
          to="/admin"
          className="inline-flex items-center px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại trang quản trị
        </Link>
      </div>

      {/* Tiêu đề và bộ lọc */}
      <div className="bg-[#00D5BE] text-white p-3 rounded-t-lg flex justify-between items-center">
        <h2 className="text-base font-semibold">THỐNG KÊ BÁN HÀNG MỸ PHẨM</h2>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="p-2 rounded bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="WEEK">Theo tuần</option>
          <option value="MONTH">Theo tháng</option>
          <option value="YEAR">Theo năm</option>
          <option value="ALL">Tất cả</option>
        </select>
      </div>

      {/* Nội dung chính */}
      <div className="p-4">
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
              {/* <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#00D5BE]">
                <h3 className="text-sm font-medium text-gray-700">Giá trị đơn hàng TB</h3>
                <p className="text-2xl font-bold text-[#00D5BE]">
                  {(stats.averageOrderValue / 1000).toFixed(0)}K VND
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#f9a8d4]">
                <h3 className="text-sm font-medium text-gray-700">Khách hàng mới</h3>
                <p className="text-2xl font-bold text-[#f9a8d4]">{stats.newCustomers}</p>
              </div> */}
            </div>

            {/* Biểu đồ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <Line data={revenueChartData} options={revenueChartOptions} />
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <Pie data={categoryChartData} options={categoryChartOptions} />
              </div>
            </div>

            {/* Top sản phẩm bán chạy */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-gray-700">Top sản phẩm bán chạy</h3>
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
                  <tbody>
                    {stats.topProducts.length > 0 ? (
                      stats.topProducts.map((product) => (
                        <tr
                          key={product[0]}
                          className="border-t-[1px] border-[#ddd] hover:bg-gray-100"
                          onClick={() =>
                            navigate(`/products/product-management/edit/${product[0]}`)
                          }
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
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Sản phẩm tồn kho thấp</h3>
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
                  <tbody>
                    {stats.lowStockProducts.length > 0 ? (
                      stats.lowStockProducts.map((product) => (
                        <tr
                          key={product[0]}
                          className="border-t-[1px] border-[#ddd] hover:bg-gray-100"
                          onClick={() =>
                            navigate(`/products/product-management/edit/${product[14]}`)
                          }
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
                        <td colSpan="3" className="px-4 py-3 text-center">
                          Không có dữ liệu
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Thống kê quà tặng */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium text-gray-700">Thống kê quà tặng</h3>
                <button
                  onClick={() => navigate('/gifts')}
                  className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
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
                  <tbody>
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
                            {' '}
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
                        <td colSpan="5" className="px-4 py-3 text-center">
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
