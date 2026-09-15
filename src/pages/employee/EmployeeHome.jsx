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

const calcDiffMins = (start, end) => {
    if (!start) return 0;
    const [sH, sM] = start.split(':').map(Number);
    let eH, eM;
    if (end) {
        [eH, eM] = end.split(':').map(Number);
    } else {
        const now = new Date();
        eH = now.getHours();
        eM = now.getMinutes();
    }
    const diff = (eH * 60 + eM) - (sH * 60 + sM);
    return diff > 0 ? diff : 0;
};

const calcHours = (inTime, outTime, firstOutTime, secondInTime) => {
    if (!inTime) return '—';
    const parseMins = (t) => {
        if (!t) return null;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    let totalMins = 0;

    if (firstOutTime && secondInTime) {
        // Multi-session (1st half worked + 2nd half worked)
        const s1In = parseMins(inTime);
        const s1Out = parseMins(firstOutTime);
        if (s1In !== null && s1Out !== null && s1Out > s1In) {
            totalMins += (s1Out - s1In);
        }
        const s2In = parseMins(secondInTime);
        const s2Out = outTime ? parseMins(outTime) : currentMins;
        if (s2In !== null && s2Out !== null && s2Out > s2In) {
            totalMins += (s2Out - s2In);
        }
    } else {
        const startMins = parseMins(inTime);
        const endMins = outTime ? parseMins(outTime) : currentMins;
        if (startMins !== null && endMins !== null && endMins > startMins) {
            totalMins = endMins - startMins;
        }
    }

    if (totalMins <= 0) return '—';
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const getStatusInfo = (r) => {
    const s = (r.status || '').toUpperCase();
    if (s.includes('HALF') || s === 'HP' || s === 'HD') {
        let label = 'Half Day Present';
        if (r.leaveNote) {
            if (r.leaveNote.includes('SESSION_1')) label = 'Half Day (1st Half Leave)';
            else if (r.leaveNote.includes('SESSION_2')) label = 'Half Day (2nd Half Leave)';
        }
        return { label, color: '#10b981', bg: '#ecfdf5', dot: '#10b981' };
    }
    if (s === 'P' || s === 'PRESENT' || (r.checkInTime && s !== 'ABSENT' && s !== 'A')) {
        return { label: 'Present', color: '#10b981', bg: '#ecfdf5', dot: '#10b981' };
    }
    if (s === 'H' || s === 'HOLIDAY') {
        return { label: 'Holiday', color: '#7c3aed', bg: '#ede9fe', dot: '#6366f1' };
    }
    if (s === 'L' || s === 'LEAVE' || s === 'SL' || s === 'CL' || s === 'PL') {
        const leaveMap = { SL: 'Sick Leave', CL: 'Casual Leave', PL: 'Privilege Leave' };
        return { label: leaveMap[s] || 'Leave', color: '#f59e0b', bg: '#fffbeb', dot: '#f59e0b' };
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
    const [todayStatus, setTodayStatus] = useState(null);

    useEffect(() => {
        fetchRecords();
        fetchSummary();
        fetchHolidays();
        fetchTodayStatus();
        const timer = setInterval(() => setClock(new Date()), 1000);
        const statusPoll = setInterval(fetchTodayStatus, 15000);
        return () => {
            clearInterval(timer);
            clearInterval(statusPoll);
        };
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
    const fetchTodayStatus = async () => {
        try { const r = await api.get('/attendance/today-status'); setTodayStatus(r.data); } catch {}
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
            fetchRecords();
            fetchSummary();
            fetchTodayStatus();
        } catch (err) {
            if (err instanceof GeolocationPositionError)
                toast.error('Location access denied. Please allow location access.');
            else
                toast.error(err.response?.data?.message || `Failed to ${action}`);
        } finally { setLoading(false); }
    };

    const todayStr = NOW.toISOString().split('T')[0];
    const rawTodayRecord = records.find(r => r.date === todayStr);
    const leaveSession = todayStatus?.leaveSession || null;

    const resolveMultiSession = (r, isToday = false) => {
        if (!r) return null;
        const isSession1 = r.leaveNote?.includes('SESSION_1') || (isToday && leaveSession === 'SESSION_1');
        const hasCrossShiftTimes = r.checkInTime && r.checkInTime < '13:00' && r.checkOutTime && r.checkOutTime > '13:00';
        const firstOut = r.firstCheckOutTime || (isSession1 && hasCrossShiftTimes ? '13:00:00' : null);
        const secondIn = r.secondCheckInTime || (isSession1 && hasCrossShiftTimes ? '13:00:00' : null);
        return { ...r, firstCheckOutTime: firstOut, secondCheckInTime: secondIn };
    };

    const todayRecord = resolveMultiSession(rawTodayRecord, true);
    const isCheckedIn = !!todayRecord;
    const isCheckedOut = isCheckedIn && !!todayRecord.checkOutTime;
    const { text: greeting, emoji } = greet();

    // Use backend today-status for gating buttons (authoritative source for leave logic)
    const canCheckIn = todayStatus ? todayStatus.canCheckIn : !isCheckedIn;
    const canCheckOut = todayStatus ? todayStatus.canCheckOut : (isCheckedIn && !isCheckedOut);
    const checkInBlockReason = todayStatus?.reason || null;
    const nextAvailableAt = todayStatus?.nextAvailableAt || null;

    const workingPct = summary ? Math.round((summary.presentDays / Math.max(summary.totalDays, 1)) * 100) : 0;
    const recentRecords = [...records]
        .map(r => resolveMultiSession(r, r.date === todayStr))
        .sort((a, b) => new Date(b.date + 'T00:00:00') - new Date(a.date + 'T00:00:00'))
        .slice(0, 5);

    const statusInfo = isCheckedOut
        ? (leaveSession === 'SESSION_1' || todayRecord?.leaveNote?.includes('SESSION_1')
            ? (canCheckIn
                ? { label: '1st Half Leave (2nd Half Ready)', color: '#2563eb', bg: '#eff6ff' }
                : { label: 'Half Day (1st Half Leave)', color: '#7c3aed', bg: '#f5f3ff' })
            : leaveSession === 'SESSION_2' || todayRecord?.leaveNote?.includes('SESSION_2')
                ? { label: 'Half Day (2nd Half Leave)', color: '#7c3aed', bg: '#f5f3ff' }
                : { label: 'Completed', color: '#10b981', bg: '#ecfdf5' })
        : isCheckedIn
            ? { label: 'Working', color: '#f59e0b', bg: '#fffbeb' }
            : leaveSession === 'FULL_DAY'
                ? { label: 'On Leave', color: '#7c3aed', bg: '#f5f3ff' }
                : leaveSession === 'SESSION_1'
                    ? { label: 'First Half Leave', color: '#6366f1', bg: '#eef2ff' }
                    : leaveSession === 'SESSION_2'
                        ? { label: 'Second Half Leave', color: '#6366f1', bg: '#eef2ff' }
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
                    display: 'flex', flexDirection: 'column', gap: 1.5
                }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                        <Box display="flex" gap={3} alignItems="center">
                            <Box>
                                <Typography variant="caption" sx={{ opacity: 0.7 }}>Check In</Typography>
                                <Typography fontWeight={800} variant="h6">
                                    {isCheckedIn ? fmtTime(todayRecord.checkInTime) : '—'}
                                </Typography>
                                {todayRecord?.secondCheckInTime && (
                                    <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.68rem', display: 'block', color: '#93c5fd', fontWeight: 600 }}>
                                        S2: {fmtTime(todayRecord.secondCheckInTime)}
                                    </Typography>
                                )}
                            </Box>
                            <Box sx={{ width: '1px', height: 36, bgcolor: 'rgba(255,255,255,0.25)' }} />
                            <Box>
                                <Typography variant="caption" sx={{ opacity: 0.7 }}>Check Out</Typography>
                                <Typography fontWeight={800} variant="h6">
                                    {isCheckedOut ? fmtTime(todayRecord.checkOutTime) : (todayRecord?.firstCheckOutTime ? fmtTime(todayRecord.firstCheckOutTime) : '—')}
                                </Typography>
                                {todayRecord?.firstCheckOutTime && todayRecord?.secondCheckInTime && (
                                    <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.68rem', display: 'block', color: '#fca5a5', fontWeight: 600 }}>
                                        S1: {fmtTime(todayRecord.firstCheckOutTime)}
                                    </Typography>
                                )}
                            </Box>
                            {isCheckedIn && (
                                <>
                                    <Box sx={{ width: '1px', height: 36, bgcolor: 'rgba(255,255,255,0.25)' }} />
                                    <Box>
                                        <Typography variant="caption" sx={{ opacity: 0.7 }}>Hours</Typography>
                                        <Typography fontWeight={800} variant="h6">
                                            {calcHours(
                                                todayRecord.checkInTime,
                                                todayRecord.checkOutTime,
                                                todayRecord.firstCheckOutTime,
                                                todayRecord.secondCheckInTime
                                            )}
                                        </Typography>
                                        {todayRecord?.firstCheckOutTime && todayRecord?.secondCheckInTime && (
                                            <Typography variant="caption" sx={{ opacity: 0.95, fontSize: '0.68rem', display: 'block', color: '#86efac', fontWeight: 600 }}>
                                                {calcDiffMins(todayRecord.checkInTime, todayRecord.firstCheckOutTime)}m + {calcDiffMins(todayRecord.secondCheckInTime, todayRecord.checkOutTime)}m
                                            </Typography>
                                        )}
                                    </Box>
                                </>
                            )}
                        </Box>

                        <Box display="flex" gap={1.5}>
                            <Box display="flex" flexDirection="column" gap={0.5}>
                                <Box display="flex" gap={1.5}>
                                    <Button
                                        variant="contained"
                                        disabled={loading || !canCheckIn}
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
                                        disabled={loading || !canCheckOut}
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
                                {/* Leave gating hint messages */}
                                {!canCheckIn && checkInBlockReason && (!isCheckedIn || isCheckedOut) && (
                                    <Typography variant="caption" sx={{ opacity: 0.85, color: '#fde68a', fontWeight: 500 }}>
                                        {nextAvailableAt
                                            ? `⏰ Check-in available from ${nextAvailableAt}`
                                            : `ℹ️ ${checkInBlockReason}`}
                                    </Typography>
                                )}
                                {canCheckIn && isCheckedOut && leaveSession === 'SESSION_1' && (
                                    <Typography variant="caption" sx={{ opacity: 0.95, color: '#86efac', fontWeight: 600 }}>
                                        🟢 2nd half shift is active. Click Check In to record attendance.
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </Box>

                    {/* Multi-session pill banner */}
                    {todayRecord?.firstCheckOutTime && todayRecord?.secondCheckInTime && (
                        <Box sx={{
                            pt: 1.2,
                            borderTop: '1px solid rgba(255,255,255,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            flexWrap: 'wrap'
                        }}>
                            <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>
                                Shift Sessions:
                            </Typography>
                            <Box sx={{
                                px: 1.2, py: 0.4, borderRadius: 1.5,
                                bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)',
                                display: 'flex', alignItems: 'center', gap: 0.8
                            }}>
                                <Typography variant="caption" sx={{ color: '#bfdbfe', fontWeight: 700, fontSize: '0.72rem' }}>
                                    1st Session:
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'white', fontWeight: 600, fontSize: '0.72rem' }}>
                                    {fmtTime(todayRecord.checkInTime)} – {fmtTime(todayRecord.firstCheckOutTime)} ({calcDiffMins(todayRecord.checkInTime, todayRecord.firstCheckOutTime)}m)
                                </Typography>
                            </Box>
                            <Box sx={{
                                px: 1.2, py: 0.4, borderRadius: 1.5,
                                bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)',
                                display: 'flex', alignItems: 'center', gap: 0.8
                            }}>
                                <Typography variant="caption" sx={{ color: '#86efac', fontWeight: 700, fontSize: '0.72rem' }}>
                                    2nd Session:
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'white', fontWeight: 600, fontSize: '0.72rem' }}>
                                    {fmtTime(todayRecord.secondCheckInTime)} – {todayRecord.checkOutTime ? fmtTime(todayRecord.checkOutTime) : 'Active'} ({calcDiffMins(todayRecord.secondCheckInTime, todayRecord.checkOutTime)}m)
                                </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ opacity: 0.85, color: '#fef08a', fontWeight: 700, fontSize: '0.72rem', ml: { xs: 0, sm: 'auto' } }}>
                                Total Working: {calcDiffMins(todayRecord.checkInTime, todayRecord.firstCheckOutTime) + calcDiffMins(todayRecord.secondCheckInTime, todayRecord.checkOutTime)} mins
                            </Typography>
                        </Box>
                    )}
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
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            {summary?.presentDays ?? 0} days
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            {summary?.totalDays ?? 0} working days
                        </Typography>
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
                                            {r.firstCheckOutTime && r.secondCheckInTime ? (
                                                <span>
                                                    {fmtTime(r.checkInTime)}–{fmtTime(r.firstCheckOutTime)} &amp; {fmtTime(r.secondCheckInTime)}–{fmtTime(r.checkOutTime || '—')}
                                                </span>
                                            ) : (
                                                <span>{fmtTime(r.checkInTime)} → {fmtTime(r.checkOutTime)}</span>
                                            )}
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
