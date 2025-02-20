import React, { useState, useEffect } from "react";
import { Alert, Linking, Platform } from "react-native";
import axios from "axios";
import Constants from "expo-constants";
import * as Application from "expo-application";

// Utility function to compare versions
export const compareVersions = (currentVersion, latestVersion) => {
  const currentParts = currentVersion.split(".").map(Number);
  const latestParts = latestVersion.split(".").map(Number);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const current = currentParts[i] || 0;
    const latest = latestParts[i] || 0;

    if (current < latest) return -1; // Update available
    if (current > latest) return 1; // Current version is newer (unlikely)
  }

  return 0; // Versions are the same
};

// Version Check Component
export const VersionCheckModal = ({ apiUrl, forceUpdateVersions = [] }) => {
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
    checkAppVersion();
  }, []);

  const checkAppVersion = async () => {
    try {
      // Get current app version
      const currentVersion =
        Application.nativeApplicationVersion || Constants.manifest?.version;

      // Fetch version info from your PHP API
      const response = await axios.get(apiUrl, {
        params: {
          currentVersion,
          platform: Platform.OS,
        },
      });

      const {
        success,
        updateRequired,
        mustUpdate,
        downloadUrl,
        updateMessage,
        latestVersion,
      } = response.data;

      if (!success) {
        console.error("Version check failed");
        return;
      }

      // Check if update is mandatory
      const isMandatory =
        mustUpdate ||
        forceUpdateVersions.some(
          (forcedVersion) => compareVersions(latestVersion, forcedVersion) >= 0
        );

      if (updateRequired) {
        setUpdateInfo({
          downloadUrl,
          updateMessage,
          isMandatory,
        });

        if (isMandatory) {
          showMandatoryUpdateAlert(downloadUrl, updateMessage);
        } else {
          showOptionalUpdateAlert(downloadUrl, updateMessage);
        }
      }
    } catch (error) {
      console.error("Version check error:", error);
    }
  };

  const showOptionalUpdateAlert = (downloadUrl, updateMessage) => {
    Alert.alert(
      "Update Available",
      updateMessage || "A new version of the app is available.",
      [
        {
          text: "Not Now",
          style: "cancel",
        },
        {
          text: "Update",
          onPress: () => openDownloadLink(downloadUrl),
        },
      ]
    );
  };

  const showMandatoryUpdateAlert = (downloadUrl, updateMessage) => {
    Alert.alert(
      "Update Required",
      updateMessage ||
        "A critical update is available. You must update the app to continue.",
      [
        {
          text: "Update Now",
          onPress: () => openDownloadLink(downloadUrl),
        },
      ],
      { cancelable: false }
    );
  };

  const openDownloadLink = (downloadUrl) => {
    if (downloadUrl) {
      Linking.openURL(downloadUrl);
    } else {
      Alert.alert("Error", "Download URL is not available");
    }
  };

  // No UI is rendered, this is a background check
  return null;
};
