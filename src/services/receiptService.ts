import { ApiResponse } from '../types';
import { Platform } from 'react-native';
import RNBlobUtil from 'react-native-blob-util';

const API_URL = 'http://localhost:5678/webhook/ab2c9995-ae98-4e60-9c24-2732d83cbaaf';

export const analyzeReceipt = async (imageUri: string): Promise<ApiResponse> => {
  try {
    // Get the correct file path
    const filePath = Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri;
    
    // Send the request using RNBlobUtil
    const response = await RNBlobUtil.fetch('POST', API_URL, {
      'Content-Type': 'image/jpeg',
      'Accept': 'application/json',
    }, RNBlobUtil.wrap(filePath));

    const responseData = await response.json();
    return responseData[0];
  } catch (error) {
    console.error('Error analyzing receipt:', error);
    throw error;
  }
}; 