import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { database } from '../../database';
import Artifact from '../../database/models/Artifact';

export default function NewArtifactScreen() {
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    location: '',
    material: '',
    epoch: '',
    dimensions: '',
    weight: '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.code || !form.name || !form.location || !form.material) {
      Alert.alert('Campos Incompletos', 'Por favor, complete al menos Código, Nombre, Ubicación y Material.');
      return;
    }

    setLoading(true);

    try {
      await database.write(async () => {
        const artifactsCollection = database.get<Artifact>('artifacts');
        await artifactsCollection.create((newArtifact) => {
          newArtifact.code = form.code;
          newArtifact.name = form.name;
          newArtifact.description = form.description;
          newArtifact.location = form.location;
          newArtifact.status = 'Catálogo Activo';
          newArtifact.material = form.material;
          newArtifact.epoch = form.epoch;
          newArtifact.dimensions = form.dimensions;
          newArtifact.weight = form.weight;
        });
      });

      Alert.alert('Éxito', 'El artefacto se ha guardado localmente en WatermelonDB de manera offline.');
      setForm({
        code: '',
        name: '',
        description: '',
        location: '',
        material: '',
        epoch: '',
        dimensions: '',
        weight: '',
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Hubo un error al guardar el artefacto localmente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Registrar Pieza (Offline)</Text>
        <Text style={styles.subtitle}>Almacenamiento directo local en campo</Text>
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Código del Artefacto</Text>
          <TextInput
            value={form.code}
            onChangeText={(text) => setForm({ ...form, code: text })}
            style={styles.input}
            placeholder="p. ej. ARQ-001"
            placeholderTextColor="#64748B"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre de la Pieza</Text>
          <TextInput
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
            style={styles.input}
            placeholder="Nombre o título de la pieza"
            placeholderTextColor="#64748B"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ubicación / Estante</Text>
          <TextInput
            value={form.location}
            onChangeText={(text) => setForm({ ...form, location: text })}
            style={styles.input}
            placeholder="Bóveda A, Fila 4"
            placeholderTextColor="#64748B"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Material principal</Text>
          <TextInput
            value={form.material}
            onChangeText={(text) => setForm({ ...form, material: text })}
            style={styles.input}
            placeholder="Piedra, Bronce, Cerámica"
            placeholderTextColor="#64748B"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Época o Periodo</Text>
          <TextInput
            value={form.epoch}
            onChangeText={(text) => setForm({ ...form, epoch: text })}
            style={styles.input}
            placeholder="p. ej. Siglo III d.C."
            placeholderTextColor="#64748B"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Dimensiones</Text>
          <TextInput
            value={form.dimensions}
            onChangeText={(text) => setForm({ ...form, dimensions: text })}
            style={styles.input}
            placeholder="15x20x10 cm"
            placeholderTextColor="#64748B"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Peso aproximado</Text>
          <TextInput
            value={form.weight}
            onChangeText={(text) => setForm({ ...form, weight: text })}
            style={styles.input}
            placeholder="3.2 kg"
            placeholderTextColor="#64748B"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descripción / Observaciones</Text>
          <TextInput
            value={form.description}
            onChangeText={(text) => setForm({ ...form, description: text })}
            style={[styles.input, styles.textArea]}
            placeholder="Detalles sobre el hallazgo o estado..."
            placeholderTextColor="#64748B"
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={styles.submitBtn}
        >
          <Text style={styles.submitBtnText}>{loading ? 'Guardando...' : 'Guardar en Local (Offline)'}</Text>
        </TouchableOpacity>
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
  form: {
    padding: 20,
    paddingBottom: 40,
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
    height: 80,
    textAlignVertical: 'top',
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
