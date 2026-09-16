import React, { useState, useEffect, useContext } from 'react';
import { Box, Typography, Grid, Card, CardContent, Avatar, Chip, CircularProgress } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import GroupIcon from '@mui/icons-material/Group';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import api from '../../utils/api';
import { format, parseISO, isAfter, startOfToday } from 'date-fns';
import { AuthContext } from '../../context/AuthContext';

const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return { text: 'Good Morning', emoji: '☀️' };
    if (h < 17) return { text: 'Good Afternoon', emoji: '🌤️' };
    return { text: 'Good Evening', emoji: '🌙' };
};

const StatCard = ({ title, value, icon, gradient, iconBg, sub }) => (
    <Card
        elevation={0}
        sx={{
            borderRadius: 3,
            border: '1px solid rgba(0,0,0,0.06)',
            height: '100%',
            overflow: 'visible',
            transition: 'transform 0.22s ease, box-shadow 0.22s ease',
            '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 16px 40px rgba(0,0,0,0.10)',
            },
        }}
    >
        <CardContent sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                    <Typography
                        variant="caption"
                        sx={{
                            color: 'text.secondary',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: 0.8,
                            fontSize: '0.7rem',
                        }}
                    >
                        {title}
                    </Typography>
                    <Typography
                        variant="h3"
                        fontWeight={800}
                        sx={{ lineHeight: 1.1, mt: 0.5, color: 'text.primary' }}
                    >
                        {value}
                    </Typography>
                    {sub && (
                        <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>
                            {sub}
                        </Typography>
                    )}
                </Box>
                <Box
                    sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 3,
                        background: gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: `0 8px 20px ${iconBg}55`,
                    }}
                >
                    <Box sx={{ color: 'white', display: 'flex' }}>{icon}</Box>
                </Box>
            </Box>
        </CardContent>
    </Card>
);

const HolidayItem = ({ leave, idx }) => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#22c55e'];
    const color = colors[idx % colors.length];
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1.5,
                borderRadius: 2.5,
                mb: 1,
                bgcolor: `${color}0d`,
                border: `1px solid ${color}22`,
                transition: 'all 0.15s',
                '&:hover': { transform: 'translateX(4px)', bgcolor: `${color}18` },
            }}
        >
            <Box
                sx={{
                    minWidth: 48,
                    height: 52,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0,
                }}
            >
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, lineHeight: 1 }}>
                    {format(parseISO(leave.date), 'MMM').toUpperCase()}
                </Typography>
                <Typography sx={{ fontSize: '1.1rem', fontWeight: 900, lineHeight: 1 }}>
                    {format(parseISO(leave.date), 'd')}
                </Typography>
            </Box>
            <Box flex={1} minWidth={0}>
                <Typography variant="body2" fontWeight={700} noWrap>
                    {leave.description || 'Company Holiday'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {format(parseISO(leave.date), 'EEEE')}
                </Typography>
            </Box>
            <Chip
                label="Upcoming"
                size="small"
                sx={{
                    bgcolor: `${color}22`,
                    color: color,
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    height: 20,
                }}
            />
        </Box>
    );
};

const AdminOverview = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState({ totalEmployees: 0, upcomingLeaves: [], pendingLeaveRequests: 0 });
    const [loading, setLoading] = useState(true);
    const greeting = greet();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [empRes, leaveRes, reqRes] = await Promise.all([
                    api.get('/admin/employees'),
                    api.get('/admin/leaves'),
                    api.get('admin/leave-management/requests'),
                ]);

                const today = startOfToday();
                const upcoming = leaveRes.data
                    .filter(l => !isAfter(today, parseISO(l.date)))
                    .sort((a, b) => parseISO(a.date) - parseISO(b.date))
                    .slice(0, 5);

                const pending = reqRes.data.filter(r => r.status === 'PENDING').length;

                setStats({
                    totalEmployees: empRes.data.length,
                    upcomingLeaves: upcoming,
                    pendingLeaveRequests: pending,
                });
            } catch (error) {
                console.error('Error fetching dashboard stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress sx={{ color: '#6366f1' }} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>

            {/* ── Hero Banner ──────────────────────────────── */}
            <Box
                sx={{
                    borderRadius: 4,
                    mb: 4,
                    p: { xs: 3, md: 4 },
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Decorative orbs */}
                <Box sx={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', bgcolor: 'rgba(99,102,241,0.15)' }} />
                <Box sx={{ position: 'absolute', bottom: -30, right: 120, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(139,92,246,0.12)' }} />
                <Box sx={{ position: 'absolute', top: 20, right: 200, width: 60, height: 60, borderRadius: '50%', bgcolor: 'rgba(167,139,250,0.1)' }} />

                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} position="relative" zIndex={1}>
                    <Box>
                        <Typography variant="body2" sx={{ opacity: 0.6, mb: 0.5, fontSize: '0.85rem' }}>
                            {greeting.emoji} {greeting.text}, {user?.username || 'Admin'}
                        </Typography>
                        <Typography variant="h4" fontWeight={800} letterSpacing={-0.5} sx={{ lineHeight: 1.1 }}>
                            Admin Dashboard
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.65, mt: 1 }}>
                            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </Typography>
                    </Box>
                    <Box display="flex" gap={2} flexWrap="wrap">
                        {[
                            { label: 'Employees', value: stats.totalEmployees },
                            { label: 'Pending', value: stats.pendingLeaveRequests },
                            { label: 'Holidays', value: stats.upcomingLeaves.length },
                        ].map(({ label, value }) => (
                            <Box
                                key={label}
                                textAlign="center"
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.1)',
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: 3,
                                    px: 3,
                                    py: 1.5,
                                    minWidth: 80,
                                }}
                            >
                                <Typography fontWeight={800} variant="h5">{value}</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.72rem' }}>{label}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>

            {/* ── Stat Cards ──────────────────────────────── */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Employees"
                        value={stats.totalEmployees}
                        icon={<GroupIcon sx={{ fontSize: 26 }} />}
                        gradient="linear-gradient(135deg, #6366f1, #8b5cf6)"
                        iconBg="#6366f1"
                        sub="Active workforce"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Pending Approvals"
                        value={stats.pendingLeaveRequests}
                        icon={<AssignmentLateIcon sx={{ fontSize: 26 }} />}
                        gradient="linear-gradient(135deg, #f59e0b, #ef4444)"
                        iconBg="#f59e0b"
                        sub="Leave requests"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Upcoming Holidays"
                        value={stats.upcomingLeaves.length}
                        icon={<BeachAccessIcon sx={{ fontSize: 26 }} />}
                        gradient="linear-gradient(135deg, #14b8a6, #06b6d4)"
                        iconBg="#14b8a6"
                        sub="Company calendar"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Departments"
                        value="4"
                        icon={<TrendingUpIcon sx={{ fontSize: 26 }} />}
                        gradient="linear-gradient(135deg, #22c55e, #16a34a)"
                        iconBg="#22c55e"
                        sub="Active units"
                    />
                </Grid>
            </Grid>

            {/* ── Bottom Grid ──────────────────────────────── */}
            <Grid container spacing={3}>
                {/* Upcoming Holidays */}
                <Grid item xs={12} md={6}>
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 3,
                            border: '1px solid rgba(0,0,0,0.06)',
                            overflow: 'hidden',
                            height: '100%',
                        }}
                    >
                        {/* Card Header */}
                        <Box
                            sx={{
                                px: 3,
                                py: 2,
                                background: 'linear-gradient(135deg, #f0f4ff, #e0e7ff)',
                                borderBottom: '1px solid rgba(99,102,241,0.12)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                            }}
                        >
                            <Box sx={{
                                width: 32, height: 32, borderRadius: 2,
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <CalendarMonthIcon sx={{ color: 'white', fontSize: 18 }} />
                            </Box>
                            <Box>
                                <Typography fontWeight={700} variant="subtitle2" color="primary.dark">
                                    Upcoming Holidays
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {stats.upcomingLeaves.length} scheduled
                                </Typography>
                            </Box>
                        </Box>
                        <Box p={2.5}>
                            {stats.upcomingLeaves.length > 0 ? (
                                stats.upcomingLeaves.map((leave, idx) => (
                                    <HolidayItem key={leave.id} leave={leave} idx={idx} />
                                ))
                            ) : (
                                <Box textAlign="center" py={5}>
                                    <BeachAccessIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                    <Typography color="text.secondary" variant="body2">
                                        No upcoming holidays scheduled.
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Card>
                </Grid>

                {/* Quick Actions */}
                <Grid item xs={12} md={6}>
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 3,
                            border: '1px solid rgba(0,0,0,0.06)',
                            overflow: 'hidden',
                            height: '100%',
                        }}
                    >
                        <Box
                            sx={{
                                px: 3, py: 2,
                                background: 'linear-gradient(135deg, #fdf4ff, #fae8ff)',
                                borderBottom: '1px solid rgba(139,92,246,0.12)',
                                display: 'flex', alignItems: 'center', gap: 1.5,
                            }}
                        >
                            <Box sx={{
                                width: 32, height: 32, borderRadius: 2,
                                background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <CheckCircleOutlineIcon sx={{ color: 'white', fontSize: 18 }} />
                            </Box>
                            <Box>
                                <Typography fontWeight={700} variant="subtitle2" sx={{ color: '#6b21a8' }}>
                                    Admin Overview
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Key metrics at a glance
                                </Typography>
                            </Box>
                        </Box>
                        <Box p={2.5}>
                            {[
                                { label: 'Total Employees', value: stats.totalEmployees, color: '#6366f1', icon: <PeopleIcon sx={{ fontSize: 18 }} /> },
                                { label: 'Pending Leave Requests', value: stats.pendingLeaveRequests, color: '#f59e0b', icon: <AssignmentLateIcon sx={{ fontSize: 18 }} /> },
                                { label: 'Company Holidays', value: stats.upcomingLeaves.length, color: '#14b8a6', icon: <EventIcon sx={{ fontSize: 18 }} /> },
                            ].map(({ label, value, color, icon }) => (
                                <Box
                                    key={label}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        p: 2,
                                        mb: 1.5,
                                        borderRadius: 2.5,
                                        bgcolor: `${color}0d`,
                                        border: `1px solid ${color}22`,
                                        transition: 'all 0.15s',
                                        '&:hover': { bgcolor: `${color}1a`, transform: 'translateX(3px)' },
                                    }}
                                >
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <Box sx={{
                                            width: 34, height: 34, borderRadius: 2,
                                            bgcolor: `${color}22`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: color,
                                        }}>
                                            {icon}
                                        </Box>
                                        <Typography variant="body2" fontWeight={600} color="text.primary">
                                            {label}
                                        </Typography>
                                    </Box>
                                    <Typography
                                        variant="h6"
                                        fontWeight={800}
                                        sx={{ color }}
                                    >
                                        {value}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminOverview;
