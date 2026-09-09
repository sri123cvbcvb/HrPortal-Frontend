import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Card, CircularProgress, Tooltip,
    IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, Link, Button, LinearProgress
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TvIcon from '@mui/icons-material/Tv';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ComputerIcon from '@mui/icons-material/Computer';
import WorkIcon from '@mui/icons-material/Work';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PercentIcon from '@mui/icons-material/Percent';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { format, startOfMonth, parse } from 'date-fns';

// ── Status Config ─────────────────────────────────────────────
const STATUS_CONFIG = {
    P:  { label: 'Present',         bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
    A:  { label: 'Absent',          bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    SL: { label: 'Sick Leave',      bg: '#faf5ff', color: '#7c3aed', border: '#ddd6fe' },
    CL: { label: 'Casual Leave',    bg: '#faf5ff', color: '#7c3aed', border: '#ddd6fe' },
    PL: { label: 'Privilege Leave', bg: '#faf5ff', color: '#7c3aed', border: '#ddd6fe' },
    L:  { label: 'Leave',           bg: '#faf5ff', color: '#7c3aed', border: '#ddd6fe' },
    H:  { label: 'Holiday',         bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
    O:  { label: 'Weekly Off',      bg: '#f8fafc', color: '#94a3b8', border: '#e2e8f0' },
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const LEGEND = [
    { code: 'P', ...STATUS_CONFIG['P'] },
    { code: 'A', ...STATUS_CONFIG['A'] },
    { code: 'L', ...STATUS_CONFIG['SL'], label: 'Leave' },
    { code: 'H', ...STATUS_CONFIG['H'] },
    { code: 'O', ...STATUS_CONFIG['O'] },
];

// ── Stat Card ─────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color, bg }) => (
    <Box sx={{
        p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex', alignItems: 'center', gap: 2,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }
    }}>
        <Box sx={{
            width: 48, height: 48, borderRadius: 2.5, bgcolor: bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
            <Box sx={{ color, fontSize: 24 }}>{icon}</Box>
        </Box>
        <Box>
            <Typography variant="h5" fontWeight={800} lineHeight={1}>{value}</Typography>
            <Typography variant="body2" fontWeight={600} color="text.primary" mt={0.3}>{label}</Typography>
            {sub && <Typography variant="caption" color="text.disabled">{sub}</Typography>}
        </Box>
    </Box>
);

// ── Calendar Cell ─────────────────────────────────────────────
const CalendarCell = ({ dayData, isToday }) => {
    if (!dayData) {
        return <Box sx={{ minHeight: 80, borderRadius: 2, bgcolor: '#fafafa' }} />;
    }

    const { date, status, shift, signInTime, signOutTime } = dayData;
    const cfg = status ? STATUS_CONFIG[status] : null;
    const dayNum = new Date(date + 'T00:00:00').getDate();

    const tooltipContent = (
        <Box sx={{ p: 0.5 }}>
            <Typography variant="caption" display="block" fontWeight="bold">
                {format(new Date(date + 'T00:00:00'), 'dd MMM yyyy')}
            </Typography>
            <Typography variant="caption" display="block">Status: {cfg ? cfg.label : '—'}</Typography>
            {shift && <Typography variant="caption" display="block">Shift: {shift}</Typography>}
            {signInTime && <Typography variant="caption" display="block">In: {signInTime}</Typography>}
            {signOutTime && <Typography variant="caption" display="block">Out: {signOutTime}</Typography>}
        </Box>
    );

    return (
        <Tooltip title={tooltipContent} arrow placement="top">
            <Box sx={{
                minHeight: 80,
                position: 'relative',
                border: isToday ? '2px solid' : '1px solid',
                borderColor: isToday ? 'primary.main' : cfg ? cfg.border : '#f0f0f0',
                bgcolor: cfg ? cfg.bg : 'background.paper',
                borderRadius: 2.5,
                p: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                cursor: 'default',
                transition: 'all 0.15s ease',
                '&:hover': { transform: 'scale(1.04)', boxShadow: '0 4px 14px rgba(0,0,0,0.1)', zIndex: 1 }
            }}>
                {/* Day number */}
                <Box sx={{
                    width: 26, height: 26, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: isToday ? 'primary.main' : 'transparent',
                    color: isToday ? 'white' : 'text.primary',
                }}>
                    <Typography variant="caption" fontWeight={isToday ? 800 : 500} fontSize="0.8rem">
                        {String(dayNum).padStart(2, '0')}
                    </Typography>
                </Box>

                {/* Status icon/code */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                    {status === 'O' ? (
                        <TvIcon sx={{ fontSize: 18, color: cfg?.color }} />
                    ) : status ? (
                        <Typography variant="body2" fontWeight={700} sx={{ color: cfg?.color, fontSize: '0.85rem' }}>
                            {status}
                        </Typography>
                    ) : null}
                </Box>

                {/* Shift badge */}
                {status && status !== 'O' && status !== 'H' && shift && (
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled', alignSelf: 'flex-end' }}>
                        {shift}
                    </Typography>
                )}

                {/* Late marker */}
                {status === 'P' && signInTime && (() => {
                    try { return parse(signInTime, 'hh:mm a', new Date()).getHours() >= 10; } catch { return false; }
                })() && (
                    <Box sx={{
                        position: 'absolute', top: 6, right: 6,
                        width: 8, height: 8, borderRadius: '50%',
                        bgcolor: '#f97316',
                    }} />
                )}
            </Box>
        </Tooltip>
    );
};

// ── Main Component ────────────────────────────────────────────
const EmployeeAttendance = () => {
    const today = new Date();
    const [viewDate, setViewDate] = useState({ month: today.getMonth() + 1, year: today.getFullYear() });
    const [calendarData, setCalendarData] = useState([]);
    const [detailRecords, setDetailRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);

    const fetchCalendar = useCallback(async () => {
        setLoading(true);
        try {
            const [calRes, sumRes, detailRes] = await Promise.all([
                api.get(`/attendance/monthly?month=${viewDate.month}&year=${viewDate.year}`),
                api.get(`/employee/attendance/summary?year=${viewDate.year}&month=${viewDate.month}`),
                api.get(`/attendance/detail?month=${viewDate.month}&year=${viewDate.year}`)
            ]);
            setCalendarData(calRes.data);
            setSummary(sumRes.data);
            setDetailRecords(detailRes.data);
        } catch { toast.error('Failed to load attendance data'); }
        finally { setLoading(false); }
    }, [viewDate]);

    useEffect(() => { fetchCalendar(); }, [fetchCalendar]);

    const goToPrev = () => setViewDate(v => { const d = new Date(v.year, v.month - 2, 1); return { month: d.getMonth() + 1, year: d.getFullYear() }; });
    const goToNext = () => setViewDate(v => { const d = new Date(v.year, v.month, 1); return { month: d.getMonth() + 1, year: d.getFullYear() }; });

    const buildGrid = () => {
        if (calendarData.length === 0) return [];
        const firstDate = new Date(calendarData[0].date + 'T00:00:00');
        const startDow = startOfMonth(firstDate).getDay();
        const cells = Array(startDow).fill(null);
        calendarData.forEach(d => cells.push(d));
        while (cells.length % 7 !== 0) cells.push(null);
        return cells;
    };

    const grid = buildGrid();
    const todayStr = format(today, 'yyyy-MM-dd');
    const monthLabel = new Date(viewDate.year, viewDate.month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    const pct = summary ? Math.round((summary.presentDays / Math.max(summary.totalDays, 1)) * 100) : 0;

    return (
        <Box sx={{ maxWidth: 1100, mx: 'auto', pb: 6 }}>

            {/* ── Hero Banner ───────────────────────────────── */}
            <Box sx={{
                borderRadius: 4, mb: 3, p: { xs: 3, md: 4 },
                background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 60%, #6366f1 100%)',
                color: 'white', position: 'relative', overflow: 'hidden',
            }}>
                {[180, 80, 120].map((s, i) => (
                    <Box key={i} sx={{
                        position: 'absolute', width: s, height: s, borderRadius: '50%',
                        bgcolor: `rgba(255,255,255,${0.04 + i * 0.015})`,
                        top: i === 0 ? -30 : i === 2 ? undefined : -20,
                        bottom: i === 2 ? -20 : undefined,
                        right: i === 0 ? -40 : i === 1 ? 140 : -20,
                    }} />
                ))}

                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} position="relative">
                    <Box>
                        <Typography variant="body2" sx={{ opacity: 0.7, fontWeight: 500 }}>📋 Attendance Tracker</Typography>
                        <Typography variant="h4" fontWeight={800} letterSpacing={-0.5} mt={0.5}>
                            {monthLabel}
                        </Typography>
                    </Box>
                    <Box display="flex" gap={2}>
                        {summary && [
                            { v: summary.presentDays, l: 'Present' },
                            { v: summary.absentDays, l: 'Absent' },
                            { v: `${pct}%`, l: 'Attendance' },
                        ].map(({ v, l }) => (
                            <Box key={l} textAlign="center" sx={{ bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2, px: 2.5, py: 1.5 }}>
                                <Typography fontWeight={800} variant="h5">{v}</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>{l}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>

            {/* ── Stat Cards ────────────────────────────────── */}
            {summary && (
                <Box display="grid" gridTemplateColumns={{ xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }} gap={2} mb={3}>
                    <StatCard icon={<WorkIcon />} label="Working Days" value={summary.totalDays} color="#2563eb" bg="#eff6ff" />
                    <StatCard icon={<CheckCircleIcon />} label="Present" value={summary.presentDays} sub={`${pct}% rate`} color="#059669" bg="#ecfdf5" />
                    <StatCard icon={<EventBusyIcon />} label="Absent" value={summary.absentDays} color="#dc2626" bg="#fef2f2" />
                    <StatCard icon={<PercentIcon />} label="Attendance %" value={`${summary.attendancePercentage?.toFixed(1)}%`} color="#7c3aed" bg="#faf5ff" />
                </Box>
            )}

            {/* ── Attendance Progress ───────────────────────── */}
            {summary && (
                <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2.5, mb: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography fontWeight={700} variant="subtitle2" color="text.secondary">Monthly Progress</Typography>
                        <Chip label={`${pct}%`} size="small" sx={{ fontWeight: 800, bgcolor: pct >= 80 ? '#ecfdf5' : '#fef2f2', color: pct >= 80 ? '#059669' : '#dc2626' }} />
                    </Box>
                    <LinearProgress variant="determinate" value={pct} sx={{
                        height: 8, borderRadius: 4, bgcolor: '#f1f5f9',
                        '& .MuiLinearProgress-bar': { borderRadius: 4, background: pct >= 80 ? 'linear-gradient(90deg,#059669,#10b981)' : 'linear-gradient(90deg,#f59e0b,#ef4444)' }
                    }} />
                </Box>
            )}

            {/* ── Calendar ──────────────────────────────────── */}
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 3 }}>
                {/* Nav header */}
                <Box display="flex" alignItems="center" justifyContent="space-between" px={3} py={2.5}
                    sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <CalendarMonthIcon color="primary" />
                        <Typography variant="h6" fontWeight={700}>{monthLabel}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                        <IconButton size="small" onClick={goToPrev} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <ChevronLeftIcon fontSize="small" />
                        </IconButton>
                        <Button size="small" variant="outlined" onClick={() => setViewDate({ month: today.getMonth() + 1, year: today.getFullYear() })}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 2 }}>Today</Button>
                        <IconButton size="small" onClick={goToNext} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <ChevronRightIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>

                {loading ? (
                    <Box display="flex" justifyContent="center" p={8}><CircularProgress /></Box>
                ) : (
                    <Box p={{ xs: 1.5, md: 3 }}>
                        {/* Day headers */}
                        <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={0.8} mb={1}>
                            {DAYS_OF_WEEK.map((d, i) => (
                                <Box key={d} textAlign="center" py={0.5}>
                                    <Typography variant="caption" fontWeight={700} sx={{ color: i === 0 ? '#dc2626' : 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        {d}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>

                        {/* Grid */}
                        <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={0.8}>
                            {grid.map((dayData, idx) => (
                                <CalendarCell key={idx} dayData={dayData} isToday={dayData?.date === todayStr} />
                            ))}
                        </Box>
                    </Box>
                )}

                {/* Legend */}
                <Box display="flex" flexWrap="wrap" gap={2.5} px={3} py={2} borderTop="1px solid" sx={{ borderColor: 'divider', bgcolor: '#fafafa' }}>
                    {LEGEND.map(item => (
                        <Box key={item.code} display="flex" alignItems="center" gap={0.8}>
                            <Box sx={{ width: 12, height: 12, bgcolor: item.bg, border: `2px solid ${item.color}`, borderRadius: 1 }} />
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                <strong>{item.code}</strong> {item.label}
                            </Typography>
                        </Box>
                    ))}
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f97316', alignSelf: 'center', ml: 1 }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>Late arrival</Typography>
                </Box>
            </Card>

            {/* ── Detail Table ──────────────────────────────── */}
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <Box px={3} py={2.5} borderBottom="1px solid" sx={{ borderColor: 'divider' }}
                    display="flex" alignItems="center" gap={1.5}>
                    <ComputerIcon color="primary" fontSize="small" />
                    <Typography variant="h6" fontWeight={700}>Check-In Details</Typography>
                    <Chip label={monthLabel} size="small" sx={{ ml: 'auto', fontWeight: 600 }} />
                </Box>

                {loading ? (
                    <Box display="flex" justifyContent="center" p={6}><CircularProgress size={28} /></Box>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#fafafa' }}>
                                    {['Date', 'Check In', 'Check Out', 'Hours', 'Status', 'Device', 'Location'].map(h => (
                                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.78rem', py: 1.5, whiteSpace: 'nowrap', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {detailRecords.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.disabled' }}>No records for this month.</TableCell></TableRow>
                                ) : detailRecords.map(rec => {
                                    let workingHours = '—';
                                    if (rec.checkInTime && rec.checkOutTime) {
                                        const [inH, inM] = rec.checkInTime.split(':').map(Number);
                                        const [outH, outM] = rec.checkOutTime.split(':').map(Number);
                                        const totalMins = (outH * 60 + outM) - (inH * 60 + inM);
                                        if (totalMins > 0) { const h = Math.floor(totalMins / 60); const m = totalMins % 60; workingHours = `${h}h ${m}m`; }
                                    }
                                    const mapsUrl = (rec.latitude && rec.longitude) ? `https://www.google.com/maps?q=${rec.latitude},${rec.longitude}` : null;

                                    return (
                                        <TableRow key={rec.id} hover sx={{ '&:last-child td': { borderBottom: 0 }, transition: 'background 0.1s' }}>
                                            <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                                                {format(new Date(rec.date + 'T00:00:00'), 'dd MMM, EEE')}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600} color="success.main">
                                                    {rec.checkInTime ? rec.checkInTime.substring(0, 5) : '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600} color="error.main">
                                                    {rec.checkOutTime ? rec.checkOutTime.substring(0, 5) : '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={workingHours} size="small" sx={{
                                                    height: 22, fontWeight: 700, fontSize: '0.7rem',
                                                    bgcolor: workingHours !== '—' ? '#eff6ff' : '#f8fafc',
                                                    color: workingHours !== '—' ? '#2563eb' : '#94a3b8',
                                                }} />
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={rec.status} size="small" sx={{
                                                    height: 22, fontWeight: 700, fontSize: '0.7rem',
                                                    bgcolor: rec.status === 'Present' ? '#ecfdf5' : '#fef2f2',
                                                    color: rec.status === 'Present' ? '#059669' : '#dc2626',
                                                }} />
                                            </TableCell>
                                            <TableCell>
                                                {rec.deviceName ? (
                                                    <Tooltip title={rec.deviceName}>
                                                        <Box display="flex" alignItems="center" gap={0.5}>
                                                            <ComputerIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                                            <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                                                {rec.deviceName.includes('Chrome') ? 'Chrome' : rec.deviceName.includes('Firefox') ? 'Firefox' : 'Browser'}
                                                            </Typography>
                                                        </Box>
                                                    </Tooltip>
                                                ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                                            </TableCell>
                                            <TableCell>
                                                {mapsUrl ? (
                                                    <Link href={mapsUrl} target="_blank" rel="noopener" underline="hover" display="flex" alignItems="center" gap={0.4}
                                                        sx={{ color: 'primary.main', '&:hover': { color: 'primary.dark' } }}>
                                                        <LocationOnIcon sx={{ fontSize: 14 }} />
                                                        <Typography variant="caption">Map</Typography>
                                                    </Link>
                                                ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Card>
        </Box>
    );
};

export default EmployeeAttendance;
