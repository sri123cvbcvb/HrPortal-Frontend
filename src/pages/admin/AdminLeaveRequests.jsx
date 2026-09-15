import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Tooltip, CircularProgress, Chip, TextField,
    Grid, Button, Tabs, Tab, MenuItem, Avatar
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import HistoryIcon from '@mui/icons-material/History';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

// ── Status chip ──────────────────────────────────────────────────
const LeaveStatusChip = ({ status }) => {
    const config = {
        APPROVED: { bg: '#dcfce7', color: '#16a34a', label: '✓ Approved' },
        PENDING: { bg: '#fef9c3', color: '#ca8a04', label: '⏳ Pending' },
        REJECTED: { bg: '#fee2e2', color: '#dc2626', label: '✕ Rejected' },
    };
    const c = config[status] || { bg: '#f1f5f9', color: '#64748b', label: status };
    return (
        <Chip
            label={c.label}
            size="small"
            sx={{
                bgcolor: c.bg,
                color: c.color,
                fontWeight: 700,
                fontSize: '0.7rem',
                border: `1px solid ${c.color}33`,
                height: 24,
            }}
        />
    );
};

// ── Employee avatar with initials ────────────────────────────────
const EmpAvatar = ({ name, size = 34 }) => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#22c55e', '#ef4444', '#06b6d4'];
    const hash = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const color = colors[hash % colors.length];
    const initials = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    return (
        <Avatar sx={{ width: size, height: size, background: `linear-gradient(135deg, ${color}, ${color}bb)`, fontSize: size * 0.38, fontWeight: 700 }}>
            {initials}
        </Avatar>
    );
};

// ── Styled tab bar ───────────────────────────────────────────────
const tabConfig = [
    { label: 'Pending', icon: <PendingActionsIcon sx={{ fontSize: 16 }} /> },
    { label: 'All History', icon: <HistoryIcon sx={{ fontSize: 16 }} /> },
    { label: 'Setup & Config', icon: <ManageAccountsIcon sx={{ fontSize: 16 }} /> },
    { label: 'Balances', icon: <CardGiftcardIcon sx={{ fontSize: 16 }} /> },
];

const AdminLeaveRequests = () => {
    const [tabIndex, setTabIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [allBalances, setAllBalances] = useState([]);
    const [setupData, setSetupData] = useState({ employeeIds: [], leaveTypeId: '', amount: '' });
    const [leaveTypeData, setLeaveTypeData] = useState({ name: '', totalDays: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [reqRes, typesRes, empRes, balRes] = await Promise.all([
                api.get('admin/leave-management/requests'),
                api.get('admin/leave-management/types'),
                api.get('admin/employees'),
                api.get('admin/leave-management/balances/all'),
            ]);
            setLeaveRequests(reqRes.data);
            setLeaveTypes(typesRes.data);
            setEmployees(empRes.data);
            setAllBalances(balRes.data);
        } catch (err) {
            console.error('Error fetching admin leave data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAction = async (id, action) => {
        try {
            await api.post(`admin/leave-management/requests/${id}/${action}`);
            toast.success(`Leave request ${action}d successfully`);
            fetchData();
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || `Failed to ${action} request`;
            toast.error(typeof msg === 'string' ? msg : `Error: ${action}`);
        }
    };

    const handleGrantBalance = async (e) => {
        e.preventDefault();
        if (!setupData.employeeIds || setupData.employeeIds.length === 0) {
            toast.error('Please select at least one employee');
            return;
        }
        try {
            const idsStr = setupData.employeeIds.join(',');
            await api.post(`admin/leave-management/balances/grant?employeeIds=${idsStr}&leaveTypeId=${setupData.leaveTypeId}&amount=${setupData.amount}`);
            toast.success('Balance granted successfully!');
            setSetupData({ employeeIds: [], leaveTypeId: '', amount: '' });
            fetchData();
        } catch (err) {
            toast.error('Failed to grant balance');
        }
    };

    const handleCreateLeaveType = async (e) => {
        e.preventDefault();
        try {
            await api.post('admin/leave-management/types', leaveTypeData);
            toast.success('Leave Type created successfully!');
            setLeaveTypeData({ name: '', totalDays: '' });
            fetchData();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to create Leave Type';
            toast.error(typeof msg === 'string' ? msg : 'An error occurred');
        }
    };

    const handleEditBalance = async (balanceId) => {
        const newAmt = prompt('Enter new remaining balance:');
        if (newAmt !== null && newAmt !== '') {
            try {
                await api.put(`admin/leave-management/balances/${balanceId}?remainingDays=${newAmt}`);
                toast.success('Balance updated');
                fetchData();
            } catch (err) { toast.error('Failed to update'); }
        }
    };

    const handleDeleteBalance = async (balanceId) => {
        if (window.confirm('Are you sure you want to delete this balance?')) {
            try {
                await api.delete(`admin/leave-management/balances/${balanceId}`);
                toast.success('Balance deleted');
                fetchData();
            } catch (err) { toast.error('Failed to delete'); }
        }
    };

    // ── Table header cell style ──────────────────────────────────
    const ThCell = ({ children, align }) => (
        <TableCell align={align} sx={{
            fontWeight: 700,
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            color: 'rgba(255,255,255,0.85)',
            bgcolor: '#1e1b4b',
            py: 1.8,
            borderBottom: 'none',
            whiteSpace: 'nowrap',
        }}>
            {children}
        </TableCell>
    );

    // ── Requests table ───────────────────────────────────────────
    const renderRequestsTable = (pendingOnly) => {
        const filtered = pendingOnly
            ? leaveRequests.filter(r => r.status === 'PENDING')
            : leaveRequests;

        if (filtered.length === 0) {
            return (
                <Box textAlign="center" py={8}>
                    <PendingActionsIcon sx={{ fontSize: 52, color: 'text.disabled', mb: 1.5 }} />
                    <Typography color="text.secondary" fontWeight={500}>
                        {pendingOnly ? 'No pending requests — all caught up! 🎉' : 'No leave records found.'}
                    </Typography>
                </Box>
            );
        }

        return (
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <ThCell>Employee</ThCell>
                            <ThCell>Leave Type</ThCell>
                            <ThCell>Dates</ThCell>
                            <ThCell>Sessions</ThCell>
                            <ThCell>Reason</ThCell>
                            <ThCell>Status</ThCell>
                            <ThCell align="center">Actions</ThCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filtered.map((req, idx) => (
                            <TableRow
                                key={req.id}
                                sx={{
                                    bgcolor: idx % 2 === 0 ? 'white' : '#f8fafc',
                                    transition: 'bgcolor 0.15s',
                                    '&:hover': { bgcolor: '#eef2ff' },
                                }}
                            >
                                <TableCell>
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <EmpAvatar name={`${req.employee?.firstName || ''} ${req.employee?.lastName || ''}`} />
                                        <Box>
                                            <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                                                {req.employee?.firstName} {req.employee?.lastName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {req.employee?.email}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={req.leaveType?.name}
                                        size="small"
                                        sx={{ bgcolor: '#eef2ff', color: '#4338ca', fontWeight: 600, fontSize: '0.72rem' }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>
                                        {format(new Date(req.fromDate), 'dd MMM yyyy')}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        → {format(new Date(req.toDate), 'dd MMM yyyy')}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                        From: <strong>{req.sessionFrom}</strong>
                                    </Typography>
                                    <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                                        To: <strong>{req.sessionTo}</strong>
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" color="text.secondary" sx={{
                                        maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                    }}>
                                        {req.reason}
                                    </Typography>
                                </TableCell>
                                <TableCell><LeaveStatusChip status={req.status} /></TableCell>
                                <TableCell align="center">
                                    {req.status === 'PENDING' ? (
                                        <Box display="flex" justifyContent="center" gap={0.5}>
                                            <Tooltip title="Approve">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleAction(req.id, 'approve')}
                                                    sx={{
                                                        bgcolor: '#dcfce7',
                                                        color: '#16a34a',
                                                        '&:hover': { bgcolor: '#bbf7d0' },
                                                        width: 32, height: 32,
                                                    }}
                                                >
                                                    <CheckCircleIcon sx={{ fontSize: 17 }} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Reject">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleAction(req.id, 'reject')}
                                                    sx={{
                                                        bgcolor: '#fee2e2',
                                                        color: '#dc2626',
                                                        '&:hover': { bgcolor: '#fecaca' },
                                                        width: 32, height: 32,
                                                    }}
                                                >
                                                    <CancelIcon sx={{ fontSize: 17 }} />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    ) : (
                                        <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                                            Processed
                                        </Typography>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    // ── Balances table ───────────────────────────────────────────
    const renderBalancesTable = () => (
        <Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <ThCell>Employee</ThCell>
                            <ThCell>Leave Type</ThCell>
                            <ThCell>Total Granted</ThCell>
                            <ThCell>Used</ThCell>
                            <ThCell>Remaining</ThCell>
                            <ThCell align="center">Actions</ThCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {allBalances.map((bal, idx) => (
                            <TableRow
                                key={bal.id}
                                sx={{
                                    bgcolor: idx % 2 === 0 ? 'white' : '#f8fafc',
                                    '&:hover': { bgcolor: '#eef2ff' },
                                }}
                            >
                                <TableCell>
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <EmpAvatar name={`${bal.employee?.firstName || ''} ${bal.employee?.lastName || ''}`} />
                                        <Typography variant="body2" fontWeight={600}>
                                            {bal.employee?.firstName} {bal.employee?.lastName}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip label={bal.leaveType?.name} size="small"
                                        sx={{ bgcolor: '#eef2ff', color: '#4338ca', fontWeight: 600, fontSize: '0.72rem' }} />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontWeight={600}>{bal.totalGranted}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" color="text.secondary">{bal.usedDays}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={bal.remainingDays}
                                        size="small"
                                        sx={{
                                            bgcolor: bal.remainingDays <= 0 ? '#fee2e2' : '#dcfce7',
                                            color: bal.remainingDays <= 0 ? '#dc2626' : '#16a34a',
                                            fontWeight: 800,
                                            fontSize: '0.8rem',
                                        }}
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Box display="flex" justifyContent="center" gap={0.5}>
                                        <Tooltip title="Edit balance">
                                            <IconButton size="small" onClick={() => handleEditBalance(bal.id)}
                                                sx={{ bgcolor: '#eef2ff', color: '#6366f1', '&:hover': { bgcolor: '#c7d2fe' }, width: 28, height: 28 }}>
                                                <EditIcon sx={{ fontSize: 14 }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete balance">
                                            <IconButton size="small" onClick={() => handleDeleteBalance(bal.id)}
                                                sx={{ bgcolor: '#fee2e2', color: '#dc2626', '&:hover': { bgcolor: '#fecaca' }, width: 28, height: 28 }}>
                                                <DeleteIcon sx={{ fontSize: 14 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                        {allBalances.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.disabled' }}>
                                    No balances found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );

    // ── Setup box ────────────────────────────────────────────────
    const FormSection = ({ title, subtitle, children }) => (
        <Box
            sx={{
                borderRadius: 3,
                border: '1px solid rgba(0,0,0,0.06)',
                overflow: 'hidden',
                mb: 3,
            }}
        >
            <Box sx={{
                px: 3, py: 2,
                background: 'linear-gradient(135deg, #f0f4ff, #e0e7ff)',
                borderBottom: '1px solid rgba(99,102,241,0.12)',
            }}>
                <Typography fontWeight={700} variant="subtitle2" color="#3730a3">{title}</Typography>
                {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
            </Box>
            <Box p={3}>{children}</Box>
        </Box>
    );

    const renderSetupBox = () => (
        <Box p={3}>
            <FormSection title="1. Create New Leave Type" subtitle="Define leave categories for your organization">
                <form onSubmit={handleCreateLeaveType}>
                    <Grid container spacing={2.5} alignItems="flex-end">
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth size="small"
                                label="Leave Type Name"
                                placeholder="e.g. Sick Leave, Casual Leave"
                                value={leaveTypeData.name}
                                onChange={(e) => setLeaveTypeData({ ...leaveTypeData, name: e.target.value })}
                                required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth size="small" type="number"
                                label="Default Total Days"
                                value={leaveTypeData.totalDays}
                                onChange={(e) => setLeaveTypeData({ ...leaveTypeData, totalDays: e.target.value })}
                                required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Button
                                variant="contained" type="submit" fullWidth
                                startIcon={<AddIcon />}
                                sx={{
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    borderRadius: 2,
                                    fontWeight: 700,
                                    boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
                                    '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' },
                                }}
                            >
                                Create
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </FormSection>

            <FormSection title="2. Grant Leave Balance to Employees" subtitle="Assign leave days to one or more employees">
                <form onSubmit={handleGrantBalance}>
                    <Grid container spacing={2.5} alignItems="flex-end">
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                select fullWidth size="small" label="Employee(s)"
                                value={setupData.employeeIds}
                                onChange={(e) => setSetupData({ ...setupData, employeeIds: e.target.value })}
                                required
                                SelectProps={{ multiple: true, displayEmpty: true }}
                                InputLabelProps={{ shrink: true }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            >
                                <MenuItem value="" disabled>Select Employees</MenuItem>
                                {employees.map(emp => (
                                    <MenuItem key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                select fullWidth size="small" label="Leave Type"
                                value={setupData.leaveTypeId}
                                onChange={(e) => setSetupData({ ...setupData, leaveTypeId: e.target.value })}
                                required
                                SelectProps={{ displayEmpty: true }}
                                InputLabelProps={{ shrink: true }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            >
                                <MenuItem value="" disabled>Select Leave Type</MenuItem>
                                {leaveTypes.map(type => (
                                    <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                fullWidth size="small" type="number" label="Days to Add"
                                inputProps={{ step: '0.5' }}
                                value={setupData.amount}
                                onChange={(e) => setSetupData({ ...setupData, amount: e.target.value })}
                                required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Button
                                variant="contained" type="submit" fullWidth
                                startIcon={<CardGiftcardIcon />}
                                sx={{
                                    background: 'linear-gradient(135deg, #14b8a6, #0891b2)',
                                    borderRadius: 2,
                                    fontWeight: 700,
                                    boxShadow: '0 4px 12px rgba(20,184,166,0.3)',
                                    '&:hover': { background: 'linear-gradient(135deg, #0d9488, #0284c7)' },
                                }}
                            >
                                Grant
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </FormSection>
        </Box>
    );

    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            {/* ── Hero Banner ──────────────────────────── */}
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
                <Box sx={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', bgcolor: 'rgba(99,102,241,0.12)' }} />
                <Box sx={{ position: 'absolute', bottom: -20, right: 120, width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(139,92,246,0.1)' }} />
                <Box position="relative" zIndex={1} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                    <Box>
                        <Typography variant="h5" fontWeight={800} letterSpacing={-0.3}>
                            Leave Requests
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.65, mt: 0.5 }}>
                            Approve, reject and manage employee leave requests
                        </Typography>
                    </Box>
                    <Box display="flex" gap={2}>
                        {[
                            { label: 'Total', value: leaveRequests.length },
                            { label: 'Pending', value: leaveRequests.filter(r => r.status === 'PENDING').length },
                            { label: 'Approved', value: leaveRequests.filter(r => r.status === 'APPROVED').length },
                        ].map(({ label, value }) => (
                            <Box key={label} textAlign="center"
                                sx={{ bgcolor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 2.5, px: 2.5, py: 1.2 }}>
                                <Typography fontWeight={800} variant="h6">{value}</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.65, fontSize: '0.7rem' }}>{label}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>

            {/* ── Tab Bar ──────────────────────────── */}
            <Box
                sx={{
                    bgcolor: 'white',
                    borderRadius: 3,
                    border: '1px solid rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
            >
                {/* Tabs */}
                <Box sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid rgba(0,0,0,0.06)', px: 2, pt: 1.5 }}>
                    <Tabs
                        value={tabIndex}
                        onChange={(_, v) => setTabIndex(v)}
                        sx={{
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                minHeight: 44,
                                color: 'text.secondary',
                                gap: 0.7,
                                borderRadius: '8px 8px 0 0',
                                transition: 'color 0.2s',
                            },
                            '& .Mui-selected': {
                                color: '#6366f1 !important',
                                fontWeight: 700,
                            },
                            '& .MuiTabs-indicator': {
                                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                                height: 3,
                                borderRadius: '3px 3px 0 0',
                            },
                        }}
                    >
                        {tabConfig.map((t, i) => (
                            <Tab
                                key={t.label}
                                label={t.label}
                                icon={t.icon}
                                iconPosition="start"
                            />
                        ))}
                    </Tabs>
                </Box>

                {/* Content */}
                {loading ? (
                    <Box display="flex" justifyContent="center" p={6}>
                        <CircularProgress sx={{ color: '#6366f1' }} />
                    </Box>
                ) : (
                    <Box>
                        {tabIndex === 0 && renderRequestsTable(true)}
                        {tabIndex === 1 && renderRequestsTable(false)}
                        {tabIndex === 2 && renderSetupBox()}
                        {tabIndex === 3 && renderBalancesTable()}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default AdminLeaveRequests;
