import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Card, CardContent,
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, TablePagination, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, CircularProgress,
    Breadcrumbs, Link, Divider, FormControlLabel, Switch, InputAdornment,
    Tooltip, Chip, Drawer, Grid, Avatar
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
import { toast } from 'react-toastify';
import api from '../../utils/api';

const EMPTY_FORM = {
    firstName: '', lastName: '', username: '', email: '', password: '',
    aadhaarNumber: '', panNumber: '',
    pfApplicable: true, pfUan: '', pfAccount: '',
    bankName: '', bankAccountNumber: '', ifscCode: '', accountHolderName: '',
    annualCtc: '', basicPercentage: '40', hraPercentage: '20', specialAllowancePercentage: '40'
};

const formatCurrency = (val) =>
    val != null
        ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)
        : '—';

const DetailRow = ({ label, value }) => (
    <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {label}
        </Typography>
        <Typography variant="body2" fontWeight={500} mt={0.3} color={value ? 'text.primary' : 'text.disabled'}>
            {value || 'Not set'}
        </Typography>
    </Box>
);

const SectionCard = ({ icon, title, color, children }) => (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', mb: 2 }}>
        <Box display="flex" alignItems="center" gap={1.5} px={2} py={1.5}
            sx={{ bgcolor: `${color}.50`, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ color: `${color}.main` }}>{icon}</Box>
            <Typography fontWeight={700} variant="subtitle2" color={`${color}.main`}
                sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>{title}</Typography>
        </Box>
        <Box p={2}>
            <Grid container spacing={2}>{children}</Grid>
        </Box>
    </Box>
);

const SectionTitle = ({ children }) => (
    <Typography variant="subtitle2" color="primary" fontWeight="bold" gutterBottom
        sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
        {children}
    </Typography>
);

const EmployeesList = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // View drawer
    const [viewEmployee, setViewEmployee] = useState(null);

    // Add dialog
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [addForm, setAddForm] = useState(EMPTY_FORM);
    const [addSubmitting, setAddSubmitting] = useState(false);

    // Edit dialog
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

    // ─── Pagination ───────────────────────────────────────────
    const handleChangePage = (_, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); };
    const paginatedEmployees = employees.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    // ─── Add Employee ─────────────────────────────────────────
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

    // ─── Edit Employee ────────────────────────────────────────
    const handleOpenEdit = (emp) => {
        setEditingEmployee(emp);
        setEditForm({
            firstName: emp.firstName || '',
            lastName: emp.lastName || '',
            email: emp.email || '',
            password: '',
            aadhaarNumber: emp.aadhaarNumber || '',
            panNumber: emp.panNumber || '',
            pfApplicable: emp.pfApplicable ?? true,
            pfUan: emp.pfUan || '',
            pfAccount: emp.pfAccount || '',
            bankName: emp.bankName || '',
            bankAccountNumber: emp.bankAccountNumber || '',
            ifscCode: emp.ifscCode || '',
            accountHolderName: emp.accountHolderName || '',
            annualCtc: emp.annualCtc ?? '',
            basicPercentage: emp.basicPercentage ?? '40',
            hraPercentage: emp.hraPercentage ?? '20',
            specialAllowancePercentage: emp.specialAllowancePercentage ?? '40',
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

    // ─── Delete Employee ──────────────────────────────────────
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

    // ─── Shared Form Fields ───────────────────────────────────
    const renderFormFields = (form, onChange, setPfFlag, isEdit = false) => (
        <Box display="flex" flexDirection="column" gap={4} mt={1}>
            <Box>
                <SectionTitle>Basic Information</SectionTitle>
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
                    <TextField name="firstName" label="First Name" fullWidth value={form.firstName} onChange={onChange} />
                    <TextField name="lastName" label="Last Name" fullWidth value={form.lastName} onChange={onChange} />
                    {!isEdit && <TextField name="username" label="Username" fullWidth value={form.username} onChange={onChange} />}
                    <TextField name="email" label="Email" type="email" fullWidth value={form.email} onChange={onChange} />
                    <TextField
                        name="password"
                        label={isEdit ? 'New Password (leave blank to keep current)' : 'Password'}
                        type="password" fullWidth value={form.password} onChange={onChange}
                    />
                </Box>
            </Box>
            <Divider />
            <Box>
                <SectionTitle>Statutory Identification</SectionTitle>
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
                    <TextField name="aadhaarNumber" label="Aadhaar Number" fullWidth value={form.aadhaarNumber}
                        onChange={onChange} inputProps={{ maxLength: 12 }} helperText="12-digit format" />
                    <TextField name="panNumber" label="PAN Number" fullWidth value={form.panNumber}
                        onChange={onChange} inputProps={{ maxLength: 10, style: { textTransform: 'uppercase' } }} helperText="e.g. ABCDE1234F" />
                </Box>
            </Box>
            <Divider />
            <Box>
                <SectionTitle>Bank & PF Details</SectionTitle>
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={1}>
                    <TextField name="bankName" label="Bank Name" fullWidth value={form.bankName} onChange={onChange} />
                    <TextField name="bankAccountNumber" label="Account Number" fullWidth value={form.bankAccountNumber} onChange={onChange} />
                    <TextField name="ifscCode" label="IFSC Code" fullWidth value={form.ifscCode} onChange={onChange} />
                    <TextField name="accountHolderName" label="Account Holder Name" fullWidth value={form.accountHolderName} onChange={onChange} />
                </Box>
                <Box mt={3} p={2} bgcolor="grey.50" borderRadius={2} border="1px solid" borderColor="divider">
                    <FormControlLabel
                        control={<Switch checked={form.pfApplicable} onChange={(e) => setPfFlag(e.target.checked)} color="primary" />}
                        label={<Typography fontWeight="medium">Provident Fund (PF) Applicable</Typography>}
                    />
                    {form.pfApplicable && (
                        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mt={2}>
                            <TextField name="pfUan" label="UAN Number" fullWidth value={form.pfUan} onChange={onChange} size="small" />
                            <TextField name="pfAccount" label="PF Account Number" fullWidth value={form.pfAccount} onChange={onChange} size="small" />
                        </Box>
                    )}
                </Box>
            </Box>
            <Divider />
            <Box>
                <SectionTitle>Salary Structure</SectionTitle>
                <Box display="grid" gridTemplateColumns="1fr" gap={2} mt={1}>
                    <TextField name="annualCtc" label="Annual CTC" type="number" fullWidth value={form.annualCtc}
                        onChange={onChange}
                        InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                    <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={2}>
                        <TextField name="basicPercentage" label="Basic (%)" type="number" value={form.basicPercentage}
                            onChange={onChange} size="small"
                            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
                        <TextField name="hraPercentage" label="HRA (%)" type="number" value={form.hraPercentage}
                            onChange={onChange} size="small"
                            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
                        <TextField name="specialAllowancePercentage" label="Special Allowance (%)" type="number"
                            value={form.specialAllowancePercentage} onChange={onChange} size="small"
                            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                        Total percentage should equal 100%. Special allowance accounts for the remaining balance.
                    </Typography>
                </Box>
            </Box>
        </Box>
    );

    return (
        <Box>
            <Breadcrumbs sx={{ mb: 2 }}>
                <Link underline="hover" color="inherit" href="/admin">Admin</Link>
                <Typography color="text.primary">Employees</Typography>
            </Breadcrumbs>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight="800" color="primary.main">Employee Management</Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                        {employees.length} total employee{employees.length !== 1 ? 's' : ''}
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<PersonAddIcon />}
                    onClick={() => setOpenAddDialog(true)} sx={{ borderRadius: 2, px: 3 }}>
                    Add Employee
                </Button>
            </Box>

            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 0 }}>
                    {loading ? (
                        <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>
                    ) : (
                        <>
                            <TableContainer>
                                <Table>
                                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Username</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Aadhaar</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>PAN</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Bank</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Annual CTC</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>PF</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {paginatedEmployees.map((emp) => (
                                            <TableRow key={emp.id} hover>
                                                <TableCell>
                                                    <Typography variant="caption" color="text.secondary">#{emp.id}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'primary.main' }}>
                                                            {emp.firstName?.[0]}{emp.lastName?.[0]}
                                                        </Avatar>
                                                        <Typography fontWeight={600} variant="body2">
                                                            {emp.firstName} {emp.lastName}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.secondary">@{emp.username}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{emp.email}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {emp.aadhaarNumber
                                                        ? <Typography variant="body2">••••{emp.aadhaarNumber.slice(-4)}</Typography>
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
                                                        ? <Typography variant="body2" fontWeight={600} color="success.main">
                                                            {formatCurrency(emp.annualCtc)}
                                                          </Typography>
                                                        : <Typography variant="caption" color="text.disabled">Not set</Typography>}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={emp.pfApplicable ? 'Yes' : 'No'}
                                                        color={emp.pfApplicable ? 'success' : 'default'} size="small" />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Tooltip title="View All Details">
                                                        <IconButton size="small" onClick={() => setViewEmployee(emp)}
                                                            sx={{ color: 'info.main', mr: 0.5 }}>
                                                            <VisibilityIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Edit Employee">
                                                        <IconButton color="primary" size="small" onClick={() => handleOpenEdit(emp)} sx={{ mr: 0.5 }}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete Employee">
                                                        <IconButton color="error" size="small" onClick={() => handleDeleteEmployee(emp.id)}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {employees.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={10} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                                    No employees found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Pagination */}
                            <TablePagination
                                component="div"
                                count={employees.length}
                                page={page}
                                onPageChange={handleChangePage}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                rowsPerPageOptions={[5, 10, 25, 50]}
                                sx={{ borderTop: '1px solid', borderColor: 'divider' }}
                            />
                        </>
                    )}
                </CardContent>
            </Card>

            {/* ── View All Details Drawer ───────────────────────────── */}
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
                    }
                }}
            >
                {viewEmployee && (
                    <Box display="flex" flexDirection="column" height="100%">
                        {/* Drawer Header */}
                        <Box sx={{ bgcolor: 'primary.main', color: 'white', px: 3, py: 2.5 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Avatar sx={{ width: 48, height: 48, bgcolor: 'white', color: 'primary.main', fontWeight: 700, fontSize: 18 }}>
                                        {viewEmployee.firstName?.[0]}{viewEmployee.lastName?.[0]}
                                    </Avatar>
                                    <Box>
                                        <Typography fontWeight={800} variant="h6">
                                            {viewEmployee.firstName} {viewEmployee.lastName}
                                        </Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.85 }}>
                                            @{viewEmployee.username} · ID #{viewEmployee.id}
                                        </Typography>
                                    </Box>
                                </Box>
                                <IconButton onClick={() => setViewEmployee(null)} sx={{ color: 'white' }}>
                                    <CloseIcon />
                                </IconButton>
                            </Box>
                        </Box>

                        {/* Drawer Body */}
                        <Box flex={1} overflow="auto" p={3}>

                            {/* Basic Info */}
                            <SectionCard icon={<BadgeIcon fontSize="small" />} title="Basic Information" color="primary">
                                <Grid item xs={6}><DetailRow label="First Name" value={viewEmployee.firstName} /></Grid>
                                <Grid item xs={6}><DetailRow label="Last Name" value={viewEmployee.lastName} /></Grid>
                                <Grid item xs={6}><DetailRow label="Username" value={`@${viewEmployee.username}`} /></Grid>
                                <Grid item xs={6}><DetailRow label="Email" value={viewEmployee.email} /></Grid>
                            </SectionCard>

                            {/* Statutory */}
                            <SectionCard icon={<BadgeIcon fontSize="small" />} title="Statutory Identification" color="warning">
                                <Grid item xs={6}><DetailRow label="Aadhaar Number" value={viewEmployee.aadhaarNumber} /></Grid>
                                <Grid item xs={6}><DetailRow label="PAN Number" value={viewEmployee.panNumber} /></Grid>
                            </SectionCard>

                            {/* Bank Details */}
                            <SectionCard icon={<AccountBalanceIcon fontSize="small" />} title="Bank Details" color="info">
                                <Grid item xs={6}><DetailRow label="Bank Name" value={viewEmployee.bankName} /></Grid>
                                <Grid item xs={6}><DetailRow label="Account Holder" value={viewEmployee.accountHolderName} /></Grid>
                                <Grid item xs={6}><DetailRow label="Account Number" value={viewEmployee.bankAccountNumber} /></Grid>
                                <Grid item xs={6}><DetailRow label="IFSC Code" value={viewEmployee.ifscCode} /></Grid>
                            </SectionCard>

                            {/* PF Details */}
                            <SectionCard icon={<SavingsIcon fontSize="small" />} title="PF Details" color="success">
                                <Grid item xs={12}>
                                    <Chip label={viewEmployee.pfApplicable ? 'PF Applicable' : 'PF Not Applicable'}
                                        color={viewEmployee.pfApplicable ? 'success' : 'default'} size="small" sx={{ mb: 1 }} />
                                </Grid>
                                {viewEmployee.pfApplicable && (
                                    <>
                                        <Grid item xs={6}><DetailRow label="UAN Number" value={viewEmployee.pfUan} /></Grid>
                                        <Grid item xs={6}><DetailRow label="PF Account" value={viewEmployee.pfAccount} /></Grid>
                                    </>
                                )}
                            </SectionCard>

                            {/* Salary Structure */}
                            <SectionCard icon={<PaymentsIcon fontSize="small" />} title="Salary Structure" color="secondary">
                                <Grid item xs={12}>
                                    <DetailRow label="Annual CTC" value={formatCurrency(viewEmployee.annualCtc)} />
                                </Grid>
                                <Grid item xs={4}>
                                    <DetailRow label="Basic" value={viewEmployee.basicPercentage != null ? `${viewEmployee.basicPercentage}%` : null} />
                                </Grid>
                                <Grid item xs={4}>
                                    <DetailRow label="HRA" value={viewEmployee.hraPercentage != null ? `${viewEmployee.hraPercentage}%` : null} />
                                </Grid>
                                <Grid item xs={4}>
                                    <DetailRow label="Special Allowance" value={viewEmployee.specialAllowancePercentage != null ? `${viewEmployee.specialAllowancePercentage}%` : null} />
                                </Grid>
                                {viewEmployee.annualCtc && (
                                    <Grid item xs={12}>
                                        <Box sx={{ bgcolor: 'grey.50', borderRadius: 1.5, p: 1.5, mt: 1 }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Monthly Breakdown</Typography>
                                            <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={1} mt={1}>
                                                {[
                                                    { label: 'Basic', pct: viewEmployee.basicPercentage ?? 40 },
                                                    { label: 'HRA', pct: viewEmployee.hraPercentage ?? 20 },
                                                    { label: 'Special', pct: viewEmployee.specialAllowancePercentage ?? 40 },
                                                ].map(({ label, pct }) => (
                                                    <Box key={label} textAlign="center" sx={{ bgcolor: 'white', borderRadius: 1, p: 1, border: '1px solid', borderColor: 'divider' }}>
                                                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                                                        <Typography variant="body2" fontWeight={700} color="primary.main">
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

                        {/* Drawer Footer */}
                        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
                            <Button fullWidth variant="outlined" onClick={() => { setViewEmployee(null); handleOpenEdit(viewEmployee); }}
                                startIcon={<EditIcon />}>
                                Edit Employee
                            </Button>
                            <Button fullWidth variant="outlined" color="error"
                                onClick={() => { setViewEmployee(null); handleDeleteEmployee(viewEmployee.id); }}
                                startIcon={<DeleteIcon />}>
                                Delete
                            </Button>
                        </Box>
                    </Box>
                )}
            </Drawer>

            {/* ── Add Employee Dialog ───────────────────────────── */}
            <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 'bold', bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                    Add New Employee
                </DialogTitle>
                <DialogContent sx={{ p: 4 }}>
                    {renderFormFields(addForm, handleAddChange, (val) => setAddForm(f => ({ ...f, pfApplicable: val })), false)}
                </DialogContent>
                <DialogActions sx={{ p: 3, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => setOpenAddDialog(false)} color="inherit" sx={{ fontWeight: 'bold' }}>Cancel</Button>
                    <Button onClick={handleAddEmployee} variant="contained"
                        disabled={addSubmitting || !addForm.username || !addForm.email || !addForm.password || !addForm.annualCtc}
                        sx={{ borderRadius: 2, px: 4, fontWeight: 'bold' }}>
                        {addSubmitting ? 'Saving...' : 'Save Employee'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Edit Employee Dialog ──────────────────────────── */}
            <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
                    Edit Employee — {editingEmployee?.firstName} {editingEmployee?.lastName}
                    <Typography variant="caption" sx={{ display: 'block', opacity: 0.8, mt: 0.5 }}>
                        @{editingEmployee?.username} · ID #{editingEmployee?.id}
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ p: 4 }}>
                    {renderFormFields(editForm, handleEditChange, (val) => setEditForm(f => ({ ...f, pfApplicable: val })), true)}
                </DialogContent>
                <DialogActions sx={{ p: 3, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button onClick={() => setOpenEditDialog(false)} color="inherit" sx={{ fontWeight: 'bold' }}>Cancel</Button>
                    <Button onClick={handleUpdateEmployee} variant="contained" disabled={editSubmitting}
                        sx={{ borderRadius: 2, px: 4, fontWeight: 'bold' }}>
                        {editSubmitting ? 'Updating...' : 'Update Employee'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EmployeesList;
