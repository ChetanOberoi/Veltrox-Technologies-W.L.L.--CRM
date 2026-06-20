import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, Alert, Modal, ScrollView
} from 'react-native';
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

const STATUS_COLORS = {
  'New': '#1565c0', 'Contacted': '#6a1b9a', 'Qualified': '#2e7d32',
  'Proposal': '#e65100', 'Won': '#00695c', 'Lost': '#c62828',
  'Not Qualified': '#757575'
};

export default function LeadsScreen() {
  const [leads, setLeads] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', status: 'New', notes: '' });

  const fetchLeads = async () => {
    try {
      const snap = await getDocs(collection(db, 'leads'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setLeads(data);
      setFiltered(data);
    } catch (e) { console.log(e); }
  };

  useEffect(() => { fetchLeads(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(leads.filter(l =>
      (l.name || '').toLowerCase().includes(q) ||
      (l.company || '').toLowerCase().includes(q) ||
      (l.status || '').toLowerCase().includes(q)
    ));
  }, [search, leads]);

  const onRefresh = async () => { setRefreshing(true); await fetchLeads(); setRefreshing(false); };

  const saveLead = async () => {
    if (!form.name) { Alert.alert('Error', 'Name is required'); return; }
    try {
      await addDoc(collection(db, 'leads'), { ...form, createdAt: serverTimestamp() });
      setModalVisible(false);
      setForm({ name: '', company: '', phone: '', email: '', status: 'New', notes: '' });
      fetchLeads();
    } catch (e) { Alert.alert('Error', 'Failed to save lead'); }
  };

  const renderLead = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.name || 'L')[0].toUpperCase()}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardCompany}>{item.company || '—'}</Text>
          <Text style={styles.cardPhone}>{item.phone || item.email || '—'}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] || '#999' }]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
      {item.notes ? <Text style={styles.notes}>{item.notes}</Text>
