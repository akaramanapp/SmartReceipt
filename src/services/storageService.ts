import AsyncStorage from '@react-native-async-storage/async-storage';
import { StoredReceipt } from '../types';

const STORAGE_KEY = '@receipts';

export const saveReceipt = async (receipt: StoredReceipt): Promise<void> => {
  try {
    const existingReceipts = await getReceipts();
    const updatedReceipts = [...existingReceipts, receipt];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReceipts));
  } catch (error) {
    console.error('Error saving receipt:', error);
    throw error;
  }
};

export const getReceipts = async (): Promise<StoredReceipt[]> => {
  try {
    const receipts = await AsyncStorage.getItem(STORAGE_KEY);
    return receipts ? JSON.parse(receipts) : [];
  } catch (error) {
    console.error('Error getting receipts:', error);
    throw error;
  }
};

export const deleteReceipt = async (id: string): Promise<void> => {
  try {
    const existingReceipts = await getReceipts();
    const updatedReceipts = existingReceipts.filter(receipt => receipt.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReceipts));
  } catch (error) {
    console.error('Error deleting receipt:', error);
    throw error;
  }
}; 