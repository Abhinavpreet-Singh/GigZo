import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Neutral, Radius, Spacing, Font, Shadow } from '@/constants/theme';

export default function OTPScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const refs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (text: string, idx: number) => {
    const newOtp = [...otp];
    newOtp[idx] = text;
    setOtp(newOtp);
    if (text && idx < 5) refs.current[idx + 1]?.focus();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Neutral[700]} />
          </TouchableOpacity>

          {/* Step bar */}
          <View style={styles.stepRow}>
            {[1, 2, 3, 4].map((s) => (
              <View key={s} style={[styles.step, s <= 1 && styles.stepActive]} />
            ))}
          </View>

          <View style={styles.content}>
            <Text style={styles.label}>STEP 1 OF 4</Text>
            <Text style={styles.title}>{otpSent ? 'Enter OTP' : 'Phone Number'}</Text>
            <Text style={styles.sub}>
              {otpSent ? `Code sent to +91 ${phone}` : 'We will send a verification code'}
            </Text>

            {!otpSent ? (
              <>
                <View style={styles.phoneInput}>
                  <Text style={styles.prefix}>+91</Text>
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
                <TouchableOpacity
                  style={[styles.cta, phone.length < 10 && styles.ctaDisabled]}
                  onPress={() => phone.length >= 10 && setOtpSent(true)}
                >
                  <Text style={styles.ctaText}>Send OTP</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.otpRow}>
                  {otp.map((d, idx) => (
                    <TextInput
                      key={idx}
                      ref={(r) => { refs.current[idx] = r; }}
                      style={[styles.otpBox, d && styles.otpBoxFilled]}
                      maxLength={1} keyboardType="number-pad"
                      value={d} onChangeText={(t) => handleOtpChange(t, idx)}
                    />
                  ))}
                </View>
                <TouchableOpacity style={styles.cta} onPress={() => router.push('/onboarding/profile')}>
                  <Text style={styles.ctaText}>Verify and Continue</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {}} style={styles.resend}>
                  <Text style={styles.resendText}>Resend code</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Neutral.white },
  back: { padding: Spacing.xl },
  stepRow: { flexDirection: 'row', gap: 6, paddingHorizontal: Spacing.xl, marginBottom: Spacing.xxl },
  step: { flex: 1, height: 3, borderRadius: 2, backgroundColor: Neutral[100] },
  stepActive: { backgroundColor: Brand.primary },
  content: { paddingHorizontal: Spacing.xl },
  label: { fontFamily: Font.bold, fontSize: 10, color: Brand.primary, letterSpacing: 1.5, marginBottom: Spacing.sm },
  title: { fontFamily: Font.bold, fontSize: 28, color: Neutral[900], letterSpacing: -0.4, marginBottom: Spacing.sm },
  sub: { fontFamily: Font.regular, fontSize: 14, color: Neutral[500], marginBottom: Spacing.xxxl },
  phoneInput: {
    flexDirection: 'row', borderWidth: 1.5, borderColor: Neutral[200],
    borderRadius: Radius.lg, overflow: 'hidden', marginBottom: Spacing.xl,
  },
  prefix: { fontFamily: Font.semiBold, fontSize: 15, color: Neutral[700], paddingHorizontal: 14, paddingVertical: 15, backgroundColor: Neutral[50], borderRightWidth: 1, borderRightColor: Neutral[200] },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 15, fontFamily: Font.semiBold, fontSize: 16, color: Neutral[900] },
  otpRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  otpBox: {
    flex: 1, height: 54, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Neutral[200],
    textAlign: 'center', fontFamily: Font.bold, fontSize: 22, color: Neutral[900],
    backgroundColor: Neutral[50],
  },
  otpBoxFilled: { borderColor: Brand.primary, backgroundColor: Brand.primaryLight },
  cta: {
    backgroundColor: Brand.primary, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: Radius.lg, ...Shadow.md,
  },
  ctaDisabled: { backgroundColor: Neutral[200] },
  ctaText: { fontFamily: Font.bold, fontSize: 16, color: Neutral.white },
  resend: { alignItems: 'center', marginTop: Spacing.lg },
  resendText: { fontFamily: Font.medium, fontSize: 13, color: Brand.primary },
});
