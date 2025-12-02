// CustomDrawer.js
import React, { useState, useEffect, useCallback, use } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faMessage,
  faRightFromBracket,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CustomDrawer = (props) => {
  // Correct prop handling
  const { navigation, state } = props;

  const [chatHistory, setChatHistory] = useState([]);
  const [userEmail, setUserEmail] = useState("user@example.com"); // fallback

  // helper: extract email from drawer/navigation state safely
  const extractParamsFromState = (drawerState) => {
    try {
      const activeDrawerRoute = drawerState?.routes?.[drawerState.index];

      const nestedState = activeDrawerRoute?.state;
      const nestedActiveRoute = nestedState?.routes?.[nestedState?.index ?? 0];

      const email =
        activeDrawerRoute?.params?.email ||
        nestedActiveRoute?.params?.email ||
        nestedActiveRoute?.state?.routes?.[
          nestedActiveRoute?.state?.index ?? 0
        ]?.params?.email ||
        null;

      const needsRefreshHistory =
        activeDrawerRoute?.params?.needsRefreshHistory ||
        nestedActiveRoute?.params?.needsRefreshHistory ||
        nestedActiveRoute?.state?.routes?.[
          nestedActiveRoute?.state?.index ?? 0
        ]?.params?.needsRefreshHistory ||
        null;

      return { email, needsRefreshHistory };
    } catch (e) {
      console.warn("extractParamsFromState error:", e);
      return { email: null, needsRefreshHistory: null };
    }
  };



  // Load chat history once (you had this before)
  useEffect(() => {
    loadChatHistory();
  }, []);

  // Update userEmail whenever drawer state changes (or on mount)
  useEffect(() => {
    const { email, needsRefreshHistory } = extractParamsFromState(state);

    if (email && email !== userEmail) {
      setUserEmail(email);
    }

    if (needsRefreshHistory) {
      // whenever this changes, reload history
      if (userEmail && userEmail !== "user@example.com") {
        loadChatHistory();
      }
    }
  }, [state]);

  useEffect(() => {
    if (userEmail && userEmail !== "user@example.com") {
      loadChatHistory();
    }
  }, [userEmail]);

  const loadChatHistory = async () => {
    try {
      const key = `chatHistory_${userEmail}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        setChatHistory(JSON.parse(stored));
      } else {
        setChatHistory([]);
      }
    } catch (e) {
      console.log("Error loading chat history", e);
      setChatHistory([]);
    }
  };


  const handleChatSelect = (chatId) => {
    console.log("Selected chat:", chatId);
    navigation.closeDrawer();

    navigation.navigate("ChatPage", {
      email: userEmail,
      mode: "continue",
      chatId: chatId,
    });
  };


  const handleLogout = () => {
    navigation.closeDrawer();
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          onPress: async () => {
            try {
              // TODO: Call your logout API if needed
              await fetch("https://accounts-thru-courses-gods.trycloudflare.com/api/users/logout", {
                method: "POST",
                credentials: "include", // include cookies if using sessions
              });
              // Reset navigation stack to Auth screen only
              navigation.reset({
                index: 0,
                routes: [{ name: "Auth" }],
              });
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Failed to logout", [{ style: "destructive" }], { cancelable: true });
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <LinearGradient
      colors={["#c2b8dfdf", "#DBCFFF", "#a176ff80", "#e0d4ff80"]}
      style={styles.drawerContainer}
    >
      <View style={styles.drawerContent}>
        {/* Header */}
        <View style={styles.drawerHeader}>
          <Text style={styles.drawerTitle}>Chat History</Text>
        </View>

        {/* Chat History List */}
        <ScrollView style={styles.chatList} showsVerticalScrollIndicator={false}>
          {chatHistory.length > 0 ? (
            chatHistory.map((chat) => (
              <TouchableOpacity
                key={chat.id}
                style={styles.chatItem}
                onPress={() => handleChatSelect(chat.id)}
              >
                <View style={styles.chatItemIcon}>
                  <FontAwesomeIcon icon={faMessage} size={16} color="#7e57c2" />
                </View>
                <View style={styles.chatItemContent}>
                  <Text style={styles.chatItemTitle} numberOfLines={1}>
                    {chat.title}
                  </Text>
                  <Text style={styles.chatItemPreview} numberOfLines={1}>
                    {chat.preview}
                  </Text>
                  <Text style={styles.chatItemDate}>{chat.date}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No chat history yet</Text>
            </View>
          )}
        </ScrollView>

        {/* User Info & Logout Section */}
        <View style={styles.userSection}>
          {/* User Email */}
          <View style={styles.userInfo}>
            <View style={styles.userIconContainer}>
              <FontAwesomeIcon icon={faUser} size={20} color="#7e57c2" />
            </View>
            <Text style={styles.userEmail} numberOfLines={1}>
              {userEmail}
            </Text>
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LinearGradient
              colors={["#ff6b6b", "#ee5a6f"]}
              start={[0, 0]}
              end={[1, 1]}
              style={styles.logoutGradient}
            >
              <FontAwesomeIcon icon={faRightFromBracket} size={18} color="white" />
              <Text style={styles.logoutText}>Logout</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  drawerContainer: { flex: 1 },
  drawerContent: { flex: 1, paddingTop: 60 },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ffffff40",
  },
  drawerTitle: { fontSize: 24, fontWeight: "bold", color: "#4a148c" },
  chatList: { flex: 1, paddingHorizontal: 10, paddingTop: 10 },
  chatItem: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chatItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0e6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  chatItemContent: { flex: 1 },
  chatItemTitle: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 4 },
  chatItemPreview: { fontSize: 14, color: "#666", marginBottom: 4 },
  chatItemDate: { fontSize: 12, color: "#999" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 },
  emptyStateText: { fontSize: 16, color: "#666" },
  userSection: { borderTopWidth: 1, borderTopColor: "#ffffff40", padding: 20, paddingBottom: 30 },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0e6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userEmail: { fontSize: 16, fontWeight: "500", color: "#333", flex: 1 },
  logoutButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  logoutGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, gap: 10 },
  logoutText: { color: "white", fontSize: 16, fontWeight: "bold" },
});

export default CustomDrawer;
