import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';

const HazeContainer = ({ children, color = 'white', opacity = 0.7 }) => {
  return (
    // The outer container determines the size and position
    <View style={styles.container}>
      {/* The Haze Overlay (Absolute) */}
      <View 
        style={[
          styles.absoluteFill, 
          { 
            backgroundColor: color, 
            opacity: opacity 
          }
        ]} 
      />
      
      {/* Content on top */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Define your desired size here
    width: '100%',
    height: '200',
    borderRadius: 10,
    overflow: 'hidden',
  },
  // Essential: The haze layer covers the entire container area
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
  }
});


export default HazeContainer;