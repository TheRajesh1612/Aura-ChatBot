import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
  faArrowLeft,
  faHeadset,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";

const Login = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    // validate input
    if (!formData.email || !formData.password) {
      Alert.alert("Validation", "Please fill in all fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert("Validation", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        "https://aura-2kph.onrender.com/api/users/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();
      console.log("login response:", data);
      if (data.success === true) {
        Alert.alert("Success", data.message || "Logged in");
        navigation.navigate("ChatDrawer", { screen: "ChatPage", params: { email: formData.email, mode: "new" } });
      } else {
        Alert.alert("Login failed", data.message || "Invalid credentials");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Request OTP and navigate to OTP screen
  const handleForgotPassword = async () => {
    if (!formData.email) {
      Alert.alert("Email required", "Please enter your email to receive OTP");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert("Invalid email", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s

    try {
      const res = await fetch(
        "https://aura-2kph.onrender.com/api/users/request-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      // handle non-2xx
      if (!res.ok) {
        // try to get error message from body (json or text)
        let errMsg = `Server returned ${res.status}`;
        try {
          const txt = await res.text();
          // try parse json if possible
          try {
            const parsed = JSON.parse(txt);
            errMsg = parsed.message || JSON.stringify(parsed);
          } catch {
            if (txt) errMsg = txt;
          }
        } catch { }
        Alert.alert("Request failed", errMsg);
        return;
      }

      // parse JSON safely
      let data;
      try {
        data = await res.json();
      } catch (e) {
        Alert.alert("Response parse error", "Server returned unexpected response");
        console.error("parse error:", e);
        return;
      }

      console.log("request-otp:", data);
      if (data.success) {
        Alert.alert("OTP Sent", data.message || "An OTP has been sent to your email");
        navigation.navigate("OTPVerification", { email: formData.email });
      } else {
        Alert.alert("Failed to send OTP", data.message || "Please try again");
      }
    } catch (err) {
      if (err.name === "AbortError") {
        Alert.alert("Timeout", "Server took too long. Try again.");
      } else {
        console.error(err);
        Alert.alert("Network/Error", err.message || "Something went wrong");
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ width: "100%", height: "100%" }}>
        <LinearGradient
          colors={[
            "#c2b8dfdf",
            "#DBCFFF",
            "#a176ff80",
            "#e0d8f0e1",
            "#DBCFFF",
            "#ffffff",
          ]}
          style={styles.gradientContainer}
        >
          <View style={styles.container}>
            <View style={styles.topbar}>
              <TouchableOpacity
                style={styles.topbarButton}
                onPress={() => navigation.goBack()}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faArrowLeft} style={styles.icon} />
              </TouchableOpacity>

              <Text style={{ fontSize: 20, fontWeight: "bold" }}>Log in</Text>

              <TouchableOpacity style={styles.topbarButton}>
                <FontAwesomeIcon icon={faHeadset} style={styles.icon} />
              </TouchableOpacity>
            </View>

            <View style={styles.contentContainer}>
              <View style={styles.imageContainer}>
                <Image
                  source={{
                    uri:
                      "https://res.cloudinary.com/dpmroilrh/image/upload/v1759058925/Auth-img-removebg-preview_glwbrt.png",
                  }}
                  style={styles.image}
                />
              </View>

              <KeyboardAvoidingView
                behavior={Platform.OS === "android" ? "position" : "height"}
                style={{ flex: 1 }}
              >
                <View style={styles.inputContainer}>
                  <View style={styles.inputArea}>
                    <TextInput
                      style={styles.input1}
                      placeholder="Email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={formData.email}
                      onChangeText={(text) => setFormData({ ...formData, email: text })}
                      editable={!loading}
                    />

                    <View style={styles.passwordInput}>
                      <TextInput
                        style={styles.input2}
                        placeholder="Password"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        value={formData.password}
                        onChangeText={(text) =>
                          setFormData({ ...formData, password: text })
                        }
                        editable={!loading}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword((s) => !s)}
                        style={{ paddingHorizontal: 12 }}
                        disabled={loading}
                      >
                        <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      onPress={handleForgotPassword}
                      style={styles.forgotContainer}
                      disabled={loading}
                    >
                      <Text style={[styles.forgotText, loading && { color: "#ccc" }]}>
                        Forgot Password?
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleSend}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={["#a965f6ac", "#ab75eae1", "#7d34bdb1", "#5651d7e0"]}
                      start={[0, 1]}
                      end={[1, 0]}
                      style={styles.Button}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text
                          style={{
                            color: "white",
                            fontFamily: "sans-serif",
                            fontWeight: "bold",
                            fontSize: 16,
                          }}
                        >
                          Continue
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </View>
          </View>
        </LinearGradient>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 30,
    paddingTop: 50,
  },
  gradientContainer: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    // padding: 20
  },
  topbar: {
    width: "100%",
    height: 100,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topbarButton: {
    padding: 15,
    borderWidth: 1,
    borderColor: "white",
    borderStyle: "solid",
    borderRadius: 16,
    background: "transparent",
    blurRadius: 10,
  },
  contentContainer: {
    display: "flex",
    flexDirection: "column",
    // alignItems: "center",
    justifyContent: "space-between",
    gap: 40
  },
  imageContainer: {
    width: 250,
    height: 250,
    display: "flex",
    alignSelf: "center",
    alignItems: "flex-end",
    justifyContent: "center",
    justifySelf: "center",
    marginVertical: 40
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  inputContainer: {
    width: "auto%",
    height: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    // backgroundColor: 'rgba(255, 255, 255, 0.8)',
    gap: 20,
  },
  inputArea: {
    width: "100%",
    // height: 100,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  input1: {
    width: "100%",
    height: 60,
    borderWidth: 1.5,
    borderColor: "#ffffff",
    borderStyle: "solid",
    borderRadius: 10,
    padding: 15,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e3dbfbdc",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  input2: {
    width: "90%",
    height: 60,
    padding: 15,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

  },
  passwordInput: {
    width: "100%",
    height: 60,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    borderColor: "#ffffff",
    backgroundColor: "#e3dbfbdc",
    borderStyle: "solid",
    borderRadius: 10,
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  continueButton: {
    width: "100%",
    height: 60,
    // backgroundColor: "white",
    borderRadius: 10,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  Button: {
    width: "100%",
    height: 60,
    backgroundColor: "#bc92e1c7",
    borderRadius: 10,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "sans-serif",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
  },
  forgotText: {
    color: "#4B2FB6",
    // Add any other styles you want for the forgot password text
  },
  forgotContainer: {
    alignSelf: "center",
    // Add any other styles for the container
  },
});

export default Login;