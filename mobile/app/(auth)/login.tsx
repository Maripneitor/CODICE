import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { saveToken } from '@/services/secure-storage/secure-store.service';

export default function MobileLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Campos obligatorios', 'Por favor complete todos los campos.');
      return;
    }

    setLoading(true);
    try {
      // In Android Emulator, localhost is mapped to 10.0.2.2.
      // In iOS simulator or physical device, use host IP.
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api';
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error de credenciales.');
      }

      // Save token securely at hardware level
      const token = data.success && data.data ? data.data.token : data.token;
      await saveToken(token);

      // Redirect to main tabs
      router.replace('/(tabs)');
    } catch (error: any) {
      // Fallback check: if emulator connection fails, allow mock login for demonstration purposes if desired,
      // but let's show the real error.
      Alert.alert('Error de Acceso', error.message || 'No se pudo conectar al servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Graphic Accent */}
      <View style={styles.goldBar} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>CÓDICE</Text>
          <View style={styles.divider} />
          <Text style={styles.title}>Acceso Institucional</Text>
          <Text style={styles.subtitle}>Gestión y preservación del patrimonio histórico</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
          <TextInput
            style={styles.input}
            placeholder="usuario@institucion.gob"
            placeholderTextColor="#909097"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          <Text style={styles.label}>CONTRASEÑA</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••••••"
            placeholderTextColor="#909097"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <Text style={styles.buttonText}>ACCEDER AL SISTEMA</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Protocolo de seguridad encriptado</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131315',
  },
  goldBar: {
    height: 6,
    backgroundColor: '#ca8a04',
    width: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#bec6e0',
    letterSpacing: 8,
  },
  divider: {
    height: 1,
    width: 40,
    backgroundColor: '#ca8a04',
    marginVertical: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#e4e2e4',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#c6c6cd',
    textAlign: 'center',
  },
  form: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#c6c6cd',
    letterSpacing: 2,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1b1b1d',
    borderWidth: 1,
    borderColor: '#45464d',
    borderRadius: 8,
    padding: 16,
    color: '#e4e2e4',
    fontSize: 16,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#ca8a04',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#ca8a04',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#909097',
    letterSpacing: 1,
  },
});
