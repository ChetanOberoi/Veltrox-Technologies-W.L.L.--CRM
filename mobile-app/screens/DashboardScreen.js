import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const [stats, setStats] = useState({
    leads: 0, contacts: 0, tickets: 0,
    invoices: 0, openTickets: 0, newLeads: 0
  });
  const [refreshing, setRefreshing] = useState(false);
  const user = auth.currentUser;

  const fetchStats = async () => {
    try {
      const [leads, contacts, tickets, invoices] = await Promise.all([
        getDocs(collection(db, 'leads')),
        getDocs(collection(db, 'contacts')),
        getDocs(collection(db, 'tickets')),
        getDocs(collection(db, 'invoices')),
      ]);
      const openTickets = tickets.docs.filter(d => d.data().status === 'Open').length;
      const newLeads = leads.docs.filter(d => d.data().status === 'New').length;
      setStats({
        leads: leads.size, contacts: contacts.size,
        tickets: tickets.size, invoices: invoices.size,
        openTickets, newLeads
      });
    } catch (e) {
      console.log('Error fetching stats:', e);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const cards = [
    { label: 'Total Leads', value: stats.leads, icon: 'funnel', color: '#1565c0', bg: '#e3f2fd' },
    { label: 'New Leads', value: stats.newLeads, icon: 'star', color: '#6a1b9a', bg: '#f3e5f5' },
    { label: 'Contacts', value: stats.contacts, icon: 'people', color: '#2e7d32', bg: '#e8f5e9' },
    { label: 'Total Tickets', value: stats.tickets, icon: 'ticket', color: '#e65100', bg: '#fff3e0' },
    { label: 'Open Tickets', value: stats.openTickets, icon: 'alert-circle', color: '#c62828', bg: '#ffebee' },
    { label: 'Invoices', value: stats.invoices, icon: 'receipt', color: '#00695c', bg: '#e0f2f1' },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Welcome back,</Text>
          <Text style={styles.username}>{user?.email?.split('@')[0] || 'User'}</Text>
        </View>
        <TouchableOpacity onPress={() => signOut(auth)} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>📊 Overview</Text>

      {/* Stats Grid */}
      <View style={styles.grid}>
        {cards.map((card, i) => (
          <View key={i} style={[styles.card, { backgroundColor: card.bg }]}>
            <Ionicons name={card.icon} size={28} color={card.color} />
            <Text style={[styles.cardValue, { color: card.color }]}>{card.value}</Text>
            <Text style={styles.cardLabel}>{card.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.footer}>Veltrox Technologies W.L.L. • Bahrain</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#1a237e', padding: 20, paddingTop: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  welcome: { color: '#90caf9', fontSize: 14 },
  username: { color: '#fff', fontSize: 20, fontWeight: 'bold', textTransform: 'capitalize' },
  logoutBtn: { padding: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', margin: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  card: {
    width: '44%', margin: '3%', borderRadius: 12,
    padding: 16, alignItems: 'center', elevation: 2
  },
  cardValue: { fontSize: 32, fontWeight: 'bold', marginTop: 8 },
  cardLabel: { fontSize: 12, color: '#666', marginTop: 4, textAlign: 'center' },
  footer: { textAlign: 'center', color: '#999', fontSize: 12, margin: 20 }
});
