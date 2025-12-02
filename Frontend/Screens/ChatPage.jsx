import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faBars,
  faCirclePlus,
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
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";


function ChatPage() {
  const navigation = useNavigation();
  const route = useRoute();
  const userEmail = route.params?.email || "user@example.com";
  const mode = route.params?.mode || "new"; // "new" or "continue"
  const chatIdFromParams = route.params?.chatId; // only for "continue" mode

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [message, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [inputHeight, setInputHeight] = useState(40);
  const [currentChatId, setCurrentChatId] = useState(chatIdFromParams || Date.now());

  const MAX_HEIGHT = 120;
  const MIN_HEIGHT = 40;

  const scrollViewRef = useRef();

  // load messages if continuing a chat
  useEffect(() => {
    const loadExistingChat = async () => {
      if (mode === "continue" && chatIdFromParams && userEmail) {
        try {
          const key = `chatMessages_${userEmail}_${chatIdFromParams}`;
          const stored = await AsyncStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);
            setMessages(parsed);
          }
        } catch (e) {
          console.log("Error loading existing chat", e);
        }
      }
    };

    loadExistingChat();
  }, [mode, chatIdFromParams, userEmail]);

  useEffect(() => {
    if (message.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [message]);

  const handleContentSizeChange = (event) => {
    const { contentSize } = event.nativeEvent;
    const newHeight = Math.min(
      Math.max(contentSize.height, MIN_HEIGHT),
      MAX_HEIGHT
    );
    setInputHeight(newHeight);
  };

  const saveChatToHistory = async (userEmail, newChat) => {
    try {
      const key = `chatHistory_${userEmail}`;
      const existing = await AsyncStorage.getItem(key);
      const parsed = existing ? JSON.parse(existing) : [];
      const updated = [newChat, ...parsed]; // latest first
      await AsyncStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.log('Error saving chat history', e);
    }
  };

  const saveMessagesForChat = async (userEmail, chatId, messagesArray) => {
    try {
      const key = `chatMessages_${userEmail}_${chatId}`;
      await AsyncStorage.setItem(key, JSON.stringify(messagesArray));
    } catch (e) {
      console.log("Error saving chat messages", e);
    }
  };



  const handleSend = () => {
    if (inputText.trim() === "") return;

    const userMessageId = Date.now();
    const typingId = `typing-${userMessageId}`;

    setMessages((prev) => [
      ...prev,
      { text: inputText, sender: "user", id: userMessageId },
      { text: "Typing...", sender: "bot", id: typingId },
    ]);

    setInputText("");
    setInputHeight(MIN_HEIGHT);

    const thisChatId = currentChatId; // capture

    setTimeout(async () => {
      try {
        const response = await fetch(
          "https://accounts-thru-courses-gods.trycloudflare.com/chat",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: inputText }),
          }
        );

        if (!response.ok) throw new Error("Network response not ok");

        const data = await response.json();

        // 1) Update messages state
        setMessages((prev) => {
          const updated = prev.map((msg) =>
            msg.id === typingId
              ? {
                text: data.text || "No response",
                sender: "bot",
                id: Date.now(),
              }
              : msg
          );

          // 2) Persist full messages for this chat
          saveMessagesForChat(userEmail, thisChatId, updated);
          return updated;
        });

        // 3) Save / update summary in chatHistory
        const newChatSummary = {
          id: thisChatId,
          title: inputText.slice(0, 30) || "New chat",
          date: new Date().toISOString().slice(0, 10),
          preview: (data.text || "No response").slice(0, 50),
        };
        await saveChatToHistory(userEmail, newChatSummary);
        navigation.setParams({ needsRefreshHistory: Date.now() }); // notify drawer to refresh
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Failed to fetch bot response.");
      }
    }, 2000);
  };

  useEffect(() => {
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

    if (message.length === 0 && !isKeyboardOpen) {
      return (
        <View style={styles.content}>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: "https://res.cloudinary.com/dpmroilrh/image/upload/v1758885727/chatbot-removebg-preview_otqsjj.png",
              }}
              style={styles.image}
            />
          </View>
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
          behavior={Platform.OS === "android" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <View style={styles.container}>
            <View style={styles.sidebar}>
              {/* LEFT MENU BUTTON - Opens Drawer */}
              <TouchableOpacity
                style={styles.sidebarButton}
                onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              >
                <FontAwesomeIcon icon={faBars} style={styles.icon} size={20} />
              </TouchableOpacity>

              <Text style={styles.chatTitle}>New Chat</Text>

              <TouchableOpacity
                style={styles.sidebarButton}
                onPress={() => {
                  const newId = Date.now();
                  setMessages([]);
                  setCurrentChatId(newId);
                  navigation.setParams({ ...route.params, mode: "new", chatId: newId });
                }}
              >
                <FontAwesomeIcon icon={faCirclePlus} style={styles.icon} size={20} />
              </TouchableOpacity>

            </View>

            {renderMessageArea()}
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputArea}>
              <TouchableOpacity style={styles.bottomBarButton}>
                <FontAwesomeIcon
                  icon={faCirclePlus}
                  style={styles.bottomBarIcon}
                  size={22}
                />
              </TouchableOpacity>

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

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !inputText.trim() && styles.sendButtonDisabled,
                ]}
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
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

export default ChatPage;

// ... keep all your existing styles


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
