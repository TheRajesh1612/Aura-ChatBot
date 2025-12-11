import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faBars,
  faCirclePlus,
  faPaperPlane,
  faCopy,
  faPenToSquare,
  faXmark,
  faRobot,
  faUser,
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
  Modal,
  TouchableWithoutFeedback,
  Animated,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from 'expo-clipboard';
import Markdown from 'react-native-markdown-display';

function ChatPage() {
  const navigation = useNavigation();
  const route = useRoute();
  const userEmail = route.params?.email || "user@example.com";
  const mode = route.params?.mode || "new";
  const chatIdFromParams = route.params?.chatId;

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [message, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [inputHeight, setInputHeight] = useState(40);
  const [currentChatId, setCurrentChatId] = useState(chatIdFromParams || Date.now());
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);

  const MAX_HEIGHT = 120;
  const MIN_HEIGHT = 40;

  const scrollViewRef = useRef();

  // NEW: Improved Markdown styles with better readability
  const markdownStyles = {
    body: {
      color: '#2d3748',
      fontSize: 15,
      lineHeight: 22,
    },
    text: {
      color: '#2d3748',
      fontSize: 14,
      fontWeight: 'small',
      lineHeight: 22,
    },
    paragraph: {
      marginBottom: 8,
    },
    heading1: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#1a202c',
      marginTop: 12,
      marginBottom: 8,
    },
    heading2: {
      fontSize: 19,
      fontWeight: 'bold',
      color: '#1a202c',
      marginTop: 10,
      marginBottom: 6,
    },
    heading3: {
      fontSize: 17,
      fontWeight: '600',
      color: '#2d3748',
      marginTop: 8,
      marginBottom: 5,
    },
    strong: {
      fontWeight: 'bold',
      color: '#1a202c',
    },
    em: {
      fontStyle: 'italic',
      color: '#2d3748',
    },
    bullet_list: {
      marginVertical: 6,
    },
    ordered_list: {
      marginVertical: 6,
    },
    list_item: {
      flexDirection: 'row',
      marginVertical: 3,
    },
    bullet_list_icon: {
      color: '#4a5568',
      fontSize: 14,
      marginRight: 8,
      marginTop: 4,
    },
    ordered_list_icon: {
      color: '#4a5568',
      fontSize: 14,
      marginRight: 8,
    },
    code_inline: {
      backgroundColor: '#edf2f7',
      color: '#d53f8c',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 13,
    },
    code_block: {
      backgroundColor: '#2d3748',
      color: '#f7fafc',
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      borderRadius: 8,
      padding: 12,
      marginVertical: 8,
    },
    fence: {
      backgroundColor: '#2d3748',
      borderRadius: 8,
      padding: 12,
      marginVertical: 8,
    },
    blockquote: {
      backgroundColor: '#f7fafc',
      borderLeftWidth: 4,
      borderLeftColor: '#7e57c2',
      paddingLeft: 12,
      paddingVertical: 8,
      marginVertical: 8,
      borderRadius: 4,
    },
    link: {
      color: '#7e57c2',
      textDecorationLine: 'underline',
    },
    hr: {
      backgroundColor: '#e2e8f0',
      height: 1,
      marginVertical: 12,
    },
    table: {
      borderWidth: 1,
      borderColor: '#e2e8f0',
      marginVertical: 8,
      borderRadius: 6,
    },
    thead: {
      backgroundColor: '#f7fafc',
    },
    th: {
      padding: 8,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      fontWeight: 'bold',
      color: '#2d3748',
    },
    td: {
      padding: 8,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      color: '#2d3748',
    },
  };

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
      const existingIndex = parsed.findIndex(chat => chat.id === newChat.id);

      if (existingIndex !== -1) {
        parsed[existingIndex] = newChat;
      } else {
        parsed.unshift(newChat);
      }

      await AsyncStorage.setItem(key, JSON.stringify(parsed));
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

  const handleLongPress = (msg) => {
    setSelectedMessage(msg);
    setShowActionModal(true);
  };

  const handleCopyMessage = async () => {
    try {
      await Clipboard.setStringAsync(selectedMessage.text);
      setShowActionModal(false);
      Alert.alert("Success", "Message copied to clipboard");
    } catch (error) {
      Alert.alert("Error", "Failed to copy message");
    }
  };

  const handleEditMessage = () => {
    if (selectedMessage.sender !== "user") {
      Alert.alert("Info", "You can only edit your own messages");
      setShowActionModal(false);
      return;
    }

    setInputText(selectedMessage.text);
    setIsEditing(true);
    setEditingMessageId(selectedMessage.id);
    setShowActionModal(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingMessageId(null);
    setInputText("");
    setInputHeight(MIN_HEIGHT);
  };

  // NEW: Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleSend = () => {
    if (inputText.trim() === "") return;

    const thisChatId = currentChatId;
    const timestamp = Date.now();

    if (isEditing) {
      const userMessageId = editingMessageId;
      const typingId = `typing-${Date.now()}`;

      setMessages((prev) => {
        const editIndex = prev.findIndex(msg => msg.id === editingMessageId);
        const updatedMessages = prev.slice(0, editIndex);

        return [
          ...updatedMessages,
          {
            text: inputText,
            sender: "user",
            id: userMessageId,
            timestamp: Date.now(),
            edited: true,
            editedAt: new Date().toISOString()
          },
          { text: "Typing...", sender: "bot", id: typingId, timestamp: Date.now() },
        ];
      });

      const editedText = inputText;
      setInputText("");
      setInputHeight(MIN_HEIGHT);
      setIsEditing(false);
      setEditingMessageId(null);

      setTimeout(async () => {
        try {
          const response = await fetch(
            "https://aura-2kph.onrender.com/chat",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: editedText }),
            }
          );

          if (!response.ok) throw new Error("Network response not ok");

          const data = await response.json();

          setMessages((prev) => {
            const updated = prev.map((msg) =>
              msg.id === typingId
                ? {
                  text: data.text || "No response",
                  sender: "bot",
                  id: Date.now(),
                  timestamp: Date.now(),
                }
                : msg
            );

            saveMessagesForChat(userEmail, thisChatId, updated);
            return updated;
          });

          const newChatSummary = {
            id: thisChatId,
            title: editedText.slice(0, 30) || "New chat",
            date: new Date().toISOString().slice(0, 10),
            preview: (data.text || "No response").slice(0, 50),
          };
          await saveChatToHistory(userEmail, newChatSummary);
          navigation.setParams({ needsRefreshHistory: Date.now() });
        } catch (error) {
          console.error(error);
          Alert.alert("Error", "Failed to fetch bot response.");
        }
      }, 2000);

    } else {
      const userMessageId = Date.now();
      const typingId = `typing-${userMessageId}`;

      setMessages((prev) => [
        ...prev,
        { text: inputText, sender: "user", id: userMessageId, timestamp },
        { text: "Typing...", sender: "bot", id: typingId, timestamp: Date.now() },
      ]);

      const messageText = inputText;
      setInputText("");
      setInputHeight(MIN_HEIGHT);

      setTimeout(async () => {
        try {
          const response = await fetch(
            "https://aura-2kph.onrender.com/chat",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: messageText }),
            }
          );

          if (!response.ok) throw new Error("Network response not ok");

          const data = await response.json();

          setMessages((prev) => {
            const updated = prev.map((msg) =>
              msg.id === typingId
                ? {
                  text: data.text || "No response",
                  sender: "bot",
                  id: Date.now(),
                  timestamp: Date.now(),
                }
                : msg
            );

            saveMessagesForChat(userEmail, thisChatId, updated);
            return updated;
          });

          const newChatSummary = {
            id: thisChatId,
            title: messageText.slice(0, 30) || "New chat",
            date: new Date().toISOString().slice(0, 10),
            preview: (data.text || "No response").slice(0, 50),
          };
          await saveChatToHistory(userEmail, newChatSummary);
          navigation.setParams({ needsRefreshHistory: Date.now() });
        } catch (error) {
          console.error(error);
          Alert.alert("Error", "Failed to fetch bot response.");
        }
      }, 2000);
    }
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

  // NEW: Typing indicator component
  const TypingIndicator = () => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const animate = (dot, delay) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        ).start();
      };

      animate(dot1, 0);
      animate(dot2, 200);
      animate(dot3, 400);
    }, []);

    return (
      <View style={styles.typingContainer}>
        <Animated.View
          style={[
            styles.typingDot,
            {
              opacity: dot1,
              transform: [
                {
                  translateY: dot1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -4],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.typingDot,
            {
              opacity: dot2,
              transform: [
                {
                  translateY: dot2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -4],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.typingDot,
            {
              opacity: dot3,
              transform: [
                {
                  translateY: dot3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -4],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
    );
  };

  // NEW: Improved Message component with avatars and timestamps
  const Message = ({ message }) => {
    const isUser = message.sender === "user";
    const isBot = message.sender === "bot";
    const isTyping = message.text === "Typing...";

    return (
      <View
        style={[
          styles.messageWrapper,
          isUser ? styles.userMessageWrapper : styles.botMessageWrapper,
        ]}
      >
        {/* Bot Avatar (left, inline) */}
        {isBot && (
          <View style={styles.avatarContainer}>
            <View style={styles.botAvatar}>
              <FontAwesomeIcon icon={faRobot} size={18} color="#7e57c2" />
            </View>
          </View>
        )}

        {/* User Avatar (floating above, right) */}
        {isUser && (
          <View style={styles.userAvatarFloating}>
            <View style={styles.userAvatar}>
              <FontAwesomeIcon icon={faUser} size={16} color="white" />
            </View>
          </View>
        )}

        <TouchableOpacity
          onLongPress={() => !isTyping && handleLongPress(message)}
          activeOpacity={0.8}
          style={[
            styles.messageContent,
            isUser ? styles.userMessageContent : styles.botMessageContent,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isUser && styles.userMessageBubble,
              isBot && (isTyping ? styles.botTypingBubble : styles.botMessageBubble),
            ]}
          >
            {isTyping ? (
              <TypingIndicator />
            ) : isBot ? (
              <Markdown style={markdownStyles}>{message.text}</Markdown>
            ) : (
              <Text style={styles.userMessageText}>{message.text}</Text>
            )}

            {message.edited && !isTyping && (
              <Text style={[styles.editedIndicator, isUser && styles.editedIndicatorUser]}>
                Edited
              </Text>
            )}
          </View>


          {/* Timestamp */}
          {!isTyping && message.timestamp && (
            <Text style={[styles.timestamp, isUser && styles.timestampUser]}>
              {formatTime(message.timestamp)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };


  const ActionModal = () => (
    <Modal
      transparent={true}
      visible={showActionModal}
      animationType="fade"
      onRequestClose={() => setShowActionModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowActionModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Message Options</Text>

              <TouchableOpacity
                style={styles.modalOption}
                onPress={handleCopyMessage}
              >
                <FontAwesomeIcon icon={faCopy} size={20} color="#7e57c2" />
                <Text style={styles.modalOptionText}>Copy Message</Text>
              </TouchableOpacity>

              {selectedMessage?.sender === "user" && (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={handleEditMessage}
                >
                  <FontAwesomeIcon icon={faPenToSquare} size={20} color="#7e57c2" />
                  <Text style={styles.modalOptionText}>Edit Message</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.modalOption, styles.modalCancelOption]}
                onPress={() => setShowActionModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderMessageArea = () => {
    if (message.length > 0) {
      return (
        <View style={styles.messageAreaContainer}>
          <FlatList
            data={message}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <Message message={item} />}
            ref={scrollViewRef}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            contentContainerStyle={styles.messageListContent}
            showsVerticalScrollIndicator={false}
            contentInset={{ top: 70 }} // For iOS - space for floating header
            contentOffset={{ x: 0, y: -70 }} // For iOS - start below header
          />

          {/* Top fade gradient */}
          <LinearGradient
            colors={['rgba(219, 207, 255, 1)', 'rgba(219, 207, 255, 0.9)', 'rgba(219, 207, 255, 0.6)', 'transparent']}
            style={styles.topFadeOverlay}
            pointerEvents="none"
          />

          {/* Bottom fade gradient */}
          <LinearGradient
            colors={[
              'transparent',
              'rgba(219, 207, 255, 0.3)',
              'rgba(219, 207, 255, 0.6)',
              'rgba(219, 207, 255, 0.85)',
              'rgba(219, 207, 255, 1)'
            ]}
            style={styles.bottomFadeOverlay}
            pointerEvents="none"
          />
        </View>
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
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <View style={styles.container}>
            {/* Floating Sidebar */}
            <View style={styles.floatingSidebar}>
              <TouchableOpacity
                style={styles.sidebarButton}
                onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              >
                <FontAwesomeIcon icon={faBars} style={styles.icon} size={20} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sidebarButton}
                onPress={() => {
                  const newId = Date.now();
                  setMessages([]);
                  setCurrentChatId(newId);
                  setIsEditing(false);
                  setEditingMessageId(null);
                  setInputText("");
                  navigation.setParams({ ...route.params, mode: "new", chatId: newId });
                }}
              >
                <FontAwesomeIcon icon={faCirclePlus} style={styles.icon} size={20} />
              </TouchableOpacity>
            </View>

            {renderMessageArea()}
          </View>

          {/* Floating Input Container - MOVED OUTSIDE MAIN CONTAINER */}
          <View style={styles.floatingInputContainer}>
            {isEditing && (
              <View style={styles.editModeBar}>
                <View style={styles.editModeInfo}>
                  <FontAwesomeIcon icon={faPenToSquare} size={16} color="#7e57c2" />
                  <Text style={styles.editModeText}>Editing message</Text>
                </View>
                <TouchableOpacity onPress={handleCancelEdit}>
                  <FontAwesomeIcon icon={faXmark} size={20} color="#666" />
                </TouchableOpacity>
              </View>
            )}

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
                placeholder={isEditing ? "Edit your message..." : "Ask me anything?"}
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

      <ActionModal />
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
    // paddingTop: 30,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingBottom: 0,
    justifyContent: "flex-start",
    position: "relative"
  },
  floatingSidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    zIndex: 1000,
    backgroundColor: 'transparent',
  },
  messageAreaContainer: {
    flex: 1,
    position: 'relative',
    top: 0,
    left: 0,
    right: 0
  },
  messageListContent: {
    paddingTop: 80, // Space for floating header (70px header + 10px padding)
    paddingBottom: 100,
    paddingHorizontal: 0,
  },
  topFadeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60, // Increased for better fade effect
    zIndex: 999,
    pointerEvents: 'none',
  },

  bottomFadeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100, // Increased to cover input area
    zIndex: 999,
    pointerEvents: 'none',
  },
  chatTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#222",
  },
  sidebarButton: {
    backgroundColor: "#f6f4f8e6",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ffffff",
    borderRadius: 14,
  },
  icon: {
    color: "#4a148c",
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 30,
    // paddingBottom: 40,
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
  floatingInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    zIndex: 1000,
    backgroundColor: 'transparent',
  },
  inputArea: {
    backgroundColor: "#fff",
    alignItems: "flex-end",
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 28,
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    outlineStyle: "none",
  },
  input: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 120,
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
  },
  sendButtonDisabled: {
    backgroundColor: "#7e57c280",
  },
  bottomBarButton: {
    padding: 8,
    marginRight: 4,
    marginBottom: 2,
  },
  bottomBarIcon: {
    color: "#7e57c2",
  },
  messageScrollView: {
    flex: 1,
    paddingTop: 10,
  },
  messageList: {
    paddingHorizontal: 0,
    margin: 0,
    paddingBottom: 20,
  },
  // NEW: Message wrapper with avatar layout
  messageWrapper: {
    marginVertical: 6,
    paddingHorizontal: 16,
  },
  userMessageWrapper: {
    alignItems: "flex-end",
    position: "relative",  // 👈 so user avatar can float inside
    paddingTop: 28,
  },
  botMessageWrapper: {
    justifyContent: "flex-start",
  },
  // NEW: Avatar styles
  avatarContainer: {
    // marginHorizontal: 5,
    marginBottom: 4,
  },
  botAvatar: {
    width: 25,
    height: 25,
    borderRadius: 16,
    backgroundColor: "#f0e6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatarFloating: {
    position: "absolute",
    top: -5,
    right: 16,             // match horizontal padding
  },
  userAvatar: {
    alignSelf: "flex-end",
    width: 25,
    height: 25,
    borderRadius: 16,
    backgroundColor: "#7e57c2",
    justifyContent: "center",
    alignItems: "center",
  },
  // NEW: Message content wrapper
  messageContent: {
    flex: 1,
  },
  userMessageContent: {
    width: '100%',
    alignItems: "flex-end",
  },
  botMessageContent: {
    alignItems: "flex-start",
    alignSelf: 'stretch',
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: "80%",
  },
  userMessageBubble: {
    backgroundColor: "#7e57c2",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  botTypingBubble: {
    backgroundColor: "#f0e6ff5e",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    // ❌ no width: "100%" here
    // uses messageBubble maxWidth or natural content width
  },

  botMessageBubble: {
    backgroundColor: "#f0e6ff3c",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    width: '100%',
    maxWidth: '100%',
    borderColor: "#eaeaeaff",
    borderWidth: 1.5,
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  userMessageText: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "small",
  },
  editedIndicator: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
    fontStyle: "italic",
  },
  editedIndicatorUser: {
    color: "#ddd",
  },
  timestamp: {
    fontSize: 11,
    color: "#999",
    marginTop: 3,
  },
  timestampUser: {
    color: "#b39ddb",
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#7e57c2",
  },
  editModeBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff3e0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#ff9800",
  },
  editModeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editModeText: {
    color: "#e65100",
    fontWeight: "600",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    width: "80%",
    maxWidth: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalOptionText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 12,
    fontWeight: "500",
  },
  modalCancelOption: {
    marginTop: 4,
  },
  modalCancelText: {
    fontSize: 14,
    color: "#e53935",
    fontWeight: "500",
  },
});