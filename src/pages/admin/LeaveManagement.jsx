import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, IconButton, Dialog,
    DialogTitle, DialogContent, DialogActions,
    TextField, Chip, CircularProgress, Tooltip,
    Breadcrumbs, Link, Avatar
} from '@mui/material';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays,
    isSunday, parseISO, isToday, isPast, isFuture
} from 'date-fns';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CelebrationIcon from '@mui/icons-material/Celebration';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const HOLIDAY_COLORS = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6'
];

const getHolidayColor = (index) => HOLIDAY_COLORS[index % HOLIDAY_COLORS.length];

const LeaveManagement = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [companyLeaves, setCompanyLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { fetchLeaves(); }, []);

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/leaves');
            setCompanyLeaves(res.data);
        } catch {
            toast.error('Failed to load holidays');
        } finally {
            setLoading(false);
        }
    };

    const handleDateClick = (day) => {
        const existingLeave = companyLeaves.find(l => isSameDay(parseISO(l.date), day));
        setSelectedDate(day);
        setIsRemoving(!!existingLeave);
        setReason(existingLeave?.description || '');
        setOpenDialog(true);
    };

    const handleConfirm = async () => {
        try {
            setSubmitting(true);
            if (isRemoving) {
                const leave = companyLeaves.find(l => isSameDay(parseISO(l.date), selectedDate));
                await api.delete(`/admin/leaves/${leave.id}`);
                toast.success('Holiday removed');
            } else {
                await api.post('/admin/leaves', { date: format(selectedDate, 'yyyy-MM-dd'), description: reason });
                toast.success('Holiday added!');
            }
            fetchLeaves();
            setOpenDialog(false);
            setReason('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Action failed');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Sorted holidays for the list panel ───────────────────
    const sortedHolidays = [...companyLeaves].sort((a, b) => new Date(a.date) - new Date(b.date));
    const upcomingHolidays = sortedHolidays.filter(h => !isPast(parseISO(h.date)) || isToday(parseISO(h.date)));
    const pastHolidays = sortedHolidays.filter(h => isPast(parseISO(h.date)) && !isToday(parseISO(h.date)));

    // ── Calendar cell builder ─────────────────────────────────
    const buildCalendarDays = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const start = startOfWeek(monthStart);
        const end = endOfWeek(monthEnd);
        const weeks = [];
        let days = [];
        let day = start;

        while (day <= end) {
            for (let i = 0; i < 7; i++) {
                const d = day;
                const isCurrentMonth = isSameMonth(d, monthStart);
                const holiday = companyLeaves.find(l => isSameDay(parseISO(l.date), d));
                const isSun = isSunday(d);
                const todayFlag = isToday(d);

                days.push(
                    <Box
                        key={format(d, 'yyyy-MM-dd')}
                        onClick={() => isCurrentMonth && handleDateClick(d)}
                        sx={{
                            flex: 1,
                            minHeight: { xs: 56, md: 80 },
                            p: 1,
                            cursor: isCurrentMonth ? 'pointer' : 'default',
                            opacity: isCurrentMonth ? 1 : 0.25,
                            position: 'relative',
                            transition: 'all 0.15s ease',
                            borderRadius: 2,
                            bgcolor: holiday
                                ? 'rgba(239,68,68,0.08)'
                                : isSun && isCurrentMonth
                                    ? 'rgba(251,191,36,0.06)'
                                    : 'transparent',
                            border: todayFlag ? '2px solid' : '1px solid transparent',
                            borderColor: todayFlag ? 'primary.main' : 'transparent',
                            '&:hover': isCurrentMonth ? {
                                bgcolor: holiday ? 'rgba(239,68,68,0.15)' : 'action.hover',
                                transform: 'scale(1.03)',
                            } : {},
                        }}
                    >
                        {/* Date number */}
                        <Box
                            sx={{
                                width: 28, height: 28,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: '50%',
                                bgcolor: todayFlag ? 'primary.main' : 'transparent',
                                color: todayFlag ? 'white' : holiday ? 'error.main' : isSun && isCurrentMonth ? 'warning.dark' : 'text.primary',
                                fontWeight: todayFlag || holiday ? 700 : 400,
                                fontSize: '0.85rem',
                            }}
                        >
                            {format(d, 'd')}
                        </Box>

                        {/* Holiday dot + label */}
                        {holiday && (
                            <Box sx={{ mt: 0.5 }}>
                                <Box sx={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    bgcolor: 'error.main', mx: 'auto', mb: 0.3
                                }} />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        display: { xs: 'none', md: 'block' },
                                        fontSize: '0.65rem',
                                        color: 'error.dark',
                                        fontWeight: 600,
                                        lineHeight: 1.2,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {holiday.description}
                                </Typography>
                            </Box>
                        )}

                        {/* Sunday label */}
                        {isSun && isCurrentMonth && !holiday && (
                            <Typography variant="caption"
                                sx={{ display: { xs: 'none', md: 'block' }, fontSize: '0.6rem', color: 'warning.dark', fontWeight: 500 }}>
                                Weekend
                            </Typography>
                        )}
                    </Box>
                );
                day = addDays(day, 1);
            }
            weeks.push(
                <Box key={day.toString()} display="flex" gap={0.5} mb={0.5}>
                    {days}
                </Box>
            );
            days = [];
        }
        return weeks;
    };

    return (
        <Box>
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link underline="hover" color="inherit" href="/admin">Admin</Link>
                <Typography color="text.primary">Company Holidays</Typography>
            </Breadcrumbs>

            {/* ── Page Header ───────────────────────────────── */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 4,
                    p: { xs: 3, md: 4 },
                    mb: 3,
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Background decoration */}
                <Box sx={{
                    position: 'absolute', top: -30, right: -30,
                    width: 160, height: 160, borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.08)'
                }} />
                <Box sx={{
                    position: 'absolute', bottom: -20, right: 100,
                    width: 80, height: 80, borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.06)'
                }} />

                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                    <Box>
                        <Typography variant="h4" fontWeight={800} letterSpacing={-0.5}>
                            🎉 Company Holidays
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
                            Manage official holidays · {companyLeaves.length} total · {upcomingHolidays.length} upcoming
                        </Typography>
                    </Box>
                    <Box display="flex" gap={2}>
                        <Box textAlign="center" sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, px: 3, py: 1.5 }}>
                            <Typography fontWeight={800} variant="h5">{upcomingHolidays.length}</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.85 }}>Upcoming</Typography>
                        </Box>
                        <Box textAlign="center" sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, px: 3, py: 1.5 }}>
                            <Typography fontWeight={800} variant="h5">{companyLeaves.length}</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.85 }}>Total</Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" p={8}><CircularProgress /></Box>
            ) : (
                <Box display="flex" gap={3} flexDirection={{ xs: 'column', lg: 'row' }}>

                    {/* ── Calendar Panel ────────────────────── */}
                    <Box flex={1} sx={{
                        bgcolor: 'background.paper',
                        borderRadius: 4,
                        border: '1px solid',
                        borderColor: 'divider',
                        overflow: 'hidden',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                    }}>
                        {/* Month Navigation */}
                        <Box display="flex" justifyContent="space-between" alignItems="center"
                            sx={{ px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="h6" fontWeight={700}>
                                {format(currentMonth, 'MMMM yyyy')}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                                <IconButton size="small" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                    <ChevronLeftIcon fontSize="small" />
                                </IconButton>
                                <Button size="small" variant="outlined"
                                    onClick={() => setCurrentMonth(new Date())}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 2 }}>
                                    Today
                                </Button>
                                <IconButton size="small" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                    <ChevronRightIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>

                        <Box sx={{ p: { xs: 2, md: 3 } }}>
                            {/* Day headers */}
                            <Box display="flex" gap={0.5} mb={1}>
                                {DAYS.map((d, i) => (
                                    <Box key={d} flex={1} textAlign="center">
                                        <Typography variant="caption" fontWeight={700}
                                            sx={{ color: i === 0 ? 'warning.dark' : 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                            {d}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>

                            {/* Calendar grid */}
                            {buildCalendarDays()}

                            {/* Legend */}
                            <Box display="flex" gap={3} mt={3} pt={2} borderTop="1px solid" borderColor="divider" flexWrap="wrap">
                                {[
                                    { color: 'primary.main', label: 'Today' },
                                    { color: 'error.main', label: 'Holiday' },
                                    { color: 'warning.dark', label: 'Sunday' },
                                ].map(({ color, label }) => (
                                    <Box key={label} display="flex" alignItems="center" gap={0.8}>
                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
                                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                                    </Box>
                                ))}
                                <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
                                    Click any date to add / remove holiday
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* ── Holiday List Panel ────────────────── */}
                    <Box sx={{
                        width: { xs: '100%', lg: 320 },
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                    }}>
                        {/* Upcoming */}
                        <Box sx={{
                            bgcolor: 'background.paper',
                            borderRadius: 4,
                            border: '1px solid',
                            borderColor: 'divider',
                            overflow: 'hidden',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                            flex: 1,
                        }}>
                            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider',
                                background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
                                <Typography fontWeight={700} variant="subtitle1" color="success.dark">
                                    🗓️ Upcoming Holidays
                                </Typography>
                                <Typography variant="caption" color="success.dark" sx={{ opacity: 0.7 }}>
                                    {upcomingHolidays.length} remaining this year
                                </Typography>
                            </Box>

                            <Box sx={{ maxHeight: 340, overflowY: 'auto', p: 1.5 }}>
                                {upcomingHolidays.length === 0 ? (
                                    <Box textAlign="center" py={4}>
                                        <EventBusyIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                                        <Typography variant="body2" color="text.disabled">
                                            No upcoming holidays
                                        </Typography>
                                    </Box>
                                ) : upcomingHolidays.map((h, idx) => (
                                    <HolidayCard key={h.id} holiday={h} index={idx}
                                        onDelete={() => { setSelectedDate(parseISO(h.date)); setIsRemoving(true); setReason(h.description); setOpenDialog(true); }} />
                                ))}
                            </Box>
                        </Box>

                        {/* Past */}
                        {pastHolidays.length > 0 && (
                            <Box sx={{
                                bgcolor: 'background.paper',
                                borderRadius: 4,
                                border: '1px solid',
                                borderColor: 'divider',
                                overflow: 'hidden',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                            }}>
                                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider',
                                    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
                                    <Typography fontWeight={700} variant="subtitle1" color="text.secondary">
                                        ⏪ Past Holidays
                                    </Typography>
                                </Box>
                                <Box sx={{ maxHeight: 220, overflowY: 'auto', p: 1.5 }}>
                                    {pastHolidays.slice(-5).reverse().map((h, idx) => (
                                        <HolidayCard key={h.id} holiday={h} index={idx} past
                                            onDelete={() => { setSelectedDate(parseISO(h.date)); setIsRemoving(true); setReason(h.description); setOpenDialog(true); }} />
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>
            )}

            {/* ── Add / Remove Dialog ───────────────────────────── */}
            <Dialog
                open={openDialog}
                onClose={() => { setOpenDialog(false); setReason(''); }}
                PaperProps={{
                    sx: {
                        borderRadius: 4,
                        minWidth: 420,
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.15)'
                    }
                }}
            >
                <Box sx={{
                    background: isRemoving
                        ? 'linear-gradient(135deg, #fef2f2, #fee2e2)'
                        : 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                    px: 3, py: 2.5,
                    borderBottom: '1px solid',
                    borderColor: isRemoving ? 'error.light' : 'primary.light',
                }}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar sx={{
                            bgcolor: isRemoving ? 'error.main' : 'primary.main',
                            width: 40, height: 40
                        }}>
                            {isRemoving ? <DeleteOutlineIcon /> : <AddCircleOutlineIcon />}
                        </Avatar>
                        <Box>
                            <Typography fontWeight={800} variant="h6">
                                {isRemoving ? 'Remove Holiday' : 'Add Holiday'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {selectedDate && format(selectedDate, 'EEEE, MMMM do, yyyy')}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <DialogContent sx={{ p: 3 }}>
                    {!isRemoving ? (
                        <TextField
                            autoFocus
                            fullWidth
                            label="Holiday Name"
                            placeholder="e.g. Diwali, Holi, Independence Day..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            variant="outlined"
                            sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            InputProps={{
                                startAdornment: <CelebrationIcon sx={{ mr: 1, color: 'text.disabled' }} />
                            }}
                        />
                    ) : (
                        <Box sx={{ bgcolor: 'error.50', borderRadius: 2, p: 2, border: '1px solid', borderColor: 'error.light' }}>
                            <Typography variant="body2" color="error.dark">
                                Remove <strong>"{reason}"</strong> from the holiday list?
                                Employees will no longer see this as a holiday.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3, pt: 0, gap: 1 }}>
                    <Button
                        onClick={() => { setOpenDialog(false); setReason(''); }}
                        color="inherit" sx={{ borderRadius: 2, fontWeight: 600 }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        variant="contained"
                        color={isRemoving ? 'error' : 'primary'}
                        disabled={submitting || (!isRemoving && !reason.trim())}
                        sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}
                    >
                        {submitting ? '...' : isRemoving ? 'Remove Holiday' : 'Add Holiday'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

// ── Holiday Card Component ────────────────────────────────────
const HolidayCard = ({ holiday, index, past = false, onDelete }) => {
    const date = parseISO(holiday.date);
    const color = getHolidayColor(index);

    return (
        <Box
            sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                p: 1.5, borderRadius: 2.5, mb: 1,
                bgcolor: past ? 'action.hover' : `${color}10`,
                border: '1px solid',
                borderColor: past ? 'divider' : `${color}30`,
                opacity: past ? 0.65 : 1,
                transition: 'all 0.15s',
                '&:hover': { transform: 'translateX(3px)', opacity: 1 }
            }}
        >
            {/* Date badge */}
            <Box sx={{
                minWidth: 48, height: 52, borderRadius: 2,
                bgcolor: past ? 'grey.200' : color,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                color: past ? 'text.secondary' : 'white',
            }}>
                <Typography variant="caption" fontWeight={700} sx={{ lineHeight: 1, fontSize: '0.7rem' }}>
                    {format(date, 'MMM').toUpperCase()}
                </Typography>
                <Typography variant="h6" fontWeight={900} sx={{ lineHeight: 1 }}>
                    {format(date, 'd')}
                </Typography>
            </Box>

            {/* Info */}
            <Box flex={1} minWidth={0}>
                <Typography variant="body2" fontWeight={700} noWrap>
                    {holiday.description}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {format(date, 'EEEE')}
                    {isToday(date) && (
                        <Chip label="Today" size="small" color="primary"
                            sx={{ ml: 1, height: 16, fontSize: '0.6rem' }} />
                    )}
                </Typography>
            </Box>

            {/* Delete */}
            <Tooltip title="Remove holiday">
                <IconButton size="small" onClick={onDelete}
                    sx={{ color: 'text.disabled', '&:hover': { color: 'error.main', bgcolor: 'error.50' } }}>
                    <DeleteOutlineIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </Box>
    );
};

export default LeaveManagement;
