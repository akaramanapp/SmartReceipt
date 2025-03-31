import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  Animated,
  SafeAreaView,
  Platform,
} from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { launchCamera, launchImageLibrary, CameraOptions, ImageLibraryOptions } from 'react-native-image-picker';
import { analyzeReceipt } from '../services/receiptService';
import { saveReceipt, getReceipts, deleteReceipt } from '../services/storageService';
import { StoredReceipt } from '../types';

const ReceiptRow = ({ item, onDelete }: { item: StoredReceipt; onDelete: () => void }) => {
  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={onDelete}
      >
        <Animated.Text
          style={[
            styles.deleteButtonText,
            { transform: [{ scale }] },
          ]}
        >
          Sil
        </Animated.Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.rowContainer}>
      <Swipeable
        renderRightActions={renderRightActions}
        rightThreshold={40}
      >
        <View style={styles.receiptItem}>
          <Image source={{ uri: item.imageUri }} style={styles.receiptImage} />
          <View style={styles.receiptInfo}>
            <Text style={styles.receiptAmount}>{item.tutar}</Text>
            <Text style={styles.receiptDate}>{item.tarih}</Text>
          </View>
        </View>
      </Swipeable>
    </View>
  );
};

const Header = ({ totalAmount }: { totalAmount: string }) => (
  <View style={styles.headerContainer}>
    <View>
      <Text style={styles.headerTitle}>Fiş Takip</Text>
      <Text style={styles.headerSubtitle}>Toplam Harcama</Text>
    </View>
    <Text style={styles.totalAmount}>{totalAmount}</Text>
  </View>
);

export const HomeScreen = () => {
  const [receipts, setReceipts] = useState<StoredReceipt[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReceipts();
  }, []);

  const calculateTotal = useMemo(() => {
    return receipts.reduce((total, receipt) => {
      if (!receipt.tutar) return total;
      const amount = parseFloat(receipt.tutar.replace(' TL', '').replace(',', '.'));
      return total + (isNaN(amount) ? 0 : amount);
    }, 0).toFixed(2).replace('.', ',') + ' TL';
  }, [receipts]);

  const loadReceipts = async () => {
    try {
      const storedReceipts = await getReceipts();
      setReceipts(storedReceipts);
    } catch (error) {
      Alert.alert('Hata', 'Fişler yüklenirken bir hata oluştu.');
    }
  };

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteReceipt(id);
      setReceipts(prev => prev.filter(receipt => receipt.id !== id));
    } catch (error) {
      Alert.alert('Hata', 'Fiş silinirken bir hata oluştu.');
    }
  }, []);

  const handleImagePick = async (type: 'camera' | 'gallery') => {
    const options: CameraOptions & ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 0.8,
      saveToPhotos: true,
    };

    try {
      const result = type === 'camera'
        ? await launchCamera(options)
        : await launchImageLibrary(options);

      if (result.assets && result.assets[0]?.uri) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Hata', 'Görüntü seçilirken bir hata oluştu.');
    }
  };

  const processImage = async (imageUri: string) => {
    try {
      setLoading(true);
      const result = await analyzeReceipt(imageUri);
      const { tutar, tarih } = result.data;
      
      if (!tutar) {
        Alert.alert('Hata', 'Fiş tutarı okunamadı. Lütfen tekrar deneyin.');
        return;
      }

      const newReceipt: StoredReceipt = {
        id: Date.now().toString(),
        imageUri,
        tutar: tutar || '0 TL',
        tarih: tarih || new Date().toLocaleDateString('tr-TR'),
      };

      await saveReceipt(newReceipt);
      await loadReceipts();
    } catch (error) {
      console.error('Error processing receipt:', error);
      Alert.alert('Hata', 'Fiş işlenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const renderReceipt = ({ item }: { item: StoredReceipt }) => (
    <ReceiptRow
      item={item}
      onDelete={() => handleDelete(item.id)}
    />
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <Header totalAmount={calculateTotal} />
        
        {loading && (
          <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
        )}

        <FlatList
          data={receipts}
          renderItem={renderReceipt}
          keyExtractor={item => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleImagePick('camera')}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Kamera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleImagePick('gallery')}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Galeri</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 12,
    width: '45%',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    zIndex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  rowContainer: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  receiptItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  receiptImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  receiptInfo: {
    marginLeft: 16,
    flex: 1,
    justifyContent: 'center',
  },
  receiptAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  receiptDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  headerContainer: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
}); 