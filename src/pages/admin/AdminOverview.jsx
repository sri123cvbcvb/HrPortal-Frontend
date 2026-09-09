import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Divider, Avatar, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import EventIcon from '@mui/icons-material/Event';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import api from '../../utils/api';
import { format, parseISO, isAfter, startOfToday } from 'date-fns';

const AdminOverview = () => {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        upcomingLeaves: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [empRes, leaveRes] = await Promise.all([
                    api.get('/admin/employees'),
                    api.get('/admin/leaves')
                ]);

                const today = startOfToday();
                const upcoming = leaveRes.data
                    .filter(l => !isAfter(today, parseISO(l.date)))
                    .sort((a, b) => parseISO(a.date) - parseISO(b.date))
                    .slice(0, 5);

                setStats({
                    totalEmployees: empRes.data.length,
                    upcomingLeaves: upcoming
                });
            } catch (error) {
                console.error('Error fetching dashboard stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const StatCard = ({ title, value, icon, color }) => (
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                            {value}
                        </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main`, width: 56, height: 56 }}>
                        {icon}
                    </Avatar>
                </Box>
            </CardContent>
        </Card>
    );

    return (
        <Box>
            <Typography variant="h4" fontWeight="800" color="primary.main" mb={4}>Admin Overview</Typography>

            <Grid container spacing={3} mb={5}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Employees" value={stats.totalEmployees} icon={<PeopleIcon />} color="primary" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Company Leaves" value={stats.upcomingLeaves.length} icon={<BeachAccessIcon />} color="error" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Active Projects" value="12" icon={<TrendingUpIcon />} color="success" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Upcoming Holidays" value={stats.upcomingLeaves.length} icon={<EventIcon />} color="warning" />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" mb={2}>Upcoming Company Leaves</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <List>
                                {stats.upcomingLeaves.length > 0 ? (
                                    stats.upcomingLeaves.map((leave, idx) => (
                                        <ListItem key={leave.id} divider={idx < stats.upcomingLeaves.length - 1}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: 'error.light', color: 'error.main' }}>
                                                    <BeachAccessIcon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={leave.description || 'Company Holiday'}
                                                secondary={format(parseISO(leave.date), 'EEEE, MMMM do, yyyy')}
                                            />
                                        </ListItem>
                                    ))
                                ) : (
                                    <Typography color="text.secondary" align="center" py={3}>No upcoming holidays scheduled.</Typography>
                                )}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminOverview;
