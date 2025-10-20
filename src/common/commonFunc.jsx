import { toast } from 'react-toastify';
import api from '../service/api';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { jwtDecode } from 'jwt-decode';
// import BuyNow from "../page/BuyNow";

// hàm lấy ảnh
export const getImageUrl = (imageName) => {
  if (!imageName) return ''; // Xử lý trường hợp imageName rỗng hoặc null
  // Kiểm tra nếu imageName bắt đầu bằng http:// hoặc https://
  if (/^https?:\/\//.test(imageName)) {
    return imageName; // Trả về URL nguyên vẹn nếu đã là URL
  }
  // Nếu không, thêm base URL
  return `http://localhost:8080/iCommerce/images/${imageName}`;
};

// hàm chuyển tiền
export const formatPrice = (price) => price && price.toLocaleString('vi-VN') + '₫';

// hàm định dạng ngày
export const formatDateTimeVN = (inputDate) => {
  if (!inputDate) return '';

  const date = new Date(inputDate);

  const timePart = date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const datePart = date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return `${timePart} - ${datePart}`;
};

//hàm in hoa hết chữ
export const toUpperCase = (str) => {
  return str ? str.toUpperCase() : '';
};

//hàm định dạng số lượng
export function formatStockNumber(num) {
  if (num < 1000) return num.toString();
  if (num === 1000) return '1k';
  return '1k+';
}

//hàm chuyển linnk poster
export const redirectTo = (url) => {
  if (!url || typeof url !== 'string') return;

  // Kiểm tra nếu là URL hợp lệ (bắt đầu bằng http hoặc https)
  if (/^https?:\/\//i.test(url)) {
    window.location.href = url;
  } else {
    // Nếu là đường dẫn nội bộ (relative URL)
    window.location.assign(url);
  }
};

//hamf kiểm tra phải sản phẩm mới ko
export const isNewProduct = (createDay) => {
  const createdDate = new Date(createDay);
  const now = new Date();
  const diffInMs = now - createdDate;
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24); // ms -> days

  return diffInDays <= 30;
};

///////////// YEU THICH///////////////////
//hàm thêm vào yêu thích
export const handleAddToLove = (e, product, fetchFavorites, navigate) => {
  if (e) e.stopPropagation();

  api
    .post('/product/loveproduct', {
      product_id: product.id,
    })
    .then(() => {
      toast.success('💖 Đã thêm sản phẩm vào danh mục yêu thích!');
      fetchFavorites();
    })
    .catch((err) => {
      if (err.response?.status === 401) {
        RequireLoginAlert(navigate);
      } else if (err.response?.data.code === 3001) {
        toast.info('Sản phẩm đã tồn tại trong danh mục yêu thích!');
      } else {
        toast.error('Lỗi thêm vào danh mục yêu thích!');
      }
    });
};

//xoa khoi yeu thich
export const handleRemoveToLove = (e, product, fetchFavorites, navigate) => {
  if (e) e.stopPropagation();

  api
    .delete('/product/loveproduct', {
      data: {
        product_id: product.id,
      },
    })
    .then(() => {
      toast.success('💔 Đã xóa sản phẩm khỏi danh mục yêu thích!');
      fetchFavorites();
    })
    .catch((err) => {
      if (err.response?.status === 401) {
        RequireLoginAlert(navigate);
      } else if (err.response?.data.code === 3002) {
        toast.info('Sản phẩm đã bị xóa khỏi danh mục yêu thích!');
      } else {
        toast.error('Lỗi xóa khỏi danh mục yêu thích!');
      }
    });
};

//////////////////////////////////////////////////////

////////////////////// GIO HANG ////////////////////

//hàm thêm vào giỏ hàng
export const handleAddToCart = (
  e,
  product,
  fetchCart,
  navigate,
  setOpenAddAndBuyNowModal,
  setAddAndBuyNowProduct,
) => {
  if (e) e.stopPropagation();
  const token = localStorage.getItem('token');
  let role = null;
  try {
    if (token && token !== undefined) {
      const decodedToken = jwtDecode(token);
      role = decodedToken.scope;
    }
  } catch (e) {
    localStorage.removeItem('token');
    toast.error('Lỗi thêm sản phẩm vào giỏ hàng!');
  }

  if (role === 'USER' || role === 'ADMIN') {
    api
      .get(`/product-variant/${product.id}`)
      .then((response) => {
        if (response.data.result.length > 1) {
          setAddAndBuyNowProduct({ product_variant: response.data.result });
          setOpenAddAndBuyNowModal({ open: true, isBuyNow: false });
          return;
        }

        api
          .post('/cart', {
            product_variant_id: response.data.result[0].id,
            quantity: 1,
          })
          .then(() => {
            toast.success('🛒 Đã thêm sản phẩm vào giỏ hàng!');
            fetchCart(); // gọi lại nếu có
          })
          .catch((err) => {
            if (err.response?.data.code === 3012) {
              toast.info('Sản phẩm không đủ số lượng!');
            } else {
              toast.error('Lỗi thêm vào giỏ hàng!');
            }
          });

        // Dừng trạng thái tải
      })
      .catch((error) => {
        console.error(error.response?.data?.message || 'Lỗi không xác định');
      });
  } else {
    RequireLoginAlert(navigate);
  }
};

///////// mua ngay ////////
// Lưu dữ liệu "Mua ngay" vào sessionStorage
export const setBuyNow = (
  e,
  product,
  quantity,
  navigate,
  setOpenAddAndBuyNowModal,
  setAddAndBuyNowProduct,
  setOpenLoveModal,
) => {
  const token = localStorage.getItem('token');
  let role = null;
  try {
    if (token && token !== undefined) {
      const decodedToken = jwtDecode(token);
      role = decodedToken.scope;
    }
  } catch (e) {
    localStorage.removeItem('token');
    toast.error('Lỗi mua ngay!');
  }
  if (e) e.stopPropagation();
  if (role === 'USER' || role === 'ADMIN') {
    api
      .get(`/product-variant/${product.id}`)
      .then((response) => {
        if (response.data.result.length > 1) {
          setAddAndBuyNowProduct({
            product_variant: response.data.result,
            product: product,
          });
          setOpenAddAndBuyNowModal({ open: true, isBuyNow: true });
          return;
        }

        setOpenLoveModal(false);
        const product_variant = response.data.result[0];
        const data = { ...product, product_variant, quantity }; // gộp tất cả thông tin sản phẩm + số lượng
        sessionStorage.setItem('buyNowData', JSON.stringify(data));
        navigate('/buynow');

        // Dừng trạng thái tải
      })
      .catch((error) => {
        console.error(error.response?.data?.message || 'Lỗi không xác định');
      });
  } else {
    RequireLoginAlert(navigate);
  }
};

// Lấy dữ liệu "Mua ngay" từ sessionStorage
export const getBuyNow = () => {
  const stored = sessionStorage.getItem('buyNowData');
  return stored ? JSON.parse(stored) : null;
};

// Xóa dữ liệu "Mua ngay" sau khi thanh toán xong
export const clearBuyNow = () => {
  sessionStorage.removeItem('buyNowData');
};

///////////////////////////////////////////////////

//Thông báo mời đăng nhập

export const RequireLoginAlert = (navigate, to = '/auth/login') => {
  Swal.fire({
    title: '<strong> Bạn chưa đăng nhập</strong>',
    html: 'Vui lòng đăng nhập để sử dụng tính năng này.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Đăng nhập',
    cancelButtonText: 'Không',
    background: 'white',
    color: '#333',
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
  }).then((result) => {
    if (result.isConfirmed && typeof navigate === 'function') {
      navigate(to);
    }
  });
};

//Thông báo đăng xuất
export const handleLogoutConfirm = () => {
  Swal.fire({
    title: 'Bạn có chắc muốn đăng xuất?',
    text: 'Phiên làm việc của bạn sẽ kết thúc.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Đăng xuất',
    cancelButtonText: 'Hủy',
  }).then((result) => {
    if (result.isConfirmed) {
      window.location.href = '/logout'; // chuyển trang
    }
  });
};

/////////////////////////
export const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );
  return canvas.toDataURL('image/jpeg');
};

/////////////////// status order
export const statusMap = {
  PROCESSING: { display: 'Đang xử lý', color: 'bg-blue-100 text-blue-800 border border-blue-800' },
  DELIVERING: { display: 'Đang vận chuyển', color: 'bg-blue-100 text-blue-800' },
  PENDING: { display: 'Đang chờ thanh toán', color: 'bg-yellow-50 text-yellow-600' },
  COMPLETED: { display: 'Đã hoàn thành', color: 'bg-green-100 text-green-800' },
  UNCOMPLETED: {
    display: 'Chưa hoàn thành',
    color: 'bg-red-100 text-red-800 border border-red-800',
  },
  PENALTY: {
    display: 'Đơn gian lận',
    color: 'bg-red-100 text-red-800',
  },
};

// Cắt ngắn văn bản để hiển thị
export const truncateText = (text, maxLength) => {
  if (!text) return 'Đang cập nhật';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Xử lý hiển thị giá trị
export const displayValue = (value) => {
  return value ?? 'Đang cập nhật';
};

export const formatToVietnamTime = (dateString) => {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(dateString));
};
