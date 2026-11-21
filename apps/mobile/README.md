# Uniblip Mobile

The mobile frontend for Uniblip, built with React Native and Expo.

## Tech Stack
- React Native
- Expo
- TypeScript
- Expo Router

## Loading screen

The light-mode loading screen uses the UniBlip logo from the Figma design. The
native splash configuration uses the same logo and background; changes to that
configuration require a new native build. Expo Go and development builds do not
fully reproduce the native splash screen, so verify it in an iOS and Android
release build.

For a device check, cold-launch a release build on iOS and Android in both
system appearances. Confirm that the splash stays light, shows the UniBlip
logo, loading label and tagline, and transitions to a usable home screen
without a blank frame. The native splash itself may only show the logo.