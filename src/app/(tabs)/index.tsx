
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import WelcomeMessage from '@/components/welcome-message';
import DashboardCard from '@/components/dashboard-card';

// Student data structure
type Student = {
  id: string;
  name: string;
  course: string;
};

// AsyncStorage key
const STUDENTS_STORAGE_KEY = '@student_directory_students';

// Default student records
const DEFAULT_STUDENTS: Student[] = [
  { id: '1', name: 'Stanley', course: 'BSIT' },
  { id: '2', name: 'Maria', course: 'BSCS' },
  { id: '3', name: 'John', course: 'BSIT' },
  { id: '4', name: 'Angela', course: 'BSCS' },
];

export default function HomeScreen() {
  // 1. Student records and loading state
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 2. Input and editing states
  const [studentName, setStudentName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // 3. Load student records when the app opens
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const savedStudents = await AsyncStorage.getItem(
          STUDENTS_STORAGE_KEY
        );

        if (savedStudents !== null) {
          const parsedStudents: unknown = JSON.parse(savedStudents);

          if (Array.isArray(parsedStudents)) {
            setStudents(parsedStudents as Student[]);
          } else {
            setStudents(DEFAULT_STUDENTS);
          }
        } else {
          // First-time users receive default records
          setStudents(DEFAULT_STUDENTS);
        }
      } catch (error) {
        console.error('Error loading students:', error);

        // Restore default records if saved data cannot be read
        setStudents(DEFAULT_STUDENTS);
      } finally {
        setIsLoaded(true);
      }
    };

    loadStudents();
  }, []);

  // 4. Automatically save student records whenever they change
  useEffect(() => {
    const saveStudents = async () => {
      try {
        await AsyncStorage.setItem(
          STUDENTS_STORAGE_KEY,
          JSON.stringify(students)
        );
      } catch (error) {
        console.error('Error saving students:', error);
      }
    };

    // Prevent saving before the initial loading is complete
    if (isLoaded) {
      saveStudents();
    }
  }, [students, isLoaded]);

  // 5. Add student function
  const addStudent = () => {
    if (studentName.trim() === '') {
      Alert.alert('Required', 'Please enter a student name.');
      return;
    }

    const newStudent: Student = {
      id: Date.now().toString(),
      name: studentName.trim(),
      course: 'BSIT',
    };

    setStudents((previousStudents) => [
      ...previousStudents,
      newStudent,
    ]);

    setStudentName('');
  };

  // 6. Remove student function
  const removeStudent = (id: string) => {
    setStudents((previousStudents) =>
      previousStudents.filter((student) => student.id !== id)
    );

    // Cancel editing if the removed student was being edited
    if (editingId === id) {
      setEditingId(null);
      setStudentName('');
    }
  };

  // 7. Edit student function
  const editStudent = (id: string, currentName: string) => {
    setEditingId(id);
    setStudentName(currentName);
  };

  // 8. Update student function
  const updateStudent = () => {
    if (studentName.trim() === '') {
      Alert.alert('Required', 'Please enter a student name.');
      return;
    }

    setStudents((previousStudents) =>
      previousStudents.map((student) =>
        student.id === editingId
          ? { ...student, name: studentName.trim() }
          : student
      )
    );

    setStudentName('');
    setEditingId(null);
  };

  // 9. Display loading screen while retrieving records
  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#6C55D9"
        />

        <Text style={styles.loadingText}>
          Loading student records...
        </Text>
      </View>
    );
  }

  // 10. Display the dashboard and student directory
  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={students}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View>
          <WelcomeMessage name="Stanley" />

          <DashboardCard
            icon="📚"
            title="My Subjects"
            description="View and manage your learning subjects."
          />

          <DashboardCard
            icon="📝"
            title="My Assessments"
            description="Check your available assessments."
          />

          <DashboardCard
            icon="📊"
            title="My Progress"
            description="Track your learning performance."
          />

          <Text style={styles.sectionTitle}>
            Student Directory
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter student name"
            value={studentName}
            onChangeText={setStudentName}
          />

          <TouchableOpacity
            style={styles.addButton}
            onPress={editingId ? updateStudent : addStudent}
          >
            <Text style={styles.buttonText}>
              {editingId ? 'Save Changes' : '+ Add Student'}
            </Text>
          </TouchableOpacity>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.studentCard}>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>
              {item.name}
            </Text>

            <Text style={styles.studentCourse}>
              Course: {item.course}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => editStudent(item.id, item.name)}
          >
            <Text style={styles.editButtonText}>
              Edit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeStudent(item.id)}
          >
            <Text style={styles.removeButtonText}>
              Remove
            </Text>
          </TouchableOpacity>
        </View>
      )}
      ListEmptyComponent={
        <Text style={styles.emptyText}>
          No students found. Add your first student!
        </Text>
      }
    />
  );
}

// 11. Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FF',
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 15,
    color: '#6C55D9',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5B45C6',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#6C55D9',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5B45C6',
  },
  studentCourse: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },
  removeButton: {
    backgroundColor: '#FCE4EC',
    padding: 10,
    borderRadius: 8,
  },
  removeButtonText: {
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#EDE7F6',
    padding: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  editButtonText: {
    color: '#5B45C6',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#777',
    fontSize: 15,
    marginTop: 20,
  },
});
