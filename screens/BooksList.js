import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  RefreshControl,
  ActivityIndicator 
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ChevronLeft, Search, BookOpen, Calendar } from 'lucide-react-native';
import { Colors } from "../styles/styles";

// Mock data - in a real app, this would come from an API or database
const MOCK_BOOKS = [
  { 
    id: '1', 
    bookName: 'Computer Science Attendance', 
    description: 'Tracking attendance for CS101 class', 
    level: '100', 
    averageScore: 85,
    totalEvents: 12
  },
  { 
    id: '2', 
    bookName: 'Mathematics Attendance', 
    description: 'Tracking attendance for Math201 class', 
    level: '200', 
    averageScore: 78,
    totalEvents: 8
  },
  // Add more mock books as needed
];

const BooksListScreen = () => {
  const navigation = useNavigation();
  const [books, setBooks] = useState(MOCK_BOOKS);
  const [filteredBooks, setFilteredBooks] = useState(MOCK_BOOKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 5;

  // Search functionality
  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = MOCK_BOOKS.filter(book => 
      book.bookName.toLowerCase().includes(query.toLowerCase()) ||
      book.description.toLowerCase().includes(query.toLowerCase()) ||
      book.level.includes(query)
    );
    setFilteredBooks(filtered);
    setPage(1);
  };

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // In a real app, you would fetch fresh data here
    setTimeout(() => {
      setBooks(MOCK_BOOKS);
      setFilteredBooks(MOCK_BOOKS);
      setRefreshing(false);
    }, 1000);
  }, []);

  // Pagination logic
  const loadMoreBooks = () => {
    if (loading) return;
    
    setLoading(true);
    // Simulating API call with timeout
    setTimeout(() => {
      const startIndex = page * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const newBooks = filteredBooks.slice(startIndex, endIndex);
      
      if (newBooks.length > 0) {
        setBooks(prevBooks => [...prevBooks, ...newBooks]);
        setPage(prevPage => prevPage + 1);
      }
      
      setLoading(false);
    }, 500);
  };

  // Render book item
  const renderBookItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.bookCard}
      onPress={() => {
         navigation.navigate('AttendanceBookDetail', { bookId: item.id })
      }}
    >
      <View style={styles.bookCardContent}>
        <View style={styles.bookCardHeader}>
          <BookOpen color={Colors.primary} size={24} style={styles.bookIcon} />
          <Text style={styles.bookName} numberOfLines={1}>
            {item.bookName}
          </Text>
        </View>
        <View style={styles.bookCardDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Level:</Text>
            <Text style={styles.detailValue}>{item.level}</Text>
          </View>
          <View style={styles.detailItem}>
            <Calendar color={Colors.textSecondary} size={16} style={styles.detailIcon} />
            <Text style={styles.detailValue}>{item.totalEvents} Events</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Avg Score:</Text>
            <Text style={styles.detailValue}>{item.averageScore}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <ChevronLeft color={Colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Attendance Books</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search color={Colors.textSecondary} size={20} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search books..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Books List */}
      <FlatList
        data={books}
        renderItem={renderBookItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        onEndReached={loadMoreBooks}
        onEndReachedThreshold={0.1}
        ListFooterComponent={() => (
          loading ? (
            <ActivityIndicator 
              size="large" 
              color={Colors.primary} 
              style={styles.loadingIndicator} 
            />
          ) : null
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No books found</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: Colors.background,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: 'Quicksand-SemiBold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.almostBg,
    borderRadius: 10,
    marginHorizontal: 15,
    marginVertical: 10,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: 'Quicksand',
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  bookCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  bookCardContent: {
    padding: 15,
  },
  bookCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bookIcon: {
    marginRight: 10,
  },
  bookName: {
    fontSize: 18,
    fontFamily: 'Quicksand-SemiBold',
    color: Colors.textPrimary,
    flex: 1,
  },
  bookCardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Quicksand-Medium',
    color: Colors.textSecondary,
    marginRight: 5,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Quicksand-SemiBold',
    color: Colors.textPrimary,
  },
  detailIcon: {
    marginRight: 5,
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Quicksand-Medium',
    color: Colors.textSecondary,
  },
});

export default BooksListScreen;