import {
  Users,
  Package,
  BarChart2,
  FileText,
  ShoppingCart,
  Gift,
  Archive,
  Apple,
  Newspaper,
  Ticket,
  Tickets,
} from 'lucide-react';

export const navigationItems = [
  {
    icon: BarChart2,
    label: 'Tổng quan',
    path: '/dashboard',
  },
  {
    icon: Newspaper,
    label: 'Áp phích',
    path: '/posters',
  },
  {
    icon: Package,
    label: 'Sản phẩm',
    path: '/products',
  },
  {
    icon: Archive,
    label: 'Danh mục',
    path: '/categories',
  },
  {
    icon: Apple,
    label: 'Thương hiệu',
    path: '/brands',
  },
  {
    icon: Gift,
    label: 'Quà tặng',
    path: '/gifts',
  },
  {
    icon: Tickets,
    label: 'Mã giảm giá',
    path: '/vouchers',
  },
  {
    icon: ShoppingCart,
    label: 'Đơn hàng',
    path: '/orders',
  },
  {
    icon: Users,
    label: 'Khách hàng',
    path: '/customers',
  },
];

export const createRouteTitleMap = (items) => {
  const routeMap = {
    '/': 'Tổng quan',
    '/dashboard': 'Tổng quan',
  };

  const addRoutes = (items) => {
    items.forEach((item) => {
      routeMap[item.path] = item.label;

      if (item.path.includes('categories')) {
        routeMap[`${item.path}/add`] = 'Tạo danh mục';
        routeMap[`${item.path}/edit/:categoryId`] = 'Chỉnh sửa danh mục';
      }

      if (item.path.includes('brands')) {
        routeMap[`${item.path}/add`] = 'Tạo thương hiệu';
        routeMap[`${item.path}/edit/:brandId`] = 'Chỉnh sửa thương hiệu';
      }

      if (item.path.includes('products')) {
        routeMap[`${item.path}/add`] = 'Tạo sản phẩm';
        routeMap[`${item.path}/edit/:productId`] = 'Chỉnh sửa sản phẩm';
      }

      if (item.path.includes('gifts')) {
        routeMap[`${item.path}/add`] = 'Thêm quà tặng';
        routeMap[`${item.path}/edit/:giftID`] = 'Chỉnh sửa quà tặng';
      }

      if (item.path.includes('vouchers')) {
        routeMap[`${item.path}/add`] = 'Thêm mã giảm giá';
        routeMap[`${item.path}/edit/:voucherID`] = 'Chỉnh sửa mã giảm giá';
      }
    });
  };

  addRoutes(items);
  return routeMap;
};

export const routeTitleMap = createRouteTitleMap(navigationItems);
