import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons"; // Make sure to install this package
import HomeScreen from "../screens/Home";
import AttendScreen from "../screens/Attend";
import { Colors } from "../styles/styles";
import NotificationsScreen from "../screens/NotificationsScreen";

const BottomNav = () => {
  const [index, setIndex] = React.useState(0);
  const routes = [
    {
      key: "dashboard",
      title: "Dashboard",
      icon: "view-dashboard",
      iconOutline: "view-dashboard-outline", // Outlined version
    },
    {
      key: "mark-attendance",
      title: "Mark",
      icon: "clipboard-check",
      iconOutline: "clipboard-check-outline", // Outlined version
    },
    {
      key: "notifications",
      title: "Notifications",
      icon: "bell",
      iconOutline: "bell-outline", // Outlined version
    },
  ];

  const renderScene = () => {
    switch (routes[index].key) {
      case "dashboard":
        return <HomeScreen currentTab="dashboard" />;
      case "mark-attendance":
        return <AttendScreen currentTab="mark-attendance" />;
      case "notifications":
        return <NotificationsScreen currentTab="notifications" />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderScene()}
      <View style={styles.navBar}>
        {routes.map((route, i) => (
          <TouchableOpacity
            key={route.key}
            style={i === 1 ? styles.attendButton : styles.navItem}
            onPress={() => setIndex(i)}
          >
            {i === 1 ? (
              <View
                style={[
                  styles.attendCircle,
                  index === 1 ? styles.activeCircle : styles.inactiveCircle,
                ]}
              >
                <MaterialCommunityIcons
                  name={index === 1 ? route.icon : route.iconOutline}
                  size={23}
                  color={index === 1 ? "white" : Colors.textPrimary} // Change color to white if active
                />
                <Text
                  style={[
                    styles.label,
                    {
                      fontFamily: "Quicksand",
                      color: index === 1 ? "white" : Colors.textPrimary,
                    }, // Change color to white if active
                  ]}
                >
                  {route.title}
                </Text>
              </View>
            ) : (
              <>
                <MaterialCommunityIcons
                  name={index === i ? route.icon : route.iconOutline}
                  size={24}
                  color={index === i ? Colors.primary : Colors.textPrimary}
                />
                <Text style={[styles.label, { fontFamily: "Quicksand" }]}>
                  {route.title}
                </Text>
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 20,
    
    backgroundColor: "transparent", // Set the background color to transparent
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: Colors.cardBackground, // This can remain as is, or you can also set it to transparent if needed
    elevation: 4,
    paddingVertical: 10,
    position: "relative",

  },
  navItem: {
    alignItems: "center",
  },
  attendButton: {
    position: "absolute",
    bottom: 20, // Adjust this value to position the circle
    left: "50%",
    transform: [{ translateX: -30 }], // Center the circle
    alignItems: "center",
  },
  attendCircle: {
    width: 60, // Diameter of the circle
    height: 60, // Diameter of the circle
    borderRadius: 30, // Half of the width/height for a perfect circle
    justifyContent: "center",
    alignItems: "center",
    elevation: 4, // Optional: Add shadow effect
  },
  activeCircle: {
    backgroundColor: Colors.primary, // Circle color when active
  },
  inactiveCircle: {
    backgroundColor: Colors.background, // Circle color when inactive
  },
  label: {
    fontSize: 12,
    color: Colors.textPrimary,
  },
});

export default BottomNav;
