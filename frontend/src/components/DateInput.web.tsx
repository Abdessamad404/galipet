// Web : input type="date" natif du navigateur
import { StyleSheet, View, Text } from 'react-native'
import { Colors, Typography, Spacing, Radius } from '@/constants/theme'

interface Props {
  label: string
  value: string              // format YYYY-MM-DD
  onChange: (v: string) => void
  error?: string
  placeholder?: string
  style?: object
}

export default function DateInput({ label, value, onChange, error, style }: Props) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      <input
        type="date"
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
