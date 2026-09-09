import React, { useState } from 'react';
import {
    Box, Drawer, List, ListItem, ListItemButton,
    ListItemIcon, ListItemText, Typography,
    Divider, IconButton, useTheme, useMediaQuery
} from '@mui/material';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import DateRangeIcon from '@mui/icons-material/DateRange';
import EventIcon from '@mui/icons-material/Event';
import MenuIcon from '@mui/icons-material/Menu';

import AdminOverview from './admin/AdminOverview';
import EmployeesList from './admin/EmployeesList';
import AdminLeaveRequests from './admin/AdminLeaveRequests';
import LeaveManagement from './admin/LeaveManagement';

const DRAWER_WIDTH = 260;

const AdminDashboard = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { text: 'Overview', icon: <DashboardIcon />, path: '/admin' },
        { text: 'Employees', icon: <PeopleIcon />, path: '/admin/employees' },
        { text: 'Leave Management', icon: <DateRangeIcon />, path: '/admin/leaves' },
        { text: 'Company Holidays', icon: <EventIcon />, path: '/admin/holidays' },
    ];

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const drawerContent = (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, px: 2 }}>
                <Typography variant="h6" fontWeight="900" color="primary">HRMS ADMIN</Typography>
            </Box>
            <List sx={{ px: 1 }}>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                        <ListItemButton
                            onClick={() => {
                                navigate(item.path);
                                if (isMobile) setMobileOpen(false);
                            }}
                            selected={location.pathname === item.path || (item.path === '/admin' && location.pathname === '/admin/')}
                            sx={{
                                borderRadius: 2,
                                '&.Mui-selected': {
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    '& .MuiListItemIcon-root': { color: 'white' },
                                    '&:hover': { bgcolor: 'primary.dark' }
                                }
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 500 }} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Divider sx={{ my: 2 }} />
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            {/* Drawer for Desktop */}
            {!isMobile && (
                <Drawer
                    variant="permanent"
                    sx={{
                        width: DRAWER_WIDTH,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: DRAWER_WIDTH,
                            boxSizing: 'border-box',
                            borderRight: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper'
                        },
                    }}
                    open
                >
                    {drawerContent}
                </Drawer>
            )}

            {/* Mobile Nav Trigger */}
            {isMobile && (
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={handleDrawerToggle}
                    sx={{ position: 'fixed', top: 12, left: 16, zIndex: 1201 }}
                >
                    <MenuIcon />
                </IconButton>
            )}

            {/* Drawer for Mobile */}
            {isMobile && (
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        '& .MuiDrawer-paper': {
                            width: DRAWER_WIDTH,
                            boxSizing: 'border-box',
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>
            )}

            {/* Main Content Area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 4,
                    minHeight: '100vh',
                    width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` }
                }}
            >
                <Routes>
                    <Route index element={<AdminOverview />} />
                    <Route path="employees" element={<EmployeesList />} />
                    <Route path="leaves" element={<AdminLeaveRequests />} />
                    <Route path="holidays" element={<LeaveManagement />} />
                </Routes>
            </Box>
        </Box>
    );
};

export default AdminDashboard;
