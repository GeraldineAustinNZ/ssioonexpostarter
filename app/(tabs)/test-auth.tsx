import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Shield, User, Database, CircleCheck as CheckCircle, Circle as XCircle, TriangleAlert as AlertTriangle, Eye, Lock, Users, FileText, MessageSquare, Calendar } from 'lucide-react-native';

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'pending';
  message: string;
  details?: any;
}

export default function TestAuthScreen() {
  const { user, profile, signIn, signOut } = useAuthStore();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('test.patient@example.com');
  const [testPassword, setTestPassword] = useState('testpassword123');

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Test 1: Basic Authentication Flow
  const testBasicAuth = async () => {
    addTestResult({ test: 'Basic Auth', status: 'pending', message: 'Testing sign in/out flow...' });
    
    try {
      // Test sign in
      const { error: signInError } = await signIn(testEmail, testPassword);
      
      if (signInError) {
        addTestResult({ 
          test: 'Sign In', 
          status: 'fail', 
          message: `Sign in failed: ${signInError.message}` 
        });
        return;
      }

      addTestResult({ 
        test: 'Sign In', 
        status: 'pass', 
        message: 'Successfully signed in' 
      });

      // Wait a moment for auth state to update
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Test sign out
      const { error: signOutError } = await signOut();
      
      if (signOutError) {
        addTestResult({ 
          test: 'Sign Out', 
          status: 'fail', 
          message: `Sign out failed: ${signOutError.message}` 
        });
        return;
      }

      addTestResult({ 
        test: 'Sign Out', 
        status: 'pass', 
        message: 'Successfully signed out' 
      });

    } catch (error: any) {
      addTestResult({ 
        test: 'Basic Auth', 
        status: 'fail', 
        message: `Auth test failed: ${error.message}` 
      });
    }
  };

  // Test 2: RLS Policies for Patient Role
  const testPatientRLS = async () => {
    if (!user) {
      addTestResult({ 
        test: 'Patient RLS', 
        status: 'fail', 
        message: 'No user logged in' 
      });
      return;
    }

    addTestResult({ 
      test: 'Patient RLS', 
      status: 'pending', 
      message: 'Testing patient data access...' 
    });

    try {
      // Test 1: Can read own profile
      const { data: ownProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !ownProfile) {
        addTestResult({ 
          test: 'Read Own Profile', 
          status: 'fail', 
          message: 'Cannot read own profile' 
        });
      } else {
        addTestResult({ 
          test: 'Read Own Profile', 
          status: 'pass', 
          message: 'Can read own profile' 
        });
      }

      // Test 2: Cannot read other profiles (if patient)
      if (profile?.role === 'patient') {
        const { data: allProfiles, error: allProfilesError } = await supabase
          .from('profiles')
          .select('*');

        if (allProfiles && allProfiles.length > 1) {
          addTestResult({ 
            test: 'Read Other Profiles', 
            status: 'fail', 
            message: 'Patient can read other profiles (RLS violation!)' 
          });
        } else if (allProfiles && allProfiles.length === 1) {
          addTestResult({ 
            test: 'Read Other Profiles', 
            status: 'pass', 
            message: 'Patient can only see own profile' 
          });
        }
      }

      // Test 3: Documents access
      const { data: documents, error: docsError } = await supabase
        .from('documents')
        .select('*');

      if (profile?.role === 'patient') {
        const ownDocs = documents?.filter(doc => doc.patient_id === user.id) || [];
        const otherDocs = documents?.filter(doc => doc.patient_id !== user.id) || [];

        if (otherDocs.length > 0) {
          addTestResult({ 
            test: 'Documents RLS', 
            status: 'fail', 
            message: 'Patient can see other patients\' documents!' 
          });
        } else {
          addTestResult({ 
            test: 'Documents RLS', 
            status: 'pass', 
            message: 'Patient can only see own documents' 
          });
        }
      }

      // Test 4: Surgery plans access
      const { data: surgeryPlans, error: plansError } = await supabase
        .from('surgery_plans')
        .select('*');

      if (profile?.role === 'patient') {
        const ownPlans = surgeryPlans?.filter(plan => plan.patient_id === user.id) || [];
        const otherPlans = surgeryPlans?.filter(plan => plan.patient_id !== user.id) || [];

        if (otherPlans.length > 0) {
          addTestResult({ 
            test: 'Surgery Plans RLS', 
            status: 'fail', 
            message: 'Patient can see other patients\' surgery plans!' 
          });
        } else {
          addTestResult({ 
            test: 'Surgery Plans RLS', 
            status: 'pass', 
            message: 'Patient can only see own surgery plans' 
          });
        }
      }

    } catch (error: any) {
      addTestResult({ 
        test: 'Patient RLS', 
        status: 'fail', 
        message: `RLS test failed: ${error.message}` 
      });
    }
  };

  // Test 3: RLS Policies for Provider Role
  const testProviderRLS = async () => {
    if (!user || !profile) {
      addTestResult({ 
        test: 'Provider RLS', 
        status: 'fail', 
        message: 'No user logged in' 
      });
      return;
    }

    if (profile.role === 'patient') {
      addTestResult({ 
        test: 'Provider RLS', 
        status: 'pending', 
        message: 'Skipped - user is a patient, not a provider' 
      });
      return;
    }

    addTestResult({ 
      test: 'Provider RLS', 
      status: 'pending', 
      message: 'Testing provider data access...' 
    });

    try {
      // Test 1: Can read all profiles
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        addTestResult({ 
          test: 'Provider Read All Profiles', 
          status: 'fail', 
          message: 'Provider cannot read all profiles' 
        });
      } else {
        addTestResult({ 
          test: 'Provider Read All Profiles', 
          status: 'pass', 
          message: `Provider can read ${allProfiles?.length || 0} profiles` 
        });
      }

      // Test 2: Can read all documents
      const { data: allDocuments, error: docsError } = await supabase
        .from('documents')
        .select('*');

      if (docsError) {
        addTestResult({ 
          test: 'Provider Read All Documents', 
          status: 'fail', 
          message: 'Provider cannot read all documents' 
        });
      } else {
        addTestResult({ 
          test: 'Provider Read All Documents', 
          status: 'pass', 
          message: `Provider can read ${allDocuments?.length || 0} documents` 
        });
      }

      // Test 3: Can read all surgery plans
      const { data: allPlans, error: plansError } = await supabase
        .from('surgery_plans')
        .select('*');

      if (plansError) {
        addTestResult({ 
          test: 'Provider Read All Plans', 
          status: 'fail', 
          message: 'Provider cannot read all surgery plans' 
        });
      } else {
        addTestResult({ 
          test: 'Provider Read All Plans', 
          status: 'pass', 
          message: `Provider can read ${allPlans?.length || 0} surgery plans` 
        });
      }

    } catch (error: any) {
      addTestResult({ 
        test: 'Provider RLS', 
        status: 'fail', 
        message: `Provider RLS test failed: ${error.message}` 
      });
    }
  };

  // Test 4: Data Manipulation Tests
  const testDataManipulation = async () => {
    if (!user) {
      addTestResult({ 
        test: 'Data Manipulation', 
        status: 'fail', 
        message: 'No user logged in' 
      });
      return;
    }

    addTestResult({ 
      test: 'Data Manipulation', 
      status: 'pending', 
      message: 'Testing data manipulation permissions...' 
    });

    try {
      // Test 1: Try to insert a document for self
      const { data: insertDoc, error: insertError } = await supabase
        .from('documents')
        .insert({
          patient_id: user.id,
          document_type: 'other',
          file_name: 'test-document.pdf',
          file_url: 'https://example.com/test.pdf',
          file_size: 1024,
          mime_type: 'application/pdf',
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (insertError) {
        addTestResult({ 
          test: 'Insert Own Document', 
          status: 'fail', 
          message: `Cannot insert own document: ${insertError.message}` 
        });
      } else {
        addTestResult({ 
          test: 'Insert Own Document', 
          status: 'pass', 
          message: 'Can insert own document' 
        });

        // Clean up - delete the test document
        await supabase.from('documents').delete().eq('id', insertDoc.id);
      }

      // Test 2: Try to insert a document for another user (should fail for patients)
      if (profile?.role === 'patient') {
        const { data: insertOtherDoc, error: insertOtherError } = await supabase
          .from('documents')
          .insert({
            patient_id: 'fake-user-id',
            document_type: 'other',
            file_name: 'unauthorized-document.pdf',
            file_url: 'https://example.com/test.pdf',
            file_size: 1024,
            mime_type: 'application/pdf',
            uploaded_by: user.id,
          });

        if (insertOtherError) {
          addTestResult({ 
            test: 'Insert Other Document (Patient)', 
            status: 'pass', 
            message: 'Patient correctly blocked from inserting for others' 
          });
        } else {
          addTestResult({ 
            test: 'Insert Other Document (Patient)', 
            status: 'fail', 
            message: 'Patient can insert documents for others (RLS violation!)' 
          });
        }
      }

    } catch (error: any) {
      addTestResult({ 
        test: 'Data Manipulation', 
        status: 'fail', 
        message: `Data manipulation test failed: ${error.message}` 
      });
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setLoading(true);
    clearResults();

    await testBasicAuth();
    
    // Sign back in for RLS tests
    if (!user) {
      await signIn(testEmail, testPassword);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await testPatientRLS();
    await testProviderRLS();
    await testDataManipulation();

    setLoading(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle size={16} color="#059669" />;
      case 'fail':
        return <XCircle size={16} color="#dc2626" />;
      case 'pending':
        return <AlertTriangle size={16} color="#f59e0b" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return '#059669';
      case 'fail':
        return '#dc2626';
      case 'pending':
        return '#f59e0b';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Shield size={32} color="#fef2f2" />
        <Text style={styles.title}>Authentication & RLS Testing</Text>
        <Text style={styles.subtitle}>
          Comprehensive testing of authentication flow and Row Level Security policies
        </Text>
      </View>

      {/* Current User Info */}
      <Card style={styles.userCard}>
        <View style={styles.userHeader}>
          <User size={20} color="#6b7280" />
          <Text style={styles.userTitle}>Current User</Text>
        </View>
        
        {user ? (
          <View style={styles.userInfo}>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userRole}>
              Role: {profile?.role || 'Unknown'}
            </Text>
            <Text style={styles.userId}>
              ID: {user.id}
            </Text>
          </View>
        ) : (
          <Text style={styles.noUser}>No user logged in</Text>
        )}
      </Card>

      {/* Test Configuration */}
      <Card style={styles.configCard}>
        <Text style={styles.configTitle}>Test Configuration</Text>
        
        <Input
          label="Test Email"
          value={testEmail}
          onChangeText={setTestEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <Input
          label="Test Password"
          value={testPassword}
          onChangeText={setTestPassword}
          secureTextEntry
        />
      </Card>

      {/* Test Controls */}
      <View style={styles.controls}>
        <Button
          title={loading ? 'Running Tests...' : 'Run All Tests'}
          onPress={runAllTests}
          disabled={loading}
          style={styles.runButton}
        />
        
        <Button
          title="Clear Results"
          onPress={clearResults}
          variant="outline"
          style={styles.clearButton}
        />
      </View>

      {/* Individual Test Buttons */}
      <View style={styles.individualTests}>
        <Text style={styles.sectionTitle}>Individual Tests</Text>
        
        <View style={styles.testButtons}>
          <TouchableOpacity style={styles.testButton} onPress={testBasicAuth}>
            <Lock size={16} color="#fef2f2" />
            <Text style={styles.testButtonText}>Auth Flow</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.testButton} onPress={testPatientRLS}>
            <User size={16} color="#fef2f2" />
            <Text style={styles.testButtonText}>Patient RLS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.testButton} onPress={testProviderRLS}>
            <Users size={16} color="#fef2f2" />
            <Text style={styles.testButtonText}>Provider RLS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.testButton} onPress={testDataManipulation}>
            <Database size={16} color="#fef2f2" />
            <Text style={styles.testButtonText}>Data Ops</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card style={styles.resultsCard}>
          <View style={styles.resultsHeader}>
            <Eye size={20} color="#6b7280" />
            <Text style={styles.resultsTitle}>Test Results</Text>
          </View>
          
          {testResults.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <View style={styles.resultHeader}>
                {getStatusIcon(result.status)}
                <Text style={[styles.resultTest, { color: getStatusColor(result.status) }]}>
                  {result.test}
                </Text>
              </View>
              <Text style={styles.resultMessage}>{result.message}</Text>
              {result.details && (
                <Text style={styles.resultDetails}>
                  {JSON.stringify(result.details, null, 2)}
                </Text>
              )}
            </View>
          ))}
        </Card>
      )}

      {/* Testing Guidelines */}
      <Card style={styles.guidelinesCard}>
        <Text style={styles.guidelinesTitle}>Testing Guidelines</Text>
        
        <View style={styles.guideline}>
          <Text style={styles.guidelineNumber}>1.</Text>
          <Text style={styles.guidelineText}>
            Create test users with different roles in Supabase Auth dashboard
          </Text>
        </View>
        
        <View style={styles.guideline}>
          <Text style={styles.guidelineNumber}>2.</Text>
          <Text style={styles.guidelineText}>
            Update the role field in the profiles table for each test user
          </Text>
        </View>
        
        <View style={styles.guideline}>
          <Text style={styles.guidelineNumber}>3.</Text>
          <Text style={styles.guidelineText}>
            Test with patient, nurse, coordinator, admin, and sales roles
          </Text>
        </View>
        
        <View style={styles.guideline}>
          <Text style={styles.guidelineNumber}>4.</Text>
          <Text style={styles.guidelineText}>
            Verify that patients can only access their own data
          </Text>
        </View>
        
        <View style={styles.guideline}>
          <Text style={styles.guidelineNumber}>5.</Text>
          <Text style={styles.guidelineText}>
            Verify that providers can access all patient data
          </Text>
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
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  userCard: {
    margin: 24,
    marginBottom: 16,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  userTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  userInfo: {
    gap: 4,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  userRole: {
    fontSize: 14,
    color: '#6b7280',
  },
  userId: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
  noUser: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  configCard: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  controls: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  runButton: {
    flex: 2,
  },
  clearButton: {
    flex: 1,
  },
  individualTests: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  testButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    gap: 6,
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fef2f2',
  },
  resultsCard: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  resultItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  resultTest: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 24,
  },
  resultDetails: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 24,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  guidelinesCard: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  guideline: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  guidelineNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fef2f2',
    width: 20,
  },
  guidelineText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 40,
  },
});