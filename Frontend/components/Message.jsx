import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

const Message = ({ message }) => {
    const isUser = Message.role === 'user';
    return (
        <View style={[
            styles.messageRow,
            isUser ? styles.useMessageRow : styles.botMessageRow,
        ]}>
            <View style={[
                styles.messageBubble,
                isUser ? styles.userMessageBubble : styles.botMessageBubble,
            ]}>
                <Text style={[
                    isUser ? styles.userMessageText : styles.botMessageText,
                ]}>{message.text}</Text>

            </View>

        </View>
    )
}

const styles = StyleSheet.create({
    messageRow: {
        flexDirection: 'row',
        marginVertical: 4,
        maxWidth: '85%',
    },
});

export default Message