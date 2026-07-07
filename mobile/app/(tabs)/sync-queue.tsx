import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import * as Network from 'expo-network';
import * as SecureStore from 'expo-secure-store';
import { database } from '../../database';
import Artifact from '../../database/models/Artifact';

export default function SyncQueueScreen() {
  const [queueCount, setQueueCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);

  const checkConnectionAndQueue = async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      setIsOnline(state.isConnected ?? false);

      const artifactsCollection = database.get<Artifact>('artifacts');
      const allArtifacts = await artifactsCollection.query().fetch();
      // Items that are locally created/modified (mocking unsynced queue)
      setQueueCount(allArtifacts.length);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkConnectionAndQueue();
    // Poll connection and queue size every 10 seconds
    const interval = setInterval(checkConnectionAndQueue, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    if (!isOnline) {
      Alert.alert('Modo Offline', 'No hay conexión a internet disponible en este momento.');
      return;
    }

    setSyncing(true);
    setProgress(0.1);

    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) {
        throw new Error('Debe iniciar sesión para poder sincronizar con el servidor.');
      }

      // Fetch all local records to synchronize
      const artifactsCollection = database.get<Artifact>('artifacts');
      const allArtifacts = await artifactsCollection.query().fetch();

      setProgress(0.4);

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api';

      // Call Push endpoint on NestJS
      const pushRes = await fetch(`${apiUrl}/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          artifacts: {
            created: allArtifacts.map(a => ({
              id: a.id,
              code: a.code,
              name: a.name,
              description: a.description,
              location: a.location,
              status: a.status,
              material: a.material,
              epoch: a.epoch,
              dimensions: a.dimensions,
              weight: a.weight,
              version: 1,
            })),
          },
        }),
      });

      const pushData = await pushRes.json();
      if (!pushRes.ok) {
        throw new Error(pushData.message || 'Error al subir los datos.');
      }

      setProgress(0.8);

      // Call Pull endpoint to fetch new updates
      const pullRes = await fetch(`${apiUrl}/sync/pull`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const pullData = await pullRes.json();
      if (!pullRes.ok) {
        throw new Error('Error al descargar actualizaciones.');
      }

      setProgress(1.0);
      const conflicts = pushData.success && pushData.data ? pushData.data.conflicts : (pushData.conflicts || 0);
      Alert.alert('Sincronización Completada', `Proceso completado. Conflictos detectados: ${conflicts}`);
      setQueueCount(0); // Sincronizado
    } catch (error: any) {
      Alert.alert('Fallo de Sincronización', error.message || 'Error al conectar con la API.');
    } finally {
      setSyncing(false);
      setProgress(0);
    }
  };

  // Auto-sync listener when connection turns online
  useEffect(() => {
    if (isOnline && queueCount > 0 && !syncing) {
      handleSync();
    }
  }, [isOnline]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cola de Sincronización</Text>
        <Text style={styles.subtitle}>Estatus de la réplica bidireccional</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Elementos Pendientes</Text>
          <Text style={styles.cardVal}>{queueCount}</Text>
          
          <View style={styles.statusRow}>
            <View style={[styles.indicator, { backgroundColor: isOnline ? '#10B981' : '#64748B' }]} />
            <Text style={styles.statusText}>{isOnline ? 'Online (Conexión Activa)' : 'Offline (Local)'}</Text>
          </View>
        </View>

        {syncing && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>Sincronizando base de datos local...</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <ActivityIndicator size="small" color="#F59E0B" style={{ marginTop: 12 }} />
          </View>
        )}

        <TouchableOpacity
          onPress={handleSync}
          disabled={syncing}
          style={[styles.syncBtn, syncing && { opacity: 0.6 }]}
        >
          <Text style={styles.syncBtnText}>{syncing ? 'Sincronizando...' : 'Sincronizar Ahora'}</Text>
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
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  card: {
    backgroundColor: '#1E293B',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardVal: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginVertical: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  progressContainer: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
  },
  progressLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#0F172A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
  },
  syncBtn: {
    backgroundColor: '#F59E0B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  syncBtnText: {
    color: '#0F172A',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
