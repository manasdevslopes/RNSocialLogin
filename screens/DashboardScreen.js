import React, { Component } from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';

import firebase from 'firebase';

export default class DashboardScreen extends Component {
    render() {
        return (
            <View style={styles.container}>
                <Text>Dashboard Screen</Text>

                <Button title="Sign Out" onPress={() => firebase.auth().signOut()} />
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
