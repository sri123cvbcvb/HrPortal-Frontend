import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Card, CircularProgress, Chip, IconButton,
    Tooltip, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Button
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PaidIcon from '@mui/icons-material/Paid';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const getMonthName = (m) => new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' });

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
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try { const res = await api.get('/employee/payroll/payslips'); setPayslips(res.data); }
            catch { toast.error('Failed to load payslips'); }
            finally { setLoading(false); }
        })();
    }, []);

    const downloadPDF = (payslip) => {
        try {
            const doc = new jsPDF();

            // Header
            doc.setFontSize(22);
            doc.setTextColor(33, 150, 243);
            doc.text('GreytHR HRMS', 14, 20);

            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text(`Payslip for ${getMonthName(payslip.month)} ${payslip.year}`, 14, 30);

            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Generated on: ${new Date(payslip.generatedDate).toLocaleDateString()}`, 14, 38);

            // Employee Info Box
            doc.setDrawColor(200, 200, 200);
            doc.rect(14, 45, 182, 35);
            doc.setTextColor(0, 0, 0);
            doc.text(`Employee Name: ${payslip.user?.firstName || ''} ${payslip.user?.lastName || ''}`, 20, 55);
            doc.text(`Email: ${payslip.user?.email || ''}`, 20, 65);
            doc.text(`Total Working Days: ${payslip.workingDays}`, 120, 55);
            doc.text(`Loss of Pay (LOP) Days: ${payslip.absentDays}`, 120, 65);

            // Earnings and Deductions Table
            const earnings = (payslip.components || []).filter(c => c.type === 'EARNING');
            const deductions = (payslip.components || []).filter(c => c.type === 'DEDUCTION');
            const tableData = [];
            const maxRows = Math.max(earnings.length, deductions.length);
            for (let i = 0; i < maxRows; i++) {
                const earningRow = earnings[i] ? [earnings[i].componentName, formatCurrency(earnings[i].amount)] : ['', ''];
                const deductionRow = deductions[i] ? [deductions[i].componentName, formatCurrency(deductions[i].amount)] : ['', ''];
                tableData.push([...earningRow, ...deductionRow]);
            }

            autoTable(doc, {
                startY: 90,
                head: [['Earnings', 'Amount', 'Deductions', 'Amount']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
                bodyStyles: { textColor: [50, 50, 50] },
                columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: 35, halign: 'right' }, 2: { cellWidth: 55 }, 3: { cellWidth: 35, halign: 'right' } }
            });

            const finalY = doc.lastAutoTable.finalY + 10;
            doc.setFillColor(245, 245, 245);
            doc.rect(14, finalY, 182, 30, 'F');
            doc.setFontSize(11);
            doc.text(`Gross Salary: ${formatCurrency(payslip.grossSalary)}`, 20, finalY + 10);
            doc.text(`Total Deductions: ${formatCurrency(payslip.totalDeductions)}`, 110, finalY + 10);
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 100, 0);
            doc.text(`Net Pay: ${formatCurrency(payslip.netSalary)}`, 20, finalY + 22);

            saveAs(doc.output('blob'), `Payslip_${getMonthName(payslip.month)}_${payslip.year}.pdf`);
            toast.success('Payslip PDF downloaded!');
        } catch {
            toast.error('Failed to generate PDF.');
        }
    };

    const latestPayslip = payslips.length > 0 ? payslips[0] : null;

    return (
        <Box sx={{ maxWidth: 1100, mx: 'auto', pb: 6 }}>

            {/* ── Hero Banner ───────────────────────────────── */}
            <Box sx={{
                borderRadius: 4, mb: 3, p: { xs: 3, md: 4 },
                background: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #34d399 100%)',
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
                        <Typography variant="body2" sx={{ opacity: 0.7, fontWeight: 500 }}>💰 Compensation</Typography>
                        <Typography variant="h4" fontWeight={800} letterSpacing={-0.5} mt={0.5}>My Payslips</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                            View and download your monthly salary slips.
                        </Typography>
                    </Box>
                    <Box display="flex" gap={2}>
                        <Box textAlign="center" sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, px: 3, py: 1.5 }}>
                            <Typography fontWeight={800} variant="h5">{payslips.length}</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.85 }}>Payslips</Typography>
                        </Box>
                        {latestPayslip && (
                            <Box textAlign="center" sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, px: 3, py: 1.5 }}>
                                <Typography fontWeight={800} variant="h5">{formatCurrency(latestPayslip.netSalary)}</Typography>
                                <Typography variant="caption" sx={{ opacity: 0.85 }}>Latest Net Pay</Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* ── Stat Cards ────────────────────────────────── */}
            {latestPayslip && (
                <Box display="grid" gridTemplateColumns={{ xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }} gap={2} mb={3}>
                    <StatCard icon={<AccountBalanceWalletIcon />} label="Gross Salary" value={formatCurrency(latestPayslip.grossSalary)} color="#2563eb" bg="#eff6ff" />
                    <StatCard icon={<TrendingDownIcon />} label="Deductions" value={formatCurrency(latestPayslip.totalDeductions)} color="#dc2626" bg="#fef2f2" />
                    <StatCard icon={<PaidIcon />} label="Net Pay" value={formatCurrency(latestPayslip.netSalary)} color="#059669" bg="#ecfdf5" />
                    <StatCard icon={<TrendingUpIcon />} label="Working Days" value={latestPayslip.workingDays} color="#7c3aed" bg="#faf5ff" />
                </Box>
            )}

            {/* ── Payslip Cards / Table ─────────────────────── */}
            {loading ? (
                <Box display="flex" justifyContent="center" p={8}><CircularProgress /></Box>
            ) : payslips.length === 0 ? (
                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center', py: 8 }}>
                    <ReceiptLongIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.disabled">No payslips generated yet.</Typography>
                    <Typography variant="body2" color="text.disabled" mt={1}>
                        Payslips are generated on the 5th of each month.
                    </Typography>
                </Card>
            ) : (
                <>
                    {/* Mobile-friendly Payslip Cards */}
                    <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
                        {payslips.map((ps) => (
                            <Card key={ps.id} elevation={0} sx={{
                                borderRadius: 3, border: '1px solid', borderColor: 'divider',
                                p: 2.5, transition: 'transform 0.2s',
                                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }
                            }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <Box sx={{
                                            width: 48, height: 52, borderRadius: 2,
                                            bgcolor: '#059669', color: 'white',
                                            display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.6rem', lineHeight: 1 }}>
                                                {getMonthName(ps.month).substring(0, 3).toUpperCase()}
                                            </Typography>
                                            <Typography variant="h6" fontWeight={900} lineHeight={1}>{ps.year}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography fontWeight={700}>{getMonthName(ps.month)} {ps.year}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Generated {new Date(ps.generatedDate).toLocaleDateString('en-IN')}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <IconButton onClick={() => downloadPDF(ps)} color="primary"
                                        sx={{ bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}>
                                        <DownloadIcon />
                                    </IconButton>
                                </Box>

                                <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={1.5}>
                                    {[
                                        { l: 'Gross', v: formatCurrency(ps.grossSalary), c: '#2563eb' },
                                        { l: 'Deductions', v: formatCurrency(ps.totalDeductions), c: '#dc2626' },
                                        { l: 'Net Pay', v: formatCurrency(ps.netSalary), c: '#059669' },
                                    ].map(({ l, v, c }) => (
                                        <Box key={l} textAlign="center" p={1.5} borderRadius={2} bgcolor="#fafafa">
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>{l}</Typography>
                                            <Typography variant="body2" fontWeight={800} sx={{ color: c }}>{v}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Card>
                        ))}
                    </Box>

                    {/* Desktop Table */}
                    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', display: { xs: 'none', md: 'block' } }}>
                        <Box px={3} py={2.5} display="flex" alignItems="center" gap={1.5} borderBottom="1px solid" borderColor="divider">
                            <ReceiptLongIcon color="primary" fontSize="small" />
                            <Typography fontWeight={700} variant="h6">All Payslips</Typography>
                            <Chip label={`${payslips.length} records`} size="small" sx={{ ml: 'auto', fontWeight: 600 }} />
                        </Box>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#fafafa' }}>
                                        {['Month', 'Generated', 'Gross Salary', 'Deductions', 'Net Pay', 'Days', ''].map(h => (
                                            <TableCell key={h} align={['Gross Salary', 'Deductions', 'Net Pay'].includes(h) ? 'right' : 'left'}
                                                sx={{ fontWeight: 700, fontSize: '0.78rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, py: 2 }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {payslips.map((ps) => (
                                        <TableRow key={ps.id} hover sx={{ transition: 'background 0.1s' }}>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1.5}>
                                                    <Box sx={{
                                                        width: 40, height: 44, borderRadius: 2,
                                                        bgcolor: '#059669', color: 'white',
                                                        display: 'flex', flexDirection: 'column',
                                                        alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                                    }}>
                                                        <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.55rem', lineHeight: 1 }}>
                                                            {getMonthName(ps.month).substring(0, 3).toUpperCase()}
                                                        </Typography>
                                                        <Typography variant="body2" fontWeight={900} lineHeight={1}>{ps.year}</Typography>
                                                    </Box>
                                                    <Typography fontWeight={700}>{getMonthName(ps.month)} {ps.year}</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {new Date(ps.generatedDate).toLocaleDateString('en-IN')}
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
                                                    fontWeight: 800, bgcolor: '#ecfdf5', color: '#059669',
                                                    fontSize: '0.8rem', height: 28,
                                                }} />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">{ps.workingDays}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title="Download PDF">
                                                    <Button size="small" variant="outlined" startIcon={<DownloadIcon fontSize="small" />}
                                                        onClick={() => downloadPDF(ps)}
                                                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                                                        PDF
                                                    </Button>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                </>
            )}
        </Box>
    );
};

export default EmployeePayslips;
