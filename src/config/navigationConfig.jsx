import { Users, Package, BarChart2, FileText, ShoppingCart, Gift } from 'lucide-react';

export const navigationItems = [
  {
    icon: BarChart2,
    label: 'Tổng quan',
    path: '/dashboard',
  },
  {
    icon: Package,
    label: 'Sản phẩm',
    path: '/products',
    subitems: [
      { label: 'Quản lý thương hiệu', path: '/products/brand-management' },
      { label: 'Quản lý danh mục', path: '/products/category-management' },
      { label: 'Quản lý sản phẩm', path: '/products/product-management' },
    ],
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
  {
    icon: FileText,
    label: 'Quản lý kho',
    path: '/warehouse',
  },
  {
    icon: Gift,
    label: 'Quản lý quà tặng',
    path: '/gifts',
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

      if (item.subitems) {
        item.subitems.forEach((subitem) => {
          routeMap[subitem.path] = subitem.label;

          // Thêm route động nếu cần
          if (subitem.path.includes('category-management')) {
            routeMap[`${subitem.path}/add`] = 'Tạo danh mục';
            routeMap[`${subitem.path}/edit/:categoryId`] = 'Chỉnh sửa danh mục';
          }

          if (subitem.path.includes('brand-management')) {
            routeMap[`${subitem.path}/add`] = 'Tạo thương hiệu';
            routeMap[`${subitem.path}/edit/:brandId`] = 'Chỉnh sửa thương hiệu';
          }

          if (subitem.path.includes('product-management')) {
            routeMap[`${subitem.path}/add`] = 'Tạo sản phẩm';
            routeMap[`${subitem.path}/edit/:productId`] = 'Chỉnh sửa sản phẩm';
          }
        });
      }
    });
  };

  addRoutes(items);
  return routeMap;
};

export const routeTitleMap = createRouteTitleMap(navigationItems);
