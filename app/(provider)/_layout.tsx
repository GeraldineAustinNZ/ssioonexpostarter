import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Stack, Redirect, useRouter, usePathname } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { Users, MessageSquare, ChartBar as BarChart3, Calendar, FileText, Settings, LogOut, Menu, X, Chrome as Home, UserCheck } from 'lucide-react-native';

const PROVIDER_ROLES = ['nurse', 'coordinator', 'admin', 'sales'];

const NAVIGATION_ITEMS = [
  { name: 'Dashboard', href: '/(provider)', icon: Home },
  { name: 'Patients', href: '/(provider)/patients', icon: Users },
  { name: 'Messages', href: '/(provider)/messages', icon: MessageSquare },
  { name: 'Appointments', href: '/(provider)/appointments', icon: Calendar },
  { name: 'Documents', href: '/(provider)/documents', icon: FileText },
  { name: 'Analytics', href: '/(provider)/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/(provider)/settings', icon: Settings },
];

export default function ProviderLayout() {
  const { user, profile, signOut } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect if not authenticated
  if (!user) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Redirect if not a provider role
  if (profile && !PROVIDER_ROLES.includes(profile.role)) {
    return <Redirect href="/(tabs)" />;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    if (Platform.OS !== 'web') {
      setSidebarOpen(false);
    }
  };

  const isActive = (href: string) => {
    if (href === '/(provider)') {
      return pathname === '/provider' || pathname === '/(provider)';
    }
    return pathname.startsWith(href.replace('/(provider)', '/provider'));
  };

  const Sidebar = () => (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <View style={styles.logoContainer}>
          <UserCheck size={32} color="#fef2f2" />
          <Text style={styles.logoText}>Provider Portal</Text>
        </View>
        
        {Platform.OS !== 'web' && (
          <TouchableOpacity
            style={styles.closeSidebar}
            onPress={() => setSidebarOpen(false)}
          >
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <Text style={styles.userInitials}>
            {profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{profile?.full_name}</Text>
          <Text style={styles.userRole}>
            {profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1)}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.navigation}>
        {NAVIGATION_ITEMS.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.href);
          
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => handleNavigation(item.href)}
            >
              <IconComponent 
                size={20} 
                color={active ? '#fef2f2' : '#6b7280'} 
              />
              <Text style={[styles.navText, active && styles.navTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.sidebarFooter}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#dc2626" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Sidebar />
        <View style={styles.mainContent}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen 
              name="index" 
              options={{
                title: 'Dashboard'
              }} 
            />
            <Stack.Screen 
              name="patients" 
              options={{
                title: 'Patients'
              }} 
            />
            <Stack.Screen 
              name="[patientId]" 
              options={{
                title: 'Patient Details'
              }} 
            />
            <Stack.Screen 
              name="messages" 
              options={{
                title: 'Messages'
              }} 
            />
            <Stack.Screen 
              name="appointments" 
              options={{
                title: 'Appointments'
              }} 
            />
            <Stack.Screen 
              name="documents" 
              options={{
                title: 'Documents'
              }} 
            />
            <Stack.Screen 
              name="analytics" 
              options={{
                title: 'Analytics'
              }} 
            />
            <Stack.Screen 
              name="settings" 
              options={{
                title: 'Settings'
              }} 
            />
          </Stack>
        </View>
      </View>
    );
  }

  // Mobile layout with overlay sidebar
  return (
    <View style={styles.container}>
      <View style={styles.mobileHeader}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setSidebarOpen(true)}
        >
          <Menu size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.mobileTitle}>Provider Portal</Text>
      </View>

      <View style={styles.mainContent}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen 
            name="index" 
            options={{
              title: 'Dashboard'
            }} 
          />
          <Stack.Screen 
            name="patients" 
            options={{
              title: 'Patients'
            }} 
          />
          <Stack.Screen 
            name="[patientId]" 
            options={{
              title: 'Patient Details'
            }} 
          />
          <Stack.Screen 
            name="messages" 
            options={{
              title: 'Messages'
            }} 
          />
          <Stack.Screen 
            name="appointments" 
            options={{
              title: 'Appointments'
            }} 
          />
          <Stack.Screen 
            name="documents" 
            options={{
              title: 'Documents'
            }} 
          />
          <Stack.Screen 
            name="analytics" 
            options={{
              title: 'Analytics'
            }} 
          />
          <Stack.Screen 
            name="settings" 
            options={{
              title: 'Settings'
            }} 
          />
        </Stack>
      </View>

      {sidebarOpen && (
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.overlayBackground}
            onPress={() => setSidebarOpen(false)}
          />
          <Sidebar />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    backgroundColor: '#f8fafc',
  },
  sidebar: {
    width: Platform.OS === 'web' ? 280 : 280,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    flexDirection: 'column',
    ...(Platform.OS === 'web' ? {} : {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      zIndex: 1000,
      shadowColor: '#000',
      shadowOffset: { width: 2, height: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    }),
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
  },
  closeSidebar: {
    padding: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  navigation: {
    flex: 1,
    paddingVertical: 16,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginHorizontal: 12,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: '#eff6ff',
  },
  navText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 12,
  },
  navTextActive: {
    color: '#fef2f2',
  },
  sidebarFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#dc2626',
    marginLeft: 12,
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuButton: {
    padding: 8,
    marginRight: 12,
  },
  mobileTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  mainContent: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});