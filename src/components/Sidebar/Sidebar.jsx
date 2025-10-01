import React, { useState, useEffect } from 'react';
import SidebarContent from './SidebarContent';
import { navigationItems } from '../../config/navigationConfig';

const Sidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const [expandedItems, setExpandedItems] = useState({});
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleExpanded = (index) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsMobileMenuOpen]);

  const handleMenuItemClick = () => {
    if (window.innerWidth < 1024) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Custom CSS để ẩn scrollbar */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;  /* Internet Explorer 10+ */
          scrollbar-width: none;  /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;  /* Safari and Chrome */
        }
      `}</style>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:relative
          top-0 left-0 h-full
          bg-white lg:bg-transparent
          shadow-xl lg:shadow-none
          z-40
          transition-all duration-300 ease-in-out
          flex flex-col
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-16' : 'w-64 lg:w-64'}
        `}
        style={{ backgroundColor: '#AEE2FF' }}
      >
        <SidebarContent
          sidebarItems={navigationItems}
          isCollapsed={isCollapsed}
          expandedItems={expandedItems}
          toggleExpanded={toggleExpanded}
          toggleCollapsed={toggleCollapsed}
          handleMenuItemClick={handleMenuItemClick}
        />
      </div>
    </>
  );
};

export default Sidebar;