import React, { useState } from "react";
import { TouchableOpacity, View, Text, Image, StyleSheet } from "react-native";
import NavigationContainer, {
  createStaticNavigation,
  useNavigation,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Checkbox } from 'expo-checkbox';
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faUnlockKeyhole } from "@fortawesome/free-solid-svg-icons";
import { faApple ,faGoogle } from "@fortawesome/free-brands-svg-icons";

const Auth = () => {
  const navigation = useNavigation();
  const [isSelected, setSelection] = useState(false);

  // validate checkbox and handle login
  const handleLogin = () => {
    if (isSelected) {
      navigation.navigate("Login");
    } else {
      alert("Please accept the terms and conditions");
    }
  };

  // validate checkbox and handle signup
  const handleSignUp = () => {
    if (isSelected) {
      navigation.navigate("SignUP");
    } else {
      alert("Please accept the terms and conditions");
    }
  };

  return (
    // main container
    <View style={styles.mainContainer}>
      <LinearGradient
        colors={[
          "#c2b8dfdf",
          "#DBCFFF",
          "#a176ff80",
          "#e0d8f0e1",
          "#ffffffff",
          "#fffffffb",
          "#ffffff22"
          // "#dad1edff",
        ]}
        style={styles.gradientContainer}
      >
        <View style={styles.container}>

          {/* Image container */}
          <View style={styles.imageContainer}>
            {/* Image */}
            <Image
              style={styles.image}
              source={{
                uri: "https://res.cloudinary.com/dpmroilrh/image/upload/v1759058925/Auth-img-removebg-preview_glwbrt.png",
              }}
            />
          </View>

          {/* Buttons container */}
          <View style={styles.buttonContainer}>
            {/* Continue with Password */}
            <View style={styles.Buttons}>
              <TouchableOpacity
                style={{ borderRadius: 10, }}
                onPress={handleLogin}
              >
                <LinearGradient colors={["#a965f6ac", "#ab75eae1", "#7d34bdb1", "#5651d7e0"]}
                  start={[0, 1]}
                  end={[1, 0]}
                  style={styles.passwordButton}>
                  <FontAwesomeIcon icon={faUnlockKeyhole} style={{ color: "white", marginRight: 10, }} />
                  <Text style={{ color: "white", fontFamily: "sans-serif", fontWeight: "bold", fontSize: 16 }}>Continue with Password</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Continue with Google */}
              <TouchableOpacity style={styles.Button}>
                <FontAwesomeIcon icon={faApple} style={{ marginRight: 10, color: "#000000" }} />
                <Text style={styles.buttonText}>Continue with Apple</Text>
              </TouchableOpacity>

              {/* Continue with Facebook */}
              <TouchableOpacity style={styles.Button}>
                <FontAwesomeIcon icon={faGoogle} style={{ marginRight: 10, color: "#DB4437" }}/>
                <Text style={styles.buttonText}>Continue with Google</Text>
              </TouchableOpacity>

              {/* Continue with Apple */}
              <TouchableOpacity style={styles.Button} onPress={handleSignUp}>
                <Text style={styles.buttonText}>Sign up</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.checkBoxContainer}>
              <Checkbox
                value={isSelected}
                onValueChange={setSelection}
                style={styles.checkBox} />

              <Text style={styles.checkBoxText}>By signing up, you agree to our Terms, Privacy Policy and Cookie Use.</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export const styles = StyleSheet.create({
  mainContainer: {
    width: "100%",
    height: "100%",
  },
  container: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 50,
    padding: 20,
    paddingTop: 60
  },
  imageContainer: {
    width: 300,
    height: 300,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain"

  },
  gradientContainer: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContainer: {
    width: "100%",
    gap: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 6
  },
  Buttons: {
    width: "100%",
    gap: 10,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  passwordButton: {
    width: "100%",
    height: 60,
    backgroundColor: "white",
    borderRadius: 8,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  Button: {
    width: "100%",
    height: 60,
    borderRadius: 10,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "sans-serif",
    borderWidth: 2,
    borderStyle: "solid",
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    backgroundColor: "white",
  },
  buttonText: {
    fontFamily: "sans-serif",
    fontWeight: "bold",
    fontSize: 16
  },
  checkBoxContainer: {
    width: "100%",
    display: "flex",
    flexDirection: 'row',
    paddingRight: 10,
    gap: 10
  },
  checkBox: {
    borderRadius: 5,
    top: 5,
  },
  checkBoxText: {
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "sans-serif"
  }

});

export default Auth;
