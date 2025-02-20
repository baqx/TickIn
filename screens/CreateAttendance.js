import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import * as yup from "yup";
import { useFormik } from "formik";
import { useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import { ChevronLeft } from "lucide-react-native";
import { Colors } from "../styles/styles";
import axios from "axios";
import { Snackbar } from "react-native-paper";
import Config from "../config/Config";
import * as SecureStore from "expo-secure-store";

// Validation schema using yup
const validationSchema = yup.object().shape({
  bookName: yup.string().required("Book Name is required"),
  description: yup.string().required("Description is required"),
  level: yup.string().required("Level/Year is required"),
  averageScore: yup
    .number()
    .required("Average Score is required")
    .positive("Score must be a positive number")
    .integer("Score must be an integer"),
});

const CreateAttendanceScreen = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState("success");

  const handleSubmit = async (values) => {
    setIsLoading(true);

    try {
      // Retrieve the userToken
      const userToken = await SecureStore.getItemAsync("userToken");
      if (!userToken) {
        setSnackbarMessage("Failed to retrieve user ID. Please try again.");
        setSnackbarType("error");
        setSnackbarVisible(true);
        return;
      }

      // API request to create attendance book
      const response = await axios.post(
        Config.BASE_URL + "/book/create",
        {
          user_id: userToken, // Pass the userToken as user_id
          name: values.bookName,
          description: values.description,
          level: parseInt(values.level),
          average_score: parseFloat(values.averageScore),
          department_id: null, // You can modify this if needed
        },
        {
          headers: {
            Authorization: `Bearer ${Config.PASS}`,
          },
        }
      );

      if (response.data.status === 1) {
        setSnackbarMessage("Attendance book created successfully");
        setSnackbarType("success");
        setSnackbarVisible(true);

        // Reset form or navigate after successful creation
        formik.resetForm();
      } else {
        setSnackbarMessage(
          response.data.message || "Failed to create attendance book"
        );
        setSnackbarType("error");
        setSnackbarVisible(true);
      }
    } catch (error) {
      setSnackbarMessage("An error occurred. Please try again.");
      setSnackbarType("error");
      setSnackbarVisible(true);
      console.error("API Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      bookName: "",
      description: "",
      level: "",
      averageScore: "",
    },
    validationSchema: validationSchema,
    onSubmit: handleSubmit,
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft color={Colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Attendance Book</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <Text style={styles.label}>Book Name</Text>
          <TextInput
            style={[
              styles.input,
              formik.touched.bookName &&
                formik.errors.bookName &&
                styles.inputError,
            ]}
            placeholder="Enter book name"
            placeholderTextColor={Colors.textSecondary}
            value={formik.values.bookName}
            onChangeText={formik.handleChange("bookName")}
            onBlur={formik.handleBlur("bookName")}
          />
          {formik.touched.bookName && formik.errors.bookName && (
            <Text style={styles.errorText}>{formik.errors.bookName}</Text>
          )}

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              formik.touched.description &&
                formik.errors.description &&
                styles.inputError,
            ]}
            placeholder="Enter description"
            placeholderTextColor={Colors.textSecondary}
            value={formik.values.description}
            onChangeText={formik.handleChange("description")}
            onBlur={formik.handleBlur("description")}
            multiline
            numberOfLines={4}
          />
          {formik.touched.description && formik.errors.description && (
            <Text style={styles.errorText}>{formik.errors.description}</Text>
          )}

          <Text style={styles.label}>Level/Year</Text>
          <View
            style={[
              styles.pickerContainer,
              formik.touched.level && formik.errors.level && styles.inputError,
            ]}
          >
            <Picker
              selectedValue={formik.values.level}
              style={styles.picker}
              onValueChange={(itemValue) =>
                formik.setFieldValue("level", itemValue)
              }
              onBlur={formik.handleBlur("level")}
            >
              <Picker.Item
                label="Select Level"
                value=""
                color={Colors.textSecondary}
              />
              {[100, 200, 300, 400, 500, 600, 700].map((level) => (
                <Picker.Item
                  key={level}
                  label={`${level} Level`}
                  value={level.toString()}
                  color={Colors.textPrimary}
                />
              ))}
            </Picker>
          </View>
          {formik.touched.level && formik.errors.level && (
            <Text style={styles.errorText}>{formik.errors.level}</Text>
          )}

          <Text style={styles.label}>Average Score Expected</Text>
          <TextInput
            style={[
              styles.input,
              formik.touched.averageScore &&
                formik.errors.averageScore &&
                styles.inputError,
            ]}
            placeholder="Enter expected average score"
            placeholderTextColor={Colors.textSecondary}
            value={formik.values.averageScore}
            onChangeText={formik.handleChange("averageScore")}
            onBlur={formik.handleBlur("averageScore")}
            keyboardType="numeric"
          />
          {formik.touched.averageScore && formik.errors.averageScore && (
            <Text style={styles.errorText}>{formik.errors.averageScore}</Text>
          )}

          <TouchableOpacity
            style={[
              styles.createButton,
              (isLoading || !formik.isValid) && styles.createButtonDisabled,
            ]}
            onPress={formik.handleSubmit}
            disabled={isLoading || !formik.isValid}
          >
            <Text style={styles.createButtonText}>
              {isLoading ? "Creating..." : "Create Attendance Book"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{
          backgroundColor:
            snackbarType === "success" ? Colors.success : Colors.error,
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: Colors.background,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
    fontFamily: "Quicksand-SemiBold",
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  formContainer: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: 20,
  },
  label: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 5,
    fontFamily: "Quicksand-Medium",
  },
  input: {
    height: 50,
    backgroundColor: Colors.almostBg,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: "Quicksand",
    marginBottom: 10,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
    paddingTop: 15,
  },
  pickerContainer: {
    backgroundColor: Colors.almostBg,
    borderRadius: 10,
    marginBottom: 10,
  },
  picker: {
    height: 50,
  },
  inputError: {
    borderWidth: 1,
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginBottom: 10,
    fontFamily: "Quicksand-Regular",
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: "Quicksand-SemiBold",
  },
});

export default CreateAttendanceScreen;
