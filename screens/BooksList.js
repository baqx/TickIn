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
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ChevronLeft, Search, BookOpen, Calendar } from "lucide-react-native";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Colors } from "../styles/styles";
import Config from "../config/Config";

const BooksListScreen = () => {
  const navigation = useNavigation();
  const [books, setBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [userToken, setUserToken] = useState("");

  // Fetch user token from SecureStore
  const fetchUserToken = async () => {
    try {
      const token = await SecureStore.getItemAsync("userToken");
      setUserToken(token || "");
    } catch (error) {
      console.error("Failed to fetch user token:", error);
    }
  };

  // Fetch books
  const fetchBooks = async (resetData = false) => {
    if (loading || !userToken) return;

    setLoading(true);

    try {
      const response = await axios.post(`${Config.BASE_URL}/book/books`, {
        pass: Config.PASS,
        user_id: userToken,
        search: searchQuery,
        page: resetData ? 1 : page,
        per_page: 5,
        sort_by: "created_at",
        sort_order: "DESC",
      });
      //console.log(response.data);
      if (response.data.status === 1) {
        const { data, pagination } = response.data;

        // Reset or append books based on resetData flag
        setBooks(resetData ? data : (prevBooks) => [...prevBooks, ...data]);

        // Update pagination info
        setPage(pagination.current_page);
        setTotalPages(pagination.total_pages);
        setHasMore(pagination.current_page < pagination.total_pages);
      } else {
        setBooks([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Search functionality
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setPage(1);
    fetchBooks(true);
  }, []);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBooks(true);
  }, [searchQuery, userToken]);

  // Pagination logic
  const loadMoreBooks = () => {
    if (loading || !hasMore) return;
    setPage((prevPage) => prevPage + 1);
    fetchBooks();
  };

  // Initial data fetch
  useEffect(() => {
    fetchUserToken();
  }, []);

  useEffect(() => {
    if (userToken) {
      fetchBooks(true);
    }
  }, [userToken]);

  // Render book item
  const renderBookItem = ({ item }) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => {
        navigation.navigate("AttendanceBookDetail", { bookId: item.book_id });
      }}
    >
      <View style={styles.bookCardContent}>
        <View style={styles.bookCardHeader}>
          <BookOpen color={Colors.primary} size={24} style={styles.bookIcon} />
          <Text style={styles.bookName} numberOfLines={1}>
            {item.book_title}
          </Text>
        </View>
        <View style={styles.bookCardDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Level:</Text>
            <Text style={styles.detailValue}>{item.level}</Text>
          </View>
          <View style={styles.detailItem}>
            <Calendar
              color={Colors.textSecondary}
              size={16}
              style={styles.detailIcon}
            />
            <Text style={styles.detailValue}>{item.total_columns} Columns</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Avg Score:</Text>
            <Text style={styles.detailValue}>{item.average_score}</Text>
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
        <Search
          color={Colors.textSecondary}
          size={20}
          style={styles.searchIcon}
        />
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
        keyExtractor={(item) => item.book_id.toString()}
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
        ListFooterComponent={() =>
          loading ? (
            <ActivityIndicator
              size="large"
              color={Colors.primary}
              style={styles.loadingIndicator}
            />
          ) : null
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery
                ? "No books found matching your search"
                : "No books found"}
            </Text>
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: Colors.background,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
    fontFamily: "Quicksand-SemiBold",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
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
    fontFamily: "Quicksand",
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
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  bookIcon: {
    marginRight: 10,
  },
  bookName: {
    fontSize: 18,
    fontFamily: "Quicksand-SemiBold",
    color: Colors.textPrimary,
    flex: 1,
  },
  bookCardDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: "Quicksand-Medium",
    color: Colors.textSecondary,
    marginRight: 5,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: "Quicksand-SemiBold",
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
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Quicksand-Medium",
    color: Colors.textSecondary,
  },
});

export default BooksListScreen;
