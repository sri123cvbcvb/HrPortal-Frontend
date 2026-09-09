import React, { useState, useEffect, useContext } from 'react';
import {
    Box, Typography, Button, Card, CircularProgress,
    Chip, LinearProgress
} from '@mui/material';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CelebrationIcon from '@mui/icons-material/Celebration';
import WorkIcon from '@mui/icons-material/Work';
import TodayIcon from '@mui/icons-material/Today';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { useNavigate } from 'react-router-dom';

const NOW = new Date();
const MONTH = NOW.getMonth() + 1;
const YEAR = NOW.getFullYear();

const greet = () => {
    const h = NOW.getHours();
    if (h < 12) return { text: 'Good Morning', emoji: '☀️' };
    if (h < 17) return { text: 'Good Afternoon', emoji: '🌤️' };
    return { text: 'Good Evening', emoji: '🌙' };
};

const fmtTime = (t) => t ? t.substring(0, 5) : '—';
const fmtDate = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

const calcHours = (inTime, outTime) => {
    if (!inTime) return '—';
    const [inH, inM] = inTime.split(':').map(Number);
    let outH, outM;
    if (outTime) {
        [outH, outM] = outTime.split(':').map(Number);
    } else {
        const now = new Date();
        outH = now.getHours();
        outM = now.getMinutes();
    }
    const totalMins = (outH * 60 + outM) - (inH * 60 + inM);
    if (totalMins <= 0) return '—';
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const getStatusInfo = (r) => {
    const s = (r.status || '').toUpperCase();
    if (s === 'P' || s === 'PRESENT' || (r.checkInTime && s !== 'ABSENT' && s !== 'A')) {
        return { label: 'Present', color: '#10b981', bg: '#ecfdf5', dot: '#10b981' };
    }
    if (s === 'H' || s === 'HOLIDAY') {
        return { label: 'Holiday', color: '#7c3aed', bg: '#ede9fe', dot: '#6366f1' };
    }
    if (s === 'L' || s === 'LEAVE' || s === 'SL' || s === 'CL' || s === 'PL') {
        return { label: 'Leave', color: '#f59e0b', bg: '#fffbeb', dot: '#f59e0b' };
    }
    return { label: 'Absent', color: '#ef4444', bg: '#fef2f2', dot: '#ef4444' };
};

// ── Stat Card ─────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color = '#6366f1', bg = '#eef2ff' }) => (
    <Card elevation={0} sx={{
        borderRadius: 3, p: 2.5,
        border: '1px solid', borderColor: 'divider',
        display: 'flex', alignItems: 'center', gap: 2,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }
    }}>
        <Box sx={{
            width: 52, height: 52, borderRadius: 2.5,
            bgcolor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
            <Box sx={{ color, fontSize: 26 }}>{icon}</Box>
        </Box>
        <Box>
            <Typography variant="h5" fontWeight={800} lineHeight={1}>{value}</Typography>
            <Typography variant="body2" fontWeight={600} color="text.primary" mt={0.3}>{label}</Typography>
            {sub && <Typography variant="caption" color="text.disabled">{sub}</Typography>}
        </Box>
    </Card>
);

// ── Quick Link Card ───────────────────────────────────────────
const QuickCard = ({ icon, label, desc, color, gradient, onClick }) => (
    <Box onClick={onClick} sx={{
        borderRadius: 3, p: 2.5, cursor: 'pointer',
        background: gradient,
        color: 'white',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 12px 28px ${color}50` }
    }}>
        <Box sx={{ fontSize: 28, mb: 1 }}>{icon}</Box>
        <Typography fontWeight={800} variant="subtitle1">{label}</Typography>
        <Typography variant="caption" sx={{ opacity: 0.85 }}>{desc}</Typography>
    </Box>
);

const EmployeeHome = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState([]);
    const [summary, setSummary] = useState(null);
    const [holidays, setHolidays] = useState([]);
    const [clock, setClock] = useState(new Date());

    useEffect(() => {
        fetchRecords();
        fetchSummary();
        fetchHolidays();
        const timer = setInterval(() => setClock(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchRecords = async () => {
        try { const r = await api.get('/attendance/records'); setRecords(r.data); } catch {}
    };
    const fetchSummary = async () => {
        try { const r = await api.get(`/employee/attendance/summary?year=${YEAR}&month=${MONTH}`); setSummary(r.data); } catch {}
    };
    const fetchHolidays = async () => {
        try { const r = await api.get('/employee/leaves/upcoming'); setHolidays(r.data.slice(0, 4)); } catch {}
    };

    const getLocation = () => new Promise((res, rej) =>
        navigator.geolocation ? navigator.geolocation.getCurrentPosition(res, rej)
            : rej(new Error('Geolocation not supported'))
    );

    const handleAttendance = async (action) => {
        try {
            setLoading(true);
            const pos = await getLocation();
            const res = await api.post(
                action === 'checkin' ? '/attendance/check-in' : '/attendance/check-out',
                { latitude: pos.coords.latitude, longitude: pos.coords.longitude, deviceName: navigator.userAgent }
            );
            toast.success(res.data.message);
            fetchRecords(); fetchSummary();
        } catch (err) {
            if (err instanceof GeolocationPositionError)
                toast.error('Location access denied. Please allow location access.');
            else
                toast.error(err.response?.data?.message || `Failed to ${action}`);
        } finally { setLoading(false); }
    };

    const todayStr = NOW.toISOString().split('T')[0];
    const todayRecord = records.find(r => r.date === todayStr);
    const isCheckedIn = !!todayRecord;
    const isCheckedOut = isCheckedIn && !!todayRecord.checkOutTime;
    const { text: greeting, emoji } = greet();

    const workingPct = summary ? Math.round((summary.presentDays / Math.max(summary.totalDays, 1)) * 100) : 0;
    const recentRecords = [...records].sort((a, b) => new Date(b.date + 'T00:00:00') - new Date(a.date + 'T00:00:00')).slice(0, 5);

    const statusInfo = isCheckedOut
        ? { label: 'Completed', color: '#10b981', bg: '#ecfdf5' }
        : isCheckedIn
            ? { label: 'Working', color: '#f59e0b', bg: '#fffbeb' }
            : { label: 'Not Checked In', color: '#94a3b8', bg: '#f8fafc' };

    return (
        <Box sx={{ maxWidth: 1100, mx: 'auto', pb: 6 }}>

            {/* ── Hero Banner ───────────────────────────────── */}
            <Box sx={{
                borderRadius: 4, mb: 3, p: { xs: 3, md: 4 }, overflow: 'hidden', position: 'relative',
                background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 60%, #7c3aed 100%)',
                color: 'white',
            }}>
                {/* BG circles */}
                {[[180, -30, -40, '0.07'], [80, -20, 140, '0.05'], [120, null, -20, '0.06', 0]].map(([s, t, r, o, b], i) => (
                    <Box key={i} sx={{
                        position: 'absolute', width: s, height: s, borderRadius: '50%',
                        bgcolor: `rgba(255,255,255,${o})`,
                        top: t != null ? t : undefined,
                        bottom: b != null ? b : undefined,
                        right: r,
                    }} />
                ))}

                <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2} position="relative">
                    <Box>
                        <Typography variant="body2" sx={{ opacity: 0.75, fontWeight: 500 }}>
                            {emoji} {greeting}
                        </Typography>
                        <Typography variant="h4" fontWeight={800} letterSpacing={-0.5} mt={0.5}>
                            {user?.username || 'Employee'} 👋
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.7, mt: 0.5 }}>
                            {NOW.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </Typography>
                    </Box>

                    {/* Live Clock */}
                    <Box textAlign="right">
                        <Typography variant="h3" fontWeight={900} letterSpacing={-1} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            {clock.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                        </Typography>
                        <Chip
                            label={statusInfo.label}
                            size="small"
                            sx={{ bgcolor: statusInfo.bg, color: statusInfo.color, fontWeight: 700, mt: 0.5 }}
                        />
                    </Box>
                </Box>

                {/* Check-in / out strip */}
                <Box sx={{
                    mt: 3, p: 2, borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 2
                }}>
                    <Box display="flex" gap={3} alignItems="center">
                        <Box>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>Check In</Typography>
                            <Typography fontWeight={800} variant="h6">
                                {isCheckedIn ? fmtTime(todayRecord.checkInTime) : '—'}
                            </Typography>
                        </Box>
                        <Box sx={{ width: '1px', height: 28, bgcolor: 'rgba(255,255,255,0.25)' }} />
                        <Box>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>Check Out</Typography>
                            <Typography fontWeight={800} variant="h6">
                                {isCheckedOut ? fmtTime(todayRecord.checkOutTime) : '—'}
                            </Typography>
                        </Box>
                        {isCheckedIn && (
                            <>
                                <Box sx={{ width: '1px', height: 28, bgcolor: 'rgba(255,255,255,0.25)' }} />
                                <Box>
                                    <Typography variant="caption" sx={{ opacity: 0.7 }}>Hours</Typography>
                                    <Typography fontWeight={800} variant="h6">
                                        {calcHours(todayRecord.checkInTime, todayRecord.checkOutTime)}
                                    </Typography>
                                </Box>
                            </>
                        )}
                    </Box>

                    <Box display="flex" gap={1.5}>
                        <Button
                            variant="contained"
                            disabled={loading || isCheckedIn}
                            onClick={() => handleAttendance('checkin')}
                            startIcon={loading && !isCheckedIn ? <CircularProgress size={16} color="inherit" /> : <LoginIcon />}
                            sx={{
                                bgcolor: 'white', color: '#2563eb', fontWeight: 700,
                                borderRadius: 2.5, px: 3,
                                '&:hover': { bgcolor: '#f0f4ff' },
                                '&:disabled': { bgcolor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.6)' }
                            }}
                        >
                            Check In
                        </Button>
                        <Button
                            variant="outlined"
                            disabled={loading || !isCheckedIn || isCheckedOut}
                            onClick={() => handleAttendance('checkout')}
                            startIcon={loading && isCheckedIn && !isCheckedOut ? <CircularProgress size={16} color="inherit" /> : <LogoutIcon />}
                            sx={{
                                borderColor: 'rgba(255,255,255,0.6)', color: 'white', fontWeight: 700,
                                borderRadius: 2.5, px: 3,
                                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                                '&:disabled': { borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.4)' }
                            }}
                        >
                            Check Out
                        </Button>
                    </Box>
                </Box>
            </Box>

            {/* ── Stats Row ─────────────────────────────────── */}
            <Box display="grid" gridTemplateColumns={{ xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }} gap={2} mb={3}>
                <StatCard icon={<WorkIcon />} label="Present Days" value={summary?.presentDays ?? '—'}
                    sub={`of ${summary?.totalDays ?? '—'} working days`} color="#2563eb" bg="#eff6ff" />
                <StatCard icon={<EventBusyIcon />} label="Absent Days" value={summary?.absentDays ?? '—'}
                    sub="this month" color="#ef4444" bg="#fef2f2" />
                <StatCard icon={<CalendarTodayIcon />} label="Leave Days" value={summary?.leaveDays ?? '—'}
                    sub="approved leaves" color="#f59e0b" bg="#fffbeb" />
                <StatCard icon={<TodayIcon />} label="Holidays" value={summary?.holidayDays ?? '—'}
                    sub="public holidays" color="#10b981" bg="#ecfdf5" />
            </Box>

            {/* ── Middle Row ────────────────────────────────── */}
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3} mb={3}>

                {/* Attendance Progress */}
                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography fontWeight={700} variant="subtitle1">Monthly Attendance</Typography>
                        <Chip label={`${workingPct}%`} size="small"
                            sx={{ fontWeight: 800, bgcolor: workingPct >= 80 ? '#ecfdf5' : '#fef2f2',
                                color: workingPct >= 80 ? '#10b981' : '#ef4444' }} />
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={workingPct}
                        sx={{
                            height: 10, borderRadius: 5, bgcolor: '#f1f5f9',
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 5,
                                background: workingPct >= 80
                                    ? 'linear-gradient(90deg, #10b981, #059669)'
                                    : 'linear-gradient(90deg, #f59e0b, #ef4444)'
                            }
                        }}
                    />
                    <Box display="flex" justifyContent="space-between" mt={1.5}>
                        <Typography variant="caption" color="text.disabled">0 days</Typography>
                        <Typography variant="caption" color="text.disabled">{summary?.totalDays ?? 0} working days</Typography>
                    </Box>

                    {/* Recent Records */}
                    <Typography fontWeight={700} variant="subtitle2" mt={3} mb={1.5} color="text.secondary">
                        Recent Activity
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={1}>
                        {recentRecords.length === 0 && (
                            <Typography variant="body2" color="text.disabled" textAlign="center" py={2}>No records yet</Typography>
                        )}
                        {recentRecords.map((r) => {
                            const info = getStatusInfo(r);
                            return (
                                <Box key={r.id} display="flex" alignItems="center" justifyContent="space-between"
                                    sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.50', '&:hover': { bgcolor: 'grey.100' } }}>
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <Box sx={{
                                            width: 8, height: 8, borderRadius: '50%',
                                            bgcolor: info.dot
                                        }} />
                                        <Typography variant="body2" fontWeight={600}>{fmtDate(r.date)}</Typography>
                                    </Box>
                                    <Box display="flex" gap={2} alignItems="center">
                                        <Typography variant="caption" color="text.secondary">
                                            <AccessTimeIcon sx={{ fontSize: 12, mr: 0.3, verticalAlign: 'middle' }} />
                                            {fmtTime(r.checkInTime)} → {fmtTime(r.checkOutTime)}
                                        </Typography>
                                        <Chip size="small" label={info.label} sx={{
                                            height: 20, fontSize: '0.65rem', fontWeight: 700,
                                            bgcolor: info.bg, color: info.color,
                                        }} />
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                </Card>

                {/* Upcoming Holidays */}
                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
                        <Typography fontWeight={700} variant="subtitle1">Upcoming Holidays</Typography>
                        <Button size="small" onClick={() => navigate('/employee/holidays')}
                            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
                            View all →
                        </Button>
                    </Box>
                    {holidays.length === 0 ? (
                        <Box textAlign="center" py={4}>
                            <CelebrationIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                            <Typography color="text.disabled" variant="body2">No upcoming holidays</Typography>
                        </Box>
                    ) : (
                        <Box display="flex" flexDirection="column" gap={1.5}>
                            {holidays.map((h, i) => {
                                const d = new Date(h.date + 'T00:00:00');
                                const colors = [
                                    ['#eff6ff', '#2563eb'], ['#fdf4ff', '#9333ea'],
                                    ['#fff7ed', '#ea580c'], ['#f0fdf4', '#16a34a']
                                ];
                                const [bg, color] = colors[i % 4];
                                return (
                                    <Box key={h.id} display="flex" alignItems="center" gap={2}
                                        sx={{ p: 1.5, borderRadius: 2.5, bgcolor: bg, border: `1px solid ${color}20` }}>
                                        <Box sx={{
                                            minWidth: 48, height: 52, borderRadius: 2,
                                            bgcolor: color, color: 'white',
                                            display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.6rem', lineHeight: 1 }}>
                                                {d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}
                                            </Typography>
                                            <Typography variant="h6" fontWeight={900} lineHeight={1}>
                                                {d.getDate()}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" fontWeight={700}>{h.description}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {d.toLocaleDateString('en-IN', { weekday: 'long' })}
                                            </Typography>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </Card>
            </Box>

            {/* ── Quick Links ───────────────────────────────── */}
            <Typography fontWeight={700} variant="subtitle1" mb={2} color="text.secondary">
                Quick Actions
            </Typography>
            <Box display="grid" gridTemplateColumns={{ xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' }} gap={2}>
                <QuickCard icon="📋" label="My Attendance" desc="View full history"
                    color="#2563eb" gradient="linear-gradient(135deg,#1d4ed8,#3b82f6)"
                    onClick={() => navigate('/employee/attendance')} />
                <QuickCard icon="🌴" label="Apply Leave" desc="Request time off"
                    color="#7c3aed" gradient="linear-gradient(135deg,#6d28d9,#8b5cf6)"
                    onClick={() => navigate('/employee/leaves')} />
                <QuickCard icon="🎉" label="Holidays" desc="Company calendar"
                    color="#d97706" gradient="linear-gradient(135deg,#b45309,#f59e0b)"
                    onClick={() => navigate('/employee/holidays')} />
                <QuickCard icon="💰" label="Payslips" desc="Download salary slip"
                    color="#059669" gradient="linear-gradient(135deg,#047857,#10b981)"
                    onClick={() => navigate('/employee/payslips')} />
            </Box>
        </Box>
    );
};

export default EmployeeHome;
