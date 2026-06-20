import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

const MENU_ITEMS = [
  { icon: 'document-text', label: 'Quotations', color: '#6a1b9a', screen: 'Quotations' },
  { icon: 'cube', label: 'Products', color: '#1565c0', screen: 'Products' },
  { icon: 'construct', label: 'Services', color: '#2e7d32', screen: 'Services' },
  { icon: 'people', label: 'User Management', color: '#e65100', screen: 'Users' },
  { icon: 'bar-chart', label: 'Reports', color: '#00695c', screen: 'Reports' },
  { icon: 'settings', label: 'Settings', color: '#757575', screen: 'Settings' },
];

export default function MoreScreen({ navigation }) {
  const user = auth.currentUser;

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => signOut(auth) }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* User Info */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.email || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <View style={{ marginLeft: 14 }}>
          <Text style={styles.userName}>
            {user?.email?.split('@')[0] || 'User'}
          </Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          <Text style={styles.userCompany}>Veltrox Technologies W.L.L.</Text>
        </View>
      </View>

      {/* Menu Items */}
      <Text style={styles.sectionTitle}>More Modules</Text>
      <View style={styles.menuGrid}>
        {MENU_ITEMS.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.menuItem}
            onPress={() => Alert.alert(item.label, 'Coming soon in next update!')}
          >
            <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon} size={26} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* App Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Veltrox CRM</Text>
        <Text style={styles.infoText}>Version 1.0.0</Text>
        <Text style={styles.infoText}>Powered by Firebase + React Native</Text>
        <Text style={styles.infoText}>© 2026 Veltrox Technologies W.L.L.</Text>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  userCard: {
    backgroundColor: '#1a237e', padding: 20,
    flexDirection: 'row', alignItems: 'center'
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center'
  },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#1a237e' },
  userName: { color: '#fff', fontSize: 18, fontWeight: 'bold', textTransform: 'capitalize' },
  userEmail: { color: '#90caf9', fontSize: 13 },
  userCompany: { color: '#90caf9', fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#888', margin: 16, marginBottom: 8, textTransform: 'uppercase' },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  menuItem: {
    width: '44%', margin: '3%', backgroundColor: '#fff',
    borderRadius: 12, padding: 16, alignItems: 'center', elevation: 2
  },
  menuIcon: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  menuLabel: { fontSize: 13, fontWeight: '600', color: '#333', textAlign: 'center' },
  infoCard: {
    margin: 16, backgroundColor: '#fff', borderRadius: 12,
    padding: 16, alignItems: 'center', elevation: 1
  },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a237e', marginBottom: 6 },
  infoText: { fontSize: 12, color: '#888', marginBottom: 2 },
  logoutBtn: {
    margin: 16, backgroundColor: '#c62828', borderRadius: 12,
    padding: 16, flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 8, marginBottom: 32
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
