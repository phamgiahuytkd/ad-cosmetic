// src/components/Context/WebSocketContext.jsx
import React, { createContext, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNotifications } from './NotificationContext';

export const WebSocketContext = createContext();

export const WebSocketProvider = ({ children, onNewOrder }) => {
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);
  const { notifications, fetchNotifications } = useNotifications();

  useEffect(() => {
    // Nếu backend dùng context-path /iCommerce → dùng '/iCommerce/ws'
    // Nếu backend không dùng context-path, sửa thành '/ws' hoặc full URL.
    const client = new Client({
      webSocketFactory: () =>
        new SockJS('https://icommerce-production.up.railway.app/iCommerce/ws'),
      reconnectDelay: 3000,
      debug: (msg) => console.debug('STOMP:', msg),
      onConnect: () => {
        console.log('✅ STOMP connected');
        setConnected(true);

        // Subscribe topic chung cho admin
        client.subscribe('/topic/admin', (msg) => {
          try {
            const body = msg.body;
            console.log('📩 STOMP message:', body);
            if (body === 'NEW_ORDER' || body === 'CANCELED') {
              if (body === 'NEW_ORDER') {
                toast.info('📦 Có đơn hàng mới!', { position: 'top-right', autoClose: 3500 });
              } else if (body === 'CANCELED') {
                toast.info('📦 Đơn hàng đã bị hủy!', { position: 'top-right', autoClose: 3500 });
              }
              fetchNotifications();
              if (onNewOrder) onNewOrder();
            }
          } catch (e) {
            console.error('Error handling message', e);
          }
        });
      },
      onStompError: (frame) => {
        console.error('❌ STOMP error', frame);
        toast.error('Lỗi STOMP: ' + (frame?.message || 'unknown'));
      },
      onWebSocketError: (ev) => {
        console.error('❌ WebSocket error', ev);
      },
      onWebSocketClose: () => {
        console.log('🔌 WebSocket closed');
        setConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
    };
  }, [onNewOrder]);

  return (
    <WebSocketContext.Provider value={{ connected }}>
      {children}
      <ToastContainer position="bottom-right" />
    </WebSocketContext.Provider>
  );
};
