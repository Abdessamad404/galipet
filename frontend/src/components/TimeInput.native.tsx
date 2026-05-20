// Native iOS/Android : TimePicker modal
import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Clock } from 'lucide-react-native'
import { Colors, Typography, Spacing, Radius } from '@/constants/theme'

interface Props {
  label: string
  value: string              // format HH:MM
  onChange: (v: string) => void
  error?: string
  style?: object
}

export default function TimeInput({ label, value, onChange, error, style }: Props) {
  const [show, setShow] = useState(false)

  // Reconstruit un Date à partir de HH:MM pour le picker
  const date = (() => {
    const d = new Date()
    if (value) {
      const [h, m] = value.split(':').map(Number)
      d.setHours(h, m, 0, 0)
    }
    return d
  })()

  function handleChange(_: any, selected?: Date) {
    setShow(Platform.OS === 'ios')
    if (selected) {
      const h = String(selected.getHours()).padStart(2, '0')
      const m = String(selected.getMinutes()).padStart(2, '0')
      onChange(`${h}:${m}`)
    }
  }

  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.btn, error && styles.btnError]}
        onPress={() => setShow(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.btnText, !value && styles.placeholder]}>
          {value || 'Sélectionner une heure'}
        </Text>
        <Clock size={16} color={Colors.textMuted} />
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}

      {show && (
        <DateTimePicker
          value={date}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
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
  btnError:    { borderColor: Colors.error },
  btnText:     { fontSize: Typography.base, color: Colors.textPrimary },
  placeholder: { color: Colors.textMuted },
  error:       { fontSize: Typography.xs, color: Colors.error },
})
