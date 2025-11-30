import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faBars, // Used for the left menu icon
  faCirclePlus, // Used for the top right icon and the bottom left button
  faMicrophone,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard, // Import Keyboard
  KeyboardAvoidingView, // Import KeyboardAvoidingView
  Platform,
  ScrollView,
  Alert, // Import Platform
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NavigationContainer, DrawerActions } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Login from "./Login";
import SignUP from "./SignUP";
import Chat from "./GetStarted";

const Drawer = createDrawerNavigator();


function ChatPage() {

  const navigation = useNavigation();

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [message, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [inputHeight, setInputHeight] = useState(40);

  const MAX_HEIGHT = 120; //max height for the input box
  const MIN_HEIGHT = 40; //min height for the input box


  const scrollViewRef = useRef();


  // Scroll to bottom when a new message is added
  useEffect(() => {
    if (message.length > 0) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [message]);

  // Message Sending Logic
  // const handleSend = () => {
  //   if (inputText.trim() === "") {
  //     return;
  //   }

  //   // Add user message immediately
  //   const sendMessage = async () => {

  //     const userMessageId = Date.now();
  //     const typingMessageId = `typing-${Date.now()}`;

  //     setMessages((prevMessage) => [
  //       ...prevMessage,
  //       {
  //         text: inputText,
  //         sender: "user",
  //         id: userMessageId,
  //       },
  //       { text: "Typing...", sender: "bot", id: typingMessageId }
  //     ]);

  //     // Generate the response from the bot with some delay
  //     setTimeout(async () => {
  //       try {
  //         const response = await fetch(
  //           "https://alleged-sporting-staff-villages.trycloudflare.com/chat",
  //           {
  //             method: "POST",
  //             headers: {
  //               "Content-Type": "application/json",
  //             },
  //             body: JSON.stringify({
  //               message: inputText,
  //             }),
  //           }
  //         );

  //         if (!response.ok) {
  //           throw new Error("Network response was not ok");
  //         }

  //         const data = await response.json();

  //         console.log(data);
  //         if (data && data.text) {
  //           const botMessage = {
  //             text: data.text,
  //             sender: "bot",
  //             id: Date.now(),
  //           };
  //           setMessages((prevMessage) => prevMessage.map(msg => msg.id === botMessage.id ? botMessage : msg));
  //         } else {
  //           setMessages((prevMessage) =>
  //             prevMessage.map(msg => msg.id === typingMessageId ?
  //               { text: "No response from sever.", sender: "bot", id: Date.now() } : msg)
  //           );
  //           Alert.alert("Error", "No response from the server.", [
  //             { text: "OK", onPress: () => console.log("OK Pressed") },
  //           ]);
  //         }

  //       } catch (error) {
  //         console.log(error.message);
  //         console.error(error);
  //       }
  //     }, 2000); // Delay for 2 seconds
  //   };
  //   sendMessage();
  //   setInputText("");
  // };

  const handleContentSizeChange = (event) => {
    const { contentSize } = event.nativeEvent;
    const newHeight = Math.min(Math.max(contentSize.height, MIN_HEIGHT), MAX_HEIGHT);
    setInputHeight(newHeight);
  }

  const handleSend = () => {
    if (inputText.trim() === "") return;

    const typingId = `typing-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      { text: inputText, sender: "user", id: Date.now() },
      { text: "Typing...", sender: "bot", id: typingId }
    ]);

    setInputText("");
    setInputHeight(MIN_HEIGHT);


    setTimeout(async () => {
      try {
        const response = await fetch(
          "https://fun-qualifications-successful-basename.trycloudflare.com/chat",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: inputText })
          }
        );

        if (!response.ok) throw new Error("Network response not ok");

        const data = await response.json();
        console.log(data);


        setMessages(prev =>
          prev.map(msg =>
            msg.id === typingId ? { text: data.text || "No response", sender: "bot", id: Date.now() } : msg
          )
        );
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Failed to fetch bot response.");
      }
    }, 2000);
  };


  // Keyboard Listeners to manage content visibility
  useEffect(() => {
    // Use 'keyboardWillShow'/'keyboardWillHide' for smoother iOS transition
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardDidShowListener = Keyboard.addListener(showEvent, () => {
      setIsKeyboardOpen(true);
    });
    const keyboardDidHideListener = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardOpen(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const Message = ({ message }) => {
    const isUser = message.sender === "user";
    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.userMessageRow : styles.botMessageRow,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userMessageBubble : styles.botMessageBubble,
          ]}
        >
          <Text
            style={[isUser ? styles.userMessageText : styles.botMessageText]}
          >
            {message.text}
          </Text>
        </View>
      </View>
    );
  };
  // Conditional Rendering for Main Content Area
  const renderMessageArea = () => {
    if (message.length > 0) {
      return (
        <ScrollView
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          ref={scrollViewRef}
          style={styles.messageScrollView}
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
        >
          {message.map((message) => {
            return <Message key={message.id} message={message} />;
          })}
          <View style={{ height: 30 }} />
        </ScrollView>
      );
    }

    // Conditional rendering for the bot's greeting/image area

    // Hide the image and greeting text when the keyboard is open
    if (message.length === 0 && !isKeyboardOpen) {
      return (
        <View style={styles.content}>
          {/* Bot Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: "https://res.cloudinary.com/dpmroilrh/image/upload/v1758885727/chatbot-removebg-preview_otqsjj.png",
              }}
              style={styles.image}
            />
          </View>
          {/* Bot Greeting Text - Changed to "Fisca" */}
          <View style={styles.textContent}>
            <Text style={styles.text1}>Hi, I'm Aura</Text>
            <Text style={styles.text2}>How can I help you today?</Text>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.rootView}>
      <LinearGradient
        colors={[
          "#c2b8dfdf",
          "#DBCFFF",
          "#a176ff80",
          "#e0d8f0e1",
          "#DBCFFF",
          "#a176ff8c",
          "#dad1edff",
        ]}
        style={styles.gradientContainer}
      >

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          // Use 'padding' for iOS and 'height' for Android to handle keyboard shift
          behavior={Platform.OS === "android" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <View style={styles.container}>
            {/* Top container (Sidebar) - Remains visible */}
            <View style={styles.sidebar}>
              {/* Left Menu Button */}
              <TouchableOpacity style={styles.sidebarButton}>
                {/* onPress={() => navigation.dispatch(DrawerActions.openDrawer())} */}
                <FontAwesomeIcon icon={faBars} style={styles.icon} size={20} />
              </TouchableOpacity>

              <Text style={styles.chatTitle}>New Chat</Text>

              {/* Right New Chat Button */}
              <TouchableOpacity style={styles.sidebarButton}>
                <FontAwesomeIcon
                  icon={faCirclePlus}
                  style={styles.icon}
                  size={20}
                />
              </TouchableOpacity>
            </View>

            {/* Conditionally rendered Greeting Content */}
            {renderMessageArea()}
          </View>

          {/* Input container (Frosted Glass Effect at bottom) 
                This view is now positioned relative to the KAV and will move up
            */}
          <View style={styles.inputContainer}>
            {/* Input Area (Text input and internal Send button) */}
            <View style={styles.inputArea}>

              {/* Plus Button */}
              <TouchableOpacity style={styles.bottomBarButton}>
                <FontAwesomeIcon
                  icon={faCirclePlus}
                  style={styles.bottomBarIcon}
                  size={22}
                />
              </TouchableOpacity>

              {/* Text Input Area*/}
              <TextInput
                style={[styles.input, { height: inputHeight }]}
                placeholder="Ask me anything?"
                placeholderTextColor="#555"
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
                multiline
                scrollEnabled={inputHeight >= MAX_HEIGHT}
                onContentSizeChange={handleContentSizeChange}
              />
              {/* Send Button (Purple arrow inside the box) */}
              <TouchableOpacity
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!inputText.trim()}
              >
                <FontAwesomeIcon
                  icon={faPaperPlane}
                  style={{ color: "white" }}
                  size={20}
                />
              </TouchableOpacity>
            </View>

            {/* Utility Input Buttons (+ and Mic buttons below the input) */}
            {/* {!isKeyboardOpen && (
              <View style={styles.inputButtons}>


                <TouchableOpacity style={styles.bottomBarButton}>
                  <FontAwesomeIcon
                    icon={faMicrophone}
                    style={styles.bottomBarIcon}
                    size={22}
                  />
                </TouchableOpacity>
              </View>
            )} */}
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

export default ChatPage;


const styles = StyleSheet.create({
  rootView: {
    flex: 1,
  },
  gradientContainer: {
    width: "100%",
    height: "100%",
    flex: 1,
    paddingTop: 60, // Space for status bar/notch
  },
  keyboardAvoidingView: {
    flex: 1, // Ensure the KAV takes up all space
  },
  container: {
    flex: 1, // Main content area (takes up all remaining space)
    paddingHorizontal: 20,
    paddingBottom: 0,
    justifyContent: "flex-start", // Start content from the top
  },
  // Top Navigation Bar
  sidebar: {
    width: "100%",
    height: 60,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  chatTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#222",
  },
  sidebarButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ffffff",
    // backgroundColor: "#ffffff80",
    borderRadius: 14,
  },
  icon: {
    color: "#4a148c",
  },

  // Main Content Area (Bot & Text) - Only visible when keyboard is closed
  content: {
    flex: 1, // Allows it to take up available space when visible
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 30,
    paddingBottom: 40,
  },
  imageContainer: {
    width: 200,
    height: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 10,
    borderColor: "#ffffffc0",
    borderRadius: 100,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  textContent: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  text1: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a0847",
    textShadowColor: "rgba(255, 255, 255, 0.7)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  text2: {
    fontSize: 16,
    fontWeight: "400",
    color: "#333",
  },

  // Input Container (Frosted Bottom Bar) - No longer absolute
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    // paddingBottom: 40,
    // backgroundColor: "#ffffff40",
    // display: "flex",
    // flexDirection: "column",
    // justifyContent: "space-between",
    // alignItems: "center",
    // borderTopColor: "#ffffffe0",
    // borderLeftColor: "#ffffffe0",
    // borderBottomWidth: 0,
    // borderWidth: 2,
    // borderStyle: "solid",
    // width: "100%",
    // paddingHorizontal: 20,
    // // paddingTop: 20,
    // padding: 10,
    // bottom: -10,
    // borderRadius: 40,
    // gap: 15,
  },
  // Main Text Input Area
  inputArea: {
    backgroundColor: "white",
    alignItems: "flex-end",
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#e5e5ea",
    // width: "100%",
    // height: 55,
    // display: "flex",
    // justifyContent: "space-between",

  },
  input: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 120,
    // height: "100%",
    // fontWeight: "400",
    // fontSize: 16,
    // // paddingRight: 10,
    // paddingVertical: 6
  },
  sendButton: {
    backgroundColor: "#7e57c2",
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    marginBottom: 2,
    // display: "flex",
    // padding: 10,
  },
  sendButtonDisabled: {
    backgroundColor: "#7e57c280",
  },
  // Utility Buttons below the input
  inputButtons: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  bottomBarButton: {
    padding: 8,
    marginRight: 4,
    marginBottom: 2,
    // backgroundColor: "#ffffff60",
    // borderWidth: 1,
    // borderColor: "#ffffff",
    // borderRadius: 12,
  },
  bottomBarIcon: {
    color: "#7e57c2",
  },
  messageScrollView: {
    flex: 1,
    paddingTop: 10,
    borderWidth: 0,
  },
  messageList: {
    paddingHorizontal: 5,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: "row",
    marginVertical: 4,
    maxWidth: "85%",
  },
  userMessageRow: {
    justifyContent: "flex-end",
    alignSelf: "flex-end",
  },
  botMessageRow: {
    justifyContent: "flex-start",
    alignSelf: "flex-start",
  },
  messageBubble: {
    backgroundColor: "#7e57c2",
    paddingHorizontal: 20,
    paddingVertical: 15,
    maxWidth: "85%",
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexShrink: 1,
    justifyContent: "center",
  },
  userMessageBubble: {
    backgroundColor: "#7e57c2",
    borderBottomRightRadius: 5,
  },
  botMessageBubble: {
    backgroundColor: "#7e57c2",
    borderTopLeftRadius: 5,
    paddingHorizontal: 18,
    paddingVertical: 10,
    maxWidth: "85%",
  },
  userMessageText: {
    color: "white",
    flexShrink: 1,
    flexWrap: "wrap",
    fontSize: 16,
    lineHeight: 20,
    textAlignVertical: "center",
  },
  botMessageText: {
    color: "white",
    flexShrink: 1,
    flexWrap: "wrap",
    fontSize: 16,
    lineHeight: 20,
    textAlignVertical: "center",
  },
});
