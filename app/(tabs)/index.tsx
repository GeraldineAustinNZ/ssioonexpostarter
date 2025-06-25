import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useUser } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Heart, Calendar, MessageCircle, FileText } from 'lucide-react-native';

export default function HomeScreen() {
  const { user } = useUser();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back!</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.welcomeCard}>
          <View style={styles.cardHeader}>
            <Heart size={24} color="#fef2f2" />
            <Text style={styles.cardTitle}>Your Surgery Journey</Text>
          </View>
          <Text style={styles.cardDescription}>
            Track your progress, communicate with your care team, and access all your medical information in one secure place.
          </Text>
        </Card>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <Card style={styles.actionCard}>
              <Calendar size={32} color="#fef2f2" />
              <Text style={styles.actionTitle}>Schedule</Text>
              <Text style={styles.actionDescription}>View your recovery timeline</Text>
            </Card>

            <Card style={styles.actionCard}>
              <MessageCircle size={32} color="#059669" />
              <Text style={styles.actionTitle}>Messages</Text>
              <Text style={styles.actionDescription}>Chat with your care team</Text>
            </Card>

            <Card style={styles.actionCard}>
              <FileText size={32} color="#7c3aed" />
              <Text style={styles.actionTitle}>Documents</Text>
              <Text style={styles.actionDescription}>Access medical records</Text>
            </Card>

            <Card style={styles.actionCard}>
              <Heart size={32} color="#dc2626" />
              <Text style={styles.actionTitle}>Health</Text>
              <Text style={styles.actionDescription}>Track your progress</Text>
            </Card>
          </View>
        </View>
      </View>
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
    paddingBottom: 32,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    padding: 24,
  },
  welcomeCard: {
    marginBottom: 32,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  cardDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
  quickActions: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    minWidth: 150,
    alignItems: 'center',
    paddingVertical: 20,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});