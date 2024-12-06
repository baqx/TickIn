import React from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, SafeAreaView } from "react-native";
import * as yup from "yup";
import { useFormik } from "formik";
import { useNavigation } from "@react-navigation/native";
import { Picker } from '@react-native-picker/picker';
import { ChevronLeft } from 'lucide-react-native'; // Make sure to install lucide-react-native
import { Colors } from "../styles/styles";


// Validation schema using yup
const validationSchema = yup.object().shape({
  bookName: yup.string().required("Book Name is required"),
  description: yup.string().required("Description is required"),
  level: yup.string().required("Level/Year is required"),
  averageScore: yup.number().required("Average Score is required").positive().integer(),
});

const CreateAttendanceScreen = () => {
  const navigation = useNavigation();
  
  const formik = useFormik({
    initialValues: {
      bookName: '',
      description: '',
      level: '',
      averageScore: '',
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      // Handle form submission
      console.log(values);
      // You can navigate or show a success message here
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
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
              formik.touched.bookName && formik.errors.bookName && styles.inputError
            ]}
            placeholder="Enter book name"
            placeholderTextColor={Colors.textSecondary}
            value={formik.values.bookName}
            onChangeText={formik.handleChange('bookName')}
            onBlur={formik.handleBlur('bookName')}
          />
          {formik.touched.bookName && formik.errors.bookName && (
            <Text style={styles.errorText}>{formik.errors.bookName}</Text>
          )}

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[
              styles.input, 
              styles.textArea,
              formik.touched.description && formik.errors.description && styles.inputError
            ]}
            placeholder="Enter description"
            placeholderTextColor={Colors.textSecondary}
            value={formik.values.description}
            onChangeText={formik.handleChange('description')}
            onBlur={formik.handleBlur('description')}
            multiline
            numberOfLines={4}
          />
          {formik.touched.description && formik.errors.description && (
            <Text style={styles.errorText}>{formik.errors.description}</Text>
          )}

          <Text style={styles.label}>Level/Year</Text>
          <View style={[
            styles.pickerContainer, 
            formik.touched.level && formik.errors.level && styles.inputError
          ]}>
            <Picker
              selectedValue={formik.values.level}
              style={styles.picker}
              onValueChange={(itemValue) => formik.setFieldValue('level', itemValue)}
              onBlur={formik.handleBlur('level')}
            >
              <Picker.Item label="Select Level" value="" color={Colors.textSecondary} />
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
              formik.touched.averageScore && formik.errors.averageScore && styles.inputError
            ]}
            placeholder="Enter expected average score"
            placeholderTextColor={Colors.textSecondary}
            value={formik.values.averageScore}
            onChangeText={formik.handleChange('averageScore')}
            onBlur={formik.handleBlur('averageScore')}
            keyboardType="numeric"
          />
          {formik.touched.averageScore && formik.errors.averageScore && (
            <Text style={styles.errorText}>{formik.errors.averageScore}</Text>
          )}

          <TouchableOpacity 
            style={styles.createButton}
            onPress={formik.handleSubmit}
          >
            <Text style={styles.createButtonText}>Create Attendance Book</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: Colors.background,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: 'Quicksand-SemiBold',
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
    fontFamily: 'Quicksand-Medium',
  },
  input: {
    height: 50,
    backgroundColor: Colors.almostBg,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: 'Quicksand',
    marginBottom: 10,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
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
    fontFamily: 'Quicksand-Regular',
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  createButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Quicksand-SemiBold',
  },
});

export default CreateAttendanceScreen;