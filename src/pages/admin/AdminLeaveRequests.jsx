import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Tooltip, CircularProgress, Chip, TextField,
    Grid, Button, Divider, Tabs, Tab, MenuItem
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const LeaveStatusChip = ({ status }) => {
    let color = 'default';
    if (status === 'APPROVED') color = 'success';
    else if (status === 'PENDING') color = 'warning';
    else if (status === 'REJECTED') color = 'error';

    return <Chip label={status} color={color} size="small" sx={{ fontWeight: 'bold' }} />;
};

const AdminLeaveRequests = () => {
    const [tabIndex, setTabIndex] = useState(0);
    const [loading, setLoading] = useState(false);

    // Core Data
    const [leaveRequests, setLeaveRequests] = useState([]);

    // Setup Data
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [allBalances, setAllBalances] = useState([]);

    // Setup Form
    const [setupData, setSetupData] = useState({ employeeIds: [], leaveTypeId: '', amount: '' });
    const [leaveTypeData, setLeaveTypeData] = useState({ name: '', totalDays: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [reqRes, typesRes, empRes, balRes] = await Promise.all([
                api.get('admin/leave-management/requests'),
                api.get('admin/leave-management/types'),
                api.get('admin/employees'),
                api.get('admin/leave-management/balances/all')
            ]);
            setLeaveRequests(reqRes.data);
            setLeaveTypes(typesRes.data);
            setEmployees(empRes.data);
            setAllBalances(balRes.data);
        } catch (err) {
            console.error("Error fetching admin leave data", err);
            // toast.error("Failed to load leave data"); // Silent fail if /users doesn't exist yet
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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
            toast.error("Please select at least one employee");
            return;
        }
        try {
            // Convert array to comma-separated string for @RequestParam List<Long>
            const idsStr = setupData.employeeIds.join(',');
            await api.post(`admin/leave-management/balances/grant?employeeIds=${idsStr}&leaveTypeId=${setupData.leaveTypeId}&amount=${setupData.amount}`);
            toast.success("Balance granted successfully!");
            setSetupData({ employeeIds: [], leaveTypeId: '', amount: '' });
            fetchData(); // Refresh balances table
        } catch (err) {
            toast.error("Failed to grant balance");
        }
    };

    const handleCreateLeaveType = async (e) => {
        e.preventDefault();
        try {
            await api.post(`admin/leave-management/types`, leaveTypeData);
            toast.success("Leave Type created successfully!");
            setLeaveTypeData({ name: '', totalDays: '' });
            fetchData(); // Refresh list to update dropdowns
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to create Leave Type";
            toast.error(typeof msg === 'string' ? msg : "An error occurred");
        }
    };

    const renderRequestsTable = (filterPendingOnly) => {
        const filtered = filterPendingOnly
            ? leaveRequests.filter(r => r.status === 'PENDING')
            : leaveRequests;

        if (filtered.length === 0) {
            return (
                <Box p={4} textAlign="center">
                    <Typography color="text.secondary">No requests found in this view.</Typography>
                </Box>
            );
        }

        return (
            <TableContainer>
                <Table>
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                        <TableRow>
                            <TableCell fontWeight="bold">Employee</TableCell>
                            <TableCell fontWeight="bold">Type</TableCell>
                            <TableCell fontWeight="bold">Dates</TableCell>
                            <TableCell fontWeight="bold">Sessions</TableCell>
                            <TableCell fontWeight="bold">Reason</TableCell>
                            <TableCell fontWeight="bold">Status</TableCell>
                            <TableCell fontWeight="bold" align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filtered.map(req => (
                            <TableRow key={req.id} hover>
                                <TableCell>
                                    <Typography variant="body2" fontWeight="bold">{req.employee.firstName} {req.employee.lastName}</Typography>
                                    <Typography variant="caption" color="text.secondary">{req.employee.email}</Typography>
                                </TableCell>
                                <TableCell>{req.leaveType.name}</TableCell>
                                <TableCell>
                                    {format(new Date(req.fromDate), 'dd MMM yyyy')} <br />
                                    to {format(new Date(req.toDate), 'dd MMM yyyy')}
                                </TableCell>
                                <TableCell>
                                    <Typography variant="caption" display="block">From: {req.sessionFrom}</Typography>
                                    <Typography variant="caption" display="block">To: {req.sessionTo}</Typography>
                                </TableCell>
                                <TableCell>{req.reason}</TableCell>
                                <TableCell><LeaveStatusChip status={req.status} /></TableCell>
                                <TableCell align="center">
                                    {req.status === 'PENDING' ? (
                                        <Box display="flex" justifyContent="center" gap={1}>
                                            <Tooltip title="Approve">
                                                <IconButton color="success" onClick={() => handleAction(req.id, 'approve')}>
                                                    <CheckCircleIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Reject">
                                                <IconButton color="error" onClick={() => handleAction(req.id, 'reject')}>
                                                    <CancelIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    ) : (
                                        <Typography variant="caption" color="text.secondary">Processed</Typography>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    const handleEditBalance = async (balanceId) => {
        const newAmt = prompt("Enter new remaining balance:");
        if (newAmt !== null && newAmt !== "") {
            try {
                await api.put(`admin/leave-management/balances/${balanceId}?remainingDays=${newAmt}`);
                toast.success("Balance updated");
                fetchData();
            } catch (err) { toast.error("Failed to update"); }
        }
    };

    const handleDeleteBalance = async (balanceId) => {
        if (window.confirm("Are you sure you want to delete this balance?")) {
            try {
                await api.delete(`admin/leave-management/balances/${balanceId}`);
                toast.success("Balance deleted");
                fetchData();
            } catch (err) { toast.error("Failed to delete"); }
        }
    };

    const renderBalancesTable = () => (
        <Box p={3}>
            <Typography variant="h6" gutterBottom>Employee Leave Balances</Typography>
            <TableContainer component={Paper} variant="outlined">
                <Table>
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                        <TableRow>
                            <TableCell fontWeight="bold">Employee Name</TableCell>
                            <TableCell fontWeight="bold">Leave Type</TableCell>
                            <TableCell fontWeight="bold">Total Granted</TableCell>
                            <TableCell fontWeight="bold">Used Leaves</TableCell>
                            <TableCell fontWeight="bold">Remaining Balance</TableCell>
                            <TableCell fontWeight="bold" align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {allBalances.map(bal => (
                            <TableRow key={bal.id} hover>
                                <TableCell>{bal.employee.firstName} {bal.employee.lastName}</TableCell>
                                <TableCell>{bal.leaveType.name}</TableCell>
                                <TableCell>{bal.totalGranted}</TableCell>
                                <TableCell>{bal.usedDays}</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: bal.remainingDays <= 0 ? 'error.main' : 'success.main' }}>
                                    {bal.remainingDays}
                                </TableCell>
                                <TableCell align="center">
                                    <Button size="small" variant="outlined" sx={{ mr: 1 }} onClick={() => handleEditBalance(bal.id)}>Edit</Button>
                                    <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteBalance(bal.id)}>Delete</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {allBalances.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center">No balances found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );

    const renderSetupBox = () => (
        <Box p={3}>
            {/* Create Leave Type Section */}
            <Typography variant="h6" gutterBottom>1. Create New Leave Type</Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleCreateLeaveType}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Leave Type Name (e.g. Sick Leave, Casual Leave)"
                            value={leaveTypeData.name}
                            onChange={(e) => setLeaveTypeData({ ...leaveTypeData, name: e.target.value })}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Default Total Days Allowed"
                            value={leaveTypeData.totalDays}
                            onChange={(e) => setLeaveTypeData({ ...leaveTypeData, totalDays: e.target.value })}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Button variant="contained" color="secondary" fullWidth type="submit" sx={{ height: 56 }}>
                            Create Type
                        </Button>
                    </Grid>
                </Grid>
            </form>

            <Box mt={6} mb={4}>
                <Divider />
            </Box>

            {/* Grant Balance Section */}
            <Typography variant="h6" gutterBottom>2. Grant Leave Balance to Employees</Typography>
            <Divider sx={{ mb: 3 }} />
            <form onSubmit={handleGrantBalance}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField
                            select
                            fullWidth
                            label="Employee(s)"
                            value={setupData.employeeIds}
                            onChange={(e) => setSetupData({ ...setupData, employeeIds: e.target.value })}
                            required
                            SelectProps={{ multiple: true, displayEmpty: true }}
                            InputLabelProps={{ shrink: true }}
                            sx={{ minWidth: 150 }}
                        >
                            <MenuItem value="" disabled>Select Employees</MenuItem>
                            {employees.map(emp => (
                                <MenuItem key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField
                            select
                            fullWidth
                            label="Leave Type"
                            value={setupData.leaveTypeId}
                            onChange={(e) => setSetupData({ ...setupData, leaveTypeId: e.target.value })}
                            required
                            SelectProps={{ displayEmpty: true }}
                            InputLabelProps={{ shrink: true }}
                            sx={{ minWidth: 150 }}
                        >
                            <MenuItem value="" disabled>Select Leave Type</MenuItem>
                            {leaveTypes.map(type => (
                                <MenuItem key={type.id} value={type.id}>{type.name}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Days to Add"
                            inputProps={{ step: "0.5" }}
                            value={setupData.amount}
                            onChange={(e) => setSetupData({ ...setupData, amount: e.target.value })}
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Button variant="contained" color="primary" fullWidth type="submit" sx={{ height: 56 }}>
                            Grant Balance
                        </Button>
                    </Grid>
                </Grid>
            </form>
        </Box>
    );

    return (
        <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
                Admin Leave Requests
            </Typography>

            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)} aria-label="admin leave tabs">
                        <Tab label="Pending Approvals" />
                        <Tab label="All Leave History" />
                        <Tab label="Setup & Config" />
                        <Tab label="Employee Balances" />
                    </Tabs>
                </Box>

                {loading ? (
                    <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>
                ) : (
                    <Box>
                        {tabIndex === 0 && renderRequestsTable(true)}
                        {tabIndex === 1 && renderRequestsTable(false)}
                        {tabIndex === 2 && renderSetupBox()}
                        {tabIndex === 3 && renderBalancesTable()}
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default AdminLeaveRequests;
