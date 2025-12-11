// OTPVerification.js
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
import ResetPassword from "./ResetPassword";

const OTPVerification = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = route.params || {};
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!otp) {
      Alert.alert("Enter OTP", "Please enter the OTP you received.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        "https://aura-2kph.onrender.com/api/users/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        }
      );
      const data = await res.json();
      console.log("verify-otp:", data);
      if (data.success) {
        Alert.alert("Success", data.message || "OTP verified");
        navigation.navigate("ResetPassword", { email, otp });
      } else {
        Alert.alert("Failed", data.message || "Invalid OTP");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        "https://aura-2kph.onrender.com/api/users/request-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await res.json();
      if (data.success) {
        Alert.alert("Sent", "OTP resent to your email");
      } else {
        Alert.alert("Failed", data.message || "Could not resend OTP");
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
        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>
          We sent an OTP to <Text style={{ fontWeight: "700" }}>{email}</Text>
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter OTP"
          keyboardType="number-pad"
          value={otp}
          onChangeText={setOtp}
          editable={!loading}
        />

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleVerify} 
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
              <Text style={styles.buttonText}>Verify</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleResend} 
          style={{ marginTop: 12 }}
          disabled={loading}
        >
          <Text style={{ color: loading ? "#ccc" : "#4B2FB6" }}>
            Resend OTP
          </Text>
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
    elevation: 4 
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
  input: {
    width: "100%",
    height: 60,
    borderWidth: 2,
    borderColor: "#ffffff",
    borderStyle: "solid",
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: "rgba(255, 255, 255, 1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
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

export default OTPVerification;