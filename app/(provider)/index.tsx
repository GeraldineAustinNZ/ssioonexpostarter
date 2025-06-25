import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Users, MessageSquare, Calendar, TrendingUp, Clock, CircleAlert as AlertCircle, CircleCheck as CheckCircle, ArrowRight, Activity } from 'lucide-react-native';
import { Database } from '../../types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type SurgeryPlan = Database['public']['Tables']['surgery_plans']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

interface DashboardStats {
  totalPatients: number;
  activePlans: number;
  unreadMessages: number;
  upcomingAppointments: number;
}

interface RecentActivity {
  id: string;
  type: 'patient_registered' | 'plan_created' | 'message_received' | 'task_completed';
  description: string;
  timestamp: string;
  patientName?: string;
}

export default function ProviderDashboard() {
  const { profile } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    activePlans: 0,
    unreadMessages: 0,
    upcomingAppointments: 0,
  });
  const [recentPatients, setRecentPatients] = useState<Profile[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadStats(),
        loadRecentPatients(),
        loadRecentActivity(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get total patients
      const { count: totalPatients } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'patient');

      // Get active surgery plans
      const { count: activePlans } = await supabase
        .from('surgery_plans')
        .select('*', { count: 'exact', head: true })
        .in('status', ['planning', 'pre_op', 'surgery', 'post_op']);

      // Get unread messages (simplified - in production, track read status)
      const { count: unreadMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .is('read_at', null);

      // Get upcoming appointments (tasks with type 'appointment')
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 7);
      
      const { count: upcomingAppointments } = await supabase
        .from('recovery_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('task_type', 'appointment')
        .eq('completed', false)
        .lte('due_date', tomorrow.toISOString());

      setStats({
        totalPatients: totalPatients || 0,
        activePlans: activePlans || 0,
        unreadMessages: unreadMessages || 0,
        upcomingAppointments: upcomingAppointments || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'patient')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentPatients(data || []);
    } catch (error) {
      console.error('Error loading recent patients:', error);
    }
  };

  const loadRecentActivity = async () => {
    try {
      // This is a simplified version - in production, you'd have a dedicated activity log
      const activities: RecentActivity[] = [
        {
          id: '1',
          type: 'patient_registered',
          description: 'New patient registered',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          patientName: 'Sarah Johnson',
        },
        {
          id: '2',
          type: 'plan_created',
          description: 'Surgery plan created',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          patientName: 'Michael Chen',
        },
        {
          id: '3',
          type: 'message_received',
          description: 'New message received',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          patientName: 'Emma Wilson',
        },
        {
          id: '4',
          type: 'task_completed',
          description: 'Pre-op task completed',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          patientName: 'David Brown',
        },
      ];

      setRecentActivity(activities);
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'patient_registered':
        return <Users size={16} color="#fef2f2" />;
      case 'plan_created':
        return <Calendar size={16} color="#059669" />;
      case 'message_received':
        return <MessageSquare size={16} color="#7c3aed" />;
      case 'task_completed':
        return <CheckCircle size={16} color="#059669" />;
      default:
        return <Activity size={16} color="#6b7280" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
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
        <Text style={styles.greeting}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {profile?.full_name?.split(' ')[0]}
        </Text>
        <Text style={styles.subtitle}>
          Here's what's happening with your patients today
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => router.push('/(provider)/patients')}
        >
          <View style={styles.statIcon}>
            <Users size={24} color="#fef2f2" />
          </View>
          <Text style={styles.statNumber}>{stats.totalPatients}</Text>
          <Text style={styles.statLabel}>Total Patients</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard}>
          <View style={styles.statIcon}>
            <Activity size={24} color="#059669" />
          </View>
          <Text style={styles.statNumber}>{stats.activePlans}</Text>
          <Text style={styles.statLabel}>Active Plans</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => router.push('/(provider)/messages')}
        >
          <View style={styles.statIcon}>
            <MessageSquare size={24} color="#7c3aed" />
          </View>
          <Text style={styles.statNumber}>{stats.unreadMessages}</Text>
          <Text style={styles.statLabel}>Unread Messages</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => router.push('/(provider)/appointments')}
        >
          <View style={styles.statIcon}>
            <Calendar size={24} color="#ea580c" />
          </View>
          <Text style={styles.statNumber}>{stats.upcomingAppointments}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Patients */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Patients</Text>
          <TouchableOpacity onPress={() => router.push('/(provider)/patients')}>
            <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentPatients.length > 0 ? (
          recentPatients.map((patient) => (
            <TouchableOpacity
              key={patient.id}
              style={styles.patientItem}
              onPress={() => router.push(`/(provider)/${patient.id}`)}
            >
              <Image
                source={{ uri: `https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop` }}
                style={styles.patientAvatar}
              />
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{patient.full_name}</Text>
                <Text style={styles.patientEmail}>{patient.email}</Text>
                <Text style={styles.patientRegion}>{patient.region}</Text>
              </View>
              <ArrowRight size={16} color="#9ca3af" />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No patients yet</Text>
        )}
      </Card>

      {/* Recent Activity */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>

        {recentActivity.map((activity) => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              {getActivityIcon(activity.type)}
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityDescription}>
                {activity.description}
                {activity.patientName && (
                  <Text style={styles.activityPatient}> • {activity.patientName}</Text>
                )}
              </Text>
              <Text style={styles.activityTime}>
                {formatTimeAgo(activity.timestamp)}
              </Text>
            </View>
          </View>
        ))}
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
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 16,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  sectionCard: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sectionLink: {
    fontSize: 14,
    color: '#df3b89',
    fontWeight: '500',
  },
  patientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  patientEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  patientRegion: {
    fontSize: 12,
    color: '#9ca3af',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  activityPatient: {
    fontWeight: '500',
    color: '#111827',
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 20,
  },
  bottomSpacing: {
    height: 40,
  },
});