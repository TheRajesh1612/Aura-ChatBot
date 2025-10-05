import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Image, StyleSheet, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native'
import { NavigationContainer, useNavigation } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient';
import { faArrowLeft, faBarsStaggered, faBorderStyle, faEyeSlash, faHeadset, faPaperPlane, faSquarePlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
// import { styles } from './App';

const SignUP = () => {
  const navigation = useNavigation();

  const [formData, setFormData] = useState({
    // name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const handleSubmit = async () => {

    // validate input
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      alert("Please fill in all fields");
      return;
    }

    // check if passwords match
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords does not match!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("Please enter a valid email address");
      return;
    }

    try {
      const response = await fetch(
        "https://concert-treated-config-ports.trycloudflare.com/api/users/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // name: formData.name,
            email: formData.email,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
          }),
        }
      );

      const data = await response.json();
      console.log(data);
      if (data.success === true) {
        alert(data.message);
        navigation.navigate("Login");
      } else {
        alert(data.message);
      }
    } catch (error) {

      console.log(error.message);
      console.error(error);

    }

  }
  return (
    // Main container
    <View style={{ width: "100%", height: "100%" }}>
      <LinearGradient
        colors={[
          "#c2b8dfdf",
          "#DBCFFF",
          "#a176ff80",
          "#e0d8f0e1",
          // "#ffffffff",
          "#DBCFFF",
          "#ffffff"
          // "#dad1edff",
        ]}
        style={styles.gradientContainer}
      >
        {/* container */}
        <View style={styles.container}>
          {/* Top bar */}
          <View style={styles.topbar}>
            <TouchableOpacity style={styles.topbarButton} onPress={() => navigation.goBack()}>
              <FontAwesomeIcon icon={faArrowLeft} style={styles.icon} />
            </TouchableOpacity>

            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                // fontFamily: "sans-serif",
              }}
            >
              Sign up
            </Text>

            <TouchableOpacity style={styles.topbarButton}>
              <FontAwesomeIcon icon={faHeadset} style={styles.icon} />
            </TouchableOpacity>
          </View>

          <View style={styles.contentContainer}>

            {/* Image container */}
            <View style={styles.imageContainer}>
              {/* Image */}
              <Image
                source={{
                  uri: "https://res.cloudinary.com/dpmroilrh/image/upload/v1759058925/Auth-img-removebg-preview_glwbrt.png",
                }}
                style={styles.image}
              />
            </View>
            <KeyboardAvoidingView behavior={Platform.OS === "android" ? "position" : "height"} style={{ flex: 1 }}>
              {/* Input container */}
              <View style={styles.inputContainer}>
                <View style={styles.inputArea}>
                  {/* <TextInput style={styles.input1} placeholder="" onSubmitEditing={handleSubmit} /> */}
                  <TextInput style={styles.input1} placeholder="Email" keyboardType='email-address' value={formData.email} onChangeText={(text) => setFormData({ ...formData, email: text })} onSubmitEditing={handleSubmit} />
                  <View style={styles.passwordInput}>
                    <TextInput style={styles.input2} placeholder="Password" secureTextEntry={true} value={formData.password} onChangeText={(text) => setFormData({ ...formData, password: text })} onSubmitEditing={handleSubmit} />
                    <FontAwesomeIcon icon={faEyeSlash} style={{ marginRight: 12, }} />
                  </View>
                  <View style={styles.passwordInput}>
                    <TextInput style={styles.input2} placeholder="Confirm Password" secureTextEntry={true} value={formData.confirmPassword} onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })} onSubmitEditing={handleSubmit} />
                    <FontAwesomeIcon icon={faEyeSlash} style={{ marginRight: 12, }} />
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={handleSubmit}
                >
                  <LinearGradient colors={["#a965f6ac", "#ab75eae1", "#7d34bdb1", "#5651d7e0"]}
                    start={[0, 1]}
                    end={[1, 0]}
                    style={styles.Button}>
                    <Text style={{ color: "white", fontFamily: "sans-serif", fontWeight: "bold", fontSize: 16 }}>Sign up</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

            </KeyboardAvoidingView>
          </View>
        </View>
      </LinearGradient >
    </View >
  )
}

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
    // marginVertical: 40
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
    // backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#ffffff",
    borderStyle: "solid",
    borderRadius: 10,
    padding: 15,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    // gap: 10,
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
    backgroundColor: "rgba(255, 255, 255, 1)",
    borderStyle: "solid",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    // backgroundColor: "white",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    // borderWidth: 2,
    // borderStyle: "solid",
    // borderColor: "#cccccc98"
  },
});

export default SignUP