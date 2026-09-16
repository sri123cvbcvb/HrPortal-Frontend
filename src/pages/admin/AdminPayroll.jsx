import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Button, Card, CardContent,
    FormControl, InputLabel, Select, MenuItem, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, CircularProgress, Divider, Avatar,
    TextField, Autocomplete, Tooltip, IconButton, Dialog,
    DialogTitle, DialogContent, DialogActions, Grid
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PaidIcon from '@mui/icons-material/Paid';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PersonIcon from '@mui/icons-material/Person';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BusinessIcon from '@mui/icons-material/Business';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../utils/api';

const MONTH_NAMES = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const getMonthName = (m) => MONTH_NAMES[m] || `Month ${m}`;

const formatCurrency = (val) => {
    if (val == null || isNaN(val)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(val);
};

const numberToWords = (num) => {
    if (!num || isNaN(num)) return 'Zero Rupees Only';
    const a = [
        '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
        'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n) => {
        let str = '';
        if (n > 99) {
            str += a[Math.floor(n / 100)] + 'Hundred ';
            n %= 100;
        }
        if (n > 19) {
            str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
        } else if (n > 0) {
            str += a[n];
        }
        return str;
    };

    let n = Math.floor(num);
    if (n === 0) return 'Zero Rupees Only';
    let output = '';

    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    const remaining = n;

    if (crore > 0) output += inWords(crore) + 'Crore ';
    if (lakh > 0) output += inWords(lakh) + 'Lakh ';
    if (thousand > 0) output += inWords(thousand) + 'Thousand ';
    if (remaining > 0) output += inWords(remaining);

    return output.trim() + ' Rupees Only';
};

const GradientAvatar = ({ firstName, lastName, size = 42 }) => {
    const name = `${firstName || ''}${lastName || ''}`;
    const palettes = [
        ['#6366f1', '#8b5cf6'],
        ['#ec4899', '#f43f5e'],
        ['#14b8a6', '#06b6d4'],
        ['#f59e0b', '#ef4444'],
        ['#22c55e', '#16a34a'],
        ['#0ea5e9', '#6366f1'],
    ];
    const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const [c1, c2] = palettes[hash % palettes.length];
    const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join('').toUpperCase();
    return (
        <Avatar sx={{
            width: size, height: size,
            background: `linear-gradient(135deg, ${c1}, ${c2})`,
            fontSize: size * 0.38, fontWeight: 700, flexShrink: 0
        }}>
            {initials || '?'}
        </Avatar>
    );
};

const AdminPayroll = () => {
    const [searchParams] = useSearchParams();
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [payslips, setPayslips] = useState([]);
    const [currentPreviewPayslip, setCurrentPreviewPayslip] = useState(null);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [fetchingSlip, setFetchingSlip] = useState(false);

    // Batch run dialog
    const [batchOpen, setBatchOpen] = useState(false);
    const [batchMonth, setBatchMonth] = useState('');
    const [batchLoading, setBatchLoading] = useState(false);

    // 1. Fetch all employees
    useEffect(() => {
        const fetchEmployees = async () => {
            setLoadingEmployees(true);
            try {
                const res = await api.get('/admin/employees');
                const list = res.data || [];
                setEmployees(list);

                // Auto-select employee from URL param if present, else first
                const empIdParam = searchParams.get('employeeId');
                if (empIdParam) {
                    const match = list.find(e => String(e.id) === String(empIdParam));
                    if (match) setSelectedEmployee(match);
                    else if (list.length > 0) setSelectedEmployee(list[0]);
                } else if (list.length > 0) {
                    setSelectedEmployee(list[0]);
                }
            } catch {
                toast.error('Failed to load employees list');
            } finally {
                setLoadingEmployees(false);
            }
        };

        fetchEmployees();
    }, [searchParams]);

    // 2. Compute completed months strictly starting from selected employee's dateOfJoining
    const availablePeriods = useMemo(() => {
        if (!selectedEmployee) return [];

        const now = new Date();
        // Completed previous month (e.g. in Sept 2026, latest completed is August 2026)
        let endYear = now.getFullYear();
        let endMonth = now.getMonth(); // 0-based in JS
        if (endMonth === 0) {
            endMonth = 12;
            endYear -= 1;
        }

        // Determine start date based on employee's dateOfJoining
        let startYear = endYear;
        let startMonth = 1;

        if (selectedEmployee.dateOfJoining) {
            const dojParts = selectedEmployee.dateOfJoining.split('-');
            startYear = parseInt(dojParts[0], 10);
            startMonth = parseInt(dojParts[1], 10);
        }

        // Check dateOfExit if any
        if (selectedEmployee.dateOfExit) {
            const doeParts = selectedEmployee.dateOfExit.split('-');
            const exitYear = parseInt(doeParts[0], 10);
            const exitMonth = parseInt(doeParts[1], 10);
            if (exitYear < endYear || (exitYear === endYear && exitMonth < endMonth)) {
                endYear = exitYear;
                endMonth = exitMonth;
            }
        }

        const options = [];
        let y = endYear;
        let m = endMonth;

        while (y > startYear || (y === startYear && m >= startMonth)) {
            options.push({
                key: `${y}-${m}`,
                year: y,
                month: m,
                label: `${getMonthName(m)} ${y}`,
            });

            m--;
            if (m === 0) {
                m = 12;
                y--;
            }
        }

        return options;
    }, [selectedEmployee]);

    // 3. When employee changes, load their historical payslips and set default period
    useEffect(() => {
        if (!selectedEmployee) {
            setPayslips([]);
            setSelectedPeriod('');
            setCurrentPreviewPayslip(null);
            return;
        }

        api.get(`/admin/payroll/payslips?userId=${selectedEmployee.id}`)
            .then(res => {
                const list = res.data || [];
                setPayslips(list);
            })
            .catch(() => setPayslips([]));

        if (availablePeriods.length > 0) {
            setSelectedPeriod(availablePeriods[0].key);
        } else {
            setSelectedPeriod('');
            setCurrentPreviewPayslip(null);
        }
    }, [selectedEmployee?.id]);

    // 4. Automatically fetch or preview payslip when selectedEmployee or selectedPeriod changes
    useEffect(() => {
        if (!selectedEmployee?.id || !selectedPeriod) {
            setCurrentPreviewPayslip(null);
            setFetchingSlip(false);
            return;
        }

        const [yStr, mStr] = selectedPeriod.split('-');
        const year = parseInt(yStr, 10);
        const month = parseInt(mStr, 10);

        // Instant render if already in cached payslips list
        const cached = payslips.find(p => p.year === year && p.month === month);
        if (cached) {
            setCurrentPreviewPayslip(cached);
            setFetchingSlip(false);
            return;
        }

        let isCurrent = true;
        setFetchingSlip(true);

        api.get(`/admin/payroll/payslip?userId=${selectedEmployee.id}&month=${month}&year=${year}`)
            .then(res => {
                if (!isCurrent) return;
                if (res.data && res.data.id) {
                    setCurrentPreviewPayslip(res.data);
                    setPayslips(prev => {
                        const exists = prev.some(p => p.id === res.data.id);
                        return exists ? prev : [res.data, ...prev];
                    });
                } else {
                    setCurrentPreviewPayslip(null);
                }
            })
            .catch(err => {
                if (!isCurrent) return;
                setCurrentPreviewPayslip(null);
                const msg = err.response?.data?.message || 'Unable to load payslip for this period.';
                toast.info(msg);
            })
            .finally(() => {
                if (isCurrent) setFetchingSlip(false);
            });

        return () => {
            isCurrent = false;
        };
    }, [selectedEmployee?.id, selectedPeriod]);

    // 5. PDF Generator matching official GreytHR preview
    const downloadPDF = (payslip, emp = selectedEmployee) => {
        if (!payslip || !emp) {
            toast.warn('No payslip available to download.');
            return;
        }
        try {
            const doc = new jsPDF();
            const monthName = getMonthName(payslip.month);

            // Company Header Banner
            doc.setFillColor(30, 27, 75); // Dark Indigo
            doc.rect(0, 0, 210, 28, 'F');
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text('HRMS PORTAL TECHNOLOGIES', 14, 14);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(199, 210, 254);
            doc.text('Corporate Identification & Statutory Payroll Compliance Unit', 14, 21);

            // Sub-header
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text(`PAYSLIP FOR THE MONTH OF ${monthName.toUpperCase()} ${payslip.year}`, 14, 37);

            const genDateStr = payslip.generatedDate
                ? new Date(payslip.generatedDate).toLocaleDateString('en-IN')
                : new Date().toLocaleDateString('en-IN');
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text(`Generated Date: ${genDateStr}  |  Cycle: Monthly Payroll (Paid on 5th)`, 14, 43);

            // Employee Summary Grid
            const empName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.username;
            const dojStr = emp.dateOfJoining
                ? new Date(emp.dateOfJoining).toLocaleDateString('en-IN')
                : 'N/A';

            const formatPdfAmount = (num) =>
                new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num || 0);

            autoTable(doc, {
                startY: 47,
                margin: { left: 14, right: 14 },
                theme: 'plain',
                styles: { fontSize: 8.5, cellPadding: 2, textColor: [30, 41, 59] },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 34, textColor: [71, 85, 105] },
                    1: { cellWidth: 57 },
                    2: { fontStyle: 'bold', cellWidth: 34, textColor: [71, 85, 105] },
                    3: { cellWidth: 57 },
                },
                body: [
                    ['Employee Name:', empName, 'Employee ID / Code:', `#EMP-${String(emp.id).padStart(4, '0')}`],
                    ['Designation:', 'Software Engineer', 'Department:', 'Core Engineering'],
                    ['Date of Joining:', dojStr, 'Email Address:', emp.email || 'N/A'],
                    ['PAN Card Number:', emp.panNumber || 'NOT CONFIGURED', 'Aadhaar Number:', emp.aadhaarNumber ? `•••• ${emp.aadhaarNumber.slice(-4)}` : 'N/A'],
                    ['Bank Account:', emp.bankAccountNumber || 'N/A', 'Bank Name & IFSC:', `${emp.bankName || 'N/A'} (${emp.ifscCode || 'N/A'})`],
                    ['PF Applicable:', emp.pfApplicable ? 'Yes' : 'No', 'PF / UAN Number:', emp.pfUan || emp.pfAccount || 'N/A'],
                ],
            });

            // Attendance & Working Days Banner
            const attendY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 80) + 3;
            autoTable(doc, {
                startY: attendY,
                margin: { left: 14, right: 14 },
                theme: 'grid',
                styles: { fontSize: 8, cellPadding: 2.5, halign: 'center', textColor: [15, 23, 42] },
                headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold' },
                head: [['Total Working Days', 'Days Present', 'Days Absent (LOP)', 'Paid Days Count']],
                body: [[
                    payslip.workingDays != null ? payslip.workingDays : '30',
                    payslip.presentDays != null ? payslip.presentDays : '30',
                    payslip.absentDays != null ? payslip.absentDays : '0',
                    (payslip.workingDays || 30) - (payslip.absentDays || 0)
                ]],
            });

            // Earnings & Deductions Tables
            const earnings = payslip.components?.filter(c => c.type === 'EARNING') || [];
            const deductions = payslip.components?.filter(c => c.type === 'DEDUCTION') || [];
            const maxRows = Math.max(earnings.length, deductions.length);
            const tableRows = [];

            for (let i = 0; i < maxRows; i++) {
                const earn = earnings[i];
                const ded = deductions[i];
                tableRows.push([
                    earn ? earn.componentName : '',
                    earn ? formatPdfAmount(earn.amount) : '',
                    ded ? ded.componentName : '',
                    ded ? formatPdfAmount(ded.amount) : '',
                ]);
            }

            tableRows.push([
                'Total Gross Earnings', formatPdfAmount(payslip.grossSalary),
                'Total Deductions', formatPdfAmount(payslip.totalDeductions)
            ]);

            const tableY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 110) + 4;
            autoTable(doc, {
                startY: tableY,
                margin: { left: 14, right: 14 },
                theme: 'grid',
                headStyles: { fillColor: [49, 46, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
                styles: { fontSize: 8, cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 } },
                columnStyles: {
                    0: { cellWidth: 52 },
                    1: { cellWidth: 39, halign: 'right' },
                    2: { cellWidth: 52 },
                    3: { cellWidth: 39, halign: 'right' }
                },
                head: [['Earnings Component', 'Amount (INR)', 'Deductions Component', 'Amount (INR)']],
                body: tableRows,
                didParseCell: function (data) {
                    if (data.row.index === tableRows.length - 1) {
                        data.cell.styles.fontStyle = 'bold';
                        data.cell.styles.fillColor = [241, 245, 249];
                        if (data.column.index === 1) data.cell.styles.textColor = [37, 99, 235];
                        if (data.column.index === 3) data.cell.styles.textColor = [220, 38, 38];
                    }
                }
            });

            // Net Pay Box
            const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 180) + 6;
            doc.setFillColor(236, 253, 245);
            doc.setDrawColor(16, 185, 129);
            doc.rect(14, finalY, 182, 22, 'FD');

            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(4, 120, 87);
            doc.text('NET SALARY TAKE-HOME PAYABLE:', 18, finalY + 8);

            doc.setFontSize(13);
            doc.setTextColor(6, 95, 70);
            doc.text(`INR ${formatPdfAmount(payslip.netSalary)}`, 18, finalY + 16);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(4, 120, 87);
            doc.text(`In Words: ${numberToWords(payslip.netSalary)}`, 90, finalY + 14);

            // Footer Signature & Disclaimers
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(148, 163, 184);
            const safeName = (emp.firstName ? `${emp.firstName}_${emp.lastName || ''}` : emp.username || 'Employee')
                .replace(/[^a-zA-Z0-9]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_|_$/g, '');
            const fileName = `Payslip_${safeName}_${monthName}_${payslip.year}.pdf`;
            const base64Data = doc.output('datauristring').split(',')[1];

            // Submit to backend download endpoint to force managed Chrome to save with proper filename and .pdf extension
            let iframe = document.getElementById('admin-pdf-download-iframe');
            if (!iframe) {
                iframe = document.createElement('iframe');
                iframe.id = 'admin-pdf-download-iframe';
                iframe.name = 'admin-pdf-download-iframe';
                iframe.style.display = 'none';
                document.body.appendChild(iframe);
            }

            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/api/payroll/download-pdf';
            form.target = 'admin-pdf-download-iframe';

            const nameInput = document.createElement('input');
            nameInput.type = 'hidden';
            nameInput.name = 'fileName';
            nameInput.value = fileName;
            form.appendChild(nameInput);

            const dataInput = document.createElement('input');
            dataInput.type = 'hidden';
            dataInput.name = 'pdfData';
            dataInput.value = base64Data;
            form.appendChild(dataInput);

            document.body.appendChild(form);
            form.submit();
            setTimeout(() => {
                if (form.parentNode) document.body.removeChild(form);
            }, 1500);

            toast.success(`Payslip for ${empName} downloaded!`);
        } catch (err) {
            console.error('PDF generation error:', err);
            toast.error('Failed to generate PDF');
        }
    };

    // 6. Manual Batch Generation for Completed Month
    const handleRunBatch = async () => {
        if (!batchMonth) {
            toast.error('Please select a completed month.');
            return;
        }

        const [yStr, mStr] = batchMonth.split('-');
        const year = parseInt(yStr, 10);
        const month = parseInt(mStr, 10);

        setBatchLoading(true);
        try {
            const res = await api.post(`/admin/payroll/generate?month=${month}&year=${year}`);
            toast.success(res.data?.message || `Payroll batch executed for ${getMonthName(month)} ${year}`);
            setBatchOpen(false);

            // Reload current employee payslips
            if (selectedEmployee) {
                const updated = await api.get(`/admin/payroll/payslips?userId=${selectedEmployee.id}`);
                setPayslips(updated.data || []);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to trigger batch payroll.');
        } finally {
            setBatchLoading(false);
        }
    };

    // Prepare completed batch months options
    const completedBatchOptions = useMemo(() => {
        const now = new Date();
        let endYear = now.getFullYear();
        let endMonth = now.getMonth();
        if (endMonth === 0) {
            endMonth = 12;
            endYear -= 1;
        }
        const opts = [];
        let y = endYear;
        let m = endMonth;
        for (let i = 0; i < 12; i++) {
            opts.push({
                key: `${y}-${m}`,
                year: y,
                month: m,
                label: `${getMonthName(m)} ${y}`
            });
            m--;
            if (m === 0) {
                m = 12;
                y--;
            }
        }
        return opts;
    }, []);

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
            {/* ── Hero Banner ────────────────────────────────── */}
            <Box sx={{
                borderRadius: 4,
                mb: 4,
                p: { xs: 3, md: 4 },
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <Box sx={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', bgcolor: 'rgba(99,102,241,0.15)' }} />
                <Box sx={{ position: 'absolute', bottom: -30, right: 140, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(139,92,246,0.12)' }} />

                <Box position="relative" zIndex={1} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                    <Box>
                        <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
                            <Box sx={{
                                width: 36, height: 36, borderRadius: 2,
                                background: 'rgba(255,255,255,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <ReceiptLongIcon sx={{ fontSize: 22 }} />
                            </Box>
                            <Typography variant="h5" fontWeight={800} letterSpacing={-0.3}>
                                Payroll & Payslips Management
                            </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', maxWidth: 550, mt: 0.5 }}>
                            Select any employee to view their completed monthly payslips, inspect statutory breakdowns, and export verified PDFs.
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        startIcon={<AutoAwesomeIcon />}
                        onClick={() => {
                            if (completedBatchOptions.length > 0) setBatchMonth(completedBatchOptions[0].key);
                            setBatchOpen(true);
                        }}
                        sx={{
                            borderRadius: 2.5,
                            textTransform: 'none',
                            fontWeight: 700,
                            py: 1.2, px: 2.5,
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            boxShadow: '0 4px 15px rgba(99,102,241,0.4)',
                            '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }
                        }}
                    >
                        Run Monthly Batch
                    </Button>
                </Box>
            </Box>

            {/* ── Employee & Month Selector Card ───────────── */}
            <Card elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3.5, border: '1px solid', borderColor: 'divider', bgcolor: '#ffffff' }}>
                <Grid container spacing={3} alignItems="center">
                    {/* Employee Autocomplete Selector */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.8} display="block" mb={1}>
                            Select Employee
                        </Typography>
                        {loadingEmployees ? (
                            <CircularProgress size={24} />
                        ) : (
                            <Autocomplete
                                options={employees}
                                getOptionLabel={(option) => `${option.firstName || ''} ${option.lastName || ''} (@${option.username}) - #${option.id}`}
                                value={selectedEmployee}
                                onChange={(_, newVal) => setSelectedEmployee(newVal)}
                                isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                                renderOption={(props, option) => (
                                    <Box component="li" {...props} display="flex" alignItems="center" gap={1.5} py={1}>
                                        <GradientAvatar firstName={option.firstName} lastName={option.lastName} size={32} />
                                        <Box>
                                            <Typography variant="body2" fontWeight={700}>
                                                {option.firstName} {option.lastName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                @{option.username} • Joined: {option.dateOfJoining ? new Date(option.dateOfJoining).toLocaleDateString('en-IN') : 'N/A'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Search by employee name or ID..."
                                        size="small"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                                    />
                                )}
                            />
                        )}
                    </Grid>

                    {/* Month Picker Dropdown */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.8} display="block" mb={1}>
                            Select Completed Payroll Month
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <FormControl size="small" fullWidth>
                                <InputLabel id="admin-month-select-label">Payroll Period</InputLabel>
                                <Select
                                    labelId="admin-month-select-label"
                                    value={selectedPeriod}
                                    label="Payroll Period"
                                    onChange={(e) => setSelectedPeriod(e.target.value)}
                                    sx={{ borderRadius: 2.5, fontWeight: 600 }}
                                    disabled={availablePeriods.length === 0}
                                >
                                    {availablePeriods.map((item) => {
                                        const hasSlip = payslips.some(p => p.year === item.year && p.month === item.month);
                                        return (
                                            <MenuItem key={item.key} value={item.key} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{item.label}</span>
                                                {hasSlip ? (
                                                    <Chip label="Ready" size="small" sx={{ height: 20, fontSize: '0.68rem', bgcolor: '#ecfdf5', color: '#059669', fontWeight: 700 }} />
                                                ) : (
                                                    <Chip label="Calculated" size="small" sx={{ height: 20, fontSize: '0.68rem', bgcolor: '#f1f5f9', color: '#64748b' }} />
                                                )}
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>

                            {currentPreviewPayslip && (
                                <Button
                                    variant="contained"
                                    startIcon={<DownloadIcon />}
                                    onClick={() => downloadPDF(currentPreviewPayslip)}
                                    sx={{
                                        borderRadius: 2.5,
                                        py: 1, px: 3,
                                        whiteSpace: 'nowrap',
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        bgcolor: '#059669',
                                        '&:hover': { bgcolor: '#047857' }
                                    }}
                                >
                                    Download PDF
                                </Button>
                            )}
                        </Box>
                    </Grid>
                </Grid>

                {/* Selected Employee Quick Overview Bar */}
                {selectedEmployee && (
                    <Box sx={{
                        mt: 2.5, pt: 2,
                        borderTop: '1px solid', borderColor: 'divider',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2
                    }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <GradientAvatar firstName={selectedEmployee.firstName} lastName={selectedEmployee.lastName} size={40} />
                            <Box>
                                <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                                    {selectedEmployee.firstName} {selectedEmployee.lastName} (@{selectedEmployee.username})
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Date of Joining: <strong>{selectedEmployee.dateOfJoining ? new Date(selectedEmployee.dateOfJoining).toLocaleDateString('en-IN') : 'Not Set'}</strong>
                                    {selectedEmployee.dateOfExit && ` • Exit: ${new Date(selectedEmployee.dateOfExit).toLocaleDateString('en-IN')}`}
                                </Typography>
                            </Box>
                        </Box>

                        <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
                            <Box textAlign="right">
                                <Typography variant="caption" color="text.secondary" display="block">Annual CTC</Typography>
                                <Typography variant="body2" fontWeight={800} color="#059669">
                                    {selectedEmployee.annualCtc ? formatCurrency(selectedEmployee.annualCtc) : 'Not Configured'}
                                </Typography>
                            </Box>
                            <Box textAlign="right">
                                <Typography variant="caption" color="text.secondary" display="block">PAN Card</Typography>
                                <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                                    {selectedEmployee.panNumber || '—'}
                                </Typography>
                            </Box>
                            <Box textAlign="right">
                                <Typography variant="caption" color="text.secondary" display="block">Bank Account</Typography>
                                <Typography variant="body2" fontWeight={700}>
                                    {selectedEmployee.bankName ? `${selectedEmployee.bankName} (${selectedEmployee.bankAccountNumber || '—'})` : '—'}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                )}
            </Card>

            {/* ── Payslip Document Preview ───────────────────── */}
            {fetchingSlip ? (
                <Card elevation={0} sx={{
                    p: 6, borderRadius: 3.5, border: '1px solid', borderColor: 'divider',
                    textAlign: 'center', mb: 4, bgcolor: '#ffffff',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                    <CircularProgress size={44} sx={{ color: '#4f46e5', mb: 2 }} />
                    <Typography variant="h6" fontWeight={700} color="#1e1b4b">
                        Loading Employee Payslip...
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                        Preparing official monthly breakdown for {selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : ''}
                    </Typography>
                </Card>
            ) : currentPreviewPayslip ? (
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 3, md: 4 },
                        borderRadius: 3.5,
                        border: '1.5px solid #e2e8f0',
                        bgcolor: '#ffffff',
                        mb: 4,
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
                    }}
                >
                    {/* Company Branding Top Strip */}
                    <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { sm: 'center' },
                        pb: 2.5,
                        mb: 2.5,
                        borderBottom: '2px solid #0f172a',
                        gap: 2
                    }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <Box sx={{
                                width: 44, height: 44, borderRadius: 2,
                                bgcolor: '#1e1b4b', color: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <BusinessIcon />
                            </Box>
                            <Box>
                                <Typography variant="h6" fontWeight={900} color="#0f172a" letterSpacing={-0.5}>
                                    HRMS PORTAL TECHNOLOGIES
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Corporate Identification & Statutory Payroll Compliance Unit
                                </Typography>
                            </Box>
                        </Box>

                        <Box textAlign={{ sm: 'right' }}>
                            <Chip
                                label={`PAYSLIP FOR ${getMonthName(currentPreviewPayslip.month).toUpperCase()} ${currentPreviewPayslip.year}`}
                                sx={{ bgcolor: '#1e1b4b', color: 'white', fontWeight: 800, fontSize: '0.8rem', py: 0.5 }}
                            />
                            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                                Generated Date: {currentPreviewPayslip.generatedDate ? new Date(currentPreviewPayslip.generatedDate).toLocaleDateString('en-IN') : 'N/A'}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Employee & Bank Info Grid */}
                    <Box sx={{
                        p: 2.5,
                        borderRadius: 2.5,
                        bgcolor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        mb: 3,
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                        gap: 2
                    }}>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Employee Name</Typography>
                            <Typography variant="body2" fontWeight={800} color="#0f172a">
                                {selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : '—'}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Employee ID / Code</Typography>
                            <Typography variant="body2" fontWeight={800} color="#4338ca">
                                #{String(selectedEmployee?.id || '').padStart(4, '0')}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Date of Joining</Typography>
                            <Typography variant="body2" fontWeight={700}>
                                {selectedEmployee?.dateOfJoining ? new Date(selectedEmployee.dateOfJoining).toLocaleDateString('en-IN') : 'N/A'}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">PAN Card Number</Typography>
                            <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                                {selectedEmployee?.panNumber || 'NOT CONFIGURED'}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Bank & Account</Typography>
                            <Typography variant="body2" fontWeight={700}>
                                {selectedEmployee?.bankName ? `${selectedEmployee.bankName} - ${selectedEmployee?.bankAccountNumber || ''}` : 'N/A'}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">IFSC Code</Typography>
                            <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                                {selectedEmployee?.ifscCode || 'N/A'}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Attendance Metrics Bar */}
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' },
                        gap: 1.5,
                        mb: 3
                    }}>
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f1f5f9', textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">Total Working Days</Typography>
                            <Typography variant="h6" fontWeight={800} color="#1e1b4b">{currentPreviewPayslip.workingDays || 30}</Typography>
                        </Box>
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#eff6ff', textAlign: 'center' }}>
                            <Typography variant="caption" color="#2563eb">Days Present</Typography>
                            <Typography variant="h6" fontWeight={800} color="#1d4ed8">{currentPreviewPayslip.presentDays || 30}</Typography>
                        </Box>
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#fef2f2', textAlign: 'center' }}>
                            <Typography variant="caption" color="#dc2626">Days Absent (LOP)</Typography>
                            <Typography variant="h6" fontWeight={800} color="#b91c1c">{currentPreviewPayslip.absentDays || 0}</Typography>
                        </Box>
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#ecfdf5', textAlign: 'center' }}>
                            <Typography variant="caption" color="#059669">Paid Days Count</Typography>
                            <Typography variant="h6" fontWeight={800} color="#047857">
                                {(currentPreviewPayslip.workingDays || 30) - (currentPreviewPayslip.absentDays || 0)}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Earnings & Deductions Dual Table */}
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2.5, mb: 3 }}>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#1e1b4b' }}>
                                <TableRow>
                                    <TableCell sx={{ color: 'white', fontWeight: 800, width: '35%' }}>EARNINGS</TableCell>
                                    <TableCell align="right" sx={{ color: 'white', fontWeight: 800, width: '15%' }}>AMOUNT</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 800, width: '35%' }}>DEDUCTIONS</TableCell>
                                    <TableCell align="right" sx={{ color: 'white', fontWeight: 800, width: '15%' }}>AMOUNT</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(() => {
                                    const earnings = currentPreviewPayslip.components?.filter(c => c.type === 'EARNING') || [];
                                    const deductions = currentPreviewPayslip.components?.filter(c => c.type === 'DEDUCTION') || [];
                                    const maxRows = Math.max(earnings.length, deductions.length);
                                    const rows = [];
                                    for (let i = 0; i < maxRows; i++) {
                                        rows.push(
                                            <TableRow key={i} hover>
                                                <TableCell sx={{ fontWeight: 500 }}>{earnings[i]?.componentName || '-'}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600 }}>{earnings[i] ? formatCurrency(earnings[i].amount) : '-'}</TableCell>
                                                <TableCell sx={{ fontWeight: 500, color: 'text.secondary' }}>{deductions[i]?.componentName || '-'}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600, color: 'error.main' }}>{deductions[i] ? formatCurrency(deductions[i].amount) : '-'}</TableCell>
                                            </TableRow>
                                        );
                                    }
                                    return rows;
                                })()}
                                {/* Subtotals */}
                                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                    <TableCell sx={{ fontWeight: 800, color: '#1e1b4b' }}>Total Gross Salary</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, color: '#2563eb' }}>
                                        {formatCurrency(currentPreviewPayslip.grossSalary)}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: '#1e1b4b' }}>Total Deductions</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 800, color: '#dc2626' }}>
                                        {formatCurrency(currentPreviewPayslip.totalDeductions)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Net Salary Highlight Box */}
                    <Box sx={{
                        p: 3, borderRadius: 2.5, bgcolor: '#ecfdf5',
                        border: '1.5px solid #10b981', display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2
                    }}>
                        <Box>
                            <Typography variant="caption" color="#047857" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>
                                Net Salary Disbursed
                            </Typography>
                            <Typography variant="h4" fontWeight={900} color="#065f46" mt={0.3}>
                                {formatCurrency(currentPreviewPayslip.netSalary)}
                            </Typography>
                            <Typography variant="caption" color="#047857" fontStyle="italic" display="block" mt={0.5}>
                                {numberToWords(currentPreviewPayslip.netSalary)}
                            </Typography>
                        </Box>
                        <Box textAlign={{ sm: 'right' }}>
                            <Button
                                variant="contained"
                                startIcon={<DownloadIcon />}
                                onClick={() => downloadPDF(currentPreviewPayslip)}
                                sx={{
                                    borderRadius: 2.5,
                                    py: 1.2, px: 3,
                                    textTransform: 'none',
                                    fontWeight: 800,
                                    bgcolor: '#059669',
                                    '&:hover': { bgcolor: '#047857' }
                                }}
                            >
                                Download Verified PDF
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            ) : (
                <Card elevation={0} sx={{
                    p: 5, borderRadius: 3.5, border: '1px solid', borderColor: 'divider',
                    textAlign: 'center', mb: 4, bgcolor: '#f8fafc'
                }}>
                    <ScheduleIcon sx={{ fontSize: 52, color: '#6366f1', mb: 1.5 }} />
                    <Typography variant="h6" fontWeight={700} color="#1e1b4b">
                        No Completed Payslips For This Period
                    </Typography>
                    <Typography variant="body2" color="text.secondary" maxWidth={520} mx="auto" mt={0.5}>
                        Select a completed month from the dropdown above to automatically view and download this employee's verified payslip.
                    </Typography>
                </Card>
            )}

            {/* ── Historical Payslips List Table for Selected Employee ────────── */}
            <Card elevation={0} sx={{ borderRadius: 3.5, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" fontWeight={800} color="#0f172a">
                            Historical Payslips Archive
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            All generated monthly records for {selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : 'employee'}
                        </Typography>
                    </Box>
                    <Chip label={`${payslips.length} Total Records`} size="small" sx={{ fontWeight: 700, bgcolor: '#eef2ff', color: '#4f46e5' }} />
                </Box>

                <TableContainer>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Month & Year</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Gross Salary</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Deductions</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Net Pay</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Working Days</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Generated Date</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {payslips.map((slip) => {
                                const isCurrent = currentPreviewPayslip?.id === slip.id;
                                return (
                                    <TableRow
                                        key={slip.id}
                                        hover
                                        sx={{ bgcolor: isCurrent ? '#f0fdf4' : 'inherit' }}
                                    >
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <CalendarMonthIcon sx={{ fontSize: 18, color: '#6366f1' }} />
                                                <Typography fontWeight={700} variant="body2">
                                                    {getMonthName(slip.month)} {slip.year}
                                                </Typography>
                                                {isCurrent && (
                                                    <Chip label="Active Preview" size="small" sx={{ height: 18, fontSize: '0.62rem', bgcolor: '#dcfce7', color: '#16a34a', fontWeight: 800 }} />
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{formatCurrency(slip.grossSalary)}</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: 'error.main' }}>{formatCurrency(slip.totalDeductions)}</TableCell>
                                        <TableCell sx={{ fontWeight: 800, color: '#059669' }}>{formatCurrency(slip.netSalary)}</TableCell>
                                        <TableCell>{slip.workingDays || 30} days</TableCell>
                                        <TableCell>
                                            {slip.generatedDate ? new Date(slip.generatedDate).toLocaleDateString('en-IN') : 'N/A'}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box display="flex" justifyContent="flex-end" gap={1}>
                                                <Tooltip title="Preview In Page">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => {
                                                            setSelectedPeriod(`${slip.year}-${slip.month}`);
                                                            setCurrentPreviewPayslip(slip);
                                                        }}
                                                        sx={{ bgcolor: '#eef2ff', color: '#6366f1', '&:hover': { bgcolor: '#c7d2fe' } }}
                                                    >
                                                        <VisibilityIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Download PDF">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => downloadPDF(slip)}
                                                        sx={{ bgcolor: '#ecfdf5', color: '#059669', '&:hover': { bgcolor: '#a7f3d0' } }}
                                                    >
                                                        <DownloadIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {payslips.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                        <ReceiptLongIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            No generated payslips found in the archive for this employee.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* ── Dialog: Run Monthly Batch ───────────────────── */}
            <Dialog open={batchOpen} onClose={() => setBatchOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 800 }}>Run Monthly Payroll Batch</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" mb={2.5}>
                        Trigger automated payroll generation for all active employees for the selected completed month.
                    </Typography>
                    <FormControl fullWidth size="small">
                        <InputLabel id="batch-month-label">Completed Month</InputLabel>
                        <Select
                            labelId="batch-month-label"
                            value={batchMonth}
                            label="Completed Month"
                            onChange={(e) => setBatchMonth(e.target.value)}
                            sx={{ borderRadius: 2 }}
                        >
                            {completedBatchOptions.map((opt) => (
                                <MenuItem key={opt.key} value={opt.key}>
                                    {opt.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setBatchOpen(false)} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleRunBatch}
                        disabled={batchLoading}
                        startIcon={batchLoading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
                        }}
                    >
                        {batchLoading ? 'Processing...' : 'Execute Batch'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminPayroll;
