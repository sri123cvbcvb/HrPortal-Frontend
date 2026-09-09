import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Box, Typography, Button, AppBar, Toolbar, Avatar } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

const Layout = ({ children }) => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    // Don't show header on login page
    if (location.pathname === '/login' || location.pathname === '/signup') {
        return <>{children}</>;
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isAdminRoute = location.pathname.startsWith('/admin');

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
                    zIndex: (theme) => theme.zIndex.drawer + 1
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
                            cursor: 'pointer'
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
                                    {user.roles?.includes('ROLE_ADMIN') ? 'Administrator' : 'Employee'}
                                </Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                                {user.username[0].toUpperCase()}
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
            <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', p: isAdminRoute ? 0 : 3 }}>
                {children}
            </Box>
        </Box>
    );
};

export default Layout;
