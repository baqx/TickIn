import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Modal,
} from "react-native";
import * as yup from "yup";
import { useFormik } from "formik";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import { Snackbar } from "react-native-paper";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import DateTimePicker from "@react-native-community/datetimepicker";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Colors } from "../styles/styles";
import Config from "../config/Config";
import { ChevronLeft } from "lucide-react-native";

// Utility function to generate unique shortcode
const generateShortcode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const validationSchema = yup.object().shape({
  columnName: yup.string().required("Column name is required"),
  radius: yup
    .number()
    .required("Radius is required")
    .positive("Radius must be a positive number")
    .default(200),
  eventType: yup
    .string()
    .oneOf(["online", "physical"])
    .required("Event type is required"),
  locationName: yup.string().when("eventType", {
    is: "physical",
    then: () =>
      yup.string().required("Location name is required for physical events"),
    otherwise: () => yup.string(),
  }),
  eventStartTime: yup.date().required("Start time is required"),
  eventEndTime: yup
    .date()
    .required("End time is required")
    .min(yup.ref("eventStartTime"), "End time must be after start time"),
  eventDate: yup.date().required("Event date is required"),
});

const CreateEventScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookId } = route.params;

  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState("success");
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);

  // Map selection state
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const [selectedMapLocation, setSelectedMapLocation] = useState(null);

  // Date and Time Pickers
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Request location permissions
  const requestLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      showSnackbar("Permission to access location was denied", "error");
      return false;
    }
    return true;
  };

  // Fetch current location
  const fetchCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      try {
        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation.coords);
      } catch (error) {
        showSnackbar("Unable to fetch location. Please try again.", "error");
      }
    }
  };

  // Show Snackbar utility
  const showSnackbar = (message, type = "success") => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  // Initialize location on component mount
  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  // Handle map location selection
  const handleMapLocationSelect = (event) => {
    const { coordinate } = event.nativeEvent;
    setSelectedMapLocation(coordinate);
  };

  // Confirm map location selection
  const confirmMapLocation = () => {
    if (selectedMapLocation) {
      setLocation({
        latitude: selectedMapLocation.latitude,
        longitude: selectedMapLocation.longitude,
      });
      setIsMapModalVisible(false);
    } else {
      showSnackbar("Please select a location on the map", "error");
    }
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    // Validate location if not using current location
    if (!useCurrentLocation && !location) {
      showSnackbar("Please select a location", "error");
      return;
    }

    setIsLoading(true);

    try {
      // Get user token from secure store
      const userToken = await SecureStore.getItemAsync("userToken");

      // Generate unique shortcode
      const shortcode = generateShortcode();

      const payload = {
        book_id: bookId,
        user_id: userToken,
        column_name: values.columnName,
        radius: values.radius,
        event_type: values.eventType,
        location_name: values.locationName || null,
        event_starttime: values.eventStartTime.toISOString(),
        event_endtime: values.eventEndTime.toISOString(),
        event_date: values.eventDate.toISOString().split("T")[0],
        // Include location details based on location selection method
        ...(location
          ? {
          longitude: location.longitude.toString(),
          latitude: location.latitude.toString(),
        }
          : {}),
      };

      const response = await axios.post(
        `${Config.BASE_URL}/book/create-column`,
        payload,
        {
          headers: {
        Authorization: `Bearer ${Config.PASS}`,
          },
        }
      );
      if (response.data.status === 1) {
        showSnackbar("Book column created successfully", "success");
        formik.resetForm();
        navigation.goBack();
      } else {
        showSnackbar(
          response.data.message || "Failed to create book column",
          "error"
        );
      }
    } catch (error) {
      showSnackbar("An error occurred. Please try again.", "error");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Formik setup
  const formik = useFormik({
    initialValues: {
      columnName: "",
      radius: "200",
      eventType: "physical",
      locationName: "",
      eventStartTime: new Date(),
      eventEndTime: new Date(),
      eventDate: new Date(),
    },
    validationSchema,
    onSubmit: handleSubmit,
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ChevronLeft color={Colors.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Attendance Books</Text>
        </View>
        {/* Location Toggle */}
        <View style={styles.locationToggleContainer}>
          <Text style={styles.label}>Use Current Location</Text>
          <Switch
            value={useCurrentLocation}
            onValueChange={(value) => {
              setUseCurrentLocation(value);
              // Reset location when toggling
              setLocation(null);
              setSelectedMapLocation(null);
            }}
            trackColor={{
              false: Colors.grey,
              true: Colors.primary,
            }}
          />
        </View>

        {/* Location Selection */}
        {!useCurrentLocation && (
          <TouchableOpacity
            style={styles.mapSelectButton}
            onPress={() => setIsMapModalVisible(true)}
          >
            <Text style={styles.mapSelectButtonText}>
              {location
                ? `Location Selected: ${location.latitude.toFixed(
                    4
                  )}, ${location.longitude.toFixed(4)}`
                : "Select Location on Map"}
            </Text>
          </TouchableOpacity>
        )}
        {/* Column Name */}
        <Text style={styles.label}>Column Name</Text>
        <TextInput
          style={styles.input}
          value={formik.values.columnName}
          onChangeText={formik.handleChange("columnName")}
          onBlur={formik.handleBlur("columnName")}
          placeholder="Enter column name"
        />
        {formik.touched.columnName && formik.errors.columnName && (
          <Text style={styles.errorText}>{formik.errors.columnName}</Text>
        )}

        {/* Radius */}
        <Text style={styles.label}>Radius (meters)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formik.values.radius}
          onChangeText={formik.handleChange("radius")}
          onBlur={formik.handleBlur("radius")}
          placeholder="Enter radius (default 200)"
        />
        {formik.touched.radius && formik.errors.radius && (
          <Text style={styles.errorText}>{formik.errors.radius}</Text>
        )}

        {/* Event Type */}
        <Text style={styles.label}>Event Type</Text>
        <Picker
          selectedValue={formik.values.eventType}
          onValueChange={(itemValue) =>
            formik.setFieldValue("eventType", itemValue)
          }
          style={styles.picker}
        >
          <Picker.Item label="Physical" value="physical" />
          <Picker.Item label="Online" value="online" />
        </Picker>

        {/* Location Name (Always shown) */}
        <Text style={styles.label}>Location Name</Text>
        <TextInput
          style={styles.input}
          value={formik.values.locationName}
          onChangeText={formik.handleChange("locationName")}
          onBlur={formik.handleBlur("locationName")}
          placeholder="Enter location name"
        />
        {formik.touched.locationName && formik.errors.locationName && (
          <Text style={styles.errorText}>{formik.errors.locationName}</Text>
        )}

        {/* Event Date */}
        <Text style={styles.label}>Event Date</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <TextInput
            style={styles.input}
            value={formik.values.eventDate.toLocaleDateString()}
            editable={false}
          />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={formik.values.eventDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              formik.setFieldValue(
                "eventDate",
                selectedDate || formik.values.eventDate
              );
            }}
          />
        )}

        {/* Event Start Time */}
        <Text style={styles.label}>Event Start Time</Text>
        <TouchableOpacity onPress={() => setShowStartTimePicker(true)}>
          <TextInput
            style={styles.input}
            value={formik.values.eventStartTime.toLocaleTimeString()}
            editable={false}
          />
        </TouchableOpacity>
        {showStartTimePicker && (
          <DateTimePicker
            value={formik.values.eventStartTime}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowStartTimePicker(false);
              formik.setFieldValue(
                "eventStartTime",
                selectedTime || formik.values.eventStartTime
              );
            }}
          />
        )}

        {/* Event End Time */}
        <Text style={styles.label}>Event End Time</Text>
        <TouchableOpacity onPress={() => setShowEndTimePicker(true)}>
          <TextInput
            style={styles.input}
            value={formik.values.eventEndTime.toLocaleTimeString()}
            editable={false}
          />
        </TouchableOpacity>
        {showEndTimePicker && (
          <DateTimePicker
            value={formik.values.eventEndTime}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowEndTimePicker(false);
              formik.setFieldValue(
                "eventEndTime",
                selectedTime || formik.values.eventEndTime
              );
            }}
          />
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!formik.isValid || isLoading) && styles.submitButtonDisabled,
          ]}
          onPress={formik.handleSubmit}
          disabled={!formik.isValid || isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? "Creating..." : "Create Column"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Location Selection Modal */}
      <Modal
        visible={isMapModalVisible}
        animationType="slide"
        transparent={false}
      >
        <View style={styles.mapModalContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: location?.latitude || 37.78825,
              longitude: location?.longitude || -122.4324,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            mapType="satellite"
            onPress={handleMapLocationSelect}
          >
            {selectedMapLocation && (
              <Marker
                coordinate={selectedMapLocation}
                title="Selected Location"
              />
            )}
          </MapView>

          <View style={styles.mapButtonContainer}>
            <TouchableOpacity
              style={styles.mapConfirmButton}
              onPress={confirmMapLocation}
            >
              <Text style={styles.mapConfirmButtonText}>Confirm Location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mapCancelButton}
              onPress={() => setIsMapModalVisible(false)}
            >
              <Text style={styles.mapCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Snackbar */}
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
  // ... existing styles ...
  mapSelectButton: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: "center",
  },
  mapSelectButtonText: {
    color: Colors.white,
    fontSize: 14,
  },
  mapModalContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 15,
    backgroundColor: Colors.white,
  },
  mapConfirmButton: {
    backgroundColor: Colors.success,
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  mapCancelButton: {
    backgroundColor: Colors.error,
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
  },
  mapConfirmButtonText: {
    color: Colors.white,
    fontSize: 14,
  },
  mapCancelButtonText: {
    color: Colors.white,
    fontSize: 14,
  },

  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 1,
    paddingVertical: 10,
    backgroundColor: Colors.background,
  },
  backButton: {
    marginRight: 7,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
    fontFamily: "Quicksand-SemiBold",
  },
  locationToggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    color: Colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.grey,
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: Colors.white,
  },
  picker: {
    marginBottom: 10,
    backgroundColor: Colors.white,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: 15,
    alignItems: "center",
    borderRadius: 5,
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.grey,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginBottom: 10,
  },
});

export default CreateEventScreen;
