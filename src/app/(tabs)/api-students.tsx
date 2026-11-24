
import { useCallback, useEffect, useState } from 'react';

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

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// 1. STUDENT DATA STRUCTURE
// ============================================

type ApiStudent = {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  website: string;
};

// ============================================
// 2. STORAGE CONFIGURATION
// ============================================

const STORAGE_KEY = '@api_students_local_records';

const API_URL = 'https://jsonplaceholder.typicode.com/users';

// ============================================
// 3. FETCH WITH TIMEOUT
// ============================================

const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout = 10000
): Promise<Response> => {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

// ============================================
// 4. MAIN COMPONENT
// ============================================

export default function ApiStudentsScreen() {
  // API students
  const [apiStudents, setApiStudents] = useState<ApiStudent[]>([]);

  // Locally saved students
  const [localStudents, setLocalStudents] = useState<ApiStudent[]>([]);

  // Search
  const [searchText, setSearchText] = useState('');

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form states
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Edit state
  const [editingStudent, setEditingStudent] =
    useState<ApiStudent | null>(null);

  // Error state
  const [error, setError] = useState('');

  // ============================================
  // 5. FORM VALIDATION
  // ============================================

  const validateForm = () => {
    if (
      newName.trim() === '' ||
      newUsername.trim() === '' ||
      newEmail.trim() === ''
    ) {
      Alert.alert(
        'Required Fields',
        'Please complete all fields.'
      );

      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(newEmail.trim())) {
      Alert.alert(
        'Invalid Email',
        'Please enter a valid email address.'
      );

      return false;
    }

    return true;
  };

  // ============================================
  // 6. CLEAR FORM
  // ============================================

  const clearForm = () => {
    setNewName('');
    setNewUsername('');
    setNewEmail('');
    setEditingStudent(null);
  };

  // ============================================
  // 7. LOAD LOCAL STUDENTS
  // ============================================

  const loadLocalStudents = async (): Promise<ApiStudent[]> => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);

      if (savedData !== null) {
        const parsedData: ApiStudent[] = JSON.parse(savedData);

        if (!Array.isArray(parsedData)) {
          throw new Error('Invalid saved student data.');
        }

        setLocalStudents(parsedData);

        console.log('Loaded local students:', parsedData);

        return parsedData;
      }

      setLocalStudents([]);

      return [];
    } catch (err) {
      console.error('AsyncStorage Load Error:', err);

      throw new Error('Unable to load saved students.');
    }
  };

  // ============================================
  // 8. SAVE LOCAL STUDENTS
  // ============================================

  const saveLocalStudents = async (
    students: ApiStudent[]
  ): Promise<void> => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(students)
      );

      // Verify that the records were saved
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);

      if (savedData === null) {
        throw new Error('Student records were not saved.');
      }

      const verifiedData: ApiStudent[] = JSON.parse(savedData);

      setLocalStudents(verifiedData);

      console.log('Successfully saved students:', verifiedData);
    } catch (err) {
      console.error('AsyncStorage Save Error:', err);

      throw new Error('Unable to save student records.');
    }
  };

  // ============================================
  // 9. FETCH API STUDENTS
  // ============================================

  const fetchStudents = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError('');

      // Always restore locally saved students first
      await loadLocalStudents();

      // Retrieve students from JSONPlaceholder
      const response = await fetchWithTimeout(
        API_URL,
        {},
        10000
      );

      if (!response.ok) {
        throw new Error('Failed to retrieve API students.');
      }

      const data: ApiStudent[] = await response.json();

      setApiStudents(data);

      console.log('API students loaded:', data);
    } catch (err) {
      console.error('Fetch Students Error:', err);

      if (err instanceof Error && err.name === 'AbortError') {
        setError(
          'Request timed out. The server took too long to respond. Please try again.'
        );
      } else if (err instanceof Error) {
        setError(
          'Unable to retrieve API records. Please check your internet connection and try again.'
        );
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ============================================
  // 10. LOAD DATA WHEN SCREEN OPENS
  // ============================================

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // ============================================
  // 11. ADD NEW STUDENT
  // ============================================

  const addStudent = async () => {
    if (!validateForm()) return;

    try {
      setIsAdding(true);

      let apiRequestSuccessful = false;

      // Try sending the student to the API
      try {
        const response = await fetchWithTimeout(
          API_URL,
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
          },
          10000
        );

        apiRequestSuccessful = response.ok;
      } catch (apiError) {
        console.log('POST API Error:', apiError);
      }

      // Read the latest local records
      const existingStudents = await AsyncStorage.getItem(
        STORAGE_KEY
      );

      const currentLocalStudents: ApiStudent[] =
        existingStudents
          ? JSON.parse(existingStudents)
          : [];

      // Create a unique local student ID
      const createdStudent: ApiStudent = {
        id: Date.now(),
        name: newName.trim(),
        username: newUsername.trim(),
        email: newEmail.trim(),
        phone: '',
        website: '',
      };

      // Add the new student to local records
      const updatedStudents = [
        createdStudent,
        ...currentLocalStudents,
      ];

      // Save permanently on the device
      await saveLocalStudents(updatedStudents);

      // Clear form and search
      clearForm();
      setSearchText('');

      if (apiRequestSuccessful) {
        Alert.alert(
          'Success!',
          'Student added successfully and saved on your device.'
        );
      } else {
        Alert.alert(
          'Saved Locally!',
          'The API was unavailable or did not accept the request, but your student record was saved on your device.'
        );
      }
    } catch (err) {
      console.error('Add Student Error:', err);

      Alert.alert(
        'Error',
        'Unable to save student. Please try again.'
      );
    } finally {
      setIsAdding(false);
    }
  };

  // ============================================
  // 12. UPDATE EXISTING STUDENT
  // ============================================

  const editStudent = async () => {
    if (!editingStudent) return;

    if (!validateForm()) return;

    try {
      setIsUpdating(true);

      // Read the latest local records
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);

      const currentStudents: ApiStudent[] = savedData
        ? JSON.parse(savedData)
        : [];

      // Update the selected student
      const updatedStudents = currentStudents.map((student) =>
        student.id === editingStudent.id
          ? {
              ...student,
              name: newName.trim(),
              username: newUsername.trim(),
              email: newEmail.trim(),
            }
          : student
      );

      // Save updated records
      await saveLocalStudents(updatedStudents);

      console.log(
        'Student successfully updated:',
        editingStudent.id
      );

      clearForm();

      Alert.alert(
        'Success!',
        'Student information updated successfully.'
      );
    } catch (err) {
      console.error('Update Student Error:', err);

      Alert.alert(
        'Error',
        'Unable to update student. Please try again.'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // ============================================
  // 13. CANCEL EDITING
  // ============================================

  const cancelEdit = () => {
    clearForm();

    Alert.alert(
      'Cancelled',
      'Student editing has been cancelled.'
    );
  };

  // ============================================
  // 14. DELETE STUDENT
  // ============================================

  const deleteStudent = (student: ApiStudent) => {
    Alert.alert(
      'Delete Student',
      `Are you sure you want to delete ${student.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',

          onPress: async () => {
            try {
              // Get latest saved records
              const savedStudents = await AsyncStorage.getItem(
                STORAGE_KEY
              );

              const students: ApiStudent[] = savedStudents
                ? JSON.parse(savedStudents)
                : [];

              // Remove selected student
              const updatedStudents = students.filter(
                (item) => item.id !== student.id
              );

              // Save remaining records
              await saveLocalStudents(updatedStudents);

              // Cancel editing if this student is being edited
              if (editingStudent?.id === student.id) {
                clearForm();
              }

              Alert.alert(
                'Success!',
                'Student deleted successfully!'
              );
            } catch (err) {
              console.error('Delete Student Error:', err);

              Alert.alert(
                'Error',
                'Unable to delete student. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  // ============================================
  // 15. COMBINE API AND LOCAL STUDENTS
  // ============================================

  const allStudents = [
    ...localStudents,
    ...apiStudents,
  ];

  // ============================================
  // 16. SEARCH STUDENTS
  // ============================================

  const filteredStudents = allStudents.filter((student) => {
    const keyword = searchText.toLowerCase().trim();

    return (
      student.name.toLowerCase().includes(keyword) ||
      student.username.toLowerCase().includes(keyword) ||
      student.email.toLowerCase().includes(keyword)
    );
  });

  // ============================================
  // 17. LOADING SCREEN
  // ============================================

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color="#6C55D9"
        />

        <Text style={styles.message}>
          Retrieving student information...
        </Text>
      </View>
    );
  }

  // ============================================
  // 18. MAIN SCREEN
  // ============================================

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        API Student Directory
      </Text>

      <Text style={styles.subtitle}>
        Search and manage student records.
      </Text>

      {/* ERROR MESSAGE */}

      {error !== '' && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>
            {error}
          </Text>

          <TouchableOpacity
            onPress={() => fetchStudents()}
          >
            <Text style={styles.retryText}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ADD / EDIT STUDENT FORM */}

      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>
          {editingStudent
            ? 'Edit Student'
            : 'Add New Student'}
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
            (isAdding || isUpdating) && styles.disabledButton,
          ]}
          onPress={editingStudent ? editStudent : addStudent}
          disabled={isAdding || isUpdating}
        >
          {isAdding || isUpdating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.addButtonText}>
              {editingStudent
                ? 'Update Student'
                : '+ Add Student'}
            </Text>
          )}
        </TouchableOpacity>

        {editingStudent && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={cancelEdit}
            disabled={isUpdating}
          >
            <Text style={styles.cancelButtonText}>
              Cancel Editing
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* SEARCH */}

      <TextInput
        style={styles.searchInput}
        placeholder="Search name, username, or email..."
        placeholderTextColor="#999"
        value={searchText}
        onChangeText={setSearchText}
      />

      {/* STUDENT COUNT */}

      <Text style={styles.resultCount}>
        Showing {filteredStudents.length} of {allStudents.length} students
      </Text>

      {/* STUDENT LIST */}

      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id.toString()}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchStudents(true)}
            colors={['#6C55D9']}
            tintColor="#6C55D9"
          />
        }
        renderItem={({ item }) => {
          const isLocallySaved = localStudents.some(
            (student) => student.id === item.id
          );

          return (
            <View style={styles.studentCard}>
              <View style={styles.studentHeader}>
                <Text style={styles.studentName}>
                  {item.name}
                </Text>

                {isLocallySaved && (
                  <View style={styles.localBadge}>
                    <Text style={styles.localBadgeText}>
                      SAVED
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.studentDetail}>
                Username: {item.username}
              </Text>

              <Text style={styles.studentDetail}>
                Email: {item.email}
              </Text>

              <Text style={styles.studentDetail}>
                Phone: {item.phone || 'Not provided'}
              </Text>

              <Text style={styles.studentDetail}>
                Website: {item.website || 'Not provided'}
              </Text>

              {/* EDIT AND DELETE BUTTONS */}

              {isLocallySaved && (
                <>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                      setEditingStudent(item);
                      setNewName(item.name);
                      setNewUsername(item.username);
                      setNewEmail(item.email);
                    }}
                  >
                    <Text style={styles.editButtonText}>
                      Edit Student
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteStudent(item)}
                  >
                    <Text style={styles.deleteButtonText}>
                      Delete Student
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          );
        }}
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

// ============================================
// 19. STYLES
// ============================================

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

  cancelButton: {
    backgroundColor: '#FCE8E8',
    padding: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },

  cancelButtonText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: 'bold',
  },

  editButton: {
    backgroundColor: '#E6DFFF',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },

  editButtonText: {
    color: '#5B45C6',
    fontSize: 14,
    fontWeight: 'bold',
  },

  deleteButton: {
    backgroundColor: '#FCE8E8',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },

  deleteButtonText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: 'bold',
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

  errorBanner: {
    backgroundColor: '#FCE8E8',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },

  errorText: {
    color: '#C62828',
    fontSize: 13,
  },

  retryText: {
    color: '#5B45C6',
    fontWeight: 'bold',
    marginTop: 8,
  },

  studentCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 3,
  },

  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },

  studentName: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#5B45C6',
    flexShrink: 1,
  },

  localBadge: {
    backgroundColor: '#E6DFFF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },

  localBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#5B45C6',
  },

  studentDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },

  listContent: {
    paddingBottom: 30,
    flexGrow: 1,
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
