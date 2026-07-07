import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: 'Restaurador de Campo',
    email: 'restorer@codice-heritage.org',
    role: 'Restorer',
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedEmail = await SecureStore.getItemAsync('user_email');
        const storedRole = await SecureStore.getItemAsync('user_role');
        if (storedEmail && storedRole) {
          setUser({
            name: storedEmail.split('@')[0].replace('.', ' '),
            email: storedEmail,
            role: storedRole,
          });
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user_email');
      await SecureStore.deleteItemAsync('user_role');
      // Redirect back to login / root
      router.replace('/(auth)/login');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Perfil</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{user.role.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Jurisdicción</Text>
            <Text style={styles.infoVal}>Zona Arqueológica Norte</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dispositivo</Text>
            <Text style={styles.infoVal}>Terminal de Campo #4</Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutBtnText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileCard: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '100%',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
    textTransform: 'capitalize',
  },
  email: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 99,
  },
  badgeText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: 'bold',
  },
  infoSection: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  infoVal: {
    color: '#F8FAFC',
    fontSize: 14,
  },
  logoutBtn: {
    width: '100%',
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});