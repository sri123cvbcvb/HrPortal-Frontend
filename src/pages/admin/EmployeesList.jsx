import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Card, CardContent,
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, TablePagination, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, CircularProgress,
    Divider, FormControlLabel, Switch, InputAdornment,
    Tooltip, Chip, Drawer, Grid, Avatar, InputBase
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BadgeIcon from '@mui/icons-material/Badge';
import SavingsIcon from '@mui/icons-material/Savings';
import PaymentsIcon from '@mui/icons-material/Payments';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import GroupIcon from '@mui/icons-material/Group';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const EMPTY_FORM = {
    firstName: '', lastName: '', username: '', email: '', password: '',
    dateOfJoining: '', dateOfExit: '',
    aadhaarNumber: '', panNumber: '',
    pfApplicable: true, pfUan: '', pfAccount: '',
    bankName: '', bankAccountNumber: '', ifscCode: '', accountHolderName: '',
    annualCtc: '', basicPercentage: '40', hraPercentage: '20', specialAllowancePercentage: '40'
};

const formatCurrency = (val) =>
    val != null
        ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)
        : '—';

// ── Gradient avatar using name hash ─────────────────────────────
const GradientAvatar = ({ firstName, lastName, size = 36 }) => {
    const name = `${firstName || ''}${lastName || ''}`;
    const palettes = [
        ['#6366f1', '#8b5cf6'],
        ['#ec4899', '#f43f5e'],
        ['#14b8a6', '#06b6d4'],
        ['#f59e0b', '#ef4444'],
        ['#22c55e', '#16a34a'],
        ['#8b5cf6', '#a855f7'],
        ['#0ea5e9', '#6366f1'],
    ];
    const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const [c1, c2] = palettes[hash % palettes.length];
    const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase();
    return (
        <Avatar
            sx={{
                width: size,
                height: size,
                background: `linear-gradient(135deg, ${c1}, ${c2})`,
                fontSize: size * 0.38,
                fontWeight: 700,
                flexShrink: 0,
                boxShadow: `0 3px 8px ${c1}55`,
            }}
        >
            {initials || '?'}
        </Avatar>
    );
};

const DetailRow = ({ label, value }) => (
    <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600}
            sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.65rem' }}>
            {label}
        </Typography>
        <Typography variant="body2" fontWeight={500} mt={0.3} color={value ? 'text.primary' : 'text.disabled'}>
            {value || 'Not set'}
        </Typography>
    </Box>
);

const SectionCard = ({ icon, title, color, children }) => (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, overflow: 'hidden', mb: 2 }}>
        <Box display="flex" alignItems="center" gap={1.5} px={2} py={1.5}
            sx={{ background: `linear-gradient(135deg, ${color}10, ${color}18)`, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{
                width: 28, height: 28, borderRadius: 1.5,
                background: `linear-gradient(135deg, ${color}, ${color}aa)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
            }}>
                {React.cloneElement(icon, { style: { fontSize: 15 } })}
            </Box>
            <Typography fontWeight={700} variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1, color }}>
                {title}
            </Typography>
        </Box>
        <Box p={2}><Grid container spacing={2}>{children}</Grid></Box>
    </Box>
);

const SectionTitle = ({ children }) => (
    <Typography variant="caption" fontWeight={700} gutterBottom
        sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1.5, display: 'block', color: '#6366f1' }}>
        {children}
    </Typography>
);

const ThCell = ({ children, align }) => (
    <TableCell align={align} sx={{
        fontWeight: 700,
        fontSize: '0.7rem',
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

const EmployeesList = () => {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [viewEmployee, setViewEmployee] = useState(null);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [addForm, setAddForm] = useState(EMPTY_FORM);
    const [addSubmitting, setAddSubmitting] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [editForm, setEditForm] = useState(EMPTY_FORM);
    const [editSubmitting, setEditSubmitting] = useState(false);

    useEffect(() => { fetchEmployees(); }, []);

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/admin/employees');
            setEmployees(res.data);
        } catch {
            toast.error('Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        `${emp.firstName} ${emp.lastName} ${emp.email} ${emp.username}`.toLowerCase().includes(search.toLowerCase())
    );
    const handleChangePage = (_, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); };
    const paginatedEmployees = filteredEmployees.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const handleAddChange = (e) => setAddForm({ ...addForm, [e.target.name]: e.target.value });

    const handleAddEmployee = async () => {
        try {
            setAddSubmitting(true);
            await api.post('/admin/employees', addForm);
            toast.success('Employee added successfully');
            setOpenAddDialog(false);
            setAddForm(EMPTY_FORM);
            fetchEmployees();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add employee');
        } finally {
            setAddSubmitting(false);
        }
    };

    const handleOpenEdit = (emp) => {
        setEditingEmployee(emp);
        setEditForm({
            firstName: emp.firstName || '', lastName: emp.lastName || '',
            email: emp.email || '', password: '',
            dateOfJoining: emp.dateOfJoining || '', dateOfExit: emp.dateOfExit || '',
            aadhaarNumber: emp.aadhaarNumber || '', panNumber: emp.panNumber || '',
            pfApplicable: emp.pfApplicable ?? true, pfUan: emp.pfUan || '', pfAccount: emp.pfAccount || '',
            bankName: emp.bankName || '', bankAccountNumber: emp.bankAccountNumber || '',
            ifscCode: emp.ifscCode || '', accountHolderName: emp.accountHolderName || '',
            annualCtc: emp.annualCtc ?? '', basicPercentage: emp.basicPercentage ?? '40',
            hraPercentage: emp.hraPercentage ?? '20', specialAllowancePercentage: emp.specialAllowancePercentage ?? '40',
        });
        setOpenEditDialog(true);
    };

    const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });

    const handleUpdateEmployee = async () => {
        try {
            setEditSubmitting(true);
            await api.put(`/admin/employees/${editingEmployee.id}`, editForm);
            toast.success('Employee updated successfully!');
            setOpenEditDialog(false);
            fetchEmployees();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update employee');
        } finally {
            setEditSubmitting(false);
        }
    };

    const handleDeleteEmployee = async (id) => {
        if (window.confirm('Are you sure you want to delete this employee?')) {
            try {
                await api.delete(`/admin/employees/${id}`);
                toast.success('Employee deleted');
                fetchEmployees();
            } catch {
                toast.error('Failed to delete employee');
            }
        }
    };

    const renderFormFields = (form, onChange, setPfFlag, isEdit = false) => (
        <Box display="flex" flexDirection="column" gap={3} mt={1}>
            <Box>
                <SectionTitle>Basic Information</SectionTitle>
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
                    <TextField name="firstName" label="First Name" fullWidth size="small" value={form.firstName} onChange={onChange}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    <TextField name="lastName" label="Last Name" fullWidth size="small" value={form.lastName} onChange={onChange}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    {!isEdit && <TextField name="username" label="Username" fullWidth size="small" value={form.username} onChange={onChange}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />}
                    <TextField name="email" label="Email" type="email" fullWidth size="small" value={form.email} onChange={onChange}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    <TextField name="password" label={isEdit ? 'New Password (blank = keep)' : 'Password'}
                        type="password" fullWidth size="small" value={form.password} onChange={onChange}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                </Box>
            </Box>
            <Divider />
            {/* ── Employment Dates ── */}
            <Box>
                <SectionTitle>Employment Details</SectionTitle>
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
                    <TextField
                        name="dateOfJoining"
                        label="Date of Joining"
                        type="date"
                        fullWidth size="small"
                        value={form.dateOfJoining || ''}
                        onChange={onChange}
                        InputLabelProps={{ shrink: true }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <TextField
                        name="dateOfExit"
                        label="Date of Exit"
                        type="date"
                        fullWidth size="small"
                        value={form.dateOfExit || ''}
                        onChange={onChange}
                        InputLabelProps={{ shrink: true }}
                        helperText="Leave blank if currently employed"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                </Box>
            </Box>
            <Divider />
            <Box>
                <SectionTitle>Statutory Identification</SectionTitle>
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
                    <TextField name="aadhaarNumber" label="Aadhaar Number" fullWidth size="small" value={form.aadhaarNumber}
                        onChange={onChange} inputProps={{ maxLength: 12 }} helperText="12-digit format"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    <TextField name="panNumber" label="PAN Number" fullWidth size="small" value={form.panNumber}
                        onChange={onChange} inputProps={{ maxLength: 10, style: { textTransform: 'uppercase' } }} helperText="e.g. ABCDE1234F"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                </Box>
            </Box>
            <Divider />
            <Box>
                <SectionTitle>Bank & PF Details</SectionTitle>
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
                    <TextField name="bankName" label="Bank Name" fullWidth size="small" value={form.bankName} onChange={onChange}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    <TextField name="bankAccountNumber" label="Account Number" fullWidth size="small" value={form.bankAccountNumber} onChange={onChange}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    <TextField name="ifscCode" label="IFSC Code" fullWidth size="small" value={form.ifscCode} onChange={onChange}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    <TextField name="accountHolderName" label="Account Holder Name" fullWidth size="small" value={form.accountHolderName} onChange={onChange}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                </Box>
                <Box mt={2.5} p={2} bgcolor="grey.50" borderRadius={2} border="1px solid" borderColor="divider">
                    <FormControlLabel
                        control={<Switch checked={form.pfApplicable} onChange={(e) => setPfFlag(e.target.checked)} color="primary" />}
                        label={<Typography fontWeight={600} variant="body2">Provident Fund (PF) Applicable</Typography>}
                    />
                    {form.pfApplicable && (
                        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={2}>
                            <TextField name="pfUan" label="UAN Number" fullWidth size="small" value={form.pfUan} onChange={onChange}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                            <TextField name="pfAccount" label="PF Account Number" fullWidth size="small" value={form.pfAccount} onChange={onChange}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        </Box>
                    )}
                </Box>
            </Box>
            <Divider />
            <Box>
                <SectionTitle>Salary Structure</SectionTitle>
                <Box display="grid" gridTemplateColumns="1fr" gap={2} mt={1}>
                    <TextField name="annualCtc" label="Annual CTC" type="number" fullWidth size="small" value={form.annualCtc}
                        onChange={onChange}
                        InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={2}>
                        <TextField name="basicPercentage" label="Basic (%)" type="number" size="small" value={form.basicPercentage} onChange={onChange}
                            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        <TextField name="hraPercentage" label="HRA (%)" type="number" size="small" value={form.hraPercentage} onChange={onChange}
                            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                        <TextField name="specialAllowancePercentage" label="Special Allowance (%)" type="number" size="small"
                            value={form.specialAllowancePercentage} onChange={onChange}
                            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                        Total percentage should equal 100%.
                    </Typography>
                </Box>
            </Box>
        </Box>
    );

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
                <Box sx={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', bgcolor: 'rgba(99,102,241,0.12)' }} />
                <Box sx={{ position: 'absolute', bottom: -20, right: 150, width: 100, height: 100, borderRadius: '50%', bgcolor: 'rgba(139,92,246,0.1)' }} />
                <Box position="relative" zIndex={1} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                    <Box>
                        <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
                            <Box sx={{
                                width: 36, height: 36, borderRadius: 2,
                                background: 'rgba(255,255,255,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <GroupIcon sx={{ fontSize: 20 }} />
                            </Box>
                            <Typography variant="h5" fontWeight={800} letterSpacing={-0.3}>
                                Employee Management
                            </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ opacity: 0.65 }}>
                            {employees.length} total employee{employees.length !== 1 ? 's' : ''} · Add, edit, and manage your team
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<PersonAddIcon />}
                        onClick={() => setOpenAddDialog(true)}
                        sx={{
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            fontWeight: 700,
                            borderRadius: 2.5,
                            px: 3,
                            boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                            '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 6px 20px rgba(99,102,241,0.5)' },
                        }}
                    >
                        Add Employee
                    </Button>
                </Box>
            </Box>

            {/* ── Search Bar ──────────────────────────────── */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    bgcolor: 'white',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 2.5,
                    px: 2,
                    py: 1,
                    mb: 3,
                    maxWidth: 440,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
            >
                <SearchIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                <InputBase
                    placeholder="Search by name, email or username..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    sx={{ flex: 1, fontSize: '0.875rem' }}
                />
                {search && (
                    <Typography
                        variant="caption"
                        sx={{ color: '#6366f1', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}
                        onClick={() => setSearch('')}
                    >
                        Clear
                    </Typography>
                )}
            </Box>

            {/* ── Table ──────────────────────────────── */}
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <CardContent sx={{ p: 0 }}>
                    {loading ? (
                        <Box display="flex" justifyContent="center" p={6}><CircularProgress sx={{ color: '#6366f1' }} /></Box>
                    ) : (
                        <>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <ThCell>Employee</ThCell>
                                            <ThCell>Username</ThCell>
                                            <ThCell>Email</ThCell>
                                            <ThCell>Joining Date</ThCell>
                                            <ThCell>Aadhaar</ThCell>
                                            <ThCell>PAN</ThCell>
                                            <ThCell>Bank</ThCell>
                                            <ThCell>Annual CTC</ThCell>
                                            <ThCell>PF</ThCell>
                                            <ThCell align="right">Actions</ThCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {paginatedEmployees.map((emp, idx) => (
                                            <TableRow
                                                key={emp.id}
                                                sx={{
                                                    bgcolor: idx % 2 === 0 ? 'white' : '#f8fafc',
                                                    transition: 'background-color 0.15s',
                                                    '&:hover': { bgcolor: '#eef2ff' },
                                                }}
                                            >
                                                <TableCell>
                                                    <Box display="flex" alignItems="center" gap={1.5}>
                                                        <GradientAvatar firstName={emp.firstName} lastName={emp.lastName} />
                                                        <Box>
                                                            <Typography fontWeight={700} variant="body2" sx={{ lineHeight: 1.2 }}>
                                                                {emp.firstName} {emp.lastName}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>
                                                                ID #{emp.id}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                                        @{emp.username}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{emp.email}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {emp.dateOfJoining ? (
                                                        <Box>
                                                            <Chip
                                                                label={new Date(emp.dateOfJoining).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                size="small"
                                                                sx={{ bgcolor: '#eef2ff', color: '#4338ca', fontWeight: 600, fontSize: '0.7rem' }}
                                                            />
                                                            {emp.dateOfExit && (
                                                                <Typography variant="caption" color="error.main" display="block" sx={{ mt: 0.3, fontSize: '0.65rem' }}>
                                                                    Exit: {new Date(emp.dateOfExit).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="caption" color="text.disabled">Not set</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {emp.aadhaarNumber
                                                        ? <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>••••{emp.aadhaarNumber.slice(-4)}</Typography>
                                                        : <Typography variant="caption" color="text.disabled">Not set</Typography>}
                                                </TableCell>
                                                <TableCell>
                                                    {emp.panNumber
                                                        ? <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{emp.panNumber}</Typography>
                                                        : <Typography variant="caption" color="text.disabled">Not set</Typography>}
                                                </TableCell>
                                                <TableCell>
                                                    {emp.bankName
                                                        ? <Typography variant="body2">{emp.bankName}</Typography>
                                                        : <Typography variant="caption" color="text.disabled">Not set</Typography>}
                                                </TableCell>
                                                <TableCell>
                                                    {emp.annualCtc
                                                        ? <Chip label={formatCurrency(emp.annualCtc)} size="small"
                                                            sx={{ bgcolor: '#dcfce7', color: '#16a34a', fontWeight: 700, fontSize: '0.72rem' }} />
                                                        : <Typography variant="caption" color="text.disabled">Not set</Typography>}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={emp.pfApplicable ? 'PF On' : 'PF Off'}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: emp.pfApplicable ? '#dbeafe' : '#f1f5f9',
                                                            color: emp.pfApplicable ? '#1d4ed8' : '#64748b',
                                                            fontWeight: 700,
                                                            fontSize: '0.68rem',
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Box display="flex" justifyContent="flex-end" gap={0.5}>
                                                        <Tooltip title="View Payslips">
                                                            <IconButton size="small" onClick={() => navigate(`/admin/payroll?employeeId=${emp.id}`)}
                                                                sx={{ bgcolor: '#f5f3ff', color: '#7c3aed', '&:hover': { bgcolor: '#ddd6fe' }, width: 28, height: 28 }}>
                                                                <ReceiptLongIcon sx={{ fontSize: 14 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="View Details">
                                                            <IconButton size="small" onClick={() => setViewEmployee(emp)}
                                                                sx={{ bgcolor: '#eef2ff', color: '#6366f1', '&:hover': { bgcolor: '#c7d2fe' }, width: 28, height: 28 }}>
                                                                <VisibilityIcon sx={{ fontSize: 14 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Edit Employee">
                                                            <IconButton size="small" onClick={() => handleOpenEdit(emp)}
                                                                sx={{ bgcolor: '#f0fdf4', color: '#16a34a', '&:hover': { bgcolor: '#bbf7d0' }, width: 28, height: 28 }}>
                                                                <EditIcon sx={{ fontSize: 14 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete Employee">
                                                            <IconButton size="small" onClick={() => handleDeleteEmployee(emp.id)}
                                                                sx={{ bgcolor: '#fee2e2', color: '#dc2626', '&:hover': { bgcolor: '#fecaca' }, width: 28, height: 28 }}>
                                                                <DeleteIcon sx={{ fontSize: 14 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredEmployees.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={10} align="center" sx={{ py: 7 }}>
                                                    <GroupIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                                                    <Typography color="text.secondary" variant="body2">
                                                        {search ? `No employees matching "${search}"` : 'No employees found.'}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                component="div"
                                count={filteredEmployees.length}
                                page={page}
                                onPageChange={handleChangePage}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                rowsPerPageOptions={[5, 10, 25, 50]}
                                sx={{ borderTop: '1px solid rgba(0,0,0,0.06)', bgcolor: '#f8fafc' }}
                            />
                        </>
                    )}
                </CardContent>
            </Card>

            {/* ── View Drawer ──────────────────────────────── */}
            <Drawer
                anchor="right"
                open={Boolean(viewEmployee)}
                onClose={() => setViewEmployee(null)}
                PaperProps={{
                    sx: {
                        width: { xs: '100%', sm: 480 },
                        p: 0,
                        top: '64px',
                        height: 'calc(100% - 64px)',
                        border: 'none',
                    }
                }}
            >
                {viewEmployee && (
                    <Box display="flex" flexDirection="column" height="100%">
                        {/* Header */}
                        <Box sx={{
                            background: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
                            color: 'white', px: 3, py: 3,
                        }}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                <Box display="flex" alignItems="center" gap={2}>
                                    <GradientAvatar firstName={viewEmployee.firstName} lastName={viewEmployee.lastName} size={52} />
                                    <Box>
                                        <Typography fontWeight={800} variant="h6" sx={{ lineHeight: 1.1 }}>
                                            {viewEmployee.firstName} {viewEmployee.lastName}
                                        </Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.6 }}>
                                            @{viewEmployee.username} · ID #{viewEmployee.id}
                                        </Typography>
                                    </Box>
                                </Box>
                                <IconButton onClick={() => setViewEmployee(null)} sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: 'white' } }}>
                                    <CloseIcon />
                                </IconButton>
                            </Box>
                        </Box>

                        {/* Body */}
                        <Box flex={1} overflow="auto" p={2.5}>
                            <SectionCard icon={<BadgeIcon />} title="Basic Information" color="#6366f1">
                                <Grid item xs={6}><DetailRow label="First Name" value={viewEmployee.firstName} /></Grid>
                                <Grid item xs={6}><DetailRow label="Last Name" value={viewEmployee.lastName} /></Grid>
                                <Grid item xs={6}><DetailRow label="Username" value={`@${viewEmployee.username}`} /></Grid>
                                <Grid item xs={6}><DetailRow label="Email" value={viewEmployee.email} /></Grid>
                            </SectionCard>
                            <SectionCard icon={<BadgeIcon />} title="Employment Details" color="#0ea5e9">
                                <Grid item xs={6}>
                                    <DetailRow
                                        label="Date of Joining"
                                        value={viewEmployee.dateOfJoining
                                            ? new Date(viewEmployee.dateOfJoining).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
                                            : null}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <DetailRow
                                        label="Date of Exit"
                                        value={viewEmployee.dateOfExit
                                            ? new Date(viewEmployee.dateOfExit).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
                                            : 'Currently Employed'}
                                    />
                                </Grid>
                            </SectionCard>
                            <SectionCard icon={<BadgeIcon />} title="Statutory Identification" color="#f59e0b">
                                <Grid item xs={6}><DetailRow label="Aadhaar Number" value={viewEmployee.aadhaarNumber} /></Grid>
                                <Grid item xs={6}><DetailRow label="PAN Number" value={viewEmployee.panNumber} /></Grid>
                            </SectionCard>
                            <SectionCard icon={<AccountBalanceIcon />} title="Bank Details" color="#0ea5e9">
                                <Grid item xs={6}><DetailRow label="Bank Name" value={viewEmployee.bankName} /></Grid>
                                <Grid item xs={6}><DetailRow label="Account Holder" value={viewEmployee.accountHolderName} /></Grid>
                                <Grid item xs={6}><DetailRow label="Account Number" value={viewEmployee.bankAccountNumber} /></Grid>
                                <Grid item xs={6}><DetailRow label="IFSC Code" value={viewEmployee.ifscCode} /></Grid>
                            </SectionCard>
                            <SectionCard icon={<SavingsIcon />} title="PF Details" color="#22c55e">
                                <Grid item xs={12}>
                                    <Chip
                                        label={viewEmployee.pfApplicable ? 'PF Applicable' : 'PF Not Applicable'}
                                        size="small"
                                        sx={{
                                            bgcolor: viewEmployee.pfApplicable ? '#dcfce7' : '#f1f5f9',
                                            color: viewEmployee.pfApplicable ? '#16a34a' : '#64748b',
                                            fontWeight: 700, mb: 1,
                                        }}
                                    />
                                </Grid>
                                {viewEmployee.pfApplicable && (
                                    <>
                                        <Grid item xs={6}><DetailRow label="UAN Number" value={viewEmployee.pfUan} /></Grid>
                                        <Grid item xs={6}><DetailRow label="PF Account" value={viewEmployee.pfAccount} /></Grid>
                                    </>
                                )}
                            </SectionCard>
                            <SectionCard icon={<PaymentsIcon />} title="Salary Structure" color="#8b5cf6">
                                <Grid item xs={12}><DetailRow label="Annual CTC" value={formatCurrency(viewEmployee.annualCtc)} /></Grid>
                                <Grid item xs={4}><DetailRow label="Basic" value={viewEmployee.basicPercentage != null ? `${viewEmployee.basicPercentage}%` : null} /></Grid>
                                <Grid item xs={4}><DetailRow label="HRA" value={viewEmployee.hraPercentage != null ? `${viewEmployee.hraPercentage}%` : null} /></Grid>
                                <Grid item xs={4}><DetailRow label="Special Allowance" value={viewEmployee.specialAllowancePercentage != null ? `${viewEmployee.specialAllowancePercentage}%` : null} /></Grid>
                                {viewEmployee.annualCtc && (
                                    <Grid item xs={12}>
                                        <Box sx={{ bgcolor: '#f8fafc', borderRadius: 2, p: 1.5, mt: 1, border: '1px solid rgba(0,0,0,0.06)' }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Monthly Breakdown</Typography>
                                            <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={1} mt={1}>
                                                {[
                                                    { label: 'Basic', pct: viewEmployee.basicPercentage ?? 40 },
                                                    { label: 'HRA', pct: viewEmployee.hraPercentage ?? 20 },
                                                    { label: 'Special', pct: viewEmployee.specialAllowancePercentage ?? 40 },
                                                ].map(({ label, pct }) => (
                                                    <Box key={label} textAlign="center"
                                                        sx={{ bgcolor: 'white', borderRadius: 1.5, p: 1, border: '1px solid rgba(0,0,0,0.06)' }}>
                                                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                                                        <Typography variant="body2" fontWeight={700} color="#6366f1">
                                                            {formatCurrency((viewEmployee.annualCtc / 12) * pct / 100)}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Box>
                                    </Grid>
                                )}
                            </SectionCard>
                        </Box>

                        {/* Footer */}
                        <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', gap: 1, bgcolor: '#f8fafc' }}>
                            <Button fullWidth variant="outlined" onClick={() => { setViewEmployee(null); handleOpenEdit(viewEmployee); }}
                                startIcon={<EditIcon />}
                                sx={{ borderRadius: 2, fontWeight: 600, borderColor: '#6366f1', color: '#6366f1', '&:hover': { bgcolor: '#eef2ff' } }}>
                                Edit
                            </Button>
                            <Button fullWidth variant="outlined" color="error"
                                onClick={() => { setViewEmployee(null); handleDeleteEmployee(viewEmployee.id); }}
                                startIcon={<DeleteIcon />}
                                sx={{ borderRadius: 2, fontWeight: 600 }}>
                                Delete
                            </Button>
                        </Box>
                    </Box>
                )}
            </Drawer>

            {/* ── Add Employee Dialog ──────────────────────────────── */}
            <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth
                PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
                <DialogTitle sx={{
                    fontWeight: 800, fontSize: '1.1rem',
                    background: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
                    color: 'white',
                }}>
                    Add New Employee
                    <Typography variant="caption" sx={{ display: 'block', opacity: 0.55, mt: 0.3, fontWeight: 400 }}>
                        Fill in the details to onboard a new team member
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ p: 4 }}>
                    {renderFormFields(addForm, handleAddChange, (val) => setAddForm(f => ({ ...f, pfApplicable: val })), false)}
                </DialogContent>
                <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid rgba(0,0,0,0.06)', gap: 1 }}>
                    <Button onClick={() => setOpenAddDialog(false)} color="inherit" sx={{ fontWeight: 600, borderRadius: 2 }}>Cancel</Button>
                    <Button onClick={handleAddEmployee} variant="contained"
                        disabled={addSubmitting || !addForm.username || !addForm.email || !addForm.password || !addForm.annualCtc}
                        sx={{
                            borderRadius: 2, px: 4, fontWeight: 700,
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' },
                        }}>
                        {addSubmitting ? 'Saving...' : 'Save Employee'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Edit Employee Dialog ──────────────────────────────── */}
            <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth
                PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
                <DialogTitle sx={{
                    fontWeight: 800, fontSize: '1.1rem',
                    background: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
                    color: 'white',
                }}>
                    Edit Employee — {editingEmployee?.firstName} {editingEmployee?.lastName}
                    <Typography variant="caption" sx={{ display: 'block', opacity: 0.55, mt: 0.3, fontWeight: 400 }}>
                        @{editingEmployee?.username} · ID #{editingEmployee?.id}
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ p: 4 }}>
                    {renderFormFields(editForm, handleEditChange, (val) => setEditForm(f => ({ ...f, pfApplicable: val })), true)}
                </DialogContent>
                <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid rgba(0,0,0,0.06)', gap: 1 }}>
                    <Button onClick={() => setOpenEditDialog(false)} color="inherit" sx={{ fontWeight: 600, borderRadius: 2 }}>Cancel</Button>
                    <Button onClick={handleUpdateEmployee} variant="contained" disabled={editSubmitting}
                        sx={{
                            borderRadius: 2, px: 4, fontWeight: 700,
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' },
                        }}>
                        {editSubmitting ? 'Updating...' : 'Update Employee'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EmployeesList;
