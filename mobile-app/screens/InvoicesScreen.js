import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, Alert, Modal, ScrollView
} from 'react-native';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

const STATUS_COLORS = {
  'Draft': '#757575', 'Sent': '#1565c0',
  'Paid': '#2e7d32', 'Overdue': '#c62828', 'Cancelled': '#880e4f'
};

export default function InvoicesScreen() {
  const [invoices, setInvoices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [form, setForm] = useState({
    invoiceNo: '', customerName: '', company: '',
    amount: '', status: 'Draft', dueDate: '', notes: ''
  });

  const fetchInvoices = async () => {
    try {
      const snap = await getDocs(collection(db, 'invoices'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setInvoices(data);
      setFiltered(data);
    } catch (e) { console.log(e); }
  };

  useEffect(() => { fetchInvoices(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    let data = invoices;
    if (filterStatus !== 'All') data = data.filter(i => i.status === filterStatus);
    setFiltered(data.filter(i =>
      (i.invoiceNo || '').toLowerCase().includes(q) ||
      (i.customerName || '').toLowerCase().includes(q) ||
      (i.company || '').toLowerCase().includes(q)
    ));
  }, [search, invoices, filterStatus]);

  const onRefresh = async () => { setRefreshing(true); await fetchInvoices(); setRefreshing(false); };

  const totalAmount = filtered.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

  const saveInvoice = async () => {
    if (!form.customerName) { Alert.alert('Error', 'Customer name is required'); return; }
    try {
      await addDoc(collection(db, 'invoices'), { ...form, createdAt: serverTimestamp() });
      setModalVisible(false);
      setForm({ invoiceNo: '', customerName: '', company: '', amount: '', status: 'Draft', dueDate: '', notes: '' });
      fetchInvoices();
    } catch (e) { Alert.alert('Error', 'Failed to save invoice'); }
  };

  const renderInvoice = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.invoiceNo}>{item.invoiceNo || 'INV-—'}</Text>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <Text style={styles.company}>{item.company || ''}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.amount}>BHD {parseFloat(item.amount || 0).toFixed(3)}</Text>
          <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] || '#999' }]}>
            <Text style={styles.badgeText}>{item.status}</Text>
          </View>
          {item.dueDate ? <Text style={styles.dueDate}>Due: {item.dueDate}</Text> : null}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Total Bar */}
      <View style={styles.totalBar}>
        <Text style={styles.totalLabel}>Total ({filtered.length} invoices)</Text>
        <Text style={styles.totalAmount}>BHD {totalAmount.toFixed(3)}</Text>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.search}
          placeholder="Search invoices..."
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {['All', 'Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'].map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, filterStatus === s && styles.filterChipActive]}
            onPress={() => setFilterStatus(s)}
          >
            <Text style={[styles.filterText, filterStatus === s && styles.filterTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderInvoice}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.empty}>No invoices found</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New Invoice</Text>
            <ScrollView>
              {[
                { key: 'invoiceNo', label: 'Invoice No', placeholder: 'INV-001' },
                { key: 'customerName', label: 'Customer Name *', placeholder: 'Customer name' },
                { key: 'company', label: 'Company', placeholder: 'Company name' },
                { key: 'amount', label: 'Amount (BHD)', placeholder: '0.000', keyboard: 'decimal-pad' },
                { key: 'dueDate', label: 'Due Date', placeholder: 'DD/MM/YYYY' },
                { key: 'notes', label: 'Notes', placeholder: 'Additional notes' },
              ].map(field => (
                <View key={field.key}>
                  <Text style={styles.label}>{field.label}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={field.placeholder}
                    value={form[field.key]}
                    onChangeText={v => setForm({ ...form, [field.key]: v })}
                    keyboardType={field.keyboard || 'default'}
                  />
                </View>
              ))}
              <Text style={styles.label}>Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {Object.keys(STATUS_COLORS).map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, { backgroundColor: form.status === s ? STATUS_COLORS[s] : '#eee' }]}
                    onPress={() => setForm({ ...form, status: s })}
                  >
                    <Text style={{ color: form.status === s ? '#fff' : '#333', fontSize: 12 }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={{ color: '#666' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveInvoice}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save Invoice</Text>
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
  totalBar: { backgroundColor: '#1a237e', padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: '#90caf9', fontSize: 13 },
  totalAmount: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: 12, gap: 8 },
  searchIcon: { position: 'absolute', left: 20, zIndex: 1 },
  search: { flex: 1, backgroundColor: '#fff', borderRadius: 8, paddingLeft: 36, paddingRight: 12, paddingVertical: 10, elevation: 2 },
  addBtn: { backgroundColor: '#1a237e', borderRadius: 8, padding: 10 },
  filterRow: { paddingHorizontal: 12, marginBottom: 4 },
  filterChip: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6, marginRight: 8, backgroundColor: '#eee' },
  filterChipActive: { backgroundColor: '#1a237e' },
  filterText: { fontSize: 12, color: '#555' },
  filterTextActive: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', margin: 8, marginHorizontal: 12, borderRadius: 10, padding: 14, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  invoiceNo: { fontSize: 13, color: '#888', marginBottom: 2 },
  customerName: { fontSize: 15, fontWeight: 'bold', color: '#222' },
  company: { fontSize: 12, color: '#666' },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#1a237e', marginBottom: 4 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-end' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  dueDate: { fontSize: 11, color: '#888', marginTop: 4 },
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
