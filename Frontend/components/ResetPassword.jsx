// ResetPassword.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const ResetPassword = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { email, otp } = route.params || {};
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    // Validation
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        "https://estate-progress-motorcycle-approved.trycloudflare.com/api/users/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email, 
            otp, 
            newPassword 
          }),
        }
      );
      
      const data = await res.json();
      console.log("reset-password:", data);
      
      if (data.success) {
        Alert.alert(
          "Success", 
          "Password reset successfully! Please login with your new password.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login")
            }
          ]
        );
      } else {
        Alert.alert("Failed", data.message || "Could not reset password");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#c2b8dfdf", "#DBCFFF", "#a176ff80", "#e0d4ff80"]}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.box}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your new password for <Text style={{ fontWeight: "700" }}>{email}</Text>
          </Text>

          {/* New Password Input */}
          <View style={styles.passwordInput}>
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry={!showPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={{ paddingHorizontal: 12 }}
              disabled={loading}
            >
              <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
            </TouchableOpacity>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.passwordInput}>
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{ paddingHorizontal: 12 }}
              disabled={loading}
            >
              <FontAwesomeIcon icon={showConfirmPassword ? faEye : faEyeSlash} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleResetPassword} 
            disabled={loading}
          >
            <LinearGradient
              colors={["#a965f6ac", "#ab75eae1", "#7d34bdb1", "#5651d7e0"]}
              start={[0, 1]}
              end={[1, 0]}
              style={styles.gradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 20 
  },
  box: { 
    width: "100%", 
    padding: 20, 
    borderRadius: 12, 
    backgroundColor: "white", 
    elevation: 4,
    gap: 15
  },
  title: { 
    fontSize: 22, 
    fontWeight: "700", 
    marginBottom: 6 
  },
  subtitle: { 
    color: "#333", 
    marginBottom: 18 
  },
  passwordInput: {
    width: "100%",
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    borderColor: "#ffffff",
    backgroundColor: "rgba(255, 255, 255, 1)",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  input: {
    flex: 1,
    height: 60,
    paddingHorizontal: 15,
  },
  button: { 
    width: "100%", 
    height: 60,
    marginTop: 16,
    borderRadius: 10,
  },
  gradient: {
    width: "100%",
    height: 60,
    backgroundColor: "#bc92e1c7",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: { 
    color: "white", 
    fontWeight: "bold",
    fontFamily: "sans-serif",
    fontSize: 16 
  },
});

export default ResetPassword;