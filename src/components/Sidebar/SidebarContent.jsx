import React from 'react';
import { ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const SidebarContent = ({ 
  sidebarItems, 
  isCollapsed, 
  expandedItems, 
  toggleExpanded, 
  toggleCollapsed, 
  handleMenuItemClick
}) => {
  return (
    <>
      {/* Logo */}
      <div className="p-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-teal-400 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">U</span>
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-gray-800">upos</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 flex-1 overflow-y-auto scrollbar-hide">
        <div className="space-y-6">
          {/* Main Menu */}
          <div className="space-y-1">
            {sidebarItems.map((item, index) => (
              <div key={index}>
                {item.subitems ? (
                  <div>
                    <div
                      onClick={() => !isCollapsed && toggleExpanded(index)}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm cursor-pointer text-gray-600 hover:bg-gray-50 ${
                        isCollapsed ? 'justify-center' : ''
                      }`}
                      title={isCollapsed ? item.label : ''}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 ml-3">{item.label}</span>
                          {expandedItems[index] ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </>
                      )}
                    </div>
                    {!isCollapsed && (
                      <div className={`overflow-hidden transition-all duration-200 ease-in-out ${
                        expandedItems[index] ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                        <div className="ml-6 mt-1 space-y-1">
                          {item.subitems.map((subitem, subIndex) => (
                            <NavLink
                              key={subIndex}
                              to={subitem.path}
                              onClick={handleMenuItemClick}
                              className={({ isActive }) =>
                                `px-3 py-1 text-sm rounded cursor-pointer block transition-colors w-full text-left ${
                                  isActive 
                                    ? 'text-teal-600 bg-teal-50' 
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`
                              }
                            >
                              {subitem.label}
                            </NavLink>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <NavLink
                    to={item.path}
                    onClick={handleMenuItemClick}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors w-full text-left ${
                        isCollapsed ? 'justify-center' : ''
                      } ${
                        isActive 
                          ? 'text-teal-600 bg-teal-50' 
                          : 'text-gray-600 hover:bg-gray-50'
                      }`
                    }
                    title={isCollapsed ? item.label : ''}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="flex-1 ml-3">{item.label}</span>
                    )}
                  </NavLink>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Collapse Toggle Button */}
      <div className="hidden lg:block p-4 border-t border-gray-200">
        <button
          onClick={toggleCollapsed}
          className="w-full cursor-pointer flex items-center justify-center px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </>
  );
};

export default SidebarContent;