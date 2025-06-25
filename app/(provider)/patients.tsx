import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { 
  Search, 
  Filter, 
  Users, 
  MapPin, 
  Calendar,
  ArrowRight,
  Plus
} from 'lucide-react-native';
import { Database } from '../../types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type SurgeryPlan = Database['public']['Tables']['surgery_plans']['Row'];

interface PatientWithPlan extends Profile {
  surgery_plans?: SurgeryPlan[];
}

export default function PatientsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patients, setPatients] = useState<PatientWithPlan[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientWithPlan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchQuery, selectedRegion]);

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          surgery_plans (*)
        `)
        .eq('role', 'patient')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = patients;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(patient =>
        patient.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by region
    if (selectedRegion !== 'all') {
      filtered = filtered.filter(patient => patient.region === selectedRegion);
    }

    setFilteredPatients(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatients();
    setRefreshing(false);
  };

  const getPatientStatus = (patient: PatientWithPlan) => {
    if (!patient.surgery_plans || patient.surgery_plans.length === 0) {
      return { status: 'No Plan', color: '#9ca3af' };
    }

    const latestPlan = patient.surgery_plans[0];
    const statusColors = {
      planning: '#f59e0b',
      pre_op: '#fef2f2',
      surgery: '#dc2626',
      post_op: '#059669',
      completed: '#6b7280',
    };

    return {
      status: latestPlan.status.replace('_', '-').toUpperCase(),
      color: statusColors[latestPlan.status] || '#9ca3af',
    };
  };

  const getRegionName = (region: string) => {
    const regions = {
      AU: 'Australia',
      NZ: 'New Zealand',
      TH: 'Thailand',
    };
    return regions[region as keyof typeof regions] || region;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Patients</Text>
        <Text style={styles.subtitle}>
          Manage and monitor patient care
        </Text>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedRegion === 'all' && styles.filterChipActive
            ]}
            onPress={() => setSelectedRegion('all')}
          >
            <Text style={[
              styles.filterChipText,
              selectedRegion === 'all' && styles.filterChipTextActive
            ]}>
              All Regions
            </Text>
          </TouchableOpacity>

          {['AU', 'NZ', 'TH'].map((region) => (
            <TouchableOpacity
              key={region}
              style={[
                styles.filterChip,
                selectedRegion === region && styles.filterChipActive
              ]}
              onPress={() => setSelectedRegion(region)}
            >
              <Text style={[
                styles.filterChipText,
                selectedRegion === region && styles.filterChipTextActive
              ]}>
                {getRegionName(region)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Users size={16} color="#fef2f2" />
          <Text style={styles.statText}>{filteredPatients.length} Patients</Text>
        </View>
        <View style={styles.statItem}>
          <Calendar size={16} color="#059669" />
          <Text style={styles.statText}>
            {filteredPatients.filter(p => p.surgery_plans?.length).length} With Plans
          </Text>
        </View>
      </View>

      {/* Patients List */}
      <ScrollView 
        style={styles.patientsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredPatients.length > 0 ? (
          filteredPatients.map((patient) => {
            const status = getPatientStatus(patient);
            
            return (
              <TouchableOpacity
                key={patient.id}
                onPress={() => router.push(`/(provider)/${patient.id}`)}
              >
                <Card style={styles.patientCard}>
                  <View style={styles.patientHeader}>
                    <Image
                      source={{ 
                        uri: `https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&seed=${patient.id}` 
                      }}
                      style={styles.patientAvatar}
                    />
                    
                    <View style={styles.patientInfo}>
                      <Text style={styles.patientName}>{patient.full_name}</Text>
                      <Text style={styles.patientEmail}>{patient.email}</Text>
                      
                      <View style={styles.patientMeta}>
                        <View style={styles.metaItem}>
                          <MapPin size={12} color="#9ca3af" />
                          <Text style={styles.metaText}>
                            {getRegionName(patient.region)}
                          </Text>
                        </View>
                        
                        <View style={styles.metaItem}>
                          <Calendar size={12} color="#9ca3af" />
                          <Text style={styles.metaText}>
                            Joined {new Date(patient.created_at).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.patientActions}>
                      <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                        <Text style={[styles.statusText, { color: status.color }]}>
                          {status.status}
                        </Text>
                      </View>
                      <ArrowRight size={16} color="#9ca3af" />
                    </View>
                  </View>

                  {patient.surgery_plans && patient.surgery_plans.length > 0 && (
                    <View style={styles.planInfo}>
                      <Text style={styles.planTitle}>
                        {patient.surgery_plans[0].procedure_type}
                      </Text>
                      <Text style={styles.planClinic}>
                        {patient.surgery_plans[0].clinic_name}
                      </Text>
                      <Text style={styles.planDate}>
                        Surgery: {new Date(patient.surgery_plans[0].surgery_date).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            );
          })
        ) : (
          <Card style={styles.emptyState}>
            <Users size={48} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No patients found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery || selectedRegion !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Patients will appear here once they register'
              }
            </Text>
          </Card>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
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
  searchContainer: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#fef2f2',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: '#111827',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  patientsList: {
    flex: 1,
    padding: 24,
  },
  patientCard: {
    marginBottom: 16,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  patientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  patientEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  patientMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  patientActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  planInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  planClinic: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  planDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 40,
  },
});