import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { ChevronLeft, LogOut } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../styles/styles';



// Departments and Faculties (example data)
const departments = [
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Business Administration',
  'Biology'
];

const faculties = [
  'Science',
  'Engineering',
  'Business',
  'Arts and Humanities',
  'Medicine'
];

const ProfileEditScreen = ({ navigation }) => {
  // State for form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [level, setLevel] = useState('');
  const [department, setDepartment] = useState('');
  const [faculty, setFaculty] = useState('');

  // Logout handler
  const handleLogout = async () => {
    try {
      // Remove the userToken from secure store
      await SecureStore.deleteItemAsync('userToken');
      
      // Navigate to Onboarding Screen
      // Assumes you have set up navigation with an Onboarding screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Onboarding' }],
      });
    } catch (error) {
      console.error('Logout failed:', error);
      // Optionally show an error message to the user
    }
  };

  // Save profile handler
  const handleSaveProfile = () => {
    // Implement profile save logic here
    // This might involve API call to update user profile
    console.log('Profile data to save:', {
      username,
      email,
      phoneNumber,
      level,
      department,
      faculty
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Back Chevron */}
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <ChevronLeft color={Colors.textPrimary} size={24} />
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity 
          onPress={handleLogout} 
          style={styles.logoutButton}
        >
          <LogOut color={Colors.error} size={24} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.screenTitle}>Edit Profile</Text>

          {/* Username Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email"
              keyboardType="email-address"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          {/* Phone Number Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter new password"
              secureTextEntry
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          {/* Level Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Level</Text>
            <TextInput
              style={styles.input}
              value={level}
              onChangeText={setLevel}
              placeholder="Enter level (100-700)"
              keyboardType="numeric"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          {/* Department Dropdown */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Department</Text>
            <View style={styles.pickerContainer}>
              <Text 
                style={[
                  styles.pickerText, 
                  !department && { color: Colors.textSecondary }
                ]}
              >
                {department || 'Select Department'}
              </Text>
              {/* In a real app, replace with a proper picker or modal selection */}
            </View>
          </View>

          {/* Faculty Dropdown */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Faculty</Text>
            <View style={styles.pickerContainer}>
              <Text 
                style={[
                  styles.pickerText, 
                  !faculty && { color: Colors.textSecondary }
                ]}
              >
                {faculty || 'Select Faculty'}
              </Text>
              {/* In a real app, replace with a proper picker or modal selection */}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSaveProfile}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backButton: {
      padding: 8,
    },
    logoutButton: {
      padding: 8,
    },
    keyboardView: {
      flex: 1,
    },
    scrollViewContent: {
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    screenTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: Colors.textPrimary,
      marginBottom: 24,
      textAlign: 'center',
      fontFamily: 'Quicksand', // Added font family
    },
    inputContainer: {
      marginBottom: 16,
    },
    inputLabel: {
      color: Colors.textPrimary,
      marginBottom: 8,
      fontWeight: '600',
      fontFamily: 'Quicksand', // Added font family
    },
    input: {
      backgroundColor: Colors.white,
      borderWidth: 1,
      borderColor: Colors.grey,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: Colors.textPrimary,
      fontFamily: 'Quicksand', // Added font family
    },
    pickerContainer: {
      backgroundColor: Colors.white,
      borderWidth: 1,
      borderColor: Colors.grey,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      justifyContent: 'center',
    },
    pickerText: {
      color: Colors.textPrimary,
      fontFamily: 'Quicksand', // Added font family
    },
    saveButton: {
      backgroundColor: Colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
      marginTop: 16,
    },
    saveButtonText: {
      color: Colors.white,
      fontWeight: 'bold',
      fontSize: 16,
      fontFamily: 'Quicksand', // Added font family
    },
  });

export default ProfileEditScreen;