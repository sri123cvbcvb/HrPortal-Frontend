import React, { useState, useContext } from 'react';
import {
    Box, Drawer, List, ListItem, Typography,
    IconButton, useTheme, useMediaQuery, Avatar, Tooltip
} from '@mui/material';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import DateRangeIcon from '@mui/icons-material/DateRange';
import EventIcon from '@mui/icons-material/Event';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { AuthContext } from '../context/AuthContext';

import AdminOverview from './admin/AdminOverview';
import EmployeesList from './admin/EmployeesList';
import AdminLeaveRequests from './admin/AdminLeaveRequests';
import LeaveManagement from './admin/LeaveManagement';
import AdminPayroll from './admin/AdminPayroll';

const DRAWER_WIDTH = 272;

const SIDEBAR_GRADIENT = 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)';

const menuItems = [
    {
        text: 'Overview',
        icon: <DashboardIcon fontSize="small" />,
        path: '/admin',
        description: 'Dashboard summary'
    },
    {
        text: 'Employees',
        icon: <PeopleIcon fontSize="small" />,
        path: '/admin/employees',
        description: 'Manage team'
    },
    {
        text: 'Payslips & Payroll',
        icon: <ReceiptLongIcon fontSize="small" />,
        path: '/admin/payroll',
        description: 'Employee payslips & preview'
    },
    {
        text: 'Leave Requests',
        icon: <DateRangeIcon fontSize="small" />,
        path: '/admin/leaves',
        description: 'Approve & manage'
    },
    {
        text: 'Holidays',
        icon: <EventIcon fontSize="small" />,
        path: '/admin/holidays',
        description: 'Company calendar'
    },
];

const NavItem = ({ item, active, onClick }) => (
    <ListItem disablePadding sx={{ mb: 0.5 }}>
        <Box
            onClick={onClick}
            sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1.4,
                borderRadius: 2.5,
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s ease',
                background: active
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.9) 0%, rgba(139,92,246,0.85) 100%)'
                    : 'transparent',
                boxShadow: active ? '0 4px 15px rgba(99,102,241,0.35)' : 'none',
                '&:hover': {
                    background: active
                        ? 'linear-gradient(135deg, rgba(99,102,241,0.9) 0%, rgba(139,92,246,0.85) 100%)'
                        : 'rgba(255,255,255,0.07)',
                    transform: active ? 'none' : 'translateX(4px)',
                },
            }}
        >
            {/* Active left bar */}
            {active && (
                <Box sx={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 4,
                    height: '60%',
                    borderRadius: '0 4px 4px 0',
                    bgcolor: 'white',
                }} />
            )}
            <Box sx={{
                width: 36, height: 36,
                borderRadius: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
                color: active ? 'white' : 'rgba(255,255,255,0.55)',
                flexShrink: 0,
                transition: 'all 0.2s',
            }}>
                {item.icon}
            </Box>
            <Box flex={1} minWidth={0}>
                <Typography
                    variant="body2"
                    fontWeight={active ? 700 : 500}
                    sx={{
                        color: active ? 'white' : 'rgba(255,255,255,0.72)',
                        lineHeight: 1.2,
                        fontSize: '0.875rem',
                    }}
                >
                    {item.text}
                </Typography>
                <Typography variant="caption" sx={{ color: active ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)', fontSize: '0.7rem' }}>
                    {item.description}
                </Typography>
            </Box>
            {active && (
                <ChevronRightIcon sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 16 }} />
            )}
        </Box>
    </ListItem>
);

const AdminDashboard = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useContext(AuthContext);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) =>
        path === '/admin'
            ? location.pathname === '/admin' || location.pathname === '/admin/'
            : location.pathname.startsWith(path);

    const drawerContent = (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: SIDEBAR_GRADIENT,
            overflowX: 'hidden',
        }}>
            {/* ── Logo / Brand ─────────────────── */}
            <Box sx={{
                px: 3, py: 3.5,
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
            }}>
                <Box sx={{
                    width: 40, height: 40,
                    borderRadius: 2.5,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(99,102,241,0.5)',
                    flexShrink: 0,
                }}>
                    <AdminPanelSettingsIcon sx={{ color: 'white', fontSize: 22 }} />
                </Box>
                <Box>
                    <Typography
                        sx={{
                            fontWeight: 900,
                            fontSize: '1.1rem',
                            background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            lineHeight: 1.1,
                            letterSpacing: -0.3,
                        }}
                    >
                        HRMS Admin
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem' }}>
                        Control Panel
                    </Typography>
                </Box>
            </Box>

            {/* ── Section Label ─────────────────── */}
            <Box sx={{ px: 3, pt: 3, pb: 1 }}>
                <Typography variant="caption" sx={{
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 1.2,
                }}>
                    Navigation
                </Typography>
            </Box>

            {/* ── Nav Items ─────────────────── */}
            <List sx={{ px: 1.5, flex: 1 }}>
                {menuItems.map((item) => (
                    <NavItem
                        key={item.text}
                        item={item}
                        active={isActive(item.path)}
                        onClick={() => {
                            navigate(item.path);
                            if (isMobile) setMobileOpen(false);
                        }}
                    />
                ))}
            </List>

            {/* ── Decorative Orb ─────────────────── */}
            <Box sx={{
                mx: 2, mb: 2, p: 2,
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
                border: '1px solid rgba(99,102,241,0.2)',
            }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
                    ✦ Pro Tip
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem', lineHeight: 1.5 }}>
                    Use Holidays to configure your company calendar for employees.
                </Typography>
            </Box>

            {/* ── User / Logout ─────────────────── */}
            <Box sx={{
                px: 2, py: 2.5,
                borderTop: '1px solid rgba(255,255,255,0.07)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
            }}>
                <Avatar sx={{
                    width: 36, height: 36,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    fontSize: 14,
                    fontWeight: 700,
                    flexShrink: 0,
                }}>
                    {user?.username?.[0]?.toUpperCase() || 'A'}
                </Avatar>
                <Box flex={1} minWidth={0}>
                    <Typography variant="body2" fontWeight={600} sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem' }} noWrap>
                        {user?.username || 'Admin'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem' }}>
                        Administrator
                    </Typography>
                </Box>
                <Tooltip title="Logout">
                    <IconButton
                        size="small"
                        onClick={handleLogout}
                        sx={{
                            color: 'rgba(255,255,255,0.45)',
                            '&:hover': { color: '#ef4444', bgcolor: 'rgba(239,68,68,0.12)' },
                        }}
                    >
                        <LogoutIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
            {/* Mobile Menu Button */}
            {isMobile && (
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    sx={{
                        position: 'fixed', top: 70, left: 12, zIndex: 1300,
                        bgcolor: '#1e1b4b',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(30,27,75,0.4)',
                        '&:hover': { bgcolor: '#312e81' },
                    }}
                >
                    <MenuIcon />
                </IconButton>
            )}

            {/* Desktop Permanent Drawer */}
            {!isMobile && (
                <Drawer
                    variant="permanent"
                    sx={{
                        width: DRAWER_WIDTH,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: DRAWER_WIDTH,
                            boxSizing: 'border-box',
                            border: 'none',
                            top: '64px',
                            height: 'calc(100vh - 64px)',
                        },
                    }}
                    open
                >
                    {drawerContent}
                </Drawer>
            )}

            {/* Mobile Temporary Drawer */}
            {isMobile && (
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        '& .MuiDrawer-paper': {
                            width: DRAWER_WIDTH,
                            boxSizing: 'border-box',
                            border: 'none',
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>
            )}

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    bgcolor: '#f8fafc',
                    minHeight: 'calc(100vh - 64px)',
                    width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
                    overflow: 'auto',
                }}
            >
                <Routes>
                    <Route index element={<AdminOverview />} />
                    <Route path="employees" element={<EmployeesList />} />
                    <Route path="payroll" element={<AdminPayroll />} />
                    <Route path="leaves" element={<AdminLeaveRequests />} />
                    <Route path="holidays" element={<LeaveManagement />} />
                </Routes>
            </Box>
        </Box>
    );
};

export default AdminDashboard;
