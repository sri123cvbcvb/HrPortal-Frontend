import React, { useState } from 'react';
import {
    Box, Drawer, List, ListItem, ListItemIcon, ListItemText,
    Typography, IconButton, useTheme, useMediaQuery, AppBar, Toolbar, Avatar
} from '@mui/material';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CelebrationIcon from '@mui/icons-material/Celebration';
import EmployeeHome from './employee/EmployeeHome';
import EmployeeAttendance from './employee/EmployeeAttendance';
import EmployeeHolidays from './employee/EmployeeHolidays';
import EmployeeLeaves from './employee/EmployeeLeaves';
import EmployeePayslips from './employee/EmployeePayslips';
import ReceiptIcon from '@mui/icons-material/Receipt';
import NotificationListener from '../components/NotificationListener';

const drawerWidth = 260;

const EmployeeDashboard = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const menuItems = [
        { text: 'Home', icon: <DashboardIcon />, path: '/employee' },
        { text: 'Attendance', icon: <EventAvailableIcon />, path: '/employee/attendance' },
        { text: 'Leaves', icon: <EventAvailableIcon />, path: '/employee/leaves' },
        { text: 'Holidays', icon: <CelebrationIcon />, path: '/employee/holidays' },
        { text: 'Payslips', icon: <ReceiptIcon />, path: '/employee/payslips' }
    ];

    const drawerContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', borderRight: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>E</Avatar>
                <Typography variant="h6" fontWeight="bold" color="text.primary">
                    Employee Portal
                </Typography>
            </Box>
            <List sx={{ px: 2, py: 3, flexGrow: 1 }}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path || (item.path === '/employee' && location.pathname === '/employee/');
                    return (
                        <ListItem
                            button
                            key={item.text}
                            onClick={() => {
                                navigate(item.path);
                                if (isMobile) setMobileOpen(false);
                            }}
                            sx={{
                                borderRadius: 2,
                                mb: 1,
                                bgcolor: isActive ? 'primary.50' : 'transparent',
                                color: isActive ? 'primary.main' : 'text.secondary',
                                '&:hover': {
                                    bgcolor: isActive ? 'primary.50' : 'grey.100',
                                    color: isActive ? 'primary.main' : 'text.primary',
                                }
                            }}
                        >
                            <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'inherit', minWidth: 40 }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.text}
                                primaryTypographyProps={{ fontWeight: isActive ? 'bold' : 'medium' }}
                            />
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
            {/* Mobile AppBar for toggling drawer */}
            {isMobile && (
                <AppBar position="fixed" sx={{ width: '100%', zIndex: theme.zIndex.drawer + 1, bgcolor: 'background.paper', color: 'text.primary', display: { md: 'none' } }}>
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" noWrap component="div" fontWeight="bold">
                            Employee Dashboard
                        </Typography>
                    </Toolbar>
                </AppBar>
            )}

            {/* Sidebar Navigation */}
            <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
                {isMobile ? (
                    <Drawer
                        variant="temporary"
                        open={mobileOpen}
                        onClose={handleDrawerToggle}
                        ModalProps={{ keepMounted: true }} // Better open performance on mobile.
                        sx={{
                            display: { xs: 'block', md: 'none' },
                            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                        }}
                    >
                        {drawerContent}
                    </Drawer>
                ) : (
                    <Drawer
                        variant="permanent"
                        sx={{
                            display: { xs: 'none', md: 'block' },
                            '& .MuiDrawer-paper': {
                                boxSizing: 'border-box',
                                width: drawerWidth,
                                position: 'relative',
                                height: '100%',
                                borderRight: 'none'
                            },
                        }}
                        open
                    >
                        {drawerContent}
                    </Drawer>
                )}
            </Box>

            {/* Main Content Area */}
            <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, width: { md: `calc(100% - ${drawerWidth}px)` }, bgcolor: 'grey.50', mt: { xs: 8, md: 0 } }}>
                <NotificationListener />
                <Routes>
                    <Route path="/" element={<EmployeeHome />} />
                    <Route path="/attendance" element={<EmployeeAttendance />} />
                    <Route path="/leaves" element={<EmployeeLeaves />} />
                    <Route path="/holidays" element={<EmployeeHolidays />} />
                    <Route path="/payslips" element={<EmployeePayslips />} />
                    <Route path="*" element={<Navigate to="/employee" replace />} />
                </Routes>
            </Box>
        </Box>
    );
};

export default EmployeeDashboard;
