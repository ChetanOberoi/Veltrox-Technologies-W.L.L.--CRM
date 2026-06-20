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
        <Text style={styles.totalLabel}>Total
