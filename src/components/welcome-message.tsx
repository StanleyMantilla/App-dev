
import { StyleSheet, Text, View } from 'react-native';

// Define the props that this component accepts
type WelcomeMessageProps = {
  name: string;
};

// Create the reusable component
export default function WelcomeMessage({ name }: WelcomeMessageProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello, {name}! 👋</Text>
      <Text style={styles.subtitle}>
        Welcome to your learning dashboard.
      </Text>
    </View>
  );
}

// Component styles
const styles = StyleSheet.create({
  container: {
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5B45C6',
  },
  subtitle: {
    fontSize: 15,
    color: '#777',
    marginTop: 8,
  },
});
