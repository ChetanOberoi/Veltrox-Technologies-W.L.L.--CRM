import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, Alert, Modal, ScrollView
} from 'react-native';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

const STATUS_COLORS = {
  'Open': '#c62828', 'In Progress': '#e65100',
  'Resolved': '#2e7d32', 'Closed': '#757575'
};
const PRIORITY_COLORS = {
  'Low': '#2e7d32', 'Medium': '#e65100', 'High': '#c62828', 'Critical': '#880e4f'
};

export default function TicketsScreen() {
  const [tickets, setTickets] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [form, setForm] = useState({
    title: '', contactPerson: '', company: '', phone: '',
    priority: 'Medium', status: 'Open', serviceType: '', description: ''
  });

  const fetchTickets = async () => {
    try {
      const snap = await getDocs(collection(db, 'tickets'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setTickets(data);
      setFiltered(data);
    } catch (e) { console.log(e); }
  };

  useEffect(() => { fetchTickets(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    let data = tickets;
    if (filterStatus !== 'All') data = data.filter(t => t.status === filterStatus);
    setFiltered(data.filter(t =>
      (t.title || '').toLowerCase().includes(q) ||
      (t.contactPerson || '').toLowerCase().includes(q) ||
      (t.company || '').toLowerCase().includes(q)
    ));
  }, [search, tickets, filterStatus]);

  const onRefresh = async () => { setRefreshing(true); await fetchTickets(); setRefreshing(false); };

  const saveTicket = async () => {
    if (!form.title) { Alert.alert('Error', 'Title is required'); return; }
    try {
      await addDoc(collection(db, 'tickets'), { ...form, createdAt: serverTimestamp() });
      setModalVisible(false);
      setForm({ title: '', contactPerson: '', company: '', phone: '', priority: 'Medium', status: 'Open', serviceType: '', description: '' });
      fetchTickets();
    } catch (e) { Alert.alert('Error', 'Failed to save ticket'); }
  };

  const renderTicket = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] || '#999' }]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.cardMid}>
        <Text style={styles.cardSub}>{item.contactPerson || '—'} {item.company ? `• ${item.company}` : ''}</Text>
        <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[item.priority] || '#999' }]}>
          <Text style={styles.badgeText}>{item.priority}</Text>
        </View>
      </View>
      {item.serviceType ? <Text style={styles.serviceType}>🔧 {item.serviceType}</Text> : null}
      {item.description ? <Text style={styles.desc} numberOfLines={2}>{item.description}</Text> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.search}
          placeholder="Search tickets..."
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Status Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {['All', 'Open', 'In Progress', 'Resolved', 'Closed'].map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, filterStatus === s && styles.filterChipActive]}
            onPress={() => setFilterStatus(s)}
          >
            <Text style={[styles.filterText, filterStatus === s && styles.filterTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.count}>{filtered.length} tickets</Text>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderTicket}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.empty}>No tickets found</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New Support Ticket</Text>
            <ScrollView>
              {[
