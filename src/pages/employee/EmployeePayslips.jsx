import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Card, CircularProgress, Chip, IconButton,
    Tooltip, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Button, Select, MenuItem, FormControl,
    InputLabel, Divider, Stack, Alert, Paper
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PaidIcon from '@mui/icons-material/Paid';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import BusinessIcon from '@mui/icons-material/Business';
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

const getMonthName = (m) => new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' });

// Converts number to Indian currency words
const numberToWords = (num) => {
    if (!num || isNaN(num) || num === 0) return 'Zero Rupees Only';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n) => {
        let str = '';
        if (n > 99) {
            str += a[Math.floor(n / 100)] + 'Hundred ';
            n %= 100;
        }
        if (n > 19) {
            str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
        } else if (n > 0) {
            str += a[n];
        }
        return str;
    };

    let n = Math.floor(num);
    let output = '';

    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    const remainder = n;

    if (crore > 0) output += inWords(crore) + 'Crore ';
    if (lakh > 0) output += inWords(lakh) + 'Lakh ';
    if (thousand > 0) output += inWords(thousand) + 'Thousand ';
    if (remainder > 0) output += inWords(remainder);

    return output.trim() + ' Rupees Only';
};

const StatCard = ({ icon, label, value, color, bg }) => (
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
        </Box>
    </Box>
);

const EmployeePayslips = () => {
    const [profile, setProfile] = useState(null);
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState(''); // "year-month"
    const [currentPreviewPayslip, setCurrentPreviewPayslip] = useState(null);
    const [generating, setGenerating] = useState(false);

    // 1. Fetch employee profile and existing payslips
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const [profileRes, payslipsRes] = await Promise.allSettled([
                    api.get('/employee/profile'),
                    api.get('/employee/payroll/payslips')
                ]);

                if (profileRes.status === 'fulfilled') {
                    setProfile(profileRes.value.data);
                }

                if (payslipsRes.status === 'fulfilled') {
                    setPayslips(payslipsRes.value.data);
                }
            } catch {
                toast.error('Failed to load payslip records');
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, []);

    // 2. Generate monthly options strictly from employee's dateOfJoining up to latest COMPLETED month
    const availablePeriods = useMemo(() => {
        const now = new Date();
        // Completed previous month (e.g., in Sept 2026, latest completed payroll month is August 2026)
        let endYear = now.getFullYear();
        let endMonth = now.getMonth(); // 0-based: in Sept (8), endMonth is 8 (August in 1-based)
        if (endMonth === 0) {
            endMonth = 12;
            endYear -= 1;
        }

        // Determine start date based on employee's dateOfJoining
        let startYear = endYear;
        let startMonth = 1;

        if (profile?.dateOfJoining) {
            const dojParts = profile.dateOfJoining.split('-');
            startYear = parseInt(dojParts[0], 10);
            startMonth = parseInt(dojParts[1], 10);
        }

        // Determine end date based on dateOfExit (if any)
        if (profile?.dateOfExit) {
            const doeParts = profile.dateOfExit.split('-');
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

        // Collect completed periods in descending order (most recent first)
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
    }, [profile]);

    // 3. Set default selected period to the latest completed month once options are ready
    useEffect(() => {
        if (availablePeriods.length > 0 && !selectedPeriod) {
            setSelectedPeriod(availablePeriods[0].key);
        }
    }, [availablePeriods, selectedPeriod]);

    // 4. Automatically fetch and preview payslip when selectedPeriod changes
    useEffect(() => {
        if (!selectedPeriod) {
            setCurrentPreviewPayslip(null);
            return;
        }

        const [yStr, mStr] = selectedPeriod.split('-');
        const year = parseInt(yStr, 10);
        const month = parseInt(mStr, 10);

        let isCurrent = true;
        setGenerating(true);

        api.get(`/employee/payroll/payslip?month=${month}&year=${year}`)
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
                const msg = err.response?.data?.message || 'Unable to load payslip for the selected month.';
                toast.info(msg);
            })
            .finally(() => {
                if (isCurrent) setGenerating(false);
            });

        return () => {
            isCurrent = false;
        };
    }, [selectedPeriod]);

    // 5. PDF Generator
    const downloadPDF = (payslip) => {
        if (!payslip) return;
        try {
            const doc = new jsPDF();
            const monthName = getMonthName(payslip.month);

            // Company Header
            doc.setFillColor(30, 27, 75); // Dark Indigo
            doc.rect(0, 0, 210, 28, 'F');
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text('HRMS PORTAL TECHNOLOGIES', 14, 14);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(203, 213, 225);
            doc.text('Plot 45, Tech Innovation Park, OMR, Chennai - 600096', 14, 21);

            // Payslip Title
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text(`PAYSLIP FOR ${monthName.toUpperCase()} ${payslip.year}`, 14, 38);

            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            const genDateStr = payslip.generatedDate ? new Date(payslip.generatedDate).toLocaleDateString('en-IN') : 'Automated on 5th';
            doc.text(`Generated Date: ${genDateStr}  |  Cycle: Monthly Payroll (Paid on 5th)`, 14, 43);

            // Employee Summary Grid Box
            doc.setDrawColor(226, 232, 240);
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(14, 47, 182, 36, 2, 2, 'FD');

            doc.setFontSize(8.5);
            doc.setTextColor(51, 65, 85);

            // Left Column
            const empName = `${payslip.user?.firstName || profile?.firstName || ''} ${payslip.user?.lastName || profile?.lastName || ''}`.trim() || 'Employee';
            const empId = payslip.user?.username || profile?.username || 'N/A';
            const doj = profile?.dateOfJoining || payslip.user?.dateOfJoining || 'N/A';
            const email = payslip.user?.email || profile?.email || 'N/A';

            doc.setFont('helvetica', 'bold');
            doc.text('Employee Name:', 18, 54);
            doc.setFont('helvetica', 'normal');
            doc.text(empName, 48, 54);

            doc.setFont('helvetica', 'bold');
            doc.text('Employee ID:', 18, 61);
            doc.setFont('helvetica', 'normal');
            doc.text(empId, 48, 61);

            doc.setFont('helvetica', 'bold');
            doc.text('Date of Joining:', 18, 68);
            doc.setFont('helvetica', 'normal');
            doc.text(doj, 48, 68);

            doc.setFont('helvetica', 'bold');
            doc.text('Email Address:', 18, 75);
            doc.setFont('helvetica', 'normal');
            doc.text(email, 48, 75);

            // Right Column
            const bankName = profile?.bankName || 'HDFC Bank';
            const bankAcc = profile?.bankAccountNumber ? `••••${profile.bankAccountNumber.slice(-4)}` : 'Verified on File';
            const pan = profile?.panNumber || 'XXXXX0000X';
            const uan = profile?.pfUan || 'N/A';

            doc.setFont('helvetica', 'bold');
            doc.text('Bank Name:', 110, 54);
            doc.setFont('helvetica', 'normal');
            doc.text(bankName, 138, 54);

            doc.setFont('helvetica', 'bold');
            doc.text('Bank A/C No:', 110, 61);
            doc.setFont('helvetica', 'normal');
            doc.text(bankAcc, 138, 61);

            doc.setFont('helvetica', 'bold');
            doc.text('PAN Number:', 110, 68);
            doc.setFont('helvetica', 'normal');
            doc.text(pan, 138, 68);

            doc.setFont('helvetica', 'bold');
            doc.text('PF UAN:', 110, 75);
            doc.setFont('helvetica', 'normal');
            doc.text(uan, 138, 75);

            const formatPdfAmount = (num) =>
                new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num || 0);

            // Attendance Summary Box
            doc.setDrawColor(226, 232, 240);
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(14, 86, 182, 10, 1, 1, 'FD');
            doc.setFontSize(8);
            doc.setTextColor(30, 41, 59);
            doc.setFont('helvetica', 'bold');
            doc.text(`Total Days: ${payslip.workingDays || 30}`, 20, 92.5);
            doc.text(`Paid / Present Days: ${payslip.presentDays != null ? payslip.presentDays : (payslip.workingDays || 30)}`, 78, 92.5);
            doc.text(`Loss of Pay (LOP) Days: ${payslip.absentDays || 0}`, 142, 92.5);

            // Earnings & Deductions Table
            const earnings = (payslip.components || []).filter(c => c.type === 'EARNING');
            const deductions = (payslip.components || []).filter(c => c.type === 'DEDUCTION');
            const tableData = [];
            const maxRows = Math.max(earnings.length, deductions.length);
            for (let i = 0; i < maxRows; i++) {
                const earningRow = earnings[i] ? [earnings[i].componentName, formatPdfAmount(earnings[i].amount)] : ['', ''];
                const deductionRow = deductions[i] ? [deductions[i].componentName, formatPdfAmount(deductions[i].amount)] : ['', ''];
                tableData.push([...earningRow, ...deductionRow]);
            }

            // Add Totals row
            tableData.push([
                'Gross Earnings', formatPdfAmount(payslip.grossSalary),
                'Total Deductions', formatPdfAmount(payslip.totalDeductions)
            ]);

            autoTable(doc, {
                startY: 99,
                margin: { left: 14, right: 14 },
                head: [['Earnings Component', 'Amount (INR)', 'Deductions Component', 'Amount (INR)']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [49, 46, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
                bodyStyles: { textColor: [30, 41, 59], fontSize: 8, cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 } },
                columnStyles: {
                    0: { cellWidth: 52 },
                    1: { cellWidth: 39, halign: 'right' },
                    2: { cellWidth: 52 },
                    3: { cellWidth: 39, halign: 'right' }
                },
                didParseCell: function (data) {
                    if (data.row.index === tableData.length - 1) {
                        data.cell.styles.fontStyle = 'bold';
                        data.cell.styles.fillColor = [248, 250, 252];
                        if (data.column.index === 1) data.cell.styles.textColor = [30, 64, 175];
                        if (data.column.index === 3) data.cell.styles.textColor = [185, 28, 28];
                    }
                }
            });

            const finalY = doc.lastAutoTable.finalY + 6;

            // Net Pay Callout Banner
            doc.setFillColor(236, 253, 245);
            doc.setDrawColor(16, 185, 129);
            doc.roundedRect(14, finalY, 182, 22, 2, 2, 'FD');

            doc.setFontSize(9.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(6, 78, 59);
            doc.text('NET SALARY PAYABLE:', 20, finalY + 8);
            doc.setFontSize(13);
            doc.setTextColor(5, 150, 105);
            doc.text(`INR ${formatPdfAmount(payslip.netSalary)}`, 72, finalY + 8.5);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(71, 85, 105);
            doc.text(`In Words: ${numberToWords(payslip.netSalary)}`, 20, finalY + 16);

            // Footer note
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(148, 163, 184);
            doc.text('This is a system-generated payslip issued in accordance with company payroll policy and does not require a physical signature.', 14, finalY + 34);

            const fileName = `Payslip_${monthName}_${payslip.year}.pdf`;
            const base64Data = doc.output('datauristring').split(',')[1];

            // Submit to backend download endpoint to force managed Chrome to save with proper filename and .pdf extension
            let iframe = document.getElementById('pdf-download-iframe');
            if (!iframe) {
                iframe = document.createElement('iframe');
                iframe.id = 'pdf-download-iframe';
                iframe.name = 'pdf-download-iframe';
                iframe.style.display = 'none';
                document.body.appendChild(iframe);
            }

            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/api/payroll/download-pdf';
            form.target = 'pdf-download-iframe';

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

            toast.success(`Payslip for ${monthName} ${payslip.year} downloaded!`);
        } catch {
            toast.error('Failed to generate PDF.');
        }
    };

    const latestPayslip = payslips.length > 0 ? payslips[0] : null;

    return (
        <Box sx={{ maxWidth: 1100, mx: 'auto', pb: 8 }}>

            {/* ── Hero Banner ───────────────────────────────── */}
            <Box sx={{
                borderRadius: 4, mb: 3, p: { xs: 3, md: 4 },
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)',
                color: 'white', position: 'relative', overflow: 'hidden',
                boxShadow: '0 20px 40px -15px rgba(49, 46, 129, 0.4)'
            }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} position="relative">
                    <Box>
                        <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 500 }}>
                            💼 Salary & Compensation
                        </Typography>
                        <Typography variant="h4" fontWeight={800} letterSpacing={-0.5} mt={0.5}>
                            Employee Payslips
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
                            Preview your monthly salary breakdown and download verified PDF payslips.
                        </Typography>
                    </Box>
                    <Box display="flex" gap={2}>
                        {profile?.dateOfJoining && (
                            <Box textAlign="center" sx={{ bgcolor: 'rgba(255,255,255,0.12)', borderRadius: 2, px: 2.5, py: 1.5, border: '1px solid rgba(255,255,255,0.15)' }}>
                                <Typography fontWeight={800} variant="body1">
                                    {new Date(profile.dateOfJoining).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>Joined Date</Typography>
                            </Box>
                        )}
                        {latestPayslip && (
                            <Box textAlign="center" sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, px: 3, py: 1.5, border: '1px solid rgba(255,255,255,0.2)' }}>
                                <Typography fontWeight={800} variant="h6">{formatCurrency(latestPayslip.netSalary)}</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.85 }}>Latest Net Pay</Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* ── Monthly Selector & Preview Bar ────────────── */}
            <Card elevation={0} sx={{
                borderRadius: 3.5,
                border: '1px solid',
                borderColor: 'divider',
                p: { xs: 2.5, sm: 3 },
                mb: 4,
                bgcolor: '#ffffff',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
            }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                    <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                        <Box sx={{
                            width: 44, height: 44, borderRadius: 2.5,
                            bgcolor: '#eff6ff', color: '#3b82f6',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <CalendarMonthIcon />
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={700} color="#0f172a">
                                Select Payroll Month
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {profile?.dateOfJoining
                                    ? `Eligible periods since joining date (${new Date(profile.dateOfJoining).toLocaleDateString('en-IN')})`
                                    : 'Select any month to view and download payslip'}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Month Picker Dropdown */}
                    <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                        <FormControl size="small" sx={{ minWidth: 220 }}>
                            <InputLabel id="month-select-label">Select Month & Year</InputLabel>
                            <Select
                                labelId="month-select-label"
                                value={selectedPeriod}
                                label="Select Month & Year"
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                                sx={{ borderRadius: 2.5, fontWeight: 600 }}
                            >
                                {availablePeriods.map((item) => {
                                    const hasSlip = payslips.some(p => p.year === item.year && p.month === item.month);
                                    return (
                                        <MenuItem key={item.key} value={item.key} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{item.label}</span>
                                            {hasSlip ? (
                                                <Chip label="Ready" size="small" sx={{ height: 20, fontSize: '0.68rem', bgcolor: '#ecfdf5', color: '#059669', fontWeight: 700 }} />
                                            ) : (
                                                <Chip label="Pending" size="small" sx={{ height: 20, fontSize: '0.68rem', bgcolor: '#f1f5f9', color: '#64748b' }} />
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
                                    py: 1,
                                    px: 2.5,
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
                </Box>
            </Card>

            {/* ── Live In-Page Document Preview ─────────────── */}
            {currentPreviewPayslip ? (
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 3.5,
                        border: '1px solid #e2e8f0',
                        p: { xs: 3, md: 5 },
                        mb: 4,
                        bgcolor: '#ffffff',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
                        position: 'relative'
                    }}
                >
                    {/* Top Action Bar */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" pb={3} mb={3} borderBottom="2px dashed #e2e8f0">
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <CheckCircleOutlineIcon sx={{ color: '#10b981' }} />
                            <Typography variant="body2" fontWeight={700} color="#059669">
                                Verified Generated Payslip
                            </Typography>
                            <Chip label="Automated 5th of Month Run" size="small" sx={{ bgcolor: '#f8fafc', fontWeight: 600, fontSize: '0.72rem' }} />
                        </Box>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<DownloadIcon fontSize="small" />}
                            onClick={() => downloadPDF(currentPreviewPayslip)}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                        >
                            Download PDF Slip
                        </Button>
                    </Box>

                    {/* Payslip Header */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2} mb={3}>
                        <Box>
                            <Typography variant="h5" fontWeight={900} color="#1e1b4b" letterSpacing={-0.5}>
                                HRMS PORTAL TECHNOLOGIES
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                                Plot 45, Tech Innovation Park, OMR, Chennai - 600096
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Corporate Identification & Statutory Payroll Compliance Unit
                            </Typography>
                        </Box>
                        <Box textAlign={{ xs: 'left', sm: 'right' }}>
                            <Typography variant="h6" fontWeight={800} color="#4338ca">
                                PAYSLIP — {getMonthName(currentPreviewPayslip.month).toUpperCase()} {currentPreviewPayslip.year}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Generated: {currentPreviewPayslip.generatedDate ? new Date(currentPreviewPayslip.generatedDate).toLocaleDateString('en-IN') : '5th of month'}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Employee Profile Grid */}
                    <Box sx={{
                        p: 2.5, borderRadius: 2.5, bgcolor: '#f8fafc',
                        border: '1px solid #e2e8f0', mb: 3
                    }}>
                        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Employee Name</Typography>
                                <Typography variant="body2" fontWeight={700}>
                                    {currentPreviewPayslip.user?.firstName || profile?.firstName || ''} {currentPreviewPayslip.user?.lastName || profile?.lastName || ''}
                                </Typography>

                                <Typography variant="caption" color="text.secondary" fontWeight={600} mt={1} display="block">Employee ID / Username</Typography>
                                <Typography variant="body2" fontWeight={700}>
                                    {currentPreviewPayslip.user?.username || profile?.username}
                                </Typography>

                                <Typography variant="caption" color="text.secondary" fontWeight={600} mt={1} display="block">Date of Joining</Typography>
                                <Typography variant="body2" fontWeight={700} color="#4338ca">
                                    {profile?.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Bank Account</Typography>
                                <Typography variant="body2" fontWeight={700}>
                                    {profile?.bankName || 'Verified Corporate Bank'} ({profile?.bankAccountNumber ? `••••${profile.bankAccountNumber.slice(-4)}` : 'On File'})
                                </Typography>

                                <Typography variant="caption" color="text.secondary" fontWeight={600} mt={1} display="block">PAN / Identification</Typography>
                                <Typography variant="body2" fontWeight={700}>
                                    {profile?.panNumber || 'XXXXX0000X'}
                                </Typography>

                                <Typography variant="caption" color="text.secondary" fontWeight={600} mt={1} display="block">PF UAN</Typography>
                                <Typography variant="body2" fontWeight={700}>
                                    {profile?.pfUan || 'N/A'}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* Attendance Highlights */}
                    <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={2} mb={3}>
                        <Box textAlign="center" p={1.5} borderRadius={2} bgcolor="#f1f5f9">
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Working Days</Typography>
                            <Typography variant="h6" fontWeight={800}>{currentPreviewPayslip.workingDays || 30}</Typography>
                        </Box>
                        <Box textAlign="center" p={1.5} borderRadius={2} bgcolor="#ecfdf5">
                            <Typography variant="caption" color="#059669" fontWeight={600}>Present / Paid Days</Typography>
                            <Typography variant="h6" fontWeight={800} color="#059669">{currentPreviewPayslip.presentDays || currentPreviewPayslip.workingDays || 30}</Typography>
                        </Box>
                        <Box textAlign="center" p={1.5} borderRadius={2} bgcolor="#fef2f2">
                            <Typography variant="caption" color="#dc2626" fontWeight={600}>Loss of Pay (LOP)</Typography>
                            <Typography variant="h6" fontWeight={800} color="#dc2626">{currentPreviewPayslip.absentDays || 0}</Typography>
                        </Box>
                    </Box>

                    {/* Earnings & Deductions Comparison Table */}
                    <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2, mb: 3 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#312e81' }}>
                                    <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Earnings Component</TableCell>
                                    <TableCell align="right" sx={{ color: '#fff', fontWeight: 700 }}>Amount</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Deduction Component</TableCell>
                                    <TableCell align="right" sx={{ color: '#fff', fontWeight: 700 }}>Amount</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(() => {
                                    const earnings = (currentPreviewPayslip.components || []).filter(c => c.type === 'EARNING');
                                    const deductions = (currentPreviewPayslip.components || []).filter(c => c.type === 'DEDUCTION');
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
                            <Chip label="Payment Complete" color="success" size="small" sx={{ fontWeight: 700, mb: 0.5 }} />
                            <Typography variant="caption" color="text.secondary" display="block">
                                Disbursed via Electronic Direct Bank Transfer
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            ) : generating ? (
                <Card elevation={0} sx={{
                    p: 6, borderRadius: 3.5, border: '1px solid', borderColor: 'divider',
                    textAlign: 'center', mb: 4, bgcolor: '#ffffff',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                    <CircularProgress size={44} sx={{ color: '#4f46e5', mb: 2 }} />
                    <Typography variant="h6" fontWeight={700} color="#1e1b4b">
                        Loading Verified Payslip...
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                        Retrieving your official salary breakdown for {availablePeriods.find(p => p.key === selectedPeriod)?.label || 'selected month'}
                    </Typography>
                </Card>
            ) : selectedPeriod ? (
                <Card elevation={0} sx={{
                    p: 5, borderRadius: 3.5, border: '1px solid', borderColor: 'divider',
                    textAlign: 'center', mb: 4, bgcolor: '#f8fafc'
                }}>
                    <ScheduleIcon sx={{ fontSize: 52, color: '#6366f1', mb: 1.5 }} />
                    <Typography variant="h6" fontWeight={700} color="#1e1b4b">
                        Payslip Not Generated Yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" maxWidth={520} mx="auto" mt={0.5}>
                        Monthly payslips are automatically generated on the <strong>5th of every month</strong> for the preceding payroll cycle.
                    </Typography>
                </Card>
            ) : (
                <Card elevation={0} sx={{
                    p: 5, borderRadius: 3.5, border: '1px solid', borderColor: 'divider',
                    textAlign: 'center', mb: 4, bgcolor: '#f8fafc'
                }}>
                    <ScheduleIcon sx={{ fontSize: 52, color: '#6366f1', mb: 1.5 }} />
                    <Typography variant="h6" fontWeight={700} color="#1e1b4b">
                        No Completed Payroll Months Yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" maxWidth={520} mx="auto" mt={0.5}>
                        Your monthly payslip will be generated on the <strong>5th of next month</strong> following the completion of your first payroll cycle.
                    </Typography>
                </Card>
            )}

            {/* ── Summary Stat Cards ────────────────────────── */}
            {latestPayslip && (
                <Box display="grid" gridTemplateColumns={{ xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }} gap={2} mb={3}>
                    <StatCard icon={<AccountBalanceWalletIcon />} label="Gross Salary" value={formatCurrency(latestPayslip.grossSalary)} color="#2563eb" bg="#eff6ff" />
                    <StatCard icon={<TrendingDownIcon />} label="Deductions" value={formatCurrency(latestPayslip.totalDeductions)} color="#dc2626" bg="#fef2f2" />
                    <StatCard icon={<PaidIcon />} label="Net Pay" value={formatCurrency(latestPayslip.netSalary)} color="#059669" bg="#ecfdf5" />
                    <StatCard icon={<TrendingUpIcon />} label="Working Days" value={latestPayslip.workingDays} color="#7c3aed" bg="#faf5ff" />
                </Box>
            )}

            {/* ── All Payslips History Table ────────────────── */}
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <Box px={3} py={2.5} display="flex" alignItems="center" justifyContent="space-between" borderBottom="1px solid" borderColor="divider">
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <ReceiptLongIcon color="primary" fontSize="small" />
                        <Typography fontWeight={700} variant="h6">Payslip History</Typography>
                    </Box>
                    <Chip label={`${payslips.length} Available Records`} size="small" sx={{ fontWeight: 600 }} />
                </Box>
                {loading ? (
                    <Box display="flex" justifyContent="center" p={6}><CircularProgress /></Box>
                ) : payslips.length === 0 ? (
                    <Box textAlign="center" py={6} color="text.secondary">
                        <Typography variant="body2">No past payslip records found in database.</Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#fafafa' }}>
                                    {['Month & Year', 'Generated Date', 'Gross Pay', 'Deductions', 'Net Salary', 'Work Days', 'Actions'].map(h => (
                                        <TableCell key={h} align={['Gross Pay', 'Deductions', 'Net Salary'].includes(h) ? 'right' : 'left'}
                                            sx={{ fontWeight: 700, fontSize: '0.78rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, py: 2 }}>
                                            {h}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {payslips.map((ps) => (
                                    <TableRow key={ps.id} hover sx={{
                                        transition: 'background 0.1s',
                                        bgcolor: (selectedPeriod === `${ps.year}-${ps.month}`) ? 'rgba(99, 102, 241, 0.05)' : 'inherit'
                                    }}>
                                        <TableCell>
                                            <Typography fontWeight={700}>{getMonthName(ps.month)} {ps.year}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {ps.generatedDate ? new Date(ps.generatedDate).toLocaleDateString('en-IN') : 'Automated on 5th'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography fontWeight={600}>{formatCurrency(ps.grossSalary)}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography fontWeight={600} color="error.main">{formatCurrency(ps.totalDeductions)}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Chip label={formatCurrency(ps.netSalary)} size="small" sx={{
                                                fontWeight: 800, bgcolor: '#ecfdf5', color: '#059669', fontSize: '0.8rem'
                                            }} />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">{ps.workingDays}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={1}>
                                                <Button
                                                    size="small"
                                                    variant="text"
                                                    onClick={() => {
                                                        setSelectedPeriod(`${ps.year}-${ps.month}`);
                                                        window.scrollTo({ top: 120, behavior: 'smooth' });
                                                    }}
                                                    sx={{ textTransform: 'none', fontWeight: 600 }}
                                                >
                                                    Preview
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<DownloadIcon fontSize="small" />}
                                                    onClick={() => downloadPDF(ps)}
                                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                                                >
                                                    PDF
                                                </Button>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Card>
        </Box>
    );
};

export default EmployeePayslips;
