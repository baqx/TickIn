import { StyleSheet } from "react-native";

export const Colors = {
  // Main color theme
  mainThemeColor: "#1abc9c", // Mint Green

  // Shades and tints
  primary: "#1abc9c",
  primaryLight: "#48d1b7", // 20% lighter
  primaryDark: "#17917e", // 20% darker
  primaryDarker: "#116f5d", // 40% darker

  // Neutral colors
  background: "#fdfdfd", // A slightly tinted white
  cardBackground: "#ffffff", // White card background
  almostBg: "#f2f3f5", // A slightly darker neutral gray
  white: "#fff",
  // Text colors
  textPrimary: "#2c3e50", // Dark navy
  textSecondary: "#95a5a6", // Cool gray
  grey: "#bdc3c7", // A light gray text color

  // Accent colors or additional colors
  accent: "#f39c12", // Bright orange
  success: "#2ecc71", // Lime green
  error: "#e74c3c", // Poppy red
};
export const DarkColors = {
  // Main color theme
  mainThemeColor: "#16a085", // Darker Mint Green

  // Shades and tints
  primary: "#16a085", // Darker primary color
  primaryLight: "#1abc9c", // Original primary color for highlights
  primaryDark: "#0e7a6b", // Darker shade for depth
  primaryDarker: "#0b5b4e", // Even darker shade

  // Neutral colors
  background: "#2c3e50", // Dark navy background
  cardBackground: "#34495e", // Darker card background
  almostBg: "#1a252f", // Darker neutral gray
  white: "#ecf0f1", // Light gray for text on dark background

  // Text colors
  textPrimary: "#ecf0f1", // Light gray for primary text
  textSecondary: "#bdc3c7", // Cool gray for secondary text
  grey: "#95a5a6", // Lighter gray for less prominent text

  // Accent colors or additional colors
  accent: "#e67e22", // Darker bright orange
  success: "#27ae60", // Darker lime green
  error: "#c0392b", // Darker poppy red
};
export const GlobalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bgwhite: {
    backgroundColor: Colors.background,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: 10,
    marginBottom: 5,
    shadowColor: Colors.grey,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  textPrimary: {
    color: Colors.textPrimary,
  },
  textSecondary: {
    color: Colors.textSecondary,
  },
  fs18: {
    fontSize: 18,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  fdosis: {
    fontFamily: "Poppins-Regular",
  },
  secTitle: {
    fontFamily: "Poppins-Bold",
    fontSize: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    padding: 10,
  },
  appname: {
    fontSize: 24,
    fontFamily: "Poppins-Bold",
    color: Colors.primary,
  },
});
