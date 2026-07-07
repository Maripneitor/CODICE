import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, PanResponder, SafeAreaView, Alert } from 'react-native';
// eslint-disable-next-line import/no-unresolved
import Svg, { Path } from 'react-native-svg';
import { database } from '../../database';
import Artifact from '../../database/models/Artifact';
import ArtifactMovement from '../../database/models/ArtifactMovement';

export default function DigitalSignatureScreen() {
  const [code, setCode] = useState('');
  const [recipient, setRecipient] = useState('Admin User');
  const [details, setDetails] = useState('');
  const [currentPath, setCurrentPath] = useState<string>('');
  const [allPaths, setAllPaths] = useState<string[]>([]);
  const [isSigned, setIsSigned] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath(`M ${locationX} ${locationY}`);
        setIsSigned(true);
      },
      onPanResponderMove: (evt, gestureState) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPath((prev) => `${prev} L ${locationX} ${locationY}`);
      },
      onPanResponderRelease: () => {
        if (currentPath) {
          setAllPaths((prev) => [...prev, currentPath]);
          setCurrentPath('');
        }
      },
    })
  ).current;

  const handleClear = () => {
    setAllPaths([]);
    setCurrentPath('');
    setIsSigned(false);
  };

  const handleConfirm = async () => {
    if (!code || !isSigned) {
      Alert.alert('Datos Incompletos', 'Debe ingresar el código del artefacto y estampar su firma digital.');
      return;
    }

    try {
      // Mock converting drawing paths to a Base64 Image URL string
      const fakeBase64Signature = `data:image/svg+xml;base64,${btoa(
        `<svg width="300" height="150" xmlns="http://www.w3.org/2000/svg">${allPaths
          .map((path) => `<path d="${path}" fill="none" stroke="black" stroke-width="3"/>`)
          .join('')}</svg>`
      )}`;

      await database.write(async () => {
        const artifactsCollection = database.get<Artifact>('artifacts');
        const results = await artifactsCollection.query().fetch();
        const artifact = results.find(a => a.code.toLowerCase() === code.trim().toLowerCase());

        if (!artifact) {
          throw new Error('No se encontró ningún artefacto local con ese código.');
        }

        const movementsCollection = database.get<ArtifactMovement>('artifact_movements');
        await movementsCollection.create((movement) => {
          movement.artifactId = artifact.id;
          movement.action = 'Traslado';
          // Associate the base64 signature inmutable inside the details field of the movement
          movement.details = `${details || 'Firma de recepción cargada'}. SignatureData: ${fakeBase64Signature}`;
          movement.responsible = recipient;
          movement.origin = 'App Campo Offline';
        });
      });

      Alert.alert('Protocolo Confirmado', 'La firma y los datos se han guardado localmente de forma inmutable.');
      setCode('');
      setDetails('');
      handleClear();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al guardar la firma digital.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Protocolo de Recepción Digital</Text>
        <Text style={styles.subtitle}>Firma digital de custodia e inventario</Text>
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
          <Text style={styles.label}>Firma del Receptor</Text>
          <View style={styles.canvasContainer} {...panResponder.panHandlers}>
            <Svg style={styles.canvas}>
              {allPaths.map((path, index) => (
                <Path key={index} d={path} fill="none" stroke="#F8FAFC" strokeWidth={3} />
              ))}
              {currentPath ? (
                <Path d={currentPath} fill="none" stroke="#F59E0B" strokeWidth={3} />
              ) : null}
            </Svg>
            {!isSigned && (
              <Text style={styles.canvasPlaceholder}>Firme aquí en la pantalla</Text>
            )}
          </View>
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Borrar Firma</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Observaciones de Recepción</Text>
          <TextInput
            value={details}
            onChangeText={setDetails}
            style={styles.input}
            placeholder="Observaciones o notas de traslado..."
            placeholderTextColor="#64748B"
          />
        </View>

        <TouchableOpacity onPress={handleConfirm} style={styles.submitBtn}>
          <Text style={styles.submitBtnText}>Confirmar y Archivar</Text>
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
  canvasContainer: {
    height: 180,
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  canvas: {
    flex: 1,
  },
  canvasPlaceholder: {
    position: 'absolute',
    color: '#64748B',
    fontSize: 14,
    width: '100%',
    textAlign: 'center',
    top: '45%',
    pointerEvents: 'none',
  },
  clearBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  clearBtnText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: 'bold',
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