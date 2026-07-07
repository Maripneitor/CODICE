import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { database } from '../../database';
import Artifact from '../../database/models/Artifact';
import ArtifactMovement from '../../database/models/ArtifactMovement';

export default function TransferFormScreen() {
  const [code, setCode] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [status, setStatus] = useState('Catálogo Activo');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTransfer = async () => {
    if (!code || !newLocation) {
      Alert.alert('Campos Incompletos', 'Debe proporcionar el código del artefacto y la nueva ubicación.');
      return;
    }

    setLoading(true);

    try {
      await database.write(async () => {
        const artifactsCollection = database.get<Artifact>('artifacts');
        const results = await artifactsCollection.query().fetch();
        const artifact = results.find(a => a.code.toLowerCase() === code.trim().toLowerCase());

        if (!artifact) {
          throw new Error('No se encontró ningún artefacto local con ese código.');
        }

        // Update artifact details
        await artifact.update((record) => {
          record.location = newLocation;
          record.status = status;
        });

        // Add a movement
        const movementsCollection = database.get<ArtifactMovement>('artifact_movements');
        await movementsCollection.create((movement) => {
          movement.artifactId = artifact.id;
          movement.action = 'Traslado';
          movement.details = details || `Traslado offline a: ${newLocation}`;
          movement.responsible = 'Campo User';
          movement.origin = 'App Campo Offline';
        });
      });

      Alert.alert('Éxito', 'El traslado se ha registrado localmente de forma offline.');
      setCode('');
      setNewLocation('');
      setDetails('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al procesar el traslado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Registrar Traslado (Offline)</Text>
        <Text style={styles.subtitle}>Actualiza la ubicación del bien patrimonial</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Código del Artefacto</Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            style={styles.input}
            placeholder="p. ej. ARQ-001"
            placeholderTextColor="#64748B"
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nueva Ubicación / Bóveda</Text>
          <TextInput
            value={newLocation}
            onChangeText={setNewLocation}
            style={styles.input}
            placeholder="Bóveda B, Estante 2"
            placeholderTextColor="#64748B"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Estado de Conservación</Text>
          <View style={styles.badgeRow}>
            {['Catálogo Activo', 'En Restauración'].map((st) => (
              <TouchableOpacity
                key={st}
                onPress={() => setStatus(st)}
                style={[
                  styles.badge,
                  status === st && styles.activeBadge
                ]}
              >
                <Text style={[styles.badgeText, status === st && styles.activeBadgeText]}>{st}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Detalles o Motivo</Text>
          <TextInput
            value={details}
            onChangeText={setDetails}
            style={[styles.input, styles.textArea]}
            placeholder="Motivo del traslado o estado al recibir..."
            placeholderTextColor="#64748B"
            multiline
          />
        </View>

        <TouchableOpacity
          onPress={handleTransfer}
          disabled={loading}
          style={styles.submitBtn}
        >
          <Text style={styles.submitBtnText}>{loading ? 'Procesando...' : 'Registrar Traslado'}</Text>
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
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: '#F8FAFC',
    fontSize: 14,
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  badge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeBadge: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  badgeText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeBadgeText: {
    color: '#0F172A',
  },
  submitBtn: {
    backgroundColor: '#F59E0B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnText: {
    color: '#0F172A',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
