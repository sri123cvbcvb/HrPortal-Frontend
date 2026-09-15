import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Container,
    Alert
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Avatar from '@mui/material/Avatar';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useContext(AuthContext);
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
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Card elevation={4} sx={{ width: '100%', borderRadius: 3 }}>
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
                        <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
                            <LockOutlinedIcon fontSize="large" />
                        </Avatar>
                        <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                            HRMS Login
                        </Typography>

                        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

                        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="username"
                                label="Username"
                                name="username"
                                autoComplete="username"
                                autoFocus
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type="password"
                                id="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                disabled={loading}
                                sx={{ mt: 3, mb: 2, height: 48 }}
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </Button>
                            {/* Signup hidden - admin creates employee accounts and provides credentials
                            <Box sx={{ textAlign: 'center', mt: 1 }}>
                                <Typography variant="body2">
                                    Don't have an account?{' '}
                                    <Link to="/signup" style={{ textDecoration: 'none', fontWeight: 'bold' }}>
                                        Sign Up
                                    </Link>
                                </Typography>
                            </Box>
                            */}
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
};

export default Login;
