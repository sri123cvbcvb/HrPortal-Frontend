import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Container,
    Alert,
    Divider,
    IconButton,
    InputAdornment,
    Chip,
    Stack
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import BusinessCenterRoundedIcon from '@mui/icons-material/BusinessCenterRounded';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, googleLogin } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userData = await login(username, password);
            if (userData.roles && userData.roles.includes('ROLE_ADMIN')) {
                navigate('/admin');
            } else {
                navigate('/employee');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please verify your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        setLoading(true);
        try {
            if (!credentialResponse.credential) {
                throw new Error('No credential received from Google');
            }
            const userData = await googleLogin(credentialResponse.credential);
            if (userData.roles && userData.roles.includes('ROLE_ADMIN')) {
                navigate('/admin');
            } else {
                navigate('/employee');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Google sign-in failed. Please ensure your email is registered by HR.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Google sign-in was cancelled or encountered an error.');
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                width: '100vw',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
                position: 'relative',
                overflow: 'hidden',
                py: { xs: 4, md: 6 },
                px: { xs: 2, sm: 3 }
            }}
        >
            {/* Background Ambient Glow Accents */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '-10%',
                    left: '15%',
                    width: 500,
                    height: 500,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                    pointerEvents: 'none'
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    bottom: '-10%',
                    right: '10%',
                    width: 600,
                    height: 600,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(168, 85, 247, 0.14) 0%, transparent 70%)',
                    filter: 'blur(70px)',
                    pointerEvents: 'none'
                }}
            />

            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                <Card
                    elevation={0}
                    sx={{
                        borderRadius: { xs: 4, md: 5 },
                        overflow: 'hidden',
                        background: 'rgba(255, 255, 255, 0.96)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.15)',
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        minHeight: 640
                    }}
                >
                    {/* Left Brand Showcase Panel (Visible on md+) */}
                    <Box
                        sx={{
                            flex: { md: '1 1 45%' },
                            background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
                            color: '#ffffff',
                            p: { xs: 4, md: 6 },
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Decorative background grid pattern */}
                        <Box
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                opacity: 0.08,
                                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                                backgroundSize: '24px 24px'
                            }}
                        />

                        {/* Top Branding */}
                        <Box sx={{ position: 'relative', zIndex: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                <Box
                                    sx={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 3,
                                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 8px 20px -4px rgba(99, 102, 241, 0.5)'
                                    }}
                                >
                                    <BusinessCenterRoundedIcon sx={{ color: '#fff', fontSize: 24 }} />
                                </Box>
                                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                                    HR<span style={{ color: '#818cf8' }}>Portal</span>
                                </Typography>
                            </Box>

                            <Chip
                                icon={<VerifiedUserOutlinedIcon sx={{ color: '#a5b4fc !important', fontSize: '16px !important' }} />}
                                label="Enterprise HR & Workforce Suite"
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(255, 255, 255, 0.12)',
                                    color: '#e0e7ff',
                                    fontWeight: 500,
                                    fontSize: '0.75rem',
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    mb: 3
                                }}
                            />

                            <Typography
                                variant="h3"
                                sx={{
                                    fontWeight: 800,
                                    lineHeight: 1.2,
                                    fontSize: { xs: '1.8rem', md: '2.4rem' },
                                    letterSpacing: '-0.03em',
                                    mb: 2,
                                    background: 'linear-gradient(to right, #ffffff, #e0e7ff)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}
                            >
                                Everything your workforce needs, in one workspace.
                            </Typography>
                            <Typography sx={{ color: '#c7d2fe', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: 420 }}>
                                Experience modern attendance geofencing, automated leave workflows, and streamlined payroll calculation.
                            </Typography>
                        </Box>

                        {/* Middle Feature Highlights */}
                        <Stack spacing={2} sx={{ my: { xs: 4, md: 5 }, position: 'relative', zIndex: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 2,
                                        bgcolor: 'rgba(99, 102, 241, 0.25)',
                                        border: '1px solid rgba(165, 180, 252, 0.25)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#a5b4fc'
                                    }}
                                >
                                    <AccessTimeFilledRoundedIcon fontSize="small" />
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#fff' }}>
                                        Geofenced Real-Time Clock In
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#c7d2fe' }}>
                                        Accurate shift tracking with GPS office validation
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 2,
                                        bgcolor: 'rgba(168, 85, 247, 0.25)',
                                        border: '1px solid rgba(216, 180, 254, 0.25)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#d8b4fe'
                                    }}
                                >
                                    <EventAvailableRoundedIcon fontSize="small" />
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#fff' }}>
                                        Instant Leave Management
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#c7d2fe' }}>
                                        Session-based requests with dynamic balance updates
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box
                                    sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 2,
                                        bgcolor: 'rgba(16, 185, 129, 0.25)',
                                        border: '1px solid rgba(110, 231, 183, 0.25)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#6ee7b7'
                                    }}
                                >
                                    <PaymentsRoundedIcon fontSize="small" />
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#fff' }}>
                                        Integrated Payroll & Statutory
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#c7d2fe' }}>
                                        Built-in PF, UAN, and CTC breakdown management
                                    </Typography>
                                </Box>
                            </Box>
                        </Stack>

                        {/* Bottom Security Note */}
                        <Box
                            sx={{
                                pt: 3,
                                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                position: 'relative',
                                zIndex: 2
                            }}
                        >
                            <Typography variant="caption" sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <VerifiedUserOutlinedIcon sx={{ fontSize: 15, color: '#10b981' }} />
                                256-Bit SSL Protected
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                v2.4 Enterprise Edition
                            </Typography>
                        </Box>
                    </Box>

                    {/* Right Login Form Panel */}
                    <Box
                        sx={{
                            flex: { md: '1 1 55%' },
                            p: { xs: 3.5, sm: 5, md: 7 },
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}
                    >
                        <Box sx={{ maxWidth: 420, mx: 'auto', width: '100%' }}>
                            {/* Header */}
                            <Box sx={{ mb: 4 }}>
                                <Typography
                                    component="h1"
                                    variant="h4"
                                    sx={{
                                        fontWeight: 800,
                                        letterSpacing: '-0.02em',
                                        color: '#0f172a',
                                        mb: 1
                                    }}
                                >
                                    Welcome back 👋
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#64748b' }}>
                                    Sign in using your corporate account or email OAuth2
                                </Typography>
                            </Box>

                            {error && (
                                <Alert
                                    severity="error"
                                    sx={{
                                        mb: 3,
                                        borderRadius: 2.5,
                                        fontSize: '0.875rem',
                                        '& .MuiAlert-icon': { fontSize: 20 }
                                    }}
                                >
                                    {error}
                                </Alert>
                            )}

                            {/* Google Sign-In as Top Choice */}
                            <Box sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={handleGoogleError}
                                        shape="rectangular"
                                        theme="outline"
                                        size="large"
                                        text="signin_with"
                                        width="420"
                                    />
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', my: 2.5 }}>
                                <Divider sx={{ flexGrow: 1, borderColor: '#e2e8f0' }} />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        px: 2,
                                        color: '#94a3b8',
                                        fontWeight: 600,
                                        letterSpacing: '0.06em',
                                        fontSize: '0.72rem'
                                    }}
                                >
                                    OR LOGIN WITH CREDENTIALS
                                </Typography>
                                <Divider sx={{ flexGrow: 1, borderColor: '#e2e8f0' }} />
                            </Box>

                            {/* Standard Form */}
                            <Box component="form" onSubmit={handleSubmit} noValidate>
                                <Box sx={{ mb: 2.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                                        Username
                                    </Typography>
                                    <TextField
                                        required
                                        fullWidth
                                        id="username"
                                        name="username"
                                        placeholder="e.g. admin or employee ID"
                                        autoComplete="username"
                                        autoFocus
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <PersonOutlineRoundedIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                                                </InputAdornment>
                                            )
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2.5,
                                                bgcolor: '#f8fafc',
                                                transition: 'all 0.2s ease',
                                                '&:hover': { bgcolor: '#f1f5f9' },
                                                '&.Mui-focused': { bgcolor: '#ffffff' }
                                            }
                                        }}
                                    />
                                </Box>

                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                                        Password
                                    </Typography>
                                    <TextField
                                        required
                                        fullWidth
                                        name="password"
                                        placeholder="Enter your account password"
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LockOutlinedIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        aria-label="toggle password visibility"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        edge="end"
                                                        size="small"
                                                        sx={{ color: '#94a3b8' }}
                                                    >
                                                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2.5,
                                                bgcolor: '#f8fafc',
                                                transition: 'all 0.2s ease',
                                                '&:hover': { bgcolor: '#f1f5f9' },
                                                '&.Mui-focused': { bgcolor: '#ffffff' }
                                            }
                                        }}
                                    />
                                </Box>

                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    disabled={loading}
                                    sx={{
                                        py: 1.5,
                                        borderRadius: 2.5,
                                        fontWeight: 700,
                                        fontSize: '0.95rem',
                                        letterSpacing: '-0.01em',
                                        textTransform: 'none',
                                        background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                                        boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.45)',
                                        transition: 'all 0.25s ease',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #4338ca 0%, #4f46e5 100%)',
                                            boxShadow: '0 15px 30px -5px rgba(79, 70, 229, 0.55)',
                                            transform: 'translateY(-1px)'
                                        },
                                        '&:active': {
                                            transform: 'translateY(0)'
                                        }
                                    }}
                                >
                                    {loading ? 'Authenticating...' : 'Sign In to Portal'}
                                </Button>
                            </Box>

                            {/* Helper Info Footer */}
                            <Box sx={{ textAlign: 'center', mt: 4 }}>
                                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>
                                    Need help signing in or forgot credentials?
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 600 }}>
                                    Please contact your system HR Administrator
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Card>
            </Container>
        </Box>
    );
};

export default Login;
