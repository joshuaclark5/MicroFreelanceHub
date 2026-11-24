import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import {encryptedSessionStorage} from './encryptedSessionStorage';

const options:SecureStore.SecureStoreOptions={
 keychainService:'com.microfreelancehub.mobile.auth',
 keychainAccessible:SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};
async function available(){
 if(!await SecureStore.isAvailableAsync())throw Error('Encrypted sign-in storage is unavailable on this device.');
}
/** Native-only. Never fall back to plaintext storage when secure storage fails. */
export const nativeSessionStorage=encryptedSessionStorage({
 async getItemAsync(key){await available();return SecureStore.getItemAsync(key,options);},
 async setItemAsync(key,value){await available();await SecureStore.setItemAsync(key,value,options);},
 async deleteItemAsync(key){await available();await SecureStore.deleteItemAsync(key,options);},
},()=>Crypto.randomUUID());
