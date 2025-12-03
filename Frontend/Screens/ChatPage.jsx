import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faBars,
  faCirclePlus,
  faPaperPlane,
  faCopy,
  faPenToSquare,
  faXmark,
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { DrawerActions } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from 'expo-clipboard';
import Markdown from 'react-native-markdown-display'; // NEW: Install with: npm install react-native-markdown-display

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

  // NEW: Markdown styles for bot messages
  const markdownStyles = {
    body: {
      color: 'white',
      fontSize: 16,
      lineHeight: 24,
    },
    heading1: {
      fontSize: 24,
      fontWeight: 'bold',
      color: 'white',
      marginTop: 10,
      marginBottom: 8,
    },
    heading2: {
      fontSize: 20,
      fontWeight: 'bold',
      color: 'white',
      marginTop: 8,
      marginBottom: 6,
    },
    heading3: {
      fontSize: 18,
      fontWeight: '600',
      color: 'white',
      marginTop: 6,
      marginBottom: 4,
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 10,
      color: 'white',
      lineHeight: 22,
    },
    strong: {
      fontWeight: 'bold',
      color: 'white',
    },
    em: {
      fontStyle: 'italic',
      color: 'white',
    },
    bullet_list: {
      marginVertical: 8,
    },
    ordered_list: {
      marginVertical: 8,
    },
    list_item: {
      flexDirection: 'row',
      marginVertical: 4,
    },
    bullet_list_icon: {
      color: 'white',
      fontSize: 16,
      marginRight: 8,
    },
    ordered_list_icon: {
      color: 'white',
      fontSize: 16,
      marginRight: 8,
    },
    code_inline: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      color: '#ffeb3b',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
      fontSize: 14,
    },
    code_block: {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderRadius: 8,
      padding: 12,
      marginVertical: 8,
      borderLeftWidth: 3,
      borderLeftColor: '#ffeb3b',
    },
    fence: {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderRadius: 8,
      padding: 12,
      marginVertical: 8,
      borderLeftWidth: 3,
      borderLeftColor: '#ffeb3b',
    },
    blockquote: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderLeftWidth: 4,
      borderLeftColor: '#ffeb3b',
      paddingLeft: 12,
      paddingVertical: 8,
      marginVertical: 8,
    },
    link: {
      color: '#ffeb3b',
      textDecorationLine: 'underline',
    },
    hr: {
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      height: 1,
      marginVertical: 12,
    },
    table: {
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      marginVertical: 8,
      borderRadius: 4,
    },
    thead: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    th: {
      padding: 8,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      fontWeight: 'bold',
    },
    td: {
      padding: 8,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
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

  const handleSend = () => {
    if (inputText.trim() === "") return;

    const thisChatId = currentChatId;

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
            edited: true,
            editedAt: new Date().toISOString()
          },
          { text: "Typing...", sender: "bot", id: typingId },
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
            "https://being-def-bolt-explained.trycloudflare.com/chat",
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
        { text: inputText, sender: "user", id: userMessageId },
        { text: "Typing...", sender: "bot", id: typingId },
      ]);

      const messageText = inputText;
      setInputText("");
      setInputHeight(MIN_HEIGHT);

      setTimeout(async () => {
        try {
          const response = await fetch(
            "https://being-def-bolt-explained.trycloudflare.com/chat",
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

  // UPDATED: Message component with markdown support
  const Message = ({ message }) => {
    const isUser = message.sender === "user";
    const isBot = message.sender === "bot";
    
    return (
      <TouchableOpacity
        onLongPress={() => handleLongPress(message)}
        activeOpacity={0.8}
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
          {/* Render bot messages with Markdown, user messages as plain text */}
          {isBot ? (
            <Markdown style={markdownStyles}>
              {message.text}
            </Markdown>
          ) : (
            <Text style={styles.userMessageText}>
              {message.text}
            </Text>
          )}
          
          {message.edited && (
            <Text style={styles.editedIndicator}>Edited</Text>
          )}
        </View>
      </TouchableOpacity>
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
        <ScrollView
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          ref={scrollViewRef}
          style={styles.messageScrollView}
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
        >
          {message.map((msg) => {
            return <Message key={msg.id} message={msg} />;
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
              <TouchableOpacity
                style={styles.sidebarButton}
                onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              >
                <FontAwesomeIcon icon={faBars} style={styles.icon} size={20} />
              </TouchableOpacity>

              <Text style={styles.chatTitle}>
                {isEditing ? "Editing Message" : "New Chat"}
              </Text>

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

          <View style={styles.inputContainer}>
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
    paddingTop: 60,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 0,
    justifyContent: "flex-start",
  },
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
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
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
  editedIndicator: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 11,
    fontStyle: "italic",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "80%",
    maxWidth: 350,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    marginBottom: 10,
  },
  modalOptionText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 15,
    fontWeight: "500",
  },
  modalCancelOption: {
    backgroundColor: "#ffebee",
    justifyContent: "center",
    marginTop: 5,
  },
  modalCancelText: {
    fontSize: 16,
    color: "#ff6b6b",
    fontWeight: "600",
    textAlign: "center",
  },
  editModeBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0e6ff",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  editModeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editModeText: {
    fontSize: 14,
    color: "#7e57c2",
    fontWeight: "500",
  },
});