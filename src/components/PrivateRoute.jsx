import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const PrivateRoute = ({ requiredRole }) => {
    const { user, loading, hasRole } = useContext(AuthContext);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && !hasRole(requiredRole)) {
        // If user doesn't have required role, redirect to their appropriate dashboard
        return <Navigate to={hasRole('ROLE_ADMIN') ? '/admin' : '/employee'} replace />;
    }

    return <Outlet />;
};

export default PrivateRoute;
