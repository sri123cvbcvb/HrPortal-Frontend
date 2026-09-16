import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Box, Typography, Button, AppBar, Toolbar, Avatar, Chip } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const Layout = ({ children }) => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    // Don't show header on login / signup pages
    if (location.pathname === '/login' || location.pathname === '/signup') {
        return <>{children}</>;
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isAdminRoute = location.pathname.startsWith('/admin');

    // ── Admin AppBar ──────────────────────────────────────────────
    if (isAdminRoute) {
        return (
            <Box sx={{ flexGrow: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <AppBar
                    position="sticky"
                    elevation={0}
                    sx={{
                        background: 'linear-gradient(90deg, #0f172a 0%, #1e1b4b 100%)',
                        borderBottom: '1px solid rgba(99,102,241,0.2)',
                        zIndex: (theme) => theme.zIndex.drawer + 1,
                    }}
                >
                    <Toolbar sx={{ gap: 1.5 }}>
                        {/* Logo area — matches sidebar brand */}
                        <Box display="flex" alignItems="center" gap={1.2}>
                            <Box sx={{
                                width: 30, height: 30, borderRadius: 1.5,
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(99,102,241,0.5)',
                                flexShrink: 0,
                            }}>
                                <AdminPanelSettingsIcon sx={{ color: 'white', fontSize: 16 }} />
                            </Box>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 900,
                                    fontSize: '1rem',
                                    background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    letterSpacing: -0.3,
                                    cursor: 'pointer',
                                }}
                                onClick={() => navigate('/admin')}
                            >
                                HRMS Admin
                            </Typography>
                        </Box>

                        <Box flex={1} />

                        {user && (
                            <Box display="flex" alignItems="center" gap={1.5}>
                                <Chip
                                    label="Administrator"
                                    size="small"
                                    sx={{
                                        bgcolor: 'rgba(99,102,241,0.25)',
                                        color: '#c7d2fe',
                                        fontWeight: 600,
                                        fontSize: '0.7rem',
                                        border: '1px solid rgba(99,102,241,0.35)',
                                        display: { xs: 'none', sm: 'flex' },
                                    }}
                                />
                                <Avatar sx={{
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    width: 30, height: 30,
                                    fontSize: 13, fontWeight: 700,
                                }}>
                                    {user.username?.[0]?.toUpperCase()}
                                </Avatar>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600, display: { xs: 'none', md: 'block' } }}>
                                    {user.username}
                                </Typography>
                            </Box>
                        )}
                    </Toolbar>
                </AppBar>
                <Box component="main" sx={{ flexGrow: 1, bgcolor: '#f8fafc' }}>
                    {children}
                </Box>
            </Box>
        );
    }

    // ── Employee / Default AppBar ─────────────────────────────────
    return (
        <Box sx={{ flexGrow: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                }}
            >
                <Toolbar>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{
                            flexGrow: 1,
                            fontWeight: '900',
                            color: 'primary.main',
                            letterSpacing: -0.5,
                            cursor: 'pointer',
                        }}
                        onClick={() => navigate('/')}
                    >
                        HRMS<span style={{ color: '#666', fontWeight: '500' }}>HUB</span>
                    </Typography>
                    {user && (
                        <Box display="flex" alignItems="center" gap={2}>
                            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                                <Typography variant="subtitle2" sx={{ lineHeight: 1, fontWeight: 'bold' }}>
                                    {user.username}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Employee
                                </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                                {user.username?.[0]?.toUpperCase()}
                            </Avatar>
                            <Button
                                color="inherit"
                                size="small"
                                onClick={handleLogout}
                                startIcon={<ExitToAppIcon />}
                                sx={{ borderRadius: 2 }}
                            >
                                Logout
                            </Button>
                        </Box>
                    )}
                </Toolbar>
            </AppBar>
            <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}>
                {children}
            </Box>
        </Box>
    );
};

export default Layout;
