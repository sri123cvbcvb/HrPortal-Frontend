import React, { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { toast } from 'react-toastify';
import { Box, Typography } from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

const NotificationListener = () => {
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        // We use protocol-relative URL or explicit backend URL for SockJS
        // Replace with your actual backend URL if different
        const socketUrl = '/ws-hrms';

        const stompClient = new Client({
            // Using SockJS fallback since raw websockets might need complete ws:// URL
            webSocketFactory: () => new SockJS(socketUrl),
            debug: (str) => {
                // console.log(str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        stompClient.onConnect = (frame) => {
            setConnected(true);

            // Subscribe to the /topic/reminders
            stompClient.subscribe('/topic/reminders', (message) => {
                if (message.body) {
                    const notification = JSON.parse(message.body);

                    // Display Toast Notification
                    toast.info(
                        <Box display="flex" flexDirection="column" gap={0.5}>
                            <Typography variant="subtitle2" fontWeight="bold" display="flex" alignItems="center" gap={1}>
                                <NotificationsActiveIcon fontSize="small" />
                                {notification.title}
                            </Typography>
                            <Typography variant="body2">{notification.message}</Typography>
                            <Typography variant="caption" color="text.secondary">{notification.time}</Typography>
                        </Box>,
                        {
                            position: "top-center",
                            autoClose: 10000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            theme: "light",
                        }
                    );
                }
            });
        };

        stompClient.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
        };

        stompClient.activate();

        // Cleanup on unmount
        return () => {
            if (stompClient) {
                stompClient.deactivate();
            }
        };
    }, []);

    // This component purely acts as a listener and doesn't render visual UI itself
    // Optionally return an invisible div, or just null
    return null;
};

export default NotificationListener;
