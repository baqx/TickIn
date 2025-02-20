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
import Config from "../config/Config";
import { Colors } from "../styles/styles";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator } from "react-native-paper";

// Configuration and API endpoints
const API_BASE_URL = Config.BASE_URL;
const ADMIN_PASS = Config.PASS; // Securely manage this

const SignupScreen = ({}) => {
  // Form state
  const navigation = useNavigation();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fullname, setFullname] = useState("");
  const [gender, setGender] = useState("");
  const [university, setUniversity] = useState("");
  const [universities, setUniversities] = useState([]);
  const [faculty, setFaculty] = useState("");
  const [faculties, setFaculties] = useState([]);
  const [department, setDepartment] = useState("");
  const [departments, setDepartments] = useState([]);
  const [role, setRole] = useState("student");
  const [level, setLevel] = useState("100");
  const [matricNo, setMatricNo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false); // New loading state

  useEffect(() => {
    const checkUserToken = async () => {
      try {
        const userToken = await SecureStore.getItemAsync("userToken");
        if (userToken && userToken.trim() !== "") {
          navigation.replace("BottomNav");
        }
      } catch (error) {
        console.error("Failed to retrieve userToken from SecureStore:", error);
      }
    };

    checkUserToken();
  }, [navigation]);
  // Fetch universities on component mount
  useEffect(() => {
    fetchUniversities();
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

  // Fetch universities from API
  const fetchUniversities = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/resources/universities`
      );
      console.log(response.data); // Log the response data

      // Check if the response status is 1 and set universities
      if (response.data.status === 1) {
        setUniversities(response.data.data); // Access the data property
      } else {
        Alert.alert("Error", response.data.message);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load universities");
    }
  };

  // Fetch faculties for a specific university
  const fetchFaculties = async (universityId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/resources/faculties?universityId=${universityId}`
      );

      // Log the response data
      console.log(response.data);

      // Check if the response status is 1 and set faculties
      if (response.data.status === 1) {
        setFaculties(response.data.data); // Access the data property
        setFaculty(""); // Reset faculty
        setDepartments([]); // Reset departments
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

      // Log the response data
      console.log(response.data);

      // Check if the response status is 1 and set departments
      if (response.data.status === 1) {
        setDepartments(response.data.data); // Access the data property
        setDepartment(""); // Reset department
      } else {
        Alert.alert("Error", response.data.message);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load departments");
    }
  };

  // Validate form fields
  const validateForm = () => {
    if (!username || username.length < 4 || username.length > 12) {
      Alert.alert(
        "Validation Error",
        "Username must be between 4 and 12 characters"
      );
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      Alert.alert(
        "Validation Error",
        "Username can only contain letters, numbers, and underscores"
      );
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

    if (!fullname) {
      Alert.alert("Validation Error", "Full name is required");
      return false;
    }

    if (!gender) {
      Alert.alert("Validation Error", "Gender is required");
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

    if (!matricNo) {
      Alert.alert("Validation Error", "Matric number is required");
      return false;
    }

    if (!password || password.length < 6) {
      Alert.alert(
        "Validation Error",
        "Password must be at least 6 characters long"
      );
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match");
      return false;
    }

    return true;
  };

  // Handle signup submission
  const handleSignup = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/signup`,
        {
         
          func: "signup",
          username,
          email,
          phone,
          fullname,
          gender,
          university: universities.find((u) => u.id === university)?.id || "",
          faculty: faculties.find((f) => f.id === faculty)?.id || "",
          department: departments.find((d) => d.id === department)?.id || "",
          role,
          level,
          matric_no: matricNo,
          password,
        },
        {
          headers: {
            Authorization: `Bearer ${Config.PASS}`,
          },
        }
      );

      // Check API response
      if (response.data.status === "1") {
        // Store user token securely
        await SecureStore.setItemAsync(
          "userToken",
          response.data.uid.toString()
        );

        // Navigate to homepage or dashboard
        navigation.replace("BottomNav");
      } else {
        // Show error from API
        Alert.alert("Signup Failed", response.data.message);
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Signup Error",
        error.response?.data?.message || "An unexpected error occurred"
      );
    } finally {
      setLoading(false); // Set loading to false when signup ends
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.navigate("Onboarding")}>
        <Ionicons name="chevron-back" size={30} />
      </TouchableOpacity>
      <Text style={styles.title}>Create an Account</Text>
      {/* Username Input */}
      <TextInput
        style={styles.input}
        placeholder="Username (4-12 characters)"
        value={username}
        onChangeText={setUsername}
      />
      {/* Email Input */}
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      {/* Phone Input */}
      <TextInput
        style={styles.input}
        placeholder="Phone Number (11 digits)"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      {/* Full Name Input */}
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={fullname}
        onChangeText={setFullname}
      />
      {/* Gender Picker */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={gender}
          onValueChange={(itemValue) => setGender(itemValue)}
        >
          <Picker.Item label="Select Gender" value="" />
          <Picker.Item label="Male" value="male" />
          <Picker.Item label="Female" value="female" />
          <Picker.Item label="Other" value="other" />
        </Picker>
      </View>
      {/* University Picker */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={university}
          onValueChange={(itemValue) => setUniversity(itemValue)}
        >
          <Picker.Item label="Select University" value="" />
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
      {/* Role Picker */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={role}
          onValueChange={(itemValue) => setRole(itemValue)}
        >
          <Picker.Item label="Student" value="student" />
          <Picker.Item label="Admin" value="admin" />
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
      {/* Matric Number Input */}
      <TextInput
        style={styles.input}
        placeholder="Matric Number / Student ID"
        value={matricNo}
        onChangeText={setMatricNo}
      />
      {/* Password Input */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {/* Confirm Password Input */}
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      {/* Signup Button */}
      <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" /> // Show activity indicator when loading
        ) : (
          <Text style={styles.signupButtonText}>Sign Up</Text>
        )}
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
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
    fontFamily: "Quicksand-Bold",
  },
  input: {
    height: 50,
    backgroundColor: Colors.almostBg,
    borderRadius: 8,
    paddingHorizontal: 15,
    color: Colors.textPrimary,
    marginVertical: "10",
    fontFamily: "Quicksand",
  },
  pickerContainer: {
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: Colors.almostBg,
    fontFamily: "Quicksand",
  },
  signupButton: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 80,
  },
  signupButtonText: {
    color: "white",
    fontFamily: "Quicksand-SemiBold",
  },
});

export default SignupScreen;
