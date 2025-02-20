import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Config from "../config/Config";
import { Colors } from "../styles/styles";
import { ChevronLeft, LogOut } from "lucide-react-native";

const API_BASE_URL = Config.BASE_URL;
const ADMIN_PASS = Config.PASS;

const EditProfileScreen = () => {
  const navigation = useNavigation();

  // State for form fields
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fullname, setFullname] = useState("");
  const [university, setUniversity] = useState("");
  const [universities, setUniversities] = useState([]);
  const [faculty, setFaculty] = useState("");
  const [faculties, setFaculties] = useState([]);
  const [department, setDepartment] = useState("");
  const [departments, setDepartments] = useState([]);
  const [level, setLevel] = useState("100");
  const [matricNo, setMatricNo] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Fetch user profile and initial data on component mount
  useEffect(() => {
    const fetchProfileAndInitialData = async () => {
      try {
        // Retrieve user token
        const userToken = await SecureStore.getItemAsync("userToken");
        if (!userToken) {
          navigation.replace("Login");
          return;
        }

        // Fetch user profile
        const profileResponse = await axios.post(
          `${API_BASE_URL}/user/edit-profile`,
          {
            func: "get_profile",
            uid: userToken,
          },
          {
            headers: {
              Authorization: `Bearer ${Config.PASS}`,
            },
          }
        );

        if (profileResponse.data.status === "1") {
          const profile = profileResponse.data.data;
          setUserId(profile.id);
          setUsername(profile.username);
          setEmail(profile.email);
          setPhone(profile.phone);
          setFullname(profile.fullname);
          setUniversity(profile.university_id);
          setFaculty(profile.faculty_id);
          setDepartment(profile.department_id);
          setLevel(profile.level.toString());
          setMatricNo(profile.matric_no);
        } else {
          Alert.alert("Error", profileResponse.data.message);
        }

        // Fetch universities concurrently
        const universitiesResponse = await axios.get(
          `${API_BASE_URL}/resources/universities`
        );

        if (universitiesResponse.data.status === 1) {
          setUniversities(universitiesResponse.data.data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        Alert.alert("Error", "Failed to load profile data");
      }
    };

    fetchProfileAndInitialData();
  }, []);

  // Fetch faculties when university changes
  useEffect(() => {
    if (university) {
      fetchFaculties(university);
    }
  }, [university]);

  // Fetch departments when faculty changes
  useEffect(() => {
    if (university && faculty) {
      fetchDepartments(university, faculty);
    }
  }, [university, faculty]);

  // Fetch faculties for a specific university
  const fetchFaculties = async (universityId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/resources/faculties?universityId=${universityId}`
      );

      if (response.data.status === 1) {
        setFaculties(response.data.data);
        // If current faculty is not in the new list, reset it
        if (!response.data.data.some((f) => f.id === faculty)) {
          setFaculty("");
          setDepartments([]);
        }
      } else {
        Alert.alert("Error", response.data.message);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load faculties");
    }
  };

  // Fetch departments for a specific university and faculty
  const fetchDepartments = async (universityId, facultyId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/resources/departments?universityId=${universityId}&facultyId=${facultyId}`
      );

      if (response.data.status === 1) {
        setDepartments(response.data.data);
        // If current department is not in the new list, reset it
        if (!response.data.data.some((d) => d.id === department)) {
          setDepartment("");
        }
      } else {
        Alert.alert("Error", response.data.message);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load departments");
    }
  };

  // Validate form fields
  const validateForm = () => {
    if (!fullname) {
      Alert.alert("Validation Error", "Full name is required");
      return false;
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return false;
    }

    if (!phone || !/^\d{11}$/.test(phone)) {
      Alert.alert("Validation Error", "Phone number must be 11 digits");
      return false;
    }

    if (!university) {
      Alert.alert("Validation Error", "University is required");
      return false;
    }

    if (!faculty) {
      Alert.alert("Validation Error", "Faculty is required");
      return false;
    }

    if (!department) {
      Alert.alert("Validation Error", "Department is required");
      return false;
    }

    // Password validation (optional)
    if (newPassword) {
      if (newPassword.length < 6) {
        Alert.alert(
          "Validation Error",
          "New password must be at least 6 characters long"
        );
        return false;
      }

      if (newPassword !== confirmNewPassword) {
        Alert.alert("Validation Error", "New passwords do not match");
        return false;
      }
    }

    return true;
  };

  // Handle profile update submission
  const handleUpdateProfile = async () => {
    if (!validateForm()) return;

    try {
      const updateData = {
        pass: ADMIN_PASS,
        func: "update_profile",
        uid: userId,
        email,
        phone,
        fullname,
        university: universities.find((u) => u.id === university)?.id || "",
        faculty: faculties.find((f) => f.id === faculty)?.id || "",
        department: departments.find((d) => d.id === department)?.id || "",
        level,
      };

      // Add password update if provided
      if (newPassword) {
        updateData.current_password = currentPassword;
        updateData.new_password = newPassword;
      }

      const response = await axios.post(
        `${API_BASE_URL}/user/edit-profile`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${Config.PASS}`,
          },
        }
      );

      if (response.data.status === "1") {
        Alert.alert("Success", "Profile updated successfully", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        console.log(response);
        Alert.alert("Update Failed", response.data.message);
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Update Error",
        error.response?.data?.message || "An unexpected error occurred"
      );
    }
  };
  const handleLogout = async () => {
    try {
      // Retrieve user token
      const userToken = await SecureStore.getItemAsync("userToken");
      if (!userToken) {
        navigation.replace("Login");
        return;
      }

      // Check attendance in the last 2 hours
      const response = await axios.post(
        `${API_BASE_URL}/user/logout`,
        {
          user_id: userToken,
        },
        {
          headers: {
            Authorization: `Bearer ${Config.PASS}`,
          },
        }
      );
      console.log(response.data);
      if (response.data.status === 0) {
        // No attendance marked in the last 2 hours
        // Remove the userToken from secure store
        await SecureStore.deleteItemAsync("userToken");

        // Navigate to Onboarding Screen
        navigation.reset({
          index: 0,
          routes: [{ name: "Onboarding" }],
        });
      } else {
        // Attendance marked within the last 2 hours
        Alert.alert("Something went wrong", "You cannot log out at this time");
      }
    } catch (error) {
      console.error("Logout failed:", error);
      Alert.alert(
        "Error",
        "An unexpected error occurred while trying to log out."
      );
    }
  };
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {/* Back Chevron */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft color={Colors.textPrimary} size={24} />
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <LogOut color={Colors.error} size={24} />
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Edit Profile</Text>

      {/* Username (Read-only) */}
      <TextInput
        style={styles.inputDisabled}
        value={username}
        editable={false}
        placeholder="Username"
      />

      {/* Full Name */}
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={fullname}
        onChangeText={setFullname}
      />

      {/* Email */}
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {/* Phone */}
      <TextInput
        style={styles.input}
        placeholder="Phone Number (11 digits)"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      {/* University Picker */}
      <View style={styles.pickerContainer}>
        <Picker
          color={Colors.primary}
          selectedValue={university}
          onValueChange={(itemValue) => setUniversity(itemValue)}
        >
          <Picker.Item
            itemStyle={{ background: Colors.textPrimary }}
            label="Select University"
            value=""
          />
          {universities.map((uni) => (
            <Picker.Item key={uni.id} label={uni.name} value={uni.id} />
          ))}
        </Picker>
      </View>

      {/* Faculty Picker */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={faculty}
          onValueChange={(itemValue) => setFaculty(itemValue)}
          enabled={!!university}
        >
          <Picker.Item label="Select Faculty" value="" />
          {faculties.map((fac) => (
            <Picker.Item key={fac.id} label={fac.name} value={fac.id} />
          ))}
        </Picker>
      </View>

      {/* Department Picker */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={department}
          onValueChange={(itemValue) => setDepartment(itemValue)}
          enabled={!!faculty}
        >
          <Picker.Item label="Select Department" value="" />
          {departments.map((dept) => (
            <Picker.Item key={dept.id} label={dept.name} value={dept.id} />
          ))}
        </Picker>
      </View>

      {/* Level Picker */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={level}
          onValueChange={(itemValue) => setLevel(itemValue)}
        >
          <Picker.Item label="100 Level" value="100" />
          <Picker.Item label="200 Level" value="200" />
          <Picker.Item label="300 Level" value="300" />
          <Picker.Item label="400 Level" value="400" />
          <Picker.Item label="500 Level" value="500" />
          <Picker.Item label="600 Level" value="600" />
          <Picker.Item label="700 Level" value="700" />
        </Picker>
      </View>

      {/* Matric Number (Read-only) */}
      <TextInput
        style={styles.inputDisabled}
        value={matricNo}
        editable={false}
        placeholder="Matric Number"
      />

      {/* Password Update Section */}
      <Text style={styles.sectionTitle}>Change Password (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Current Password"
        secureTextEntry
        value={currentPassword}
        onChangeText={setCurrentPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="New Password"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm New Password"
        secureTextEntry
        value={confirmNewPassword}
        onChangeText={setConfirmNewPassword}
      />

      {/* Update Button */}
      <TouchableOpacity
        style={styles.updateButton}
        onPress={handleUpdateProfile}
      >
        <Text style={styles.updateButtonText}>Update Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  logoutButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: "Quicksand-Bold",
    marginBottom: 20,
    textAlign: "center",
    color: Colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.grey,
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    color: Colors.textPrimary,
    fontFamily: "Quicksand",
  },
  inputDisabled: {
    borderWidth: 1,
    borderColor: Colors.grey,
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    backgroundColor: Colors.cardBackground,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.grey,
    marginBottom: 15,
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Quicksand-Bold",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
    color: Colors.textPrimary,
  },
  updateButton: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 60,
  },
  updateButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    fontFamily: "Quicksand-SemiBold",
  },
});

export default EditProfileScreen;
