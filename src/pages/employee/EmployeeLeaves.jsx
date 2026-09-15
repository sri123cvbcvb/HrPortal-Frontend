import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Card, Tabs, Tab, TextField, MenuItem, Button, Grid,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, CircularProgress, LinearProgress, Avatar, ToggleButtonGroup, ToggleButton,
    Divider, Tooltip
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import HistoryIcon from '@mui/icons-material/History';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DescriptionIcon from '@mui/icons-material/Description';
import SendIcon from '@mui/icons-material/Send';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { format, differenceInBusinessDays, parseISO, isValid } from 'date-fns';

const STATUS_STYLES = {
    APPROVED: { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', label: 'Approved', icon: <CheckCircleOutlineIcon fontSize="small" /> },
    PENDING:  { bg: '#fffbeb', color: '#d97706', border: '#fde68a', label: 'Pending Approval', icon: <HourglassEmptyIcon fontSize="small" /> },
    REJECTED: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'Rejected', icon: <HighlightOffIcon fontSize="small" /> },
};

const TAB_CONFIG = [
    { label: 'Apply Leave', icon: <AddCircleOutlineIcon fontSize="small" /> },
    { label: 'Pending Requests', icon: <PendingActionsIcon fontSize="small" /> },
    { label: 'Leave History', icon: <HistoryIcon fontSize="small" /> },
];

const BALANCE_THEMES = [
    { main: '#6366f1', light: '#eef2ff', text: '#4338ca' },
    { main: '#8b5cf6', light: '#f5f3ff', text: '#6d28d9' },
    { main: '#10b981', light: '#ecfdf5', text: '#047857' },
    { main: '#f59e0b', light: '#fffbeb', text: '#b45309' },
];

const EmployeeLeaves = () => {
    const [tabIndex, setTabIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [applyLoading, setApplyLoading] = useState(false);
    const [balances, setBalances] = useState([]);
    const [history, setHistory] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);

    const [formData, setFormData] = useState({
        leaveTypeId: '', fromDate: '', toDate: '',
        sessionFrom: 'FULL_DAY', sessionTo: 'FULL_DAY', reason: ''
    });

    const fetchLeaveData = async () => {
        setLoading(true);
        try {
            const [bRes, hRes, tRes] = await Promise.all([
                api.get('employee/leaves/balances'),
                api.get('employee/leaves/history'),
                api.get('employee/leaves/types')
            ]);
            setBalances(bRes.data);
            setHistory(hRes.data);
            setLeaveTypes(tRes.data);
        } catch { 
            toast.error("Failed to load leave data."); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { fetchLeaveData(); }, []);

    // Second-half boundary: use shift config (default 13:00 = 1 PM)
    // This matches app.shift.second-half-start-time in application.properties
    const SECOND_HALF_HOUR = 13; // 1:00 PM

    const isAfterSecondHalf = (dateStr) => {
        if (!dateStr) return false;
        const today = new Date();
        return dateStr === format(today, 'yyyy-MM-dd') && today.getHours() >= SECOND_HALF_HOUR;
    };
    const isAfternoonStart = isAfterSecondHalf(formData.fromDate);
    const isAfternoonEnd = isAfterSecondHalf(formData.toDate);

    // Determine leave type restrictions
    const getLeaveTypeRestrictions = () => {
        if (!formData.leaveTypeId || !leaveTypes.length) return { minDate: '', maxDate: '', info: null };
        const type = leaveTypes.find(t => t.id === formData.leaveTypeId);
        if (!type) return { minDate: '', maxDate: '', info: null };
        const typeName = type.name.toLowerCase();
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        if (typeName.includes('sick') || typeName === 'sl') {
            return { minDate: todayStr, maxDate: todayStr, info: '🤒 Sick Leave can only be applied for today.' };
        }
        if (typeName.includes('casual') || typeName === 'cl') {
            return { minDate: todayStr, maxDate: '', info: '📅 Casual Leave can only be applied for today or future dates.' };
        }
        // PL: any date
        return { minDate: '', maxDate: '', info: '🏖️ Privilege Leave can be applied for any date (past, present, or future).' };
    };
    const leaveRestrictions = getLeaveTypeRestrictions();

    // Client-side date validation before submit
    const validateLeaveDates = () => {
        if (!formData.leaveTypeId || !formData.fromDate || !formData.toDate) return null;
        const type = leaveTypes.find(t => t.id === formData.leaveTypeId);
        if (!type) return null;
        const typeName = type.name.toLowerCase();
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        if (typeName.includes('sick') || typeName === 'sl') {
            if (formData.fromDate !== todayStr || formData.toDate !== todayStr) {
                return 'Sick Leave can only be applied for today.';
            }
        } else if (typeName.includes('casual') || typeName === 'cl') {
            if (formData.fromDate < todayStr) {
                return 'Casual Leave cannot be applied for past dates.';
            }
        }
        return null;
    };

    useEffect(() => {
        if (isAfternoonStart && formData.sessionFrom !== 'SESSION_2')
            setFormData(p => ({ ...p, sessionFrom: 'SESSION_2' }));
    }, [formData.fromDate, isAfternoonStart]);

    useEffect(() => {
        if (isAfternoonEnd && formData.sessionTo !== 'SESSION_2')
            setFormData(p => ({ ...p, sessionTo: 'SESSION_2' }));
    }, [formData.toDate, isAfternoonEnd]);

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleApplyLeave = async (e) => {
        e.preventDefault();

        // Client-side validation per leave type
        const dateError = validateLeaveDates();
        if (dateError) {
            toast.error(dateError);
            return;
        }

        setApplyLoading(true);
        try {
            await api.post('employee/leaves/apply', formData);
            toast.success("Leave request submitted successfully! 🎉");
            setFormData({ leaveTypeId: '', fromDate: '', toDate: '', sessionFrom: 'FULL_DAY', sessionTo: 'FULL_DAY', reason: '' });
            setTabIndex(1);
            fetchLeaveData();
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || "Failed to apply.";
            toast.error(typeof msg === 'string' ? msg : "An error occurred.");
        } finally { 
            setApplyLoading(false); 
        }
    };

    // Calculate approximate duration
    const calculateDays = () => {
        if (!formData.fromDate || !formData.toDate) return null;
        const start = parseISO(formData.fromDate);
        const end = parseISO(formData.toDate);
        if (!isValid(start) || !isValid(end) || end < start) return null;

        let total = differenceInBusinessDays(end, start) + 1;
        if (total < 1) total = 1;

        if (formData.sessionFrom !== 'FULL_DAY') total -= 0.5;
        if (formData.sessionTo !== 'FULL_DAY' && formData.fromDate !== formData.toDate) total -= 0.5;

        return total > 0 ? total : 0.5;
    };

    const estimatedDays = calculateDays();
    const pendingCount = history.filter(h => h.status === 'PENDING').length;
    const selectedLeaveType = leaveTypes.find(t => t.id === formData.leaveTypeId);
    const currentBalance = balances.find(b => b.leaveType?.id === formData.leaveTypeId);

    return (
        <Box sx={{ maxWidth: 1150, mx: 'auto', pb: 6 }}>

            {/* ── Hero Banner ───────────────────────────────── */}
            <Box sx={{
                borderRadius: 4, mb: 3, p: { xs: 3, md: 4 },
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 80%, #6b21a8 100%)',
                color: 'white', position: 'relative', overflow: 'hidden',
                boxShadow: '0 20px 40px -15px rgba(76, 29, 149, 0.4)'
            }}>
                {[220, 120, 160].map((s, i) => (
                    <Box key={i} sx={{
                        position: 'absolute', width: s, height: s, borderRadius: '50%',
                        bgcolor: `rgba(255,255,255,${0.03 + i * 0.02})`,
                        top: i === 0 ? -40 : i === 2 ? undefined : -20,
                        bottom: i === 2 ? -40 : undefined,
                        right: i === 0 ? -40 : i === 1 ? 200 : -20,
                        pointerEvents: 'none'
                    }} />
                ))}

                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} position="relative" zIndex={1}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ width: 56, height: 56, bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                            <BeachAccessIcon sx={{ fontSize: 30, color: '#f472b6' }} />
                        </Avatar>
                        <Box>
                            <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                Time Off & Attendance
                            </Typography>
                            <Typography variant="h4" fontWeight={800} letterSpacing={-0.5}>
                                Leave Portal
                            </Typography>
                        </Box>
                    </Box>

                    <Box display="flex" gap={1.5} flexWrap="wrap">
                        {[
                            { v: pendingCount, l: 'Pending', color: '#f59e0b' },
                            { v: history.filter(h => h.status === 'APPROVED').length, l: 'Approved', color: '#10b981' },
                            { v: balances.reduce((acc, b) => acc + (b.remainingDays || 0), 0), l: 'Days Available', color: '#3b82f6' },
                        ].map(({ v, l, color }) => (
                            <Box key={l} sx={{
                                bgcolor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
                                borderRadius: 3, px: 2.5, py: 1.2, border: '1px solid rgba(255,255,255,0.12)',
                                textAlign: 'center', minWidth: 90
                            }}>
                                <Typography fontWeight={800} variant="h5" sx={{ color }}>{v}</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 500 }}>{l}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>

            {/* ── Main Layout: Tabs + Balance Side Panel ──────────────────── */}
            <Box display="flex" gap={3} flexDirection={{ xs: 'column', lg: 'row' }}>

                {/* Main Content Area */}
                <Box flex={1}>
                    <Card elevation={0} sx={{ borderRadius: 3.5, border: '1px solid', borderColor: 'divider', overflow: 'hidden', bgcolor: 'background.paper' }}>
                        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)}
                            sx={{
                                borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#f8fafc', px: 2,
                                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 56, fontSize: '0.92rem' },
                                '& .Mui-selected': { color: '#6366f1', fontWeight: 700 },
                                '& .MuiTabs-indicator': { bgcolor: '#6366f1', height: 3, borderRadius: '3px 3px 0 0' },
                            }}>
                            {TAB_CONFIG.map((t, i) => (
                                <Tab key={i} label={
                                    <Box display="flex" alignItems="center" gap={1}>
                                        {t.icon}
                                        {t.label}
                                        {i === 1 && pendingCount > 0 && (
                                            <Chip label={pendingCount} size="small" sx={{
                                                height: 20, fontSize: '0.7rem', fontWeight: 800,
                                                bgcolor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a'
                                            }} />
                                        )}
                                    </Box>
                                } />
                            ))}
                        </Tabs>

                        <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                            {loading ? (
                                <Box display="flex" justifyContent="center" alignItems="center" p={6}>
                                    <CircularProgress size={36} sx={{ color: '#6366f1' }} />
                                </Box>
                            ) : (
                                <>
                                    {/* ── Apply Form Tab ──────────────────────────────── */}
                                    {tabIndex === 0 && (
                                        <form onSubmit={handleApplyLeave}>
                                            <Box display="flex" flexDirection="column" gap={3}>

                                                {/* Header Card */}
                                                <Box display="flex" justifyContent="space-between" alignItems="center" p={2} sx={{ bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px dashed #cbd5e1' }}>
                                                    <Box display="flex" alignItems="center" gap={1.5}>
                                                        <Avatar sx={{ bgcolor: '#eef2ff', color: '#4338ca', width: 36, height: 36 }}>
                                                            <CalendarMonthIcon fontSize="small" />
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="subtitle2" fontWeight={700} color="#1e293b">Request Time Off</Typography>
                                                            <Typography variant="caption" color="text.secondary">Select your leave type, dates, and provide a quick reason.</Typography>
                                                        </Box>
                                                    </Box>
                                                    {estimatedDays !== null && (
                                                        <Chip label={`${estimatedDays} ${estimatedDays === 1 ? 'Day' : 'Days'} Requested`}
                                                            sx={{ bgcolor: '#6366f1', color: 'white', fontWeight: 700, borderRadius: 2 }} />
                                                    )}
                                                </Box>

                                                {/* Leave Type Selector */}
                                                <Box>
                                                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, mb: 1, display: 'block' }}>
                                                        1. Select Leave Category
                                                    </Typography>
                                                    <TextField select fullWidth label="Leave Type" name="leaveTypeId"
                                                        value={formData.leaveTypeId} onChange={handleInputChange} required
                                                        SelectProps={{ displayEmpty: true }} InputLabelProps={{ shrink: true }}
                                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: '#f8fafc' } }}>
                                                        <MenuItem value="" disabled>-- Choose Leave Type --</MenuItem>
                                                        {leaveTypes.map(t => {
                                                            const bal = balances.find(b => b.leaveType?.id === t.id);
                                                            const rem = bal ? bal.remainingDays : 0;
                                                            return (
                                                                <MenuItem key={t.id} value={t.id} sx={{ py: 1.2 }}>
                                                                    <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                                                                        <Typography fontWeight={600}>{t.name}</Typography>
                                                                        <Chip label={`${rem} days left`} size="small"
                                                                            sx={{ height: 22, fontSize: '0.7rem', bgcolor: rem > 0 ? '#ecfdf5' : '#fef2f2', color: rem > 0 ? '#047857' : '#dc2626', fontWeight: 700 }} />
                                                                    </Box>
                                                                </MenuItem>
                                                            );
                                                        })}
                                                    </TextField>
                                                    {currentBalance && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.8, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <InfoOutlinedIcon sx={{ fontSize: 14, color: '#6366f1' }} />
                                                            Available balance for {currentBalance.leaveType?.name}: <strong>{currentBalance.remainingDays} days</strong> out of {currentBalance.totalGranted}
                                                        </Typography>
                                                    )}
                                                </Box>

                                                <Divider sx={{ borderStyle: 'dashed' }} />

                                                {/* Date & Session Range */}
                                                <Box>
                                                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, mb: 1.5, display: 'block' }}>
                                                        2. Date & Session Duration
                                                    </Typography>
                                                    <Grid container spacing={2.5}>
                                                        {/* From Date & Session */}
                                                        <Grid item xs={12} sm={6}>
                                                            <Card variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: '#fafafa' }}>
                                                                <Typography variant="body2" fontWeight={700} color="text.secondary" mb={1.5}>
                                                                    Start Date
                                                                </Typography>
                                                                <TextField fullWidth type="date" label="From Date" name="fromDate"
                                                                    value={formData.fromDate} onChange={handleInputChange}
                                                                    InputLabelProps={{ shrink: true }} required
                                                                    inputProps={{ min: leaveRestrictions.minDate || undefined, max: leaveRestrictions.maxDate || undefined }}
                                                                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.paper' } }} />

                                                                <Typography variant="caption" fontWeight={600} color="text.secondary" mb={0.5} display="block">
                                                                    Session
                                                                </Typography>
                                                                <ToggleButtonGroup exclusive fullWidth size="small"
                                                                    value={formData.sessionFrom}
                                                                    onChange={(_, v) => v && setFormData({ ...formData, sessionFrom: v })}
                                                                    sx={{
                                                                        bgcolor: 'background.paper', borderRadius: 2, p: 0.5, border: '1px solid', borderColor: 'divider',
                                                                        '& .MuiToggleButton-root': { border: 0, borderRadius: 1.5, textTransform: 'none', fontWeight: 600, py: 0.8 }
                                                                    }}>
                                                                    <ToggleButton value="FULL_DAY" disabled={isAfternoonStart}>Full Day</ToggleButton>
                                                                    <ToggleButton value="SESSION_1" disabled={isAfternoonStart}>First Half</ToggleButton>
                                                                    <ToggleButton value="SESSION_2">Second Half</ToggleButton>
                                                                </ToggleButtonGroup>
                                                                {isAfternoonStart && (
                                                                    <Typography variant="caption" color="error" mt={0.8} display="block" fontWeight={500}>
                                                                        ⚠️ Second half already started. Automatically set to Second Half.
                                                                    </Typography>
                                                                )}
                                                                {leaveRestrictions.info && !isAfternoonStart && (
                                                                    <Typography variant="caption" color="text.secondary" mt={0.8} display="block" fontWeight={500} sx={{ color: '#6366f1' }}>
                                                                        {leaveRestrictions.info}
                                                                    </Typography>
                                                                )}
                                                            </Card>
                                                        </Grid>

                                                        {/* To Date & Session */}
                                                        <Grid item xs={12} sm={6}>
                                                            <Card variant="outlined" sx={{ p: 2, borderRadius: 2.5, bgcolor: '#fafafa' }}>
                                                                <Typography variant="body2" fontWeight={700} color="text.secondary" mb={1.5}>
                                                                    End Date
                                                                </Typography>
                                                                <TextField fullWidth type="date" label="To Date" name="toDate"
                                                                    value={formData.toDate} onChange={handleInputChange}
                                                                    InputLabelProps={{ shrink: true }} required
                                                                    inputProps={{ min: formData.fromDate || leaveRestrictions.minDate || undefined, max: leaveRestrictions.maxDate || undefined }}
                                                                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.paper' } }} />

                                                                <Typography variant="caption" fontWeight={600} color="text.secondary" mb={0.5} display="block">
                                                                    Session
                                                                </Typography>
                                                                <ToggleButtonGroup exclusive fullWidth size="small"
                                                                    value={formData.sessionTo}
                                                                    onChange={(_, v) => v && setFormData({ ...formData, sessionTo: v })}
                                                                    sx={{
                                                                        bgcolor: 'background.paper', borderRadius: 2, p: 0.5, border: '1px solid', borderColor: 'divider',
                                                                        '& .MuiToggleButton-root': { border: 0, borderRadius: 1.5, textTransform: 'none', fontWeight: 600, py: 0.8 }
                                                                    }}>
                                                                    <ToggleButton value="FULL_DAY" disabled={isAfternoonEnd}>Full Day</ToggleButton>
                                                                    <ToggleButton value="SESSION_1" disabled={isAfternoonEnd}>First Half</ToggleButton>
                                                                    <ToggleButton value="SESSION_2">Second Half</ToggleButton>
                                                                </ToggleButtonGroup>
                                                                {isAfternoonEnd && (
                                                                    <Typography variant="caption" color="error" mt={0.8} display="block" fontWeight={500}>
                                                                        ⚠️ Afternoon started. Automatically set to Second Half.
                                                                    </Typography>
                                                                )}
                                                            </Card>
                                                        </Grid>
                                                    </Grid>
                                                </Box>

                                                <Divider sx={{ borderStyle: 'dashed' }} />

                                                {/* Reason Section */}
                                                <Box>
                                                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, mb: 1, display: 'block' }}>
                                                        3. Reason & Additional Notes
                                                    </Typography>
                                                    <TextField fullWidth multiline rows={3} label="Reason for Leave"
                                                        name="reason" value={formData.reason} onChange={handleInputChange} required
                                                        placeholder="Provide brief details about your leave request..."
                                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: '#f8fafc' } }} />
                                                </Box>

                                                {/* Submit & Clear buttons */}
                                                <Box display="flex" justifyContent="flex-end" gap={2} mt={1}>
                                                    <Button variant="outlined" color="inherit"
                                                        onClick={() => setFormData({ leaveTypeId: '', fromDate: '', toDate: '', sessionFrom: 'FULL_DAY', sessionTo: 'FULL_DAY', reason: '' })}
                                                        sx={{ borderRadius: 2.5, fontWeight: 600, textTransform: 'none', px: 3, py: 1.2, borderColor: '#cbd5e1' }}>
                                                        Clear Form
                                                    </Button>
                                                    <Button type="submit" variant="contained" disabled={applyLoading}
                                                        startIcon={!applyLoading && <SendIcon />}
                                                        sx={{
                                                            borderRadius: 2.5, fontWeight: 700, px: 4, py: 1.2, textTransform: 'none',
                                                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                                            boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.4)',
                                                            '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' }
                                                        }}>
                                                        {applyLoading ? <CircularProgress size={22} color="inherit" /> : 'Submit Leave Request'}
                                                    </Button>
                                                </Box>
                                            </Box>
                                        </form>
                                    )}

                                    {/* ── Pending / History Tables Tab ──────────────────── */}
                                    {(tabIndex === 1 || tabIndex === 2) && (() => {
                                        const filtered = tabIndex === 1 ? history.filter(h => h.status === 'PENDING') : history;
                                        return filtered.length === 0 ? (
                                            <Box textAlign="center" py={8}>
                                                <AccessTimeIcon sx={{ fontSize: 56, color: '#cbd5e1', mb: 1.5 }} />
                                                <Typography variant="h6" fontWeight={700} color="text.secondary">No leave records found</Typography>
                                                <Typography variant="body2" color="text.disabled" mt={0.5}>
                                                    {tabIndex === 1 ? "You have no pending requests waiting for manager approval." : "No leave history recorded yet."}
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <TableContainer>
                                                <Table sx={{ minWidth: 600 }}>
                                                    <TableHead>
                                                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                                            {['Leave Type', 'Duration', 'Reason', 'Status', 'Applied Date'].map(h => (
                                                                <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 }}>{h}</TableCell>
                                                            ))}
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {filtered.map(req => {
                                                            const st = STATUS_STYLES[req.status] || STATUS_STYLES.PENDING;
                                                            return (
                                                                <TableRow key={req.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                                    <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>
                                                                        <Box display="flex" alignItems="center" gap={1.5}>
                                                                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#eef2ff', color: '#6366f1', fontSize: '0.8rem', fontWeight: 800 }}>
                                                                                {req.leaveType?.name?.charAt(0) || 'L'}
                                                                            </Avatar>
                                                                            {req.leaveType?.name}
                                                                        </Box>
                                                                    </TableCell>
                                                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                                        <Typography variant="body2" fontWeight={600} color="#334155">
                                                                            {format(new Date(req.fromDate), 'dd MMM yyyy')} → {format(new Date(req.toDate), 'dd MMM yyyy')}
                                                                        </Typography>
                                                                    </TableCell>
                                                                    <TableCell sx={{ maxWidth: 220 }}>
                                                                        <Tooltip title={req.reason} arrow>
                                                                            <Typography variant="body2" color="text.secondary" noWrap sx={{ cursor: 'pointer' }}>
                                                                                {req.reason}
                                                                            </Typography>
                                                                        </Tooltip>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Chip icon={st.icon} label={st.label} size="small" sx={{
                                                                            fontWeight: 700, fontSize: '0.72rem', height: 26, px: 0.5,
                                                                            bgcolor: st.bg, color: st.color, border: `1px solid ${st.border}`,
                                                                            '& .MuiChip-icon': { color: 'inherit' }
                                                                        }} />
                                                                    </TableCell>
                                                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                                                            {format(new Date(req.createdAt), 'dd MMM yyyy')}
                                                                        </Typography>
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        );
                                    })()}
                                </>
                            )}
                        </Box>
                    </Card>
                </Box>

                {/* ── Balance Side Panel ─────────────────────────── */}
                <Box sx={{ width: { xs: '100%', lg: 300 }, flexShrink: 0 }}>
                    <Card elevation={0} sx={{ borderRadius: 3.5, border: '1px solid', borderColor: 'divider', overflow: 'hidden', position: 'sticky', top: 80, bgcolor: 'background.paper' }}>
                        <Box sx={{
                            px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider',
                            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <BeachAccessIcon sx={{ color: '#6366f1' }} />
                                <Typography fontWeight={800} variant="subtitle1" color="#1e293b">
                                    Leave Balances
                                </Typography>
                            </Box>
                            <Chip label="2026" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: '#eef2ff', color: '#4338ca' }} />
                        </Box>

                        <Box p={2.5}>
                            {balances.length === 0 ? (
                                <Typography color="text.disabled" variant="body2" textAlign="center" py={4}>
                                    No leave balances allocated.
                                </Typography>
                            ) : (
                                <Box display="flex" flexDirection="column" gap={2}>
                                    {balances.map((b, i) => {
                                        const total = b.totalGranted || 0;
                                        const remaining = b.remainingDays || 0;
                                        const used = total - remaining;
                                        const pct = total > 0 ? Math.round((remaining / total) * 100) : 0;
                                        const theme = BALANCE_THEMES[i % BALANCE_THEMES.length];

                                        return (
                                            <Box key={b.id} sx={{
                                                p: 2, borderRadius: 3, bgcolor: theme.light,
                                                border: `1px solid ${theme.main}30`,
                                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                                '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 16px -4px ${theme.main}20` }
                                            }}>
                                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                                    <Typography variant="body2" fontWeight={800} color={theme.text}>
                                                        {b.leaveType?.name}
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight={800} sx={{ color: theme.main }}>
                                                        {remaining} / {total} Days
                                                    </Typography>
                                                </Box>

                                                <LinearProgress variant="determinate" value={pct} sx={{
                                                    height: 7, borderRadius: 4, bgcolor: `${theme.main}20`,
                                                    '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: theme.main }
                                                }} />

                                                <Box display="flex" justifyContent="space-between" mt={1}>
                                                    <Typography variant="caption" fontWeight={600} color="text.secondary">{used} Used</Typography>
                                                    <Typography variant="caption" fontWeight={700} color={theme.main}>{pct}% Available</Typography>
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            )}

                            <Box mt={3} p={2} bgcolor="#f8fafc" borderRadius={2.5} border="1px dashed" borderColor="#cbd5e1" textAlign="center">
                                <Typography variant="caption" color="text.secondary" fontWeight={500} display="block">
                                    💡 Need extra leaves or balance adjustments? Contact your HR Administrator.
                                </Typography>
                            </Box>
                        </Box>
                    </Card>
                </Box>
            </Box>
        </Box>
    );
};

export default EmployeeLeaves;
