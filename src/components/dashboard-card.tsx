
import { StyleSheet, Text, View } from 'react-native';

// Define the properties
type DashboardCardProps = {
  icon: string;
  title: string;
  description: string;
};

// Reusable Dashboard Card
export default function DashboardCard({
  icon,
  title,
  description,
}: DashboardCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>{icon}</Text>

      <Text style={styles.title}>{title}</Text>

      <Text style={styles.description}>
        {description}
      </Text>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
  },
  icon: {
    fontSize: 28,
    marginBottom: 10,
  },
  title: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#5B45C6',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#777',
  },
});
