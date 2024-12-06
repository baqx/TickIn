import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { Colors } from "../styles/styles";
import { Eye, EyeOff } from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator } from 'react-native-paper';
import Config from "../config/Config";

// Validation Schema
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});


const LoginScreen = ({ navigation }) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (values) => {
    setIsLoading(true);
    try {
      const response = await axios.post(Config.BASE_URL+"/auth/login", {
        pass: Config.PASS,
        username: values.email,
        password: values.password,
        func: 'login'
      });

      // Check the response status
      if (response.data.status === "1") {
        // Store user token securely
        await SecureStore.setItemAsync('userToken', response.data.uid);
        
        // Show success message
        Alert.alert('Success', 'Login Successful');
        
        // Navigate to home page
        navigation.replace('BottomNav'); // Make sure you have a Home screen in your navigation
      } else {
        // Show error message from backend
        Alert.alert('Login Failed', response.data.message);
      }
    } catch (error) {
      // Handle network or other errors
      console.error('Login Error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
  };

  const handleSignUp = () => {
    navigation.navigate("SignUp");
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.navigate("Onboarding")}>
        <Ionicons
          name="chevron-back"
          style={{ marginLeft: 20, marginVertical: 20 }}
          size={30}
        />
      </TouchableOpacity>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <View style={styles.loginContainer}>
          <Text style={styles.title}>Welcome Back</Text>

          <Formik
            initialValues={{ email: "", password: "" }}
            validationSchema={LoginSchema}
            onSubmit={handleLogin}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
            }) => (
              <View style={styles.formContainer}>
                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={Colors.textSecondary}
                    onChangeText={handleChange("email")}
                    onBlur={handleBlur("email")}
                    value={values.email}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  {touched.email && errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Password"
                      placeholderTextColor={Colors.textSecondary}
                      onChangeText={handleChange("password")}
                      onBlur={handleBlur("password")}
                      value={values.password}
                      secureTextEntry={!passwordVisible}
                      autoCapitalize="none"
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      onPress={() => setPasswordVisible(!passwordVisible)}
                      style={styles.eyeIconContainer}
                      disabled={isLoading}
                    >
                      {passwordVisible ? (
                        <EyeOff color={Colors.textSecondary} size={20} />
                      ) : (
                        <Eye color={Colors.textSecondary} size={20} />
                      )}
                    </TouchableOpacity>
                  </View>
                  {touched.password && errors.password && (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  )}
                </View>

                {/* Forgot Password Link */}
                <TouchableOpacity
                  onPress={handleForgotPassword}
                  style={styles.forgotPasswordContainer}
                  disabled={isLoading}
                >
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                {/* Login Button / Loading Indicator */}
                {isLoading ? (
                  <View style={styles.loginButton}>
                    <ActivityIndicator color={Colors.cardBackground} />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleSubmit}
                  >
                    <Text style={styles.loginButtonText}>Log In</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Formik>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity 
              onPress={handleSignUp}
              disabled={isLoading}
            >
              <Text style={styles.signUpLinkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: "center",
  },
  loginContainer: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: "Quicksand-Bold",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 30,
  },
  formContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    height: 50,
    backgroundColor: Colors.almostBg,
    borderRadius: 8,
    paddingHorizontal: 15,
    color: Colors.textPrimary,
    fontFamily: "Quicksand",
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.almostBg,
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    color: Colors.textPrimary,
    fontFamily: "Quicksand",
  },
  eyeIconContainer: {
    paddingRight: 15,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 5,
    fontFamily: "Quicksand-SemiBold",
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontWeight: "600",
    fontFamily: "Quicksand-SemiBold",
  },
  loginButton: {
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonText: {
    color: Colors.cardBackground,
    fontSize: 16,
    fontFamily: "Quicksand-SemiBold",
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signUpText: {
    color: Colors.textSecondary,
  },
  signUpLinkText: {
    color: Colors.primary,
    fontWeight: "bold",
  },
});

export default LoginScreen;