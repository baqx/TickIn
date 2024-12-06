import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
} from "react-native";
import { Colors } from "../styles/styles";

const { width: screenWidth } = Dimensions.get("window");

const OnboardingScreen = ({ navigation }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollViewRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const carouselItems = [
    {
      image: require("../assets/images/onboarding-1.png"), // Replace with your image paths
      title: "Track and Mark Attendance Easily",
      description:
        "Effortlessly mark and manage attendance with our intuitive app.",
    },
    {
      image: require("../assets/images/onboarding-2.png"),
      title: "Real-Time Updates",
      description:
        "Get instant notifications and updates about attendance status.",
    },
    {
      image: require("../assets/images/onboarding-3.png"),
      title: "Comprehensive Reports",
      description: "Generate detailed attendance reports with just a few taps.",
    },
  ];

  const handleScroll = (event) => {
    const slideIndex = Math.round(
      event.nativeEvent.contentOffset.x / screenWidth
    );
    setActiveSlide(slideIndex);
  };

  const scrollToSlide = (index) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * screenWidth,
        animated: true,
      });
    }
  };

  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {carouselItems.map((_, index) => {
          const inputRange = [
            (index - 1) * screenWidth,
            index * screenWidth,
            (index + 1) * screenWidth,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 20, 10],
            extrapolate: "clamp",
          });

          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: "clamp",
          });

          return (
            <TouchableOpacity key={index} onPress={() => scrollToSlide(index)}>
              <Animated.View
                style={[
                  styles.paginationDot,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                    backgroundColor:
                      index === activeSlide ? Colors.primary : Colors.primary,
                  },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false, listener: handleScroll }
        )}
        scrollEventThrottle={16}
      >
        {carouselItems.map((item, index) => (
          <View key={index} style={styles.carouselItemContainer}>
            <Image
              source={item.image}
              style={styles.carouselImage}
              resizeMode="contain"
            />
            <Text style={styles.carouselTitle}>{item.title}</Text>
            <Text style={styles.carouselDescription}>{item.description}</Text>
          </View>
        ))}
      </ScrollView>

      {renderPagination()}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.loginButton]}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.signupButton]}
          onPress={() => navigation.navigate("Signup")}
        >
          <Text style={styles.signupButtonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  carouselItemContainer: {
    width: screenWidth,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  carouselImage: {
    width: screenWidth * 0.8,
    height: 250,
    marginBottom: 30,
  },
  carouselTitle: {
    fontSize: 24,
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
    fontFamily: "Quicksand-Bold",
  },
  carouselDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
    fontFamily: "Quicksand",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  paginationDot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    backgroundColor: Colors.primaryLight,
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
  },
  loginButton: {
    backgroundColor: Colors.primary,
  },
  signupButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
   fontFamily:"Quicksand-SemiBold",
  },
  signupButtonText: {
    color: Colors.primary,
    fontSize: 18,
   fontFamily:"Quicksand-SemiBold",
  },
});

export default OnboardingScreen;
