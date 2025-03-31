export interface ReceiptData {
  tutar: string;
  tarih: string;
}

export interface ApiResponse {
  data: ReceiptData;
}

export interface StoredReceipt extends ReceiptData {
  id: string;
  imageUri: string;
} 