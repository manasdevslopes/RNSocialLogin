import React, { Component } from 'react';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';

import firebase from 'firebase';
import * as Google from "expo-google-app-auth";

import * as Facebook from 'expo-facebook';

export default class LoginScreen extends Component {

    isUserEqual = (googleUser, firebaseUser) => {
        if (firebaseUser) {
            var providerData = firebaseUser.providerData;
            for (var i = 0; i < providerData.length; i++) {
                if (providerData[i].providerId === firebase.auth.GoogleAuthProvider.PROVIDER_ID &&
                    providerData[i].uid === googleUser.getBasicProfile().getId()) {
                    // We don't need to reauth the Firebase connection.
                    return true;
                }
            }
        }
        return false;
    }

    onSignIn = (googleUser) => {
        console.log('Google Auth Response', googleUser);
        // We need to register an Observer on Firebase Auth to make sure auth is initialized.
        var unsubscribe = firebase.auth().onAuthStateChanged(function (firebaseUser) {
            unsubscribe();
            // Check if we are already signed-in Firebase with the correct user.
            if (!this.isUserEqual(googleUser, firebaseUser)) {
                // Build Firebase credential with the Google ID token.
                var credential = firebase.auth.GoogleAuthProvider.credential(
                    googleUser.idToken,
                    googleUser.accessToken
                )
                // Sign in with credential from the Google user.
                firebase.auth().signInWithCredential(credential)
                    .then((result) => {
                        console.log('User Signed in');
                        if (result.additionalUserInfo.isNewUser) {
                            firebase.database().ref('/users/' + result.user.uid)
                                .set({
                                    gmail: result.user.email,
                                    profile_picture: result.additionalUserInfo.profile.picture,
                                    locale: result.additionalUserInfo.profile.locale,
                                    first_name: result.additionalUserInfo.profile.given_name,
                                    last_name: result.additionalUserInfo.profile.family_name,
                                    created_at: Date.now()
                                })
                                .then(snapshot => {

                                })
                        } else {
                            firebase.database().ref('/users/' + result.user.uid).update({
                                last_logged_in: Date.now()
                            })
                        }
                    })
                    .catch(function (error) {
                        // Handle Errors here.
                        var errorCode = error.code;
                        var errorMessage = error.message;
                        // The email of the user's account used.
                        var email = error.email;
                        // The firebase.auth.AuthCredential type that was used.
                        var credential = error.credential;
                        // ...
                    });
            } else {
                console.log('User already signed-in Firebase.');
            }
        }.bind(this));
    }

    signInWithGoogleAsync = async () => {
        try {
            const result = await Google.logInAsync({
                // behavior: 'web',
                androidClientId: '203186594591-pllfnufn1mh0diecrjhigp3sb3kiur9l.apps.googleusercontent.com',
                iosClientId: '203186594591-2qgv19h0sejgr69eniqj8ien6qtnmgcb.apps.googleusercontent.com',
                scopes: ['profile', 'email'],
            });

            if (result.type === 'success') {
                this.onSignIn(result)
                return result.accessToken;
            } else {
                return { cancelled: true };
            }
        } catch (e) {
            return { error: true };
        }
    }

    signInWithFacebook = async () => {
        try {
            await Facebook.initializeAsync('176554900242163');
            const {
                type,
                token,
                expires,
                permissions,
                declinedPermissions,
            } = await Facebook.logInWithReadPermissionsAsync({
                permissions: ['public_profile'],
            });
            if (type === 'success') {
                // Get the user's name using Facebook's Graph API
                const credential = firebase.auth.FacebookAuthProvider.credential(token)
                firebase.auth().signInWithCredential(credential)
                    .then((result) => {
                        console.log(result, 'User Signed in');
                        if (result.additionalUserInfo.isNewUser) {
                            firebase.database().ref('/users/' + result.user.uid)
                                .set({
                                    // fmail: result.user.email,
                                    profile_picture: result.additionalUserInfo.profile.picture.data.url,
                                    // locale: result.additionalUserInfo.profile.locale,
                                    first_name: result.additionalUserInfo.profile.first_name,
                                    last_name: result.additionalUserInfo.profile.last_name,
                                    created_at: Date.now()
                                })
                                .then(snapshot => {

                                })
                        } else {
                            firebase.database().ref('/users/' + result.user.uid).update({
                                last_logged_in: Date.now()
                            })
                        }
                    })
                    .catch(error => console.log(error))
                const response = await fetch(`https://graph.facebook.com/me?access_token=${token}`);
                Alert.alert('Logged in!', `Hi ${(await response.json()).name}!`);
            } else {
                // type === 'cancel'
            }
        } catch ({ message }) {
            alert(`Facebook Login Error: ${message}`);
        }
        // const { type, token } = await Facebook.logInWithReadPermissionAsync('', {
        //     permissions: ['public_profile']
        // })

        // if (type == 'success') {

        // }
    }

    render() {
        return (
            <View style={styles.container}>
                <Button title="Sign In With Google" onPress={() => this.signInWithGoogleAsync()} />
                <Button title="Sign In With Facebook" onPress={() => this.signInWithFacebook()} />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
