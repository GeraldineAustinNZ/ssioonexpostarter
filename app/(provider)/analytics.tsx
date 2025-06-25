import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { TrendingUp, Users, Calendar, CircleCheck as CheckCircle, Clock, TriangleAlert as AlertTriangle, ChartBar as BarChart3, ChartPie as PieChart, Activity } from 'lucide-react-native';

interface AnalyticsData {
  totalPatients: number;
  activePlans: number;
  completedTasks: number;
  overdueTasks: number;
  patientsByRegion: { region: string; count: number }[];
  plansByStatus: { status: string; count: number }[];
  taskCompletionRate: number;
  monthlyRegistrations: { month: string; count: number }[];
}

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalPatients: 0,
    activePlans: 0,
    completedTasks: 0,
    overdueTasks: 0,
    patientsByRegion: [],
    plansByStatus: [],
    taskCompletionRate: 0,
    monthlyRegistrations: [],
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      await Promise.all([
        loadPatientStats(),
        loadPlanStats(),
        loadTaskStats(),
        loadRegionStats(),
        loadMonthlyStats(),
      ]);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientStats = async () => {
    try {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'patient');

      setAnalytics(prev => ({ ...prev, totalPatients: count || 0 }));
    } catch (error) {
      console.error('Error loading patient stats:', error);
    }
  };

  const loadPlanStats = async () => {
    try {
      const { data: plans } = await supabase
        .from('surgery_plans')
        .select('status');

      if (plans) {
        const activePlans = plans.filter(p => 
          ['planning', 'pre_op', 'surgery', 'post_op'].includes(p.status)
        ).length;

        const plansByStatus = plans.reduce((acc, plan) => {
          const existing = acc.find(item => item.status === plan.status);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ status: plan.status, count: 1 });
          }
          return acc;
        }, [] as { status: string; count: number }[]);

        setAnalytics(prev => ({ 
          ...prev, 
          activePlans,
          plansByStatus 
        }));
      }
    } catch (error) {
      console.error('Error loading plan stats:', error);
    }
  };

  const loadTaskStats = async () => {
    try {
      const { data: tasks } = await supabase
        .from('recovery_tasks')
        .select('completed, due_date');

      if (tasks) {
        const completedTasks = tasks.filter(t => t.completed).length;
        const now = new Date();
        const overdueTasks = tasks.filter(t => 
          !t.completed && new Date(t.due_date) < now
        ).length;
        
        const taskCompletionRate = tasks.length > 0 
          ? Math.round((completedTasks / tasks.length) * 100)
          : 0;

        setAnalytics(prev => ({ 
          ...prev, 
          completedTasks,
          overdueTasks,
          taskCompletionRate 
        }));
      }
    } catch (error) {
      console.error('Error loading task stats:', error);
    }
  };

  const loadRegionStats = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('region')
        .eq('role', 'patient');

      if (profiles) {
        const patientsByRegion = profiles.reduce((acc, profile) => {
          const existing = acc.find(item => item.region === profile.region);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ region: profile.region, count: 1 });
          }
          return acc;
        }, [] as { region: string; count: number }[]);

        setAnalytics(prev => ({ ...prev, patientsByRegion }));
      
      }
    } catch (error) {
      console.error('Error loading region stats:', error);
    }
  };

  const loadMonthlyStats = async () => {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('role', 'patient')
        .gte('created_at', sixMonthsAgo.toISOString());

      if (profiles) {
        const monthlyRegistrations = profiles.reduce((acc, profile) => {
          const month = new Date(profile.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
          });
          
          const existing = acc.find(item => item.month === month);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ month, count: 1 });
          }
          return acc;
        }, [] as { month: string; count: number }[]);

        setAnalytics(prev => ({ ...prev, monthlyRegistrations }));
      }
    } catch (error) {
      console.error('Error loading monthly stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const getRegionName = (region: string) => {
    const regions = {
      AU: 'Australia',
      NZ: 'New Zealand',
      TH: 'Thailand',
    };
    return regions[region as keyof typeof regions] || region;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      planning: '#f59e0b',
      pre_op: '#fef2f2',
      surgery: '#dc2626',
      post_op: '#059669',
      completed: '#6b7280',
    };
    return colors[status as keyof typeof colors] || '#9ca3af';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>
          Insights and performance metrics
        </Text>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        <Card style={styles.metricCard}>
          <View style={styles.metricIcon}>
            <Users size={24} color="#fef2f2" />
          </View>
          <Text style={styles.metricNumber}>{analytics.totalPatients}</Text>
          <Text style={styles.metricLabel}>Total Patients</Text>
        </Card>

        <Card style={styles.metricCard}>
          <View style={styles.metricIcon}>
            <Activity size={24} color="#059669" />
          </View>
          <Text style={styles.metricNumber}>{analytics.activePlans}</Text>
          <Text style={styles.metricLabel}>Active Plans</Text>
        </Card>

        <Card style={styles.metricCard}>
          <View style={styles.metricIcon}>
            <CheckCircle size={24} color="#7c3aed" />
          </View>
          <Text style={styles.metricNumber}>{analytics.completedTasks}</Text>
          <Text style={styles.metricLabel}>Completed Tasks</Text>
        </Card>

        <Card style={styles.metricCard}>
          <View style={styles.metricIcon}>
            <AlertTriangle size={24} color="#dc2626" />
          </View>
          <Text style={styles.metricNumber}>{analytics.overdueTasks}</Text>
          <Text style={styles.metricLabel}>Overdue Tasks</Text>
        </Card>
      </View>

      {/* Task Completion Rate */}
      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <TrendingUp size={20} color="#fef2f2" />
          <Text style={styles.chartTitle}>Task Completion Rate</Text>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${analytics.taskCompletionRate}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{analytics.taskCompletionRate}%</Text>
        </View>
      </Card>

      {/* Patients by Region */}
      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <PieChart size={20} color="#fef2f2" />
          <Text style={styles.chartTitle}>Patients by Region</Text>
        </View>
        
        {analytics.patientsByRegion.map((item, index) => (
          <View key={item.region} style={styles.regionItem}>
            <View style={styles.regionInfo}>
              <View style={[
                styles.regionDot,
                { backgroundColor: ['#fef2f2', '#059669', '#f59e0b'][index] || '#9ca3af' }
              ]} />
              <Text style={styles.regionName}>{getRegionName(item.region)}</Text>
            </View>
            <Text style={styles.regionCount}>{item.count}</Text>
          </View>
        ))}
      </Card>

      {/* Surgery Plans by Status */}
      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <BarChart3 size={20} color="#fef2f2" />
          <Text style={styles.chartTitle}>Surgery Plans by Status</Text>
        </View>
        
        {analytics.plansByStatus.map((item) => (
          <View key={item.status} style={styles.statusItem}>
            <View style={styles.statusInfo}>
              <View style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(item.status) }
              ]} />
              <Text style={styles.statusName}>
                {item.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <Text style={styles.statusCount}>{item.count}</Text>
          </View>
        ))}
      </Card>

      {/* Monthly Registrations */}
      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Calendar size={20} color="#fef2f2" />
          <Text style={styles.chartTitle}>Monthly Registrations</Text>
        </View>
        
        <View style={styles.monthlyChart}>
          {analytics.monthlyRegistrations.map((item, index) => {
            const maxCount = Math.max(...analytics.monthlyRegistrations.map(m => m.count));
            const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            
            return (
              <View key={item.month} style={styles.monthlyBar}>
                <View style={styles.barContainer}>
                  <View style={[
                    styles.bar,
                    { height: `${height}%` }
                  ]} />
                </View>
                <Text style={styles.monthLabel}>{item.month}</Text>
                <Text style={styles.monthCount}>{item.count}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 24,
    paddingTop: 40,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 24,
    gap: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: 150,
    alignItems: 'center',
    paddingVertical: 24,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  chartCard: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  regionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  regionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  regionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  regionName: {
    fontSize: 14,
    color: '#374151',
  },
  regionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusName: {
    fontSize: 14,
    color: '#374151',
  },
  statusCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  monthlyChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingTop: 20,
  },
  monthlyBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  barContainer: {
    width: '100%',
    height: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 20,
    backgroundColor: '#fef2f2',
    borderRadius: 2,
    minHeight: 4,
  },
  monthLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  monthCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  bottomSpacing: {
    height: 40,
  },
});