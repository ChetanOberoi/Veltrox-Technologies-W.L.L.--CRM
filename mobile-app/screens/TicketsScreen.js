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
                { key: 'title', label: 'Title *', placeholder: 'Issue title' },
                { key: 'contactPerson', label: 'Contact Person', placeholder: 'Customer name' },
                { key: 'company', label: 'Company', placeholder: 'Company name' },
                { key: 'phone', label: 'Phone', placeholder: 'Phone number' },
                { key: 'serviceType', label: 'Service Type', placeholder: 'e.g. TallyPrime, AMC, TSS' },
                { key: 'description', label: 'Description', placeholder: 'Describe the issue...' },
              ].map(field => (
                <View key={field.key}>
                  <Text style={styles.label}>{field.label}</Text>
                  <TextInput
                    style={[styles.input, field.key === 'description' && { height: 80 }]}
                    placeholder={field.placeholder}
                    value={form[field.key]}
                    onChangeText={v => setForm({ ...form, [field.key]: v })}
                    multiline={field.key === 'description'}
                  />
                </View>
              ))}

              <Text style={styles.label}>Priority</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {['Low', 'Medium', 'High', 'Critical'].map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.chip, { backgroundColor: form.priority === p ? PRIORITY_COLORS[p] : '#eee' }]}
                    onPress={() => setForm({ ...form, priority: p })}
                  >
                    <Text style={{ color: form.priority === p ? '#fff' : '#333', fontSize: 12 }}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={{ color: '#666' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveTicket}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save Ticket</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: 12, gap: 8 },
  searchIcon: { position: 'absolute', left: 20, zIndex: 1 },
  search: { flex: 1, backgroundColor: '#fff', borderRadius: 8, paddingLeft: 36, paddingRight: 12, paddingVertical: 10, elevation: 2 },
  addBtn: { backgroundColor: '#1a237e', borderRadius: 8, padding: 10 },
  filterRow: { paddingHorizontal: 12, marginBottom: 4 },
  filterChip: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6, marginRight: 8, backgroundColor: '#eee' },
  filterChipActive: { backgroundColor: '#1a237e' },
  filterText: { fontSize: 12, color: '#555' },
  filterTextActive: { color: '#fff', fontWeight: 'bold' },
  count: { color: '#888', fontSize: 12, marginLeft: 16, marginBottom: 4 },
  card: { backgroundColor: '#fff', margin: 8, marginHorizontal: 12, borderRadius: 10, padding: 12, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#222', flex: 1, marginRight: 8 },
  cardMid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardSub: { fontSize: 12, color: '#666', flex: 1 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  priorityBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  serviceType: { fontSize: 12, color: '#555', marginTop: 6 },
  desc: { fontSize: 12, color: '#888', marginTop: 4 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '92%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a237e', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 14 },
  chip: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8 },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#1a237e', alignItems: 'center' },
});
