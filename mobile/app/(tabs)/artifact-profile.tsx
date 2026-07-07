import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { database } from '../../database';
import Artifact from '../../database/models/Artifact';

export default function ArtifactProfileScreen() {
  const [code, setCode] = useState('');
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!code) return;
    setLoading(true);
    try {
      const artifactsCollection = database.get<Artifact>('artifacts');
      const results = await artifactsCollection.query().fetch();
      const match = results.find(a => a.code.toLowerCase() === code.trim().toLowerCase());
      
      if (!match) {
        Alert.alert('No encontrado', 'No se encontró ninguna pieza local con ese código.');
        setArtifact(null);
      } else {
        setArtifact(match);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Hubo un error al buscar el artefacto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Consulta de Ficha (Offline)</Text>
        <Text style={styles.subtitle}>Búsqueda local de bienes en el dispositivo</Text>
      </View>

      <View style={styles.searchBar}>
        <TextInput
          value={code}
          onChangeText={setCode}
          style={styles.searchInput}
          placeholder="Código de la pieza (ej. ARQ-001)"
          placeholderTextColor="#64748B"
          autoCapitalize="characters"
        />
        <TouchableOpacity onPress={handleSearch} style={styles.searchBtn}>
          <Text style={styles.searchBtnText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {artifact ? (
          <View style={styles.profileCard}>
            <Text style={styles.artCode}>{artifact.code}</Text>
            <Text style={styles.artName}>{artifact.name}</Text>
            
            <View style={styles.separator} />
            
            <View style={styles.grid}>
              <View style={styles.gridCell}>
                <Text style={styles.cellLabel}>Ubicación</Text>
                <Text style={styles.cellValue}>{artifact.location}</Text>
              </View>
              <View style={styles.gridCell}>
                <Text style={styles.cellLabel}>Material</Text>
                <Text style={styles.cellValue}>{artifact.material}</Text>
              </View>
              <View style={styles.gridCell}>
                <Text style={styles.cellLabel}>Época</Text>
                <Text style={styles.cellValue}>{artifact.epoch}</Text>
              </View>
              <View style={styles.gridCell}>
                <Text style={styles.cellLabel}>Estado</Text>
                <Text style={[styles.cellValue, { color: artifact.status === 'Catálogo Activo' ? '#10B981' : '#F59E0B' }]}>
                  {artifact.status}
                </Text>
              </View>
            </View>

            <View style={styles.descSection}>
              <Text style={styles.cellLabel}>Descripción</Text>
              <Text style={styles.descText}>{artifact.description || 'Sin descripción disponible.'}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Ingrese un código para consultar la ficha técnica local.</Text>
          </View>
        )}
      </ScrollView>
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
  searchBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    backgroundColor: '#1E293B',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#F8FAFC',
  },
  searchBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#0F172A',
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  artCode: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F59E0B',
    textTransform: 'uppercase',
  },
  artName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 16,
  },
  gridCell: {
    width: '50%',
  },
  cellLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cellValue: {
    fontSize: 14,
    color: '#F8FAFC',
    marginTop: 2,
  },
  descSection: {
    marginTop: 20,
  },
  descText: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 20,
    marginTop: 6,
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 8,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  placeholderText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
  },
});
