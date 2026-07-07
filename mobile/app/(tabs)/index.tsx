import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { database } from '../../database';
import Artifact from '../../database/models/Artifact';

export default function MobileDashboard() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, restoring: 0 });

  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  const loadOfflineData = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }
    try {
      const artifactCollection = database.get<Artifact>('artifacts');
      const allArtifacts = await artifactCollection.query().fetch();
      
      const targetPage = reset ? 1 : page;
      setArtifacts(allArtifacts.slice(0, targetPage * LIMIT));
      
      const active = allArtifacts.filter(a => a.status === 'Catálogo Activo').length;
      const restoring = allArtifacts.filter(a => a.status === 'En Restauración').length;
      
      setStats({
        total: allArtifacts.length,
        active,
        restoring,
      });
    } catch (error) {
      console.error('Error loading WatermelonDB data:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (loadingMore || artifacts.length >= stats.total) return;
    setLoadingMore(true);
    setTimeout(() => {
      setPage(prevPage => {
        const nextPage = prevPage + 1;
        database.get<Artifact>('artifacts').query().fetch().then((allArtifacts) => {
          setArtifacts(allArtifacts.slice(0, nextPage * LIMIT));
          setLoadingMore(false);
        }).catch(err => {
          console.error(err);
          setLoadingMore(false);
        });
        return nextPage;
      });
    }, 400);
  };

  useEffect(() => {
    loadOfflineData(true);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CÓDICE Móvil</Text>
        <Text style={styles.subtitle}>Base de Datos Local Offline</Text>
      </View>

      {/* Local statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{stats.total}</Text>
          <Text style={styles.statLabel}>Local Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: '#10B981' }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>Activos</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statVal, { color: '#F59E0B' }]}>{stats.restoring}</Text>
          <Text style={styles.statLabel}>Taller</Text>
        </View>
      </View>

      <View style={styles.listSection}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Piezas Locales</Text>
          <TouchableOpacity onPress={() => loadOfflineData(true)} style={styles.syncBtn}>
            <Text style={styles.syncBtnText}>Actualizar</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#F59E0B" style={{ marginTop: 20 }} />
        ) : artifacts.length === 0 ? (
          <View style={styles.emptyView}>
            <Text style={styles.emptyText}>No hay piezas guardadas localmente.</Text>
          </View>
        ) : (
          <FlatList
            data={artifacts}
            keyExtractor={(item: Artifact) => item.id}
            contentContainerStyle={styles.list}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={5}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.1}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator size="small" color="#F59E0B" style={{ marginVertical: 16 }} />
              ) : null
            }
            renderItem={({ item }: { item: Artifact }) => (
              <View style={styles.itemCard}>
                <View>
                  <Text style={styles.itemCode}>{item.code}</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemLoc}>Loc: {item.location}</Text>
                </View>
                <View style={[styles.statusBadge, {
                  backgroundColor: item.status === 'Catálogo Activo' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'
                }]}>
                  <Text style={[styles.statusText, {
                    color: item.status === 'Catálogo Activo' ? '#10B981' : '#F59E0B'
                  }]}>{item.status}</Text>
                </View>
              </View>
            )}
          />
        )}
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8FAFC',
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  listSection: {
    flex: 1,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  syncBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  syncBtnText: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  emptyView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
  list: {
    paddingBottom: 24,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  itemCode: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  itemName: {
    fontSize: 16,
    color: '#F8FAFC',
    marginTop: 2,
    fontWeight: '500',
  },
  itemLoc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
