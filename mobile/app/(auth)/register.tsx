import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function MobileRegister() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Campos obligatorios', 'Por favor complete todos los campos.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api';
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar.');
      }

      Alert.alert('Registro exitoso', 'Su usuario ha sido creado correctamente.', [
        { text: 'Aceptar', onPress: () => router.replace('/(auth)/login') }
      ]);
    } catch (error: any) {
      Alert.alert('Error de Registro', error.message || 'No se pudo conectar al servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.goldBar} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>CÓDICE</Text>
          <View style={styles.divider} />
          <Text style={styles.title}>Registro Institucional</Text>
          <Text style={styles.subtitle}>Cree una cuenta para la gestión patrimonial</Text>
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

          <Text style={styles.label}>CONFIRMAR CONTRASEÑA</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••••••"
            placeholderTextColor="#909097"
            secureTextEntry
            autoCapitalize="none"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!loading}
          />

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <Text style={styles.buttonText}>REGISTRARSE</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.link}>
            <Text style={styles.linkText}>¿Ya tiene cuenta? Inicie sesión</Text>
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
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
    marginVertical: 12,
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
    padding: 14,
    color: '#e4e2e4',
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#ca8a04',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  link: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#bec6e0',
    fontSize: 14,
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
