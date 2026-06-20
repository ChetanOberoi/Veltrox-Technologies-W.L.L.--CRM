import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, Alert, Modal, ScrollView, Linking
} from 'react-native';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function ContactsScreen() {
  const [contacts, setContacts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', designation: '', notes: '' });

  const fetchContacts = async () => {
    try {
      const snap = await getDocs(collection(db, 'contacts'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setContacts(data);
      setFiltered(data);
    } catch (e) { console.log(e); }
  };

  useEffect(() => { fetchContacts(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(contacts.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    ));
  }, [search, contacts]);

  const onRefresh = async () => { setRefreshing(true); await fetchContacts(); setRefreshing(false); };

  const saveContact = async () => {
    if (!form.name) { Alert.alert('Error', 'Name is required'); return; }
    try {
      await addDoc(collection(db, 'contacts'), { ...form, createdAt: serverTimestamp() });
      setModalVisible(false);
      setForm({ name: '', company: '', phone: '', email: '', designation: '', notes: '' });
      fetchContacts();
    } catch (e) { Alert.alert('Error', 'Failed to save contact'); }
  };

  const renderContact = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: getColor(item.name) }]}>
          <Text style={styles.avatarText}>{(item.name || 'C')[0].toUpperCase()}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardSub}>{item.designation || ''}{item.designation && item.company ? ' • ' : ''}{item.company || ''}</Text>
          <Text style={styles.cardPhone}>{item.phone || item.email || '—'}</Text>
        </View>
        <View style={styles.actions}>
          {item.phone ? (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.phone}`)}>
              <Ionicons name="call" size={20} color="#2e7d32" />
            </TouchableOpacity>
          ) : null}
          {item.phone ? (
            <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/${item.phone.replace(/\D/g,'')}`)} style={{ marginTop: 6 }}>
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.search}
          placeholder="Search contacts..."
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.count}>{filtered.length} contacts</Text>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderContact}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.empty}>No contacts found</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add New Contact</Text>
            <ScrollView>
              {[
                { key: 'name', label: 'Name *', placeholder: 'Full name' },
                { key: 'company', label: 'Company', placeholder: 'Company name' },
                { key: 'designation', label: 'Designation', placeholder: 'Job title' },
                { key: 'phone', label: 'Phone', placeholder: '+973 XXXX XXXX' },
                { key: 'email', label: 'Email', placeholder: 'email@example.com' },
                { key: 'notes', label: 'Notes', placeholder: 'Additional notes' },
              ].map(field => (
                <View key={field.key}>
                  <Text style={styles.label}>{field.label}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={field.placeholder}
                    value={form[field.key]}
                    onChangeText={v => setForm({ ...form, [field.key]: v })}
                    keyboardType={field.key === 'phone' ? 'phone-pad' : field.key === 'email' ? 'email-address' : 'default'}
                    autoCapitalize={field.key === 'email' ? 'none' : 'words'}
                  />
                </View>
              ))}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={{ color: '#666' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveContact}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const COLORS = ['#1565c0','#6a1b9a','#2e7d32','#e65100','#00695c','#c62828','#f57f17'];
const getColor = (name) => COLORS[(name || 'A').charCodeAt(0) % COLORS.length];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: 12, gap: 8 },
  searchIcon: { position: 'absolute', left: 20, zIndex: 1 },
  search: { flex: 1, backgroundColor: '#fff', borderRadius: 8, paddingLeft: 36, paddingRight: 12, paddingVertical: 10, elevation: 2 },
  addBtn: { backgroundColor: '#1a237e', borderRadius: 8, padding: 10 },
  count: { color: '#888', fontSize: 12, marginLeft: 16, marginBottom: 4 },
  card: { backgroundColor: '#fff', margin: 8, marginHorizontal: 12, borderRadius: 10, padding: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cardInfo: { flex: 1, marginLeft: 10 },
  cardName: { fontSize: 15, fontWeight: 'bold', color: '#222' },
  cardSub: { fontSize: 12, color: '#555' },
  cardPhone: { fontSize: 12, color: '#888' },
  actions: { alignItems: 'center' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a237e', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 14 },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#1a237e', alignItems: 'center' },
});
