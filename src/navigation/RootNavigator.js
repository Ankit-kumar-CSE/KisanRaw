import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { farmer as C, helpline } from '../theme/colors';
import { useLang } from '../i18n';
import { useStore } from '../store/AppStore';
import { PulseDot } from '../components/ui';
import logo from '../logo.png';

import SplashScreen from '../screens/auth/SplashScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import OtpScreen from '../screens/auth/OtpScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import HomeScreen from '../screens/home/HomeScreen';
import CentreListScreen from '../screens/booking/CentreListScreen';
import CentreDetailsScreen from '../screens/booking/CentreDetailsScreen';
import BookingFlowScreen from '../screens/booking/BookingFlowScreen';
import BookingSuccessScreen from '../screens/booking/BookingSuccessScreen';
import BookingPassScreen from '../screens/booking/BookingPassScreen';
import MyBookingsScreen from '../screens/booking/MyBookingsScreen';
import LiveQueueScreen from '../screens/queue/LiveQueueScreen';
import ProcurementScreen from '../screens/procurement/ProcurementScreen';
import PaymentScreen from '../screens/payments/PaymentScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import HelpScreen from '../screens/profile/HelpScreen';
import VerifyScreen from '../screens/operator/VerifyScreen';
import ConsoleScreen from '../screens/operator/ConsoleScreen';
import QueueControlScreen from '../screens/operator/QueueControlScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = { Home: 'home', Centres: 'map-search', Bookings: 'ticket-confirmation', Queue: 'podium', Profile: 'account' };

function GlobalHeader() {
  const { t } = useLang();
  const { online, notifications } = useStore();
  const navigation = useNavigation();
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
      <View style={styles.header}>
        <Image source={logo} style={{ width: 108, height: 30 }} resizeMode="contain" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: online ? C.primaryFixed : '#FFDAD6', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 }}>
          <PulseDot color={online ? '#006C4A' : '#BA1A1A'} size={5} />
          <Text style={{ fontSize: 9.5, fontWeight: '800', color: online ? C.onPrimaryFixed : '#93000A' }}>{online ? t('online') : t('offline').toUpperCase()}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.bellWrap}>
          <MaterialCommunityIcons name="bell-outline" size={21} color={C.onSurface} />
          {unread > 0 && (
            <View style={styles.badge}>
              <Text style={{ fontSize: 8.5, fontWeight: '800', color: '#fff' }}>{unread}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function HelplinePill() {
  return (
    <TouchableOpacity
      style={styles.helpline}
      onPress={() => Linking.openURL(`tel:${helpline.replace(/-/g, '')}`)}
      activeOpacity={0.85}
    >
      <MaterialCommunityIcons name="headset" size={16} color="#fff" />
      <Text style={{ fontSize: 11, color: '#fff', fontWeight: '800' }}>{helpline}</Text>
    </TouchableOpacity>
  );
}

function MainTabs() {
  const { t } = useLang();
  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <GlobalHeader />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: C.primary,
          tabBarInactiveTintColor: C.onSurfaceVariant,
          tabBarStyle: {
            backgroundColor: 'rgba(250,248,255,0.97)',
            borderTopColor: C.surfaceContainerHighest,
            height: 62, paddingBottom: 7, paddingTop: 5,
          },
          tabBarLabelStyle: { fontSize: 9.5, fontWeight: '700' },
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name={TAB_ICONS[route.name]} size={22} color={color} />,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t('tabHome') }} />
        <Tab.Screen name="Centres" component={CentreListScreen} options={{ tabBarLabel: t('tabMandi') }} />
        <Tab.Screen name="Bookings" component={MyBookingsScreen} options={{ tabBarLabel: t('tabPass') }} />
        <Tab.Screen name="Queue" component={LiveQueueScreen} options={{ tabBarLabel: t('tabQueue') }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: t('tabProfile') }} />
      </Tab.Navigator>
      <HelplinePill />
    </View>
  );
}

export default function RootNavigator() {
  const { booted, session, profile, onboardingDone } = useStore();
  const [showSplash, setShowSplash] = React.useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1600);
    return () => clearTimeout(t);
  }, []);

  if (!booted || showSplash) return <SplashScreen />;
  if (!onboardingDone) return <OnboardingScreen />;
  if (!session) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Otp" component={OtpScreen} />
      </Stack.Navigator>
    );
  }
  if (!profile) return <RegisterScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="CentreDetails" component={CentreDetailsScreen} />
      <Stack.Screen name="BookingFlow" component={BookingFlowScreen} />
      <Stack.Screen name="BookingSuccess" component={BookingSuccessScreen} />
      <Stack.Screen name="BookingPass" component={BookingPassScreen} />
      <Stack.Screen name="Procurement" component={ProcurementScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="Verify" component={VerifyScreen} />
      <Stack.Screen name="Console" component={ConsoleScreen} />
      <Stack.Screen name="QueueControl" component={QueueControlScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.surfaceContainerHighest,
  },
  bellWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: 2, right: 2,
    minWidth: 15, height: 15, borderRadius: 8, paddingHorizontal: 3,
    backgroundColor: '#BA1A1A', alignItems: 'center', justifyContent: 'center',
  },
  helpline: {
    position: 'absolute', right: 12, bottom: 82,
    backgroundColor: C.secondary, borderRadius: 999, paddingLeft: 12, paddingRight: 16, paddingVertical: 9,
    flexDirection: 'row', alignItems: 'center', gap: 7,
    shadowColor: '#904D00', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
});
