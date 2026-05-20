import { View, Text } from 'react-native'
import { Colors, Typography } from '@/constants/theme'
export default function Screen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
      <Text style={{ fontSize: Typography.lg, color: Colors.textSecondary }}>À venir</Text>
    </View>
  )
}
