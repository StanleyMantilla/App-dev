
import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// 1. Define the structure of API data
type ApiStudent = {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  website: string;
};

export default function ApiStudentsScreen() {
  // 2. Store API student records
  const [students, setStudents] = useState<ApiStudent[]>([]);

  // 3. Store search keyword
  const [searchText, setSearchText] = useState('');

  // 4. Track loading and refreshing status
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 5. Track errors
  const [error, setError] = useState('');

  // 6. CREATE: Student form states
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // 7. Reusable function for retrieving student records
  const fetchStudents = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError('');

      const response = await fetch(
        'https://jsonplaceholder.typicode.com/users'
      );

      if (!response.ok) {
        throw new Error('Failed to retrieve student data.');
      }

      const data: ApiStudent[] = await response.json();

      setStudents(data);
    } catch (err) {
      setError('Unable to connect to the server. Please try again.');
      console.error('API Error:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // 8. Automatically retrieve records when the screen opens
  useEffect(() => {
    fetchStudents();
  }, []);

  // 9. CREATE: Add a new student
  const addStudent = async () => {
    // Validate required fields
    if (
      newName.trim() === '' ||
      newUsername.trim() === '' ||
      newEmail.trim() === ''
    ) {
      Alert.alert('Required', 'Please complete all fields.');
      return;
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(newEmail.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      setIsAdding(true);

      const response = await fetch(
        'https://jsonplaceholder.typicode.com/users',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newName.trim(),
            username: newUsername.trim(),
            email: newEmail.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add student.');
      }

      const createdStudent: ApiStudent = await response.json();

      // Add the new student to the beginning of the list
      setStudents((previousStudents) => [
        createdStudent,
        ...previousStudents,
      ]);

      // Clear the form
      setNewName('');
      setNewUsername('');
      setNewEmail('');

      // Clear the search to make the new record visible
      setSearchText('');

      Alert.alert(
        'Success',
        'Student added successfully!'
      );
    } catch (err) {
      console.error('Add Student Error:', err);

      Alert.alert(
        'Error',
        'Unable to add student. Please try again.'
      );
    } finally {
      setIsAdding(false);
    }
  };

  // 10. Filter students based on search keyword
  const filteredStudents = students.filter((student) => {
    const keyword = searchText.toLowerCase().trim();

    return (
      student.name.toLowerCase().includes(keyword) ||
      student.username.toLowerCase().includes(keyword) ||
      student.email.toLowerCase().includes(keyword)
    );
  });

  // 11. Display loading indicator
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6C55D9" />

        <Text style={styles.message}>
          Retrieving student information...
        </Text>
      </View>
    );
  }

  // 12. Display error message
  if (error !== '') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          {error}
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchStudents()}
        >
          <Text style={styles.addButtonText}>
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 13. Display student directory
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        API Student Directory
      </Text>

      <Text style={styles.subtitle}>
        Search and manage student records.
      </Text>

      {/* CREATE: Add Student Form */}
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>
          Add New Student
        </Text>

        <TextInput
          style={styles.formInput}
          placeholder="Student Name"
          placeholderTextColor="#999"
          value={newName}
          onChangeText={setNewName}
        />

        <TextInput
          style={styles.formInput}
          placeholder="Username"
          placeholderTextColor="#999"
          autoCapitalize="none"
          value={newUsername}
          onChangeText={setNewUsername}
        />

        <TextInput
          style={styles.formInput}
          placeholder="Email Address"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          value={newEmail}
          onChangeText={setNewEmail}
        />

        <TouchableOpacity
          style={[
            styles.addButton,
            isAdding && styles.disabledButton,
          ]}
          onPress={addStudent}
          disabled={isAdding}
        >
          {isAdding ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.addButtonText}>
              + Add Student
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* SEARCH INPUT */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search name, username, or email..."
        placeholderTextColor="#999"
        value={searchText}
        onChangeText={setSearchText}
      />

      <Text style={styles.resultCount}>
        Showing {filteredStudents.length} of {students.length} students
      </Text>

      {/* STUDENT LIST */}
      <FlatList
        data={filteredStudents}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchStudents(true)}
            colors={['#6C55D9']}
            tintColor="#6C55D9"
          />
        }
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.studentCard}>
            <Text style={styles.studentName}>
              {item.name}
            </Text>

            <Text style={styles.studentDetail}>
              Username: {item.username}
            </Text>

            <Text style={styles.studentDetail}>
              Email: {item.email}
            </Text>

            <Text style={styles.studentDetail}>
              Phone: {item.phone}
            </Text>

            <Text style={styles.studentDetail}>
              Website: {item.website}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              No Students Found
            </Text>

            <Text style={styles.emptyMessage}>
              Try searching with a different keyword.
            </Text>
          </View>
        }
      />
    </View>
  );
}

// 14. Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FF',
    padding: 20,
    paddingTop: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    padding: 20,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#5B45C6',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
    marginBottom: 20,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 14,
    marginBottom: 20,
    elevation: 3,
  },
  formTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#5B45C6',
    marginBottom: 15,
  },
  formInput: {
    backgroundColor: '#F5F3FF',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 15,
    color: '#333333',
  },
  addButton: {
    backgroundColor: '#6C55D9',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  retryButton: {
    backgroundColor: '#6C55D9',
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD5FF',
    fontSize: 15,
    marginBottom: 12,
    color: '#333',
  },
  resultCount: {
    fontSize: 14,
    color: '#6C55D9',
    fontWeight: '600',
    marginBottom: 15,
  },
  message: {
    marginTop: 15,
    fontSize: 15,
    color: '#6C55D9',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 16,
    textAlign: 'center',
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 3,
  },
  studentName: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#5B45C6',
    marginBottom: 8,
  },
  studentDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 25,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5B45C6',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
});
