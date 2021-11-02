import { firebaseAuth, EmailAuthProvider, endpoint } from './constants';

import socketIOClient from 'socket.io-client';
var socket = socketIOClient(endpoint);

export function signupWithEmailPassword(email, password, name) {
	return firebaseAuth()
		.createUserWithEmailAndPassword(email, password)
		.then((user) => {
			saveUser(user, name);
			return user;
		})
		.catch((error) => {
			return error;
		});
}

export function loginWithEmail(email, password) {
	// return firebaseAuth().signInWithEmailAndPassword(email, password);

	return firebaseAuth()
		.signInWithEmailAndPassword(email, password)
		.then((user) => {
			return user;
		})
		.catch((error) => {
			return error;
		});
}

export function resetPassword(email) {
	return firebaseAuth()
		.sendPasswordResetEmail(email)
		.then(function () {
			// Email sent.
			return 'ok';
		})
		.catch(function (error) {
			return 'error';
		});
}

export function changeEmail(newEmail) {
	const user = firebaseAuth().currentUser;
	return user
		.updateEmail(newEmail)
		.then(() => {
			return 'ok';
		})
		.catch((error) => {
			return error;
		});
}

export function verifyPassword(password) {
	const user = firebaseAuth().currentUser;
	const credential = EmailAuthProvider.credential(user.email, password);

	return user
		.reauthenticateWithCredential(credential)
		.then(() => {
			return 'ok';
		})
		.catch((error) => {
			return error;
		});
}

export function logout() {
	return firebaseAuth().signOut();
}

export function saveUser(user, name) {
	// console.log('signup', user, name);

	var colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];

	return socket.emit('add:userData', {
		email: user.user.email,
		uid: user.user.uid,
		displayName: name,
		photoURL: 'https://firebasestorage.googleapis.com/v0/b/giftamizer-trowbridge.appspot.com/o/profileImages%2FVMeJief8YndOGsIMsF9IU9ymdFq1?alt=media&token=a8b913be-a485-41a3-85d3-d2f770208f06',
		backgroundValue: colors[Math.floor(Math.random() * colors.length)],
		backgroundType: 'color',
		textShade: 'light',
	});
}

export function getError(error) {
	var errorMessage;
	switch (error) {
		case 'auth/invalid-email':
			errorMessage = 'Your email address appears to be malformed.';
			break;
		case 'auth/email-already-in-use':
			errorMessage = 'Your email address is already in use.';
			break;
		case 'auth/wrong-password':
			errorMessage = 'Your password is wrong.';
			break;
		case 'auth/weak-password':
			errorMessage = 'Password is too weak.';
			break;
		case 'auth/user-not-found':
			errorMessage = 'Your password is wrong.';
			break;
		case 'auth/user-disabled':
			errorMessage = 'This account has been disabled.';
			break;
		case 'ERROR_TOO_MANY_REQUESTS':
			errorMessage = 'Too many requests. Try again later.';
			break;
		case 'auth/operation-not-allowed':
			errorMessage = 'Signing in with Email and Password is not enabled.';
			break;
		default:
			errorMessage = 'An undefined Error happened.';
	}
	return errorMessage;
}
