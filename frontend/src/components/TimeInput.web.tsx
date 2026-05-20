// Web : input type="time" natif du navigateur
import { View, Text, StyleSheet } from 'react-native'
import { Colors, Typography, Spacing, Radius } from '@/constants/theme'

interface Props {
  label: string
  value: string              // format HH:MM
  onChange: (v: string) => void
  error?: string
  style?: object
}

export default function TimeInput({ label, value, onChange, error, style }: Props) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          height: 48,
          paddingLeft: Spacing.base,
          paddingRight: Spacing.base,
          fontSize: Typography.base,
          color: value ? Colors.textPrimary : Colors.textMuted,
          backgroundColor: Colors.surface,
          border: `1px solid ${error ? Colors.error : Colors.border}`,
          borderRadius: Radius.md,
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  field: { gap: Spacing.xs },
  label: { fontSize: Typography.sm, fontWeight: '500', color: Colors.textPrimary },
  error: { fontSize: Typography.xs, color: Colors.error },
})
