import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Card, CircularProgress, Chip
} from '@mui/material';
import { format, parseISO, isToday, isPast } from 'date-fns';
import api from '../../utils/api';
import CelebrationIcon from '@mui/icons-material/Celebration';
import EventBusyIcon from '@mui/icons-material/EventBusy';

const COLORS = [
    { bg: '#eff6ff', color: '#2563eb', badge: '#2563eb' },
    { bg: '#fdf4ff', color: '#9333ea', badge: '#9333ea' },
    { bg: '#fff7ed', color: '#ea580c', badge: '#ea580c' },
    { bg: '#f0fdf4', color: '#16a34a', badge: '#16a34a' },
    { bg: '#fef2f2', color: '#dc2626', badge: '#dc2626' },
    { bg: '#fefce8', color: '#ca8a04', badge: '#ca8a04' },
    { bg: '#f0fdfa', color: '#0d9488', badge: '#0d9488' },
    { bg: '#faf5ff', color: '#7c3aed', badge: '#7c3aed' },
];

const EmployeeHolidays = () => {
    const [loading, setLoading] = useState(true);
    const [holidays, setHolidays] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/employee/leaves/upcoming');
                setHolidays(res.data);
            } catch { }
            finally { setLoading(false); }
        })();
    }, []);

    const upcoming = holidays.filter(h => !isPast(parseISO(h.date)) || isToday(parseISO(h.date)));
    const past = holidays.filter(h => isPast(parseISO(h.date)) && !isToday(parseISO(h.date)));

    // Group by month
    const groupByMonth = (list) => {
        const map = {};
        list.forEach(h => {
            const key = format(parseISO(h.date), 'MMMM yyyy');
            if (!map[key]) map[key] = [];
            map[key].push(h);
        });
        return Object.entries(map);
    };

    const upcomingGrouped = groupByMonth(upcoming);

    return (
        <Box sx={{ maxWidth: 900, mx: 'auto', pb: 6 }}>

            {/* ── Hero Banner ───────────────────────────────── */}
            <Box sx={{
                borderRadius: 4, mb: 3, p: { xs: 3, md: 4 },
                background: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 50%, #fbbf24 100%)',
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
                        <Typography variant="body2" sx={{ opacity: 0.7, fontWeight: 500 }}>🎉 Holiday Calendar</Typography>
                        <Typography variant="h4" fontWeight={800} letterSpacing={-0.5} mt={0.5}>
                            Company Holidays
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                            View all official company holidays and plan your time off.
                        </Typography>
                    </Box>
                    <Box display="flex" gap={2}>
                        <Box textAlign="center" sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, px: 3, py: 1.5 }}>
                            <Typography fontWeight={800} variant="h5">{upcoming.length}</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.85 }}>Upcoming</Typography>
                        </Box>
                        <Box textAlign="center" sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, px: 3, py: 1.5 }}>
                            <Typography fontWeight={800} variant="h5">{holidays.length}</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.85 }}>Total</Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" p={8}><CircularProgress /></Box>
            ) : holidays.length === 0 ? (
                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center', py: 8 }}>
                    <EventBusyIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.disabled">No upcoming holidays scheduled.</Typography>
                </Card>
            ) : (
                <>
                    {/* ── Upcoming by month ────────────────────── */}
                    {upcomingGrouped.map(([month, list]) => (
                        <Box key={month} mb={3}>
                            <Typography fontWeight={700} variant="subtitle1" color="text.secondary" mb={1.5}
                                sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.8rem' }}>
                                📅 {month}
                            </Typography>
                            <Box display="flex" flexDirection="column" gap={1.5}>
                                {list.map((h, i) => {
                                    const date = parseISO(h.date);
                                    const c = COLORS[i % COLORS.length];
                                    const isTodayFlag = isToday(date);

                                    return (
                                        <Card key={h.id} elevation={0} sx={{
                                            borderRadius: 3, border: '1px solid',
                                            borderColor: isTodayFlag ? c.badge : 'divider',
                                            bgcolor: 'background.paper',
                                            display: 'flex', alignItems: 'center', gap: 2.5,
                                            p: 2,
                                            transition: 'all 0.2s',
                                            '&:hover': { transform: 'translateX(6px)', boxShadow: `0 4px 20px ${c.badge}20` },
                                        }}>
                                            {/* Date badge */}
                                            <Box sx={{
                                                minWidth: 64, height: 72, borderRadius: 3,
                                                background: `linear-gradient(135deg, ${c.badge}, ${c.badge}cc)`,
                                                display: 'flex', flexDirection: 'column',
                                                alignItems: 'center', justifyContent: 'center',
                                                color: 'white', flexShrink: 0,
                                            }}>
                                                <Typography variant="caption" fontWeight={700} sx={{ lineHeight: 1, fontSize: '0.7rem', opacity: 0.9 }}>
                                                    {format(date, 'MMM').toUpperCase()}
                                                </Typography>
                                                <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1 }}>
                                                    {format(date, 'd')}
                                                </Typography>
                                                <Typography variant="caption" sx={{ lineHeight: 1, fontSize: '0.6rem', opacity: 0.8, mt: 0.2 }}>
                                                    {format(date, 'yyyy')}
                                                </Typography>
                                            </Box>

                                            {/* Info */}
                                            <Box flex={1}>
                                                <Box display="flex" alignItems="center" gap={1} mb={0.3}>
                                                    <Typography variant="h6" fontWeight={700}>{h.description}</Typography>
                                                    {isTodayFlag && (
                                                        <Chip label="Today!" size="small" color="primary"
                                                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }} />
                                                    )}
                                                </Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    {format(date, 'EEEE, MMMM do, yyyy')}
                                                </Typography>
                                            </Box>

                                            {/* Type chip */}
                                            <Chip
                                                icon={<CelebrationIcon sx={{ fontSize: 14 }} />}
                                                label="Holiday"
                                                size="small"
                                                sx={{
                                                    bgcolor: c.bg, color: c.color, fontWeight: 700,
                                                    fontSize: '0.7rem', border: `1px solid ${c.badge}30`,
                                                    flexShrink: 0,
                                                }}
                                            />
                                        </Card>
                                    );
                                })}
                            </Box>
                        </Box>
                    ))}

                    {/* ── Past Holidays ────────────────────────── */}
                    {past.length > 0 && (
                        <Box mt={4}>
                            <Typography fontWeight={700} variant="subtitle1" color="text.disabled" mb={1.5}
                                sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.8rem' }}>
                                ⏪ Past Holidays
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={1.5}>
                                {past.map((h, i) => {
                                    const date = parseISO(h.date);
                                    return (
                                        <Box key={h.id} sx={{
                                            display: 'flex', alignItems: 'center', gap: 1.5,
                                            p: 1.5, borderRadius: 2.5, bgcolor: '#f8fafc',
                                            border: '1px solid', borderColor: 'divider',
                                            opacity: 0.65, minWidth: 220,
                                            '&:hover': { opacity: 1 }
                                        }}>
                                            <Box sx={{
                                                width: 40, height: 44, borderRadius: 2, bgcolor: '#e2e8f0',
                                                display: 'flex', flexDirection: 'column',
                                                alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.55rem', color: 'text.secondary' }}>
                                                    {format(date, 'MMM').toUpperCase()}
                                                </Typography>
                                                <Typography variant="body1" fontWeight={900} color="text.secondary" lineHeight={1}>
                                                    {format(date, 'd')}
                                                </Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="body2" fontWeight={600}>{h.description}</Typography>
                                                <Typography variant="caption" color="text.disabled">{format(date, 'EEEE')}</Typography>
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
};

export default EmployeeHolidays;
