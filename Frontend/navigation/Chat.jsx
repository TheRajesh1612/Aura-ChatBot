// import React from "react";
// import { NavigationContainer } from "@react-navigation/native";
// import { createNativeStackNavigator } from "@react-navigation/native-stack";
// import { createDrawerNavigator } from "@react-navigation/drawer";
// import GetStarted from "../Screens/GetStarted";
// import ChatPage from "../Screens/ChatPage";
// import Login from "../Screens/Login";
// import SignUP from "../Screens/SignUP";
// import Auth from "../Screens/Auth";


// const Stack = createNativeStackNavigator();
// const Drawer = createDrawerNavigator();

// function DrawerNavigator() {
//     return (
//         <Drawer.Navigator screenOptions={{ headerShown: false }}>
//             <Drawer.Screen name="ChatPage" component={ChatPage} />
//             <Drawer.Screen name="SignUP" component={SignUP} />
//             <Drawer.Screen name="Login" component={Login} />
//         </Drawer.Navigator>
//     );
// }

// function RootStack() {
//     return (
//         <Stack.Navigator screenOptions={{ headerShown: false }}>
//             <Stack.Screen name="GetStarted" component={GetStarted} />
//             <Stack.Screen name="Auth" component={Auth} />
//             <Stack.Screen name="Drawer" component={DrawerNavigator} />
//         </Stack.Navigator>
//     );
// }

// export default function Chat() {
//     return (
//         <NavigationContainer>
//             <RootStack />
//         </NavigationContainer>
//     );
// }
