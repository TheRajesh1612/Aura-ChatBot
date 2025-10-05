import { registerRootComponent } from 'expo';

import App from './Screens/ChatPage';
import GetStarted from './Screens/GetStarted';
import Chat from './Screens/GetStarted';


// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(Chat);
