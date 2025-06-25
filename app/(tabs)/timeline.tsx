import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Calendar, Clock, FileText, CircleCheck as CheckCircle, Circle, CircleAlert as AlertCircle, ChevronRight, Hospital, User, CalendarClock, ArrowRight, Hourglass } from 'lucide-react-native';
import { Database } from '../../types/database';

type SurgeryPlan = Database['public']['Tables']['surgery_plans']['Row'];
type RecoveryTask = Database['public']['Tables']['recovery_tasks']['Row'];
type Document = Database['public']['Tables']['documents']['Row'];

export default function TimelineScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [surgeryPlan, setSurgeryPlan] = useState<SurgeryPlan | null>(null);
  const [recoveryTasks, setRecoveryTasks] = useState<RecoveryTask[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setError(null);
      await Promise.all([
        loadSurgeryPlan(),
        loadDocuments(),
      ]);
    } catch (err) {
      console.error('Error loading timeline data:', err);
      setError('Failed to load your timeline data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const loadSurgeryPlan = async () => {
    if (!user) return;

    try {
      // Get the most recent surgery plan
      const { data: plans, error } = await supabase
        .from('surgery_plans')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (plans && plans.length > 0) {
        setSurgeryPlan(plans[0]);
        // Load recovery tasks for this plan
        await loadRecoveryTasks(plans[0].id);
      }
    } catch (error) {
      console.error('Error loading surgery plan:', error);
      throw error;
    }
  };

  const loadRecoveryTasks = async (surgeryPlanId: string) => {
    try {
      const { data, error } = await supabase
        .from('recovery_tasks')
        .select('*')
        .eq('surgery_plan_id', surgeryPlanId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setRecoveryTasks(data || []);
    } catch (error) {
      console.error('Error loading recovery tasks:', error);
      throw error;
    }
  };

  const loadDocuments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      throw error;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      planning: '#f59e0b',
      pre_op: '#3b82f6',
      surgery: '#dc2626',
      post_op: '#059669',
      completed: '#6b7280',
    };
    return statusColors[status] || '#9ca3af';
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'medical_record':
        return <FileText size={16} color="#3b82f6" />;
      case 'consent_form':
        return <FileText size={16} color="#059669" />;
      case 'prescription':
        return <FileText size={16} color="#dc2626" />;
      case 'insurance':
        return <FileText size={16} color="#f59e0b" />;
      default:
        return <FileText size={16} color="#6b7280" />;
    }
  };

  const getTaskStatusIcon = (completed: boolean, dueDate: string) => {
    if (completed) {
      return <CheckCircle size={20} color="#059669" />;
    }
    
    const now = new Date();
    const due = new Date(dueDate);
    
    if (due < now) {
      return <AlertCircle size={20} color="#dc2626" />;
    }
    
    return <Circle size={20} color="#6b7280" />;
  };

  const getPhaseLabel = (status: string) => {
    const labels: Record<string, string> = {
      planning: 'Planning Phase',
      pre_op: 'Pre-Operation',
      surgery: 'Surgery Day',
      post_op: 'Post-Operation',
      completed: 'Completed',
    };
    return labels[status] || 'Unknown Phase';
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
        <Text style={styles.title}>My Surgery Timeline</Text>
        <Text style={styles.subtitle}>
          Track your surgery journey and recovery progress
        </Text>
      </View>

      {error && (
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      )}

      {!surgeryPlan && !error && (
        <Card style={styles.emptyStateCard}>
          <View style={styles.emptyStateContent}>
            <Calendar size={48} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>No Surgery Plan Yet</Text>
            <Text style={styles.emptyStateDescription}>
              Your healthcare provider will create a surgery plan for you once it's scheduled.
            </Text>
          </View>
        </Card>
      )}

      {surgeryPlan && (
        <>
          {/* Surgery Plan Card */}
          <Card style={styles.surgeryPlanCard}>
            <View style={styles.cardHeader}>
              <Hospital size={24} color="#fef2f2" />
              <Text style={styles.cardTitle}>Surgery Plan</Text>
            </View>

            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(surgeryPlan.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(surgeryPlan.status) }]}>
                  {getPhaseLabel(surgeryPlan.status)}
                </Text>
              </View>
            </View>

            <View style={styles.surgeryDetail}>
              <Text style={styles.surgeryType}>{surgeryPlan.procedure_type}</Text>
              
              <View style={styles.detailRow}>
                <User size={16} color="#6b7280" />
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Surgeon: </Text>
                  {surgeryPlan.surgeon_name}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Hospital size={16} color="#6b7280" />
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Clinic: </Text>
                  {surgeryPlan.clinic_name}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Calendar size={16} color="#6b7280" />
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Date: </Text>
                  {formatDate(surgeryPlan.surgery_date)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Clock size={16} color="#6b7280" />
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Time: </Text>
                  {formatTime(surgeryPlan.surgery_date)}
                </Text>
              </View>
            </View>
          </Card>

          {/* Recovery Timeline */}
          <Card style={styles.timelineCard}>
            <View style={styles.cardHeader}>
              <CalendarClock size={24} color="#059669" />
              <Text style={styles.cardTitle}>Recovery Timeline</Text>
            </View>

            {recoveryTasks.length === 0 ? (
              <View style={styles.emptyTasksContainer}>
                <Hourglass size={32} color="#9ca3af" />
                <Text style={styles.emptyTasksText}>
                  Your recovery tasks will appear here once they're assigned.
                </Text>
              </View>
            ) : (
              <View style={styles.timelineContainer}>
                {recoveryTasks.map((task, index) => (
                  <View key={task.id} style={styles.timelineItem}>
                    <View style={styles.timelineIconContainer}>
                      {getTaskStatusIcon(task.completed, task.due_date)}
                      {index < recoveryTasks.length - 1 && (
                        <View style={[
                          styles.timelineConnector,
                          task.completed ? styles.timelineConnectorCompleted : null
                        ]} />
                      )}
                    </View>
                    
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineDate}>{formatDate(task.due_date)}</Text>
                      <Text style={styles.timelineTitle}>{task.title}</Text>
                      <Text style={styles.timelineDescription}>{task.description}</Text>
                      
                      {task.completed ? (
                        <View style={styles.completedBadge}>
                          <Text style={styles.completedText}>Completed</Text>
                        </View>
                      ) : new Date(task.due_date) < new Date() ? (
                        <View style={styles.overdueBadge}>
                          <Text style={styles.overdueText}>Overdue</Text>
                        </View>
                      ) : (
                        <View style={styles.pendingBadge}>
                          <Text style={styles.pendingText}>Pending</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </>
      )}

      {/* Documents Section */}
      <Card style={styles.documentsCard}>
        <View style={styles.cardHeader}>
          <FileText size={24} color="#3b82f6" />
          <Text style={styles.cardTitle}>My Documents</Text>
        </View>

        {documents.length === 0 ? (
          <View style={styles.emptyDocumentsContainer}>
            <FileText size={32} color="#9ca3af" />
            <Text style={styles.emptyDocumentsText}>
              No documents have been uploaded yet.
            </Text>
          </View>
        ) : (
          <View style={styles.documentsContainer}>
            {documents.map((doc) => (
              <TouchableOpacity key={doc.id} style={styles.documentItem}>
                <View style={styles.documentIconContainer}>
                  {getDocumentTypeIcon(doc.document_type)}
                </View>
                
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>{doc.file_name}</Text>
                  <Text style={styles.documentType}>
                    {doc.document_type.replace('_', ' ').toUpperCase()}
                  </Text>
                  <Text style={styles.documentDate}>
                    Uploaded on {formatDate(doc.created_at)}
                  </Text>
                </View>
                
                <ChevronRight size={16} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Card>

      {/* Support Section */}
      <Card style={styles.supportCard}>
        <View style={styles.supportContent}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/7089401/pexels-photo-7089401.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' }}
            style={styles.supportImage}
          />
          <View style={styles.supportTextContainer}>
            <Text style={styles.supportTitle}>Need Help?</Text>
            <Text style={styles.supportDescription}>
              Our care team is available 24/7 to answer your questions and provide support.
            </Text>
            <TouchableOpacity style={styles.supportButton}>
              <Text style={styles.supportButtonText}>Contact Support</Text>
              <ArrowRight size={16} color="#fef2f2" />
            </TouchableOpacity>
          </View>
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
    paddingTop: 60,
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
  errorCard: {
    margin: 24,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyStateCard: {
    margin: 24,
    padding: 32,
  },
  emptyStateContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  surgeryPlanCard: {
    margin: 24,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  surgeryDetail: {
    gap: 12,
  },
  surgeryType: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 16,
    color: '#374151',
  },
  detailLabel: {
    fontWeight: '500',
    color: '#6b7280',
  },
  timelineCard: {
    margin: 24,
    marginTop: 8,
    marginBottom: 16,
  },
  timelineContainer: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineIconContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineConnector: {
    width: 2,
    height: '100%',
    backgroundColor: '#e5e7eb',
    position: 'absolute',
    top: 24,
    left: 9,
    bottom: -8,
  },
  timelineConnectorCompleted: {
    backgroundColor: '#059669',
  },
  timelineContent: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  timelineDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 12,
    lineHeight: 20,
  },
  completedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  overdueBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  overdueText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '500',
  },
  pendingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  emptyTasksContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyTasksText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
  },
  documentsCard: {
    margin: 24,
    marginTop: 8,
    marginBottom: 16,
  },
  documentsContainer: {
    marginTop: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  documentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  documentType: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  documentDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyDocumentsContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyDocumentsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
  },
  supportCard: {
    margin: 24,
    marginTop: 8,
    padding: 0,
    overflow: 'hidden',
  },
  supportContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportImage: {
    width: 100,
    height: 140,
    resizeMode: 'cover',
  },
  supportTextContainer: {
    flex: 1,
    padding: 16,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  supportDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 8,
  },
  supportButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#df3b89',
  },
  bottomSpacing: {
    height: 100,
  },
});