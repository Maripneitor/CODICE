import React, { useState } from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { database } from '../../database';
import Artifact from '../../database/models/Artifact';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [artifactData, setArtifactData] = useState<any>(null);

  if (!permission) {
    // Camera permissions are still loading.
    return <View style={styles.center}><Text style={{ color: '#fff' }}>Cargando permisos de cámara...</Text></View>;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.center}>
        <Text style={{ color: '#fff', textAlign: 'center', marginBottom: 12 }}>Se necesitan permisos de cámara para escanear QRs.</Text>
        <Button onPress={requestPermission} title="Otorgar Permiso" color="#F59E0B" />
      </View>
    );
  }

  // Defensive validation of content
  const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);

    try {
      // 1. Clean URL to get the final path parameter
      let idValue = data.trim();
      if (idValue.includes('/catalog/')) {
        const parts = idValue.split('/catalog/');
        idValue = parts[parts.length - 1];
      }

      // 2. Strict UUIDv4 regex validation to prevent injection/execution attacks
      const uuidv4Regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
      if (!uuidv4Regex.test(idValue)) {
        Alert.alert('Código No Válido', 'El QR no contiene un ID de artefacto UUIDv4 válido. Escaneo abortado por seguridad.');
        return;
      }

      // 3. Query WatermelonDB database instance to find if artifact exists local/offline
      const artifactsCollection = database.get<Artifact>('artifacts');
      const allArtifacts = await artifactsCollection.query().fetch();
      const match = allArtifacts.find(a => a.id === idValue);

      if (!match) {
        Alert.alert('No Encontrado', `No se encontró la pieza con ID: ${idValue} en la base de datos local.`);
      } else {
        setArtifactData(match);
        Alert.alert('Pieza Identificada', `Código: ${match.code}\nNombre: ${match.name}\nUbicación: ${match.location}`);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Hubo un error al procesar el escaneo.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lector de Códigos QR</Text>
        <Text style={styles.subtitle}>Escaneo de seguridad con control de inyección</Text>
      </View>

      {!scanned ? (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        />
      ) : (
        <View style={styles.resultContainer}>
          {artifactData ? (
            <View style={styles.card}>
              <Text style={styles.cardCode}>{artifactData.code}</Text>
              <Text style={styles.cardName}>{artifactData.name}</Text>
              <Text style={styles.cardLoc}>Ubicación: {artifactData.location}</Text>
              <Text style={styles.cardLoc}>Estado: {artifactData.status}</Text>
            </View>
          ) : (
            <Text style={{ color: '#fff' }}>No se identificó ningún artefacto.</Text>
          )}
          <TouchableOpacity onPress={() => { setScanned(false); setArtifactData(null); }} style={styles.scanBtn}>
            <Text style={styles.scanBtnText}>Escanear de Nuevo</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 20,
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    zIndex: 10,
    backgroundColor: '#0F172A',
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
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  cardCode: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  cardName: {
    fontSize: 18,
    color: '#F8FAFC',
    fontWeight: 'bold',
    marginTop: 4,
  },
  cardLoc: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
  },
  scanBtn: {
    backgroundColor: '#F59E0B',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  scanBtnText: {
    color: '#0F172A',
    fontWeight: 'bold',
  },
});
