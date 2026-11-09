import { type ReactNode, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  type TextInputInstance,
  type TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GoogleIcon } from '@/components/icons/google-icon';
import { ArrowRightIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon } from '@/components/icons/line-icons';
import { MotoTrackLogo } from '@/components/icons/moto-track-logo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { LoginViewModel } from '../model/login-view-model';

const FEATURES = ['Garage', 'Service log', 'Doc vault', 'AI mechanic'];

export type LoginViewProps = LoginViewModel;

/** Presentational only — all state and actions come from the view model. */
export function LoginView({
  mode,
  email,
  password,
  passwordVisible,
  togglePasswordVisible,
  pending,
  error,
  notice,
  canSubmit,
  setEmail,
  setPassword,
  submit,
  continueWithGoogle,
  resetPassword,
  toggleMode,
}: LoginViewProps) {
  const theme = useTheme();
  const passwordRef = useRef<TextInputInstance>(null);
  const isSignIn = mode === 'signIn';
  const busy = pending !== null;

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.root}>
        <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.content}>
              {/* Brand */}
              <View style={styles.brand}>
                <MotoTrackLogo size={64} color={theme.brand} foreground={theme.onBrand} />
                <View style={styles.brandText}>
                  <ThemedText type="subtitle" style={styles.brandTitle}>
                    MotoTrack
                  </ThemedText>
                  <View style={[styles.badge, { backgroundColor: theme.brandSoft }]}>
                    <ThemedText type="smallBold" style={{ color: theme.brand }}>
                      & Wiki AI
                    </ThemedText>
                  </View>
                </View>
                <ThemedText themeColor="textSecondary" style={styles.tagline}>
                  {isSignIn
                    ? 'Welcome back, rider. Your garage, service history, and papers are waiting.'
                    : 'Ditch the paper logbook. Track maintenance, store documents, and ask the AI mechanic.'}
                </ThemedText>
                <View style={styles.chips}>
                  {FEATURES.map((label, i) => (
                    <View
                      key={label}
                      style={[styles.chip, { backgroundColor: theme.backgroundElement }]}>
                      <View
                        style={[styles.chipDot, { backgroundColor: i % 2 === 0 ? theme.brand : theme.accent }]}
                      />
                      <ThemedText type="small" themeColor="textSecondary">
                        {label}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>

              {/* Form */}
              <View style={styles.form}>
                <ThemedText type="smallBold" style={styles.formTitle}>
                  {isSignIn ? 'Sign in' : 'Create your account'}
                </ThemedText>

                <Field
                  label="Email"
                  icon={(color) => <MailIcon color={color} />}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="rider@example.com"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  editable={!busy}
                />

                <Field
                  inputRef={passwordRef}
                  label="Password"
                  labelAction={
                    isSignIn && (
                      <Pressable onPress={resetPassword} disabled={busy} hitSlop={8} accessibilityRole="button">
                        <ThemedText type="small" style={{ color: theme.accent }}>
                          Forgot password?
                        </ThemedText>
                      </Pressable>
                    )
                  }
                  icon={(color) => <LockIcon color={color} />}
                  trailing={
                    <Pressable
                      onPress={togglePasswordVisible}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}>
                      {passwordVisible ? (
                        <EyeOffIcon color={theme.textSecondary} />
                      ) : (
                        <EyeIcon color={theme.textSecondary} />
                      )}
                    </Pressable>
                  }
                  value={password}
                  onChangeText={setPassword}
                  placeholder={isSignIn ? 'Your password' : 'At least 6 characters'}
                  secureTextEntry={!passwordVisible}
                  autoCapitalize="none"
                  autoComplete={isSignIn ? 'current-password' : 'new-password'}
                  textContentType={isSignIn ? 'password' : 'newPassword'}
                  returnKeyType="go"
                  onSubmitEditing={submit}
                  editable={!busy}
                />

                {error && (
                  <Message tone="danger" accessibilityRole="alert">
                    {error}
                  </Message>
                )}
                {notice && <Message tone="success">{notice}</Message>}

                <Button
                  label={isSignIn ? 'Sign in' : 'Create account'}
                  onPress={submit}
                  disabled={!canSubmit}
                  loading={pending === 'email'}
                  variant="primary"
                  trailing={<ArrowRightIcon size={18} color={theme.onAccent} />}
                />
              </View>

              <View style={styles.dividerRow}>
                <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
                <ThemedText type="small" themeColor="textSecondary">
                  or
                </ThemedText>
                <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />
              </View>

              <Button
                label="Continue with Google"
                onPress={continueWithGoogle}
                disabled={busy}
                loading={pending === 'google'}
                variant="secondary"
                leading={<GoogleIcon size={20} />}
              />

              <View style={styles.footer}>
                <ThemedText type="small" themeColor="textSecondary">
                  {isSignIn ? 'New to MotoTrack?' : 'Already have an account?'}
                </ThemedText>
                <Pressable onPress={toggleMode} disabled={busy} hitSlop={8} accessibilityRole="button">
                  <ThemedText type="smallBold" style={{ color: theme.accent }}>
                    {isSignIn ? 'Create an account' : 'Sign in'}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

type FieldProps = TextInputProps & {
  label: string;
  labelAction?: ReactNode;
  icon: (color: string) => ReactNode;
  trailing?: ReactNode;
  inputRef?: React.Ref<TextInputInstance>;
};

function Field({ label, labelAction, icon, trailing, inputRef, onFocus, onBlur, ...inputProps }: FieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <ThemedText type="smallBold">{label}</ThemedText>
        {labelAction}
      </View>
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: focused ? theme.accent : theme.backgroundSelected,
          },
        ]}>
        {icon(focused ? theme.accent : theme.textSecondary)}
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: theme.text }]}
          placeholderTextColor={theme.textSecondary}
          selectionColor={theme.accent}
          cursorColor={theme.accent}
          accessibilityLabel={label}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...inputProps}
        />
        {trailing}
      </View>
    </View>
  );
}

function Message({
  tone,
  children,
  accessibilityRole,
}: {
  tone: 'danger' | 'success';
  children: ReactNode;
  accessibilityRole?: 'alert';
}) {
  const theme = useTheme();
  const color = theme[tone];
  return (
    <View style={[styles.message, { borderColor: color }]} accessibilityRole={accessibilityRole}>
      <ThemedText type="small" style={{ color }}>
        {children}
      </ThemedText>
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant: 'primary' | 'secondary';
  leading?: ReactNode;
  trailing?: ReactNode;
};

function Button({ label, onPress, disabled, loading, variant, leading, trailing }: ButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  const textColor = isPrimary ? theme.onAccent : theme.text;
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        isPrimary
          ? { backgroundColor: theme.accent }
          : { backgroundColor: theme.background, borderColor: theme.backgroundSelected, borderWidth: 1 },
        disabled && !loading && styles.buttonDisabled,
        pressed && styles.buttonPressed,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {leading}
          <ThemedText type="smallBold" style={[styles.buttonLabel, { color: textColor }]}>
            {label}
          </ThemedText>
          {trailing}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
  },
  content: {
    width: '100%',
    maxWidth: 440,
    gap: Spacing.four,
  },
  brand: {
    gap: Spacing.three,
  },
  brandText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  brandTitle: {
    letterSpacing: -0.5,
  },
  badge: {
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.half,
    borderRadius: 999,
  },
  tagline: {
    lineHeight: 22,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
    paddingHorizontal: Spacing.two + 4,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  form: {
    gap: Spacing.three,
  },
  formTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  field: {
    gap: Spacing.two,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 4,
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.three,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  message: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.two + 4,
    paddingVertical: Spacing.one,
  },
  button: {
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two + 2,
  },
  buttonLabel: {
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
