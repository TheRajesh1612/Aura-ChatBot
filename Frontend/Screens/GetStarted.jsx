import React from "react";
import { Text, TouchableOpacity, View, StyleSheet, Image } from "react-native";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Button } from "@react-navigation/elements";
// import {
//   createStaticNavigation,
//   useNavigation,
// } from "@react-navigation/native";
// import App from "./ChatPage";
import Login from "./Login";
import { LinearGradient } from "expo-linear-gradient";
import Auth from "./Auth";
import SignUP from "./SignUP";
import ChatPage from "./ChatPage";

const GetStarted = () => {
  const navigation = useNavigation();
  return (
    // Main container
    <View style={styles.container}>
      <LinearGradient
        colors={[
          "#c2b8dfdf",
          "#DBCFFF",
          "#a176ff80",
          "#e0d8f0fb",
          "#ffffffff",
          "#fffffffb",
          "#ffffff22"
        ]}
        style={styles.gradientContainer}
      >
        {/* Image container */}
        {/* <View style={styles.getStartedContainer}> */}

        <View style={styles.imageContainer}>
          <View style={styles.originalImage}>
            <Image
              style={styles.image}
              source={{
                uri: "https://res.cloudinary.com/dpmroilrh/image/upload/v1758988567/secure-lock-removebg-preview_mird72.png",
              }}
            />
          </View>
          <View style={styles.reverseImageContainer}>
            <Image
              style={styles.reverseImage}
              source={{
                uri: "https://res.cloudinary.com/dpmroilrh/image/upload/v1758988567/secure-lock-removebg-preview_mird72.png",
              }}
            />
          </View>
        </View>
        {/* </View> */}

        {/* Content container */}
        <View style={styles.contentContainer}>
          {/* Text content */}
          <View style={styles.textContent}>
            <Text style={styles.text1}>Secure & Private</Text>
            <Text style={styles.text2}>
              Access web search, file uploads, and automation tools
            </Text>
          </View>

          {/* Button container */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={() => navigation.navigate("Auth")}
              style={styles.button1}
            >
              <LinearGradient colors={["#a965f6ac", "#ab75eae1", "#7d34bdb1", "#5651d7e0"]}
                start={[0, 1]}
                end={[1, 0]}
                style={styles.buttonGradient}>

                <Text style={{ color: "white", fontWeight: "bold" }}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Button
              style={styles.button2}
              onPressIn={() => navigation.navigate("Login")}
            >
              <Text style={{ color: "black", fontWeight: "bold" }}>I already have an account</Text>
            </Button>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const Stack = createNativeStackNavigator();

function RootStack() {
  return (
    <Stack.Navigator initialRouteName="Get Started" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Get Started" component={GetStarted} />
      <Stack.Screen name="ChatPage" component={ChatPage} />
      <Stack.Screen name="Auth" component={Auth} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="SignUP" component={SignUP} />
    </Stack.Navigator>
  );
}

export default function Chat() {
  return (
    <NavigationContainer>
      <RootStack />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
  },
  gradientContainer: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-evenly",
    gap: 50
  },
  getStartedContainer: {
    display: "flex",
  },
  imageContainer: {
    width: 200,
    height: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 5,
    borderColor: "#ffffffe2",
    borderStyle: "solid",
    borderRadius: 10,
    shadowColor: "white",
    shadowOffset: {
      width: 1,
      height: 1,
    },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 0.5,
    gap: 10
  },
  originalImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  reverseImageContainer: {
    width: 200,
    height: 200,
    borderWidth: 5,
    borderColor: "#ffffffe2",
    borderStyle: "solid",
    transform: [{ scaleY: 1 }],
    opacity: 0.5,
    borderRadius: 10,
    shadowColor: "white",
    shadowOffset: {
      width: 1,
      height: 1,
    },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 0.5,
  },
  reverseImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
    transform: [{ scaleY: -1 }],
    opacity: 0.5,
    // marginTop: -5,
  },
  contentContainer: {
    width: "100%",
    height: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "end",
    justifyContent: "center",
    gap: 30,
  },
  textContent: {
    width: "100%",
    height: 100,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 20,
  },
  text1: {
    fontSize: 25,
    fontWeight: "bold",
    fontFamily: "sans-serif",
  },
  text2: {
    fontSize: 15,
    fontWeight: "light",
    textAlign: "center"
  },
  buttonContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,

  },
  button1: {
    color: "white",
    display: "flex",
    flexDirection: "row",
    fontSize: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    padding: 0,
    width: "90%",
    height: 60,
  },
  buttonGradient: {
    backgroundColor: "#bc92e1c7",
    width: "100%",
    height: "100%",
    borderRadius: 12,
    display: "flex",
    // flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  button2: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "white",
    borderRadius: 10,
    width: "90%",
    height: 60,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
});
