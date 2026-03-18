import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Neutral, Shadow, Radius, Spacing } from '@/constants/theme';

export default function OTPScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleSendOtp = () => {
    if (phone.length >= 10) setOtpSent(true);
  };

  const handleOtpChange = (text: string, idx: number) => {
    const newOtp = [...otp];
    newOtp[idx] = text;
    setOtp(newOtp);
    if (text && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleVerify = () => {
    router.push('/onboarding/profile');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Neutral[700]} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <Ionicons name="phone-portrait-outline" size={32} color={Brand.primary} />
          </View>
          <Text style={styles.title}>{otpSent ? 'Enter OTP' : 'Your Phone Number'}</Text>
          <Text style={styles.sub}>
            {otpSent
              ? `We sent a 6-digit code to +91 ${phone}`
              : 'We\'ll send you a verification code'}
          </Text>

          {!otpSent ? (
            <>
              <View style={styles.inputWrap}>
                <Text style={styles.inputPrefix}>+91</Text>
                <TextInput
                  style={styles.input}
                  placeholder="98765 43210"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={10}
                  placeholderTextColor={Neutral[300]}
                />
              </View>
              <TouchableOpacity style={styles.ctaBtn} onPress={handleSendOtp} activeOpacity={0.88}>
                <Text style={styles.ctaBtnText}>Send OTP</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.otpRow}>
                {otp.map((digit, idx) => (
                  <TextInput
                    key={idx}
                    ref={(r) => { inputRefs.current[idx] = r; }}
                    style={[styles.otpBox, digit && styles.otpBoxFilled]}
                    maxLength={1}
                    keyboardType="number-pad"
                    value={digit}
                    onChangeText={(t) => handleOtpChange(t, idx)}
                  />
                ))}
              </View>
              <TouchableOpacity style={styles.ctaBtn} onPress={handleVerify} activeOpacity={0.88}>
                <Text style={styles.ctaBtnText}>Verify & Continue</Text>
                <Ionicons name="arrow-forward" size={18} color={Neutral.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.resendBtn} onPress={() => {}}>
                <Text style={styles.resendText}>Didn't receive? <Text style={{ color: Brand.primary, fontWeight: '700' }}>Resend OTP</Text></Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutral.white },
  back: { padding: Spacing.xl },
  content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Brand.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: { fontSize: 28, fontWeight: '800', color: Neutral[900], letterSpacing: -0.5, marginBottom: 8 },
  sub: { fontSize: 14, color: Neutral[500], lineHeight: 20, marginBottom: Spacing.xxxl },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Neutral[200],
    borderRadius: Radius.lg, overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  inputPrefix: {
    paddingHorizontal: 16, paddingVertical: 16,
    fontSize: 15, fontWeight: '600', color: Neutral[700],
    borderRightWidth: 1, borderRightColor: Neutral[200],
    backgroundColor: Neutral[50],
  },
  input: {
    flex: 1, paddingHorizontal: 16, paddingVertical: 16,
    fontSize: 16, color: Neutral[900], fontWeight: '600',
  },

  otpRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  otpBox: {
    flex: 1, height: 56, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Neutral[200],
    textAlign: 'center', fontSize: 22, fontWeight: '700', color: Neutral[900],
    backgroundColor: Neutral[50],
  },
  otpBoxFilled: { borderColor: Brand.primary, backgroundColor: Brand.primaryLight },

  ctaBtn: {
    backgroundColor: Brand.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 16, borderRadius: Radius.lg,
    ...Shadow.md,
  },
  ctaBtnText: { fontSize: 16, fontWeight: '700', color: Neutral.white },
  resendBtn: { alignItems: 'center', marginTop: Spacing.lg },
  resendText: { fontSize: 13, color: Neutral[400] },
});
