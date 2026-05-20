// Native iOS/Android : DateTimePicker modal
import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { CalendarDays } from 'lucide-react-native'
import { Colors, Typography, Spacing, Radius } from '@/constants/theme'

interface Props {
  label: string
  value: string              // format YYYY-MM-DD
  onChange: (v: string) => void
  error?: string
  placeholder?: string
  style?: object
}

export default function DateInput({ label, value, onChange, error, placeholder = 'Sélectionner une date', style }: Props) {
  const [show, setShow] = useState(false)

  const date = value ? new Date(value) : new Date()

  function handleChange(_: any, selected?: Date) {
    setShow(Platform.OS === 'ios') // sur iOS le picker reste ouvert
    if (selected) {
      const iso = selected.toISOString().split('T')[0]
      onChange(iso)
    }
  }

  const displayValue = value
    ? new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : placeholder

  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.btn, error && styles.btnError]}
        onPress={() => setShow(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.btnText, !value && styles.placeholder]}>{displayValue}</Text>
        <CalendarDays size={16} color={Colors.textMuted} />
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}

      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          locale="fr-FR"
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  field: { gap: Spacing.xs },
  label: { fontSize: Typography.sm, fontWeight: '500', color: Colors.textPrimary },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  btnError:   { borderColor: Colors.error },
  btnText:    { fontSize: Typography.base, color: Colors.textPrimary },
  placeholder: { color: Colors.textMuted },
  error:      { fontSize: Typography.xs, color: Colors.error },
})
