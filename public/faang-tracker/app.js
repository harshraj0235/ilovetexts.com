// ============================================
// FAANG Crack — Full Application Logic
// ============================================

// ==========================================
// DATA: DSA Problems (150 Must-Solve)
// ==========================================
const DSA_PROBLEMS = [
    // Arrays & Hashing
    { id: 1, name: "Two Sum", url: "https://leetcode.com/problems/two-sum/", difficulty: "easy", pattern: "Arrays & Hashing", companies: "Google, Amazon, Meta" },
    { id: 2, name: "Contains Duplicate", url: "https://leetcode.com/problems/contains-duplicate/", difficulty: "easy", pattern: "Arrays & Hashing", companies: "Amazon, Apple" },
    { id: 3, name: "Valid Anagram", url: "https://leetcode.com/problems/valid-anagram/", difficulty: "easy", pattern: "Arrays & Hashing", companies: "Google, Amazon" },
    { id: 4, name: "Group Anagrams", url: "https://leetcode.com/problems/group-anagrams/", difficulty: "medium", pattern: "Arrays & Hashing", companies: "Amazon, Meta" },
    { id: 5, name: "Top K Frequent Elements", url: "https://leetcode.com/problems/top-k-frequent-elements/", difficulty: "medium", pattern: "Arrays & Hashing", companies: "Amazon, Google" },
    { id: 6, name: "Product of Array Except Self", url: "https://leetcode.com/problems/product-of-array-except-self/", difficulty: "medium", pattern: "Arrays & Hashing", companies: "Meta, Amazon, Apple" },
    { id: 7, name: "Encode and Decode Strings", url: "https://leetcode.com/problems/encode-and-decode-strings/", difficulty: "medium", pattern: "Arrays & Hashing", companies: "Google, Meta" },
    { id: 8, name: "Longest Consecutive Sequence", url: "https://leetcode.com/problems/longest-consecutive-sequence/", difficulty: "medium", pattern: "Arrays & Hashing", companies: "Google, Amazon" },

    // Two Pointers
    { id: 9, name: "Valid Palindrome", url: "https://leetcode.com/problems/valid-palindrome/", difficulty: "easy", pattern: "Two Pointers", companies: "Meta, Amazon" },
    { id: 10, name: "3Sum", url: "https://leetcode.com/problems/3sum/", difficulty: "medium", pattern: "Two Pointers", companies: "Amazon, Meta, Google" },
    { id: 11, name: "Container With Most Water", url: "https://leetcode.com/problems/container-with-most-water/", difficulty: "medium", pattern: "Two Pointers", companies: "Amazon, Google" },
    { id: 12, name: "Trapping Rain Water", url: "https://leetcode.com/problems/trapping-rain-water/", difficulty: "hard", pattern: "Two Pointers", companies: "Google, Amazon, Meta" },

    // Sliding Window
    { id: 13, name: "Best Time to Buy and Sell Stock", url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", difficulty: "easy", pattern: "Sliding Window", companies: "Amazon, Meta, Google" },
    { id: 14, name: "Longest Substring Without Repeating Characters", url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", difficulty: "medium", pattern: "Sliding Window", companies: "Amazon, Google, Meta" },
    { id: 15, name: "Longest Repeating Character Replacement", url: "https://leetcode.com/problems/longest-repeating-character-replacement/", difficulty: "medium", pattern: "Sliding Window", companies: "Google" },
    { id: 16, name: "Minimum Window Substring", url: "https://leetcode.com/problems/minimum-window-substring/", difficulty: "hard", pattern: "Sliding Window", companies: "Meta, Google, Amazon" },
    { id: 17, name: "Sliding Window Maximum", url: "https://leetcode.com/problems/sliding-window-maximum/", difficulty: "hard", pattern: "Sliding Window", companies: "Google, Amazon" },

    // Stack
    { id: 18, name: "Valid Parentheses", url: "https://leetcode.com/problems/valid-parentheses/", difficulty: "easy", pattern: "Stack", companies: "Amazon, Google, Meta" },
    { id: 19, name: "Min Stack", url: "https://leetcode.com/problems/min-stack/", difficulty: "medium", pattern: "Stack", companies: "Amazon, Google" },
    { id: 20, name: "Evaluate Reverse Polish Notation", url: "https://leetcode.com/problems/evaluate-reverse-polish-notation/", difficulty: "medium", pattern: "Stack", companies: "Amazon, Google" },
    { id: 21, name: "Daily Temperatures", url: "https://leetcode.com/problems/daily-temperatures/", difficulty: "medium", pattern: "Stack", companies: "Meta, Amazon" },
    { id: 22, name: "Largest Rectangle in Histogram", url: "https://leetcode.com/problems/largest-rectangle-in-histogram/", difficulty: "hard", pattern: "Stack", companies: "Google, Amazon" },

    // Binary Search
    { id: 23, name: "Binary Search", url: "https://leetcode.com/problems/binary-search/", difficulty: "easy", pattern: "Binary Search", companies: "Google, Amazon" },
    { id: 24, name: "Search a 2D Matrix", url: "https://leetcode.com/problems/search-a-2d-matrix/", difficulty: "medium", pattern: "Binary Search", companies: "Amazon, Google" },
    { id: 25, name: "Koko Eating Bananas", url: "https://leetcode.com/problems/koko-eating-bananas/", difficulty: "medium", pattern: "Binary Search", companies: "Google" },
    { id: 26, name: "Search in Rotated Sorted Array", url: "https://leetcode.com/problems/search-in-rotated-sorted-array/", difficulty: "medium", pattern: "Binary Search", companies: "Meta, Amazon, Google" },
    { id: 27, name: "Find Minimum in Rotated Sorted Array", url: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/", difficulty: "medium", pattern: "Binary Search", companies: "Amazon, Google" },
    { id: 28, name: "Median of Two Sorted Arrays", url: "https://leetcode.com/problems/median-of-two-sorted-arrays/", difficulty: "hard", pattern: "Binary Search", companies: "Google, Amazon, Apple" },

    // Linked List
    { id: 29, name: "Reverse Linked List", url: "https://leetcode.com/problems/reverse-linked-list/", difficulty: "easy", pattern: "Linked List", companies: "Amazon, Google, Meta" },
    { id: 30, name: "Merge Two Sorted Lists", url: "https://leetcode.com/problems/merge-two-sorted-lists/", difficulty: "easy", pattern: "Linked List", companies: "Amazon, Google" },
    { id: 31, name: "Linked List Cycle", url: "https://leetcode.com/problems/linked-list-cycle/", difficulty: "easy", pattern: "Linked List", companies: "Amazon, Google" },
    { id: 32, name: "Reorder List", url: "https://leetcode.com/problems/reorder-list/", difficulty: "medium", pattern: "Linked List", companies: "Amazon, Meta" },
    { id: 33, name: "Remove Nth Node From End", url: "https://leetcode.com/problems/remove-nth-node-from-end-of-list/", difficulty: "medium", pattern: "Linked List", companies: "Amazon, Google" },
    { id: 34, name: "Copy List with Random Pointer", url: "https://leetcode.com/problems/copy-list-with-random-pointer/", difficulty: "medium", pattern: "Linked List", companies: "Amazon, Meta" },
    { id: 35, name: "Add Two Numbers", url: "https://leetcode.com/problems/add-two-numbers/", difficulty: "medium", pattern: "Linked List", companies: "Amazon, Google, Meta" },
    { id: 36, name: "LRU Cache", url: "https://leetcode.com/problems/lru-cache/", difficulty: "medium", pattern: "Linked List", companies: "Amazon, Google, Meta, Apple" },
    { id: 37, name: "Merge K Sorted Lists", url: "https://leetcode.com/problems/merge-k-sorted-lists/", difficulty: "hard", pattern: "Linked List", companies: "Amazon, Google, Meta" },
    { id: 38, name: "Reverse Nodes in K-Group", url: "https://leetcode.com/problems/reverse-nodes-in-k-group/", difficulty: "hard", pattern: "Linked List", companies: "Amazon, Google" },

    // Trees
    { id: 39, name: "Invert Binary Tree", url: "https://leetcode.com/problems/invert-binary-tree/", difficulty: "easy", pattern: "Trees", companies: "Google, Amazon" },
    { id: 40, name: "Maximum Depth of Binary Tree", url: "https://leetcode.com/problems/maximum-depth-of-binary-tree/", difficulty: "easy", pattern: "Trees", companies: "Amazon, Google" },
    { id: 41, name: "Same Tree", url: "https://leetcode.com/problems/same-tree/", difficulty: "easy", pattern: "Trees", companies: "Amazon" },
    { id: 42, name: "Subtree of Another Tree", url: "https://leetcode.com/problems/subtree-of-another-tree/", difficulty: "easy", pattern: "Trees", companies: "Amazon, Meta" },
    { id: 43, name: "Lowest Common Ancestor of BST", url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/", difficulty: "medium", pattern: "Trees", companies: "Amazon, Meta, Google" },
    { id: 44, name: "Binary Tree Level Order Traversal", url: "https://leetcode.com/problems/binary-tree-level-order-traversal/", difficulty: "medium", pattern: "Trees", companies: "Amazon, Meta, Google" },
    { id: 45, name: "Validate Binary Search Tree", url: "https://leetcode.com/problems/validate-binary-search-tree/", difficulty: "medium", pattern: "Trees", companies: "Amazon, Meta, Google" },
    { id: 46, name: "Kth Smallest Element in BST", url: "https://leetcode.com/problems/kth-smallest-element-in-a-bst/", difficulty: "medium", pattern: "Trees", companies: "Amazon, Google" },
    { id: 47, name: "Construct Binary Tree from Preorder and Inorder", url: "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/", difficulty: "medium", pattern: "Trees", companies: "Google, Amazon" },
    { id: 48, name: "Binary Tree Maximum Path Sum", url: "https://leetcode.com/problems/binary-tree-maximum-path-sum/", difficulty: "hard", pattern: "Trees", companies: "Google, Meta, Amazon" },
    { id: 49, name: "Serialize and Deserialize Binary Tree", url: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/", difficulty: "hard", pattern: "Trees", companies: "Amazon, Google, Meta" },

    // Tries
    { id: 50, name: "Implement Trie (Prefix Tree)", url: "https://leetcode.com/problems/implement-trie-prefix-tree/", difficulty: "medium", pattern: "Tries", companies: "Google, Amazon" },
    { id: 51, name: "Design Add and Search Words Data Structure", url: "https://leetcode.com/problems/design-add-and-search-words-data-structure/", difficulty: "medium", pattern: "Tries", companies: "Meta, Google" },
    { id: 52, name: "Word Search II", url: "https://leetcode.com/problems/word-search-ii/", difficulty: "hard", pattern: "Tries", companies: "Amazon, Google" },

    // Heap / Priority Queue
    { id: 53, name: "Kth Largest Element in an Array", url: "https://leetcode.com/problems/kth-largest-element-in-an-array/", difficulty: "medium", pattern: "Heap / Priority Queue", companies: "Meta, Amazon, Google" },
    { id: 54, name: "Task Scheduler", url: "https://leetcode.com/problems/task-scheduler/", difficulty: "medium", pattern: "Heap / Priority Queue", companies: "Meta, Amazon" },
    { id: 55, name: "K Closest Points to Origin", url: "https://leetcode.com/problems/k-closest-points-to-origin/", difficulty: "medium", pattern: "Heap / Priority Queue", companies: "Amazon, Meta" },
    { id: 56, name: "Find Median from Data Stream", url: "https://leetcode.com/problems/find-median-from-data-stream/", difficulty: "hard", pattern: "Heap / Priority Queue", companies: "Amazon, Google, Apple" },

    // Backtracking
    { id: 57, name: "Subsets", url: "https://leetcode.com/problems/subsets/", difficulty: "medium", pattern: "Backtracking", companies: "Amazon, Meta" },
    { id: 58, name: "Combination Sum", url: "https://leetcode.com/problems/combination-sum/", difficulty: "medium", pattern: "Backtracking", companies: "Amazon" },
    { id: 59, name: "Permutations", url: "https://leetcode.com/problems/permutations/", difficulty: "medium", pattern: "Backtracking", companies: "Amazon, Meta" },
    { id: 60, name: "Word Search", url: "https://leetcode.com/problems/word-search/", difficulty: "medium", pattern: "Backtracking", companies: "Amazon, Google" },
    { id: 61, name: "Palindrome Partitioning", url: "https://leetcode.com/problems/palindrome-partitioning/", difficulty: "medium", pattern: "Backtracking", companies: "Amazon" },
    { id: 62, name: "Letter Combinations of a Phone Number", url: "https://leetcode.com/problems/letter-combinations-of-a-phone-number/", difficulty: "medium", pattern: "Backtracking", companies: "Amazon, Google, Meta" },
    { id: 63, name: "N-Queens", url: "https://leetcode.com/problems/n-queens/", difficulty: "hard", pattern: "Backtracking", companies: "Amazon, Google" },

    // Graphs
    { id: 64, name: "Number of Islands", url: "https://leetcode.com/problems/number-of-islands/", difficulty: "medium", pattern: "Graphs", companies: "Amazon, Google, Meta" },
    { id: 65, name: "Clone Graph", url: "https://leetcode.com/problems/clone-graph/", difficulty: "medium", pattern: "Graphs", companies: "Meta, Amazon, Google" },
    { id: 66, name: "Pacific Atlantic Water Flow", url: "https://leetcode.com/problems/pacific-atlantic-water-flow/", difficulty: "medium", pattern: "Graphs", companies: "Google, Amazon" },
    { id: 67, name: "Course Schedule", url: "https://leetcode.com/problems/course-schedule/", difficulty: "medium", pattern: "Graphs", companies: "Amazon, Google, Meta" },
    { id: 68, name: "Course Schedule II", url: "https://leetcode.com/problems/course-schedule-ii/", difficulty: "medium", pattern: "Graphs", companies: "Amazon, Google" },
    { id: 69, name: "Number of Connected Components", url: "https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/", difficulty: "medium", pattern: "Graphs", companies: "Google, Amazon" },
    { id: 70, name: "Graph Valid Tree", url: "https://leetcode.com/problems/graph-valid-tree/", difficulty: "medium", pattern: "Graphs", companies: "Google" },
    { id: 71, name: "Rotting Oranges", url: "https://leetcode.com/problems/rotting-oranges/", difficulty: "medium", pattern: "Graphs", companies: "Amazon, Google" },
    { id: 72, name: "Walls and Gates", url: "https://leetcode.com/problems/walls-and-gates/", difficulty: "medium", pattern: "Graphs", companies: "Meta, Google" },
    { id: 73, name: "Word Ladder", url: "https://leetcode.com/problems/word-ladder/", difficulty: "hard", pattern: "Graphs", companies: "Amazon, Google, Meta" },
    { id: 74, name: "Alien Dictionary", url: "https://leetcode.com/problems/alien-dictionary/", difficulty: "hard", pattern: "Graphs", companies: "Google, Meta, Amazon" },

    // Dynamic Programming - 1D
    { id: 75, name: "Climbing Stairs", url: "https://leetcode.com/problems/climbing-stairs/", difficulty: "easy", pattern: "1D Dynamic Programming", companies: "Amazon, Google" },
    { id: 76, name: "House Robber", url: "https://leetcode.com/problems/house-robber/", difficulty: "medium", pattern: "1D Dynamic Programming", companies: "Amazon, Google" },
    { id: 77, name: "House Robber II", url: "https://leetcode.com/problems/house-robber-ii/", difficulty: "medium", pattern: "1D Dynamic Programming", companies: "Amazon" },
    { id: 78, name: "Longest Palindromic Substring", url: "https://leetcode.com/problems/longest-palindromic-substring/", difficulty: "medium", pattern: "1D Dynamic Programming", companies: "Amazon, Google, Meta" },
    { id: 79, name: "Palindromic Substrings", url: "https://leetcode.com/problems/palindromic-substrings/", difficulty: "medium", pattern: "1D Dynamic Programming", companies: "Meta, Amazon" },
    { id: 80, name: "Decode Ways", url: "https://leetcode.com/problems/decode-ways/", difficulty: "medium", pattern: "1D Dynamic Programming", companies: "Amazon, Google, Meta" },
    { id: 81, name: "Coin Change", url: "https://leetcode.com/problems/coin-change/", difficulty: "medium", pattern: "1D Dynamic Programming", companies: "Amazon, Google" },
    { id: 82, name: "Maximum Product Subarray", url: "https://leetcode.com/problems/maximum-product-subarray/", difficulty: "medium", pattern: "1D Dynamic Programming", companies: "Amazon, Google" },
    { id: 83, name: "Word Break", url: "https://leetcode.com/problems/word-break/", difficulty: "medium", pattern: "1D Dynamic Programming", companies: "Amazon, Google, Meta" },
    { id: 84, name: "Longest Increasing Subsequence", url: "https://leetcode.com/problems/longest-increasing-subsequence/", difficulty: "medium", pattern: "1D Dynamic Programming", companies: "Amazon, Google" },

    // Dynamic Programming - 2D
    { id: 85, name: "Unique Paths", url: "https://leetcode.com/problems/unique-paths/", difficulty: "medium", pattern: "2D Dynamic Programming", companies: "Amazon, Google" },
    { id: 86, name: "Longest Common Subsequence", url: "https://leetcode.com/problems/longest-common-subsequence/", difficulty: "medium", pattern: "2D Dynamic Programming", companies: "Amazon, Google" },
    { id: 87, name: "Best Time to Buy and Sell Stock with Cooldown", url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/", difficulty: "medium", pattern: "2D Dynamic Programming", companies: "Amazon" },
    { id: 88, name: "Target Sum", url: "https://leetcode.com/problems/target-sum/", difficulty: "medium", pattern: "2D Dynamic Programming", companies: "Meta, Amazon" },
    { id: 89, name: "Interleaving String", url: "https://leetcode.com/problems/interleaving-string/", difficulty: "medium", pattern: "2D Dynamic Programming", companies: "Google" },
    { id: 90, name: "Edit Distance", url: "https://leetcode.com/problems/edit-distance/", difficulty: "medium", pattern: "2D Dynamic Programming", companies: "Google, Amazon" },
    { id: 91, name: "Maximal Rectangle", url: "https://leetcode.com/problems/maximal-rectangle/", difficulty: "hard", pattern: "2D Dynamic Programming", companies: "Google, Amazon" },
    { id: 92, name: "Burst Balloons", url: "https://leetcode.com/problems/burst-balloons/", difficulty: "hard", pattern: "2D Dynamic Programming", companies: "Google" },
    { id: 93, name: "Regular Expression Matching", url: "https://leetcode.com/problems/regular-expression-matching/", difficulty: "hard", pattern: "2D Dynamic Programming", companies: "Google, Meta, Amazon" },

    // Greedy
    { id: 94, name: "Maximum Subarray", url: "https://leetcode.com/problems/maximum-subarray/", difficulty: "medium", pattern: "Greedy", companies: "Amazon, Google, Meta" },
    { id: 95, name: "Jump Game", url: "https://leetcode.com/problems/jump-game/", difficulty: "medium", pattern: "Greedy", companies: "Amazon, Google" },
    { id: 96, name: "Jump Game II", url: "https://leetcode.com/problems/jump-game-ii/", difficulty: "medium", pattern: "Greedy", companies: "Amazon, Google" },
    { id: 97, name: "Gas Station", url: "https://leetcode.com/problems/gas-station/", difficulty: "medium", pattern: "Greedy", companies: "Amazon, Google" },
    { id: 98, name: "Hand of Straights", url: "https://leetcode.com/problems/hand-of-straights/", difficulty: "medium", pattern: "Greedy", companies: "Google" },
    { id: 99, name: "Partition Labels", url: "https://leetcode.com/problems/partition-labels/", difficulty: "medium", pattern: "Greedy", companies: "Amazon" },
    { id: 100, name: "Merge Intervals", url: "https://leetcode.com/problems/merge-intervals/", difficulty: "medium", pattern: "Greedy", companies: "Google, Amazon, Meta" },
    { id: 101, name: "Insert Interval", url: "https://leetcode.com/problems/insert-interval/", difficulty: "medium", pattern: "Greedy", companies: "Google, Amazon" },
    { id: 102, name: "Non-overlapping Intervals", url: "https://leetcode.com/problems/non-overlapping-intervals/", difficulty: "medium", pattern: "Greedy", companies: "Google, Amazon" },

    // Intervals
    { id: 103, name: "Meeting Rooms", url: "https://leetcode.com/problems/meeting-rooms/", difficulty: "easy", pattern: "Intervals", companies: "Google, Amazon" },
    { id: 104, name: "Meeting Rooms II", url: "https://leetcode.com/problems/meeting-rooms-ii/", difficulty: "medium", pattern: "Intervals", companies: "Google, Amazon, Meta" },
    { id: 105, name: "Minimum Interval to Include Each Query", url: "https://leetcode.com/problems/minimum-interval-to-include-each-query/", difficulty: "hard", pattern: "Intervals", companies: "Google" },

    // Math & Geometry
    { id: 106, name: "Rotate Image", url: "https://leetcode.com/problems/rotate-image/", difficulty: "medium", pattern: "Math & Geometry", companies: "Amazon, Google, Meta" },
    { id: 107, name: "Spiral Matrix", url: "https://leetcode.com/problems/spiral-matrix/", difficulty: "medium", pattern: "Math & Geometry", companies: "Amazon, Google" },
    { id: 108, name: "Set Matrix Zeroes", url: "https://leetcode.com/problems/set-matrix-zeroes/", difficulty: "medium", pattern: "Math & Geometry", companies: "Amazon, Meta" },
    { id: 109, name: "Happy Number", url: "https://leetcode.com/problems/happy-number/", difficulty: "easy", pattern: "Math & Geometry", companies: "Google" },
    { id: 110, name: "Plus One", url: "https://leetcode.com/problems/plus-one/", difficulty: "easy", pattern: "Math & Geometry", companies: "Google" },
    { id: 111, name: "Pow(x, n)", url: "https://leetcode.com/problems/powx-n/", difficulty: "medium", pattern: "Math & Geometry", companies: "Meta, Google" },

    // Bit Manipulation
    { id: 112, name: "Number of 1 Bits", url: "https://leetcode.com/problems/number-of-1-bits/", difficulty: "easy", pattern: "Bit Manipulation", companies: "Google" },
    { id: 113, name: "Counting Bits", url: "https://leetcode.com/problems/counting-bits/", difficulty: "easy", pattern: "Bit Manipulation", companies: "Google" },
    { id: 114, name: "Reverse Bits", url: "https://leetcode.com/problems/reverse-bits/", difficulty: "easy", pattern: "Bit Manipulation", companies: "Google, Apple" },
    { id: 115, name: "Missing Number", url: "https://leetcode.com/problems/missing-number/", difficulty: "easy", pattern: "Bit Manipulation", companies: "Amazon, Google" },
    { id: 116, name: "Single Number", url: "https://leetcode.com/problems/single-number/", difficulty: "easy", pattern: "Bit Manipulation", companies: "Amazon" },
    { id: 117, name: "Sum of Two Integers", url: "https://leetcode.com/problems/sum-of-two-integers/", difficulty: "medium", pattern: "Bit Manipulation", companies: "Google" },

    // Additional important problems
    { id: 118, name: "Subarray Sum Equals K", url: "https://leetcode.com/problems/subarray-sum-equals-k/", difficulty: "medium", pattern: "Arrays & Hashing", companies: "Meta, Google, Amazon" },
    { id: 119, name: "Sort Colors", url: "https://leetcode.com/problems/sort-colors/", difficulty: "medium", pattern: "Two Pointers", companies: "Amazon, Google" },
    { id: 120, name: "Next Permutation", url: "https://leetcode.com/problems/next-permutation/", difficulty: "medium", pattern: "Arrays & Hashing", companies: "Google, Amazon, Meta" },
    { id: 121, name: "Reorder Data in Log Files", url: "https://leetcode.com/problems/reorder-data-in-log-files/", difficulty: "medium", pattern: "Arrays & Hashing", companies: "Amazon" },
    { id: 122, name: "Min Cost Climbing Stairs", url: "https://leetcode.com/problems/min-cost-climbing-stairs/", difficulty: "easy", pattern: "1D Dynamic Programming", companies: "Amazon" },
    { id: 123, name: "Diameter of Binary Tree", url: "https://leetcode.com/problems/diameter-of-binary-tree/", difficulty: "easy", pattern: "Trees", companies: "Meta, Google, Amazon" },
    { id: 124, name: "Balanced Binary Tree", url: "https://leetcode.com/problems/balanced-binary-tree/", difficulty: "easy", pattern: "Trees", companies: "Amazon, Google" },
    { id: 125, name: "Binary Tree Right Side View", url: "https://leetcode.com/problems/binary-tree-right-side-view/", difficulty: "medium", pattern: "Trees", companies: "Meta, Amazon" },
    { id: 126, name: "Count Good Nodes in Binary Tree", url: "https://leetcode.com/problems/count-good-nodes-in-binary-tree/", difficulty: "medium", pattern: "Trees", companies: "Amazon, Google" },
    { id: 127, name: "Surrounded Regions", url: "https://leetcode.com/problems/surrounded-regions/", difficulty: "medium", pattern: "Graphs", companies: "Google, Amazon" },
    { id: 128, name: "Redundant Connection", url: "https://leetcode.com/problems/redundant-connection/", difficulty: "medium", pattern: "Graphs", companies: "Google" },
    { id: 129, name: "Swim in Rising Water", url: "https://leetcode.com/problems/swim-in-rising-water/", difficulty: "hard", pattern: "Graphs", companies: "Google" },
    { id: 130, name: "Design Twitter", url: "https://leetcode.com/problems/design-twitter/", difficulty: "medium", pattern: "Heap / Priority Queue", companies: "Amazon" },
    
    // Additional NeetCode 150 Missing Problems
    { id: 131, name: "Copy List with Random Pointer", url: "https://leetcode.com/problems/copy-list-with-random-pointer/", difficulty: "medium", pattern: "Linked List", companies: "Amazon, Meta" },
    { id: 132, name: "Find the Duplicate Number", url: "https://leetcode.com/problems/find-the-duplicate-number/", difficulty: "medium", pattern: "Two Pointers", companies: "Amazon, Microsoft" },
    { id: 133, name: "Permutation in String", url: "https://leetcode.com/problems/permutation-in-string/", difficulty: "medium", pattern: "Sliding Window", companies: "Meta, Google" },
    { id: 134, name: "Time Based Key-Value Store", url: "https://leetcode.com/problems/time-based-key-value-store/", difficulty: "medium", pattern: "Binary Search", companies: "Google, Meta" },
    { id: 135, name: "Find Median from Data Stream", url: "https://leetcode.com/problems/find-median-from-data-stream/", difficulty: "hard", pattern: "Heap / Priority Queue", companies: "Amazon, Apple" },
    { id: 136, name: "Cheapest Flights Within K Stops", url: "https://leetcode.com/problems/cheapest-flights-within-k-stops/", difficulty: "medium", pattern: "Graphs", companies: "Amazon, Airbnb" },
    { id: 137, name: "Network Delay Time", url: "https://leetcode.com/problems/network-delay-time/", difficulty: "medium", pattern: "Graphs", companies: "Google, Amazon" },
    { id: 138, name: "Design Add and Search Words Data Structure", url: "https://leetcode.com/problems/design-add-and-search-words-data-structure/", difficulty: "medium", pattern: "Tries", companies: "Meta, Google" },
    { id: 139, name: "Design In-Memory File System", url: "https://leetcode.com/problems/design-in-memory-file-system/", difficulty: "hard", pattern: "Tries", companies: "Amazon, Google" },
    { id: 140, name: "Basic Calculator", url: "https://leetcode.com/problems/basic-calculator/", difficulty: "hard", pattern: "Stack", companies: "Meta, Google" },
    { id: 141, name: "Longest Valid Parentheses", url: "https://leetcode.com/problems/longest-valid-parentheses/", difficulty: "hard", pattern: "Stack", companies: "Amazon, Google" },
    { id: 142, name: "Sliding Window Maximum", url: "https://leetcode.com/problems/sliding-window-maximum/", difficulty: "hard", pattern: "Sliding Window", companies: "Google, Amazon" },
    { id: 143, name: "Sudoku Solver", url: "https://leetcode.com/problems/sudoku-solver/", difficulty: "hard", pattern: "Backtracking", companies: "Amazon, Meta" },
    { id: 144, name: "N-Queens II", url: "https://leetcode.com/problems/n-queens-ii/", difficulty: "hard", pattern: "Backtracking", companies: "Google, Amazon" },
    { id: 145, name: "Word Search II", url: "https://leetcode.com/problems/word-search-ii/", difficulty: "hard", pattern: "Tries", companies: "Amazon, Google" },
    { id: 146, name: "Merge k Sorted Lists", url: "https://leetcode.com/problems/merge-k-sorted-lists/", difficulty: "hard", pattern: "Linked List", companies: "Amazon, Google, Meta" },
    { id: 147, name: "Trapping Rain Water", url: "https://leetcode.com/problems/trapping-rain-water/", difficulty: "hard", pattern: "Two Pointers", companies: "Google, Amazon, Meta" },
    { id: 148, name: "Largest Rectangle in Histogram", url: "https://leetcode.com/problems/largest-rectangle-in-histogram/", difficulty: "hard", pattern: "Stack", companies: "Google, Amazon" },
    { id: 149, name: "Edit Distance", url: "https://leetcode.com/problems/edit-distance/", difficulty: "hard", pattern: "2D Dynamic Programming", companies: "Google, Amazon" },
    { id: 150, name: "Regular Expression Matching", url: "https://leetcode.com/problems/regular-expression-matching/", difficulty: "hard", pattern: "2D Dynamic Programming", companies: "Google, Meta, Amazon" },
    
    // Top 25 Advanced & Frequent FAANG Problems
    { id: 151, name: "Serialize and Deserialize BST", url: "https://leetcode.com/problems/serialize-and-deserialize-bst/", difficulty: "medium", pattern: "Trees", companies: "Amazon, Meta" },
    { id: 152, name: "LRU Cache", url: "https://leetcode.com/problems/lru-cache/", difficulty: "medium", pattern: "Design", companies: "Amazon, Microsoft, Meta" },
    { id: 153, name: "LFU Cache", url: "https://leetcode.com/problems/lfu-cache/", difficulty: "hard", pattern: "Design", companies: "Amazon, Google" },
    { id: 154, name: "Find First and Last Position of Element in Sorted Array", url: "https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/", difficulty: "medium", pattern: "Binary Search", companies: "Meta, Amazon" },
    { id: 155, name: "Merge Intervals", url: "https://leetcode.com/problems/merge-intervals/", difficulty: "medium", pattern: "Intervals", companies: "Google, Amazon, Meta" },
    { id: 156, name: "Insert Interval", url: "https://leetcode.com/problems/insert-interval/", difficulty: "medium", pattern: "Intervals", companies: "Google, Amazon" },
    { id: 157, name: "Meeting Rooms II", url: "https://leetcode.com/problems/meeting-rooms-ii/", difficulty: "medium", pattern: "Intervals", companies: "Google, Amazon, Meta" },
    { id: 158, name: "Alien Dictionary", url: "https://leetcode.com/problems/alien-dictionary/", difficulty: "hard", pattern: "Graphs / Topological Sort", companies: "Meta, Amazon" },
    { id: 159, name: "Graph Valid Tree", url: "https://leetcode.com/problems/graph-valid-tree/", difficulty: "medium", pattern: "Graphs", companies: "Google, LinkedIn" },
    { id: 160, name: "Number of Connected Components", url: "https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/", difficulty: "medium", pattern: "Graphs", companies: "Google, Amazon" },
    { id: 161, name: "Course Schedule III", url: "https://leetcode.com/problems/course-schedule-iii/", difficulty: "hard", pattern: "Greedy / Heap", companies: "Google" },
    { id: 162, name: "Kth Smallest Element in a Sorted Matrix", url: "https://leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix/", difficulty: "medium", pattern: "Binary Search / Heap", companies: "Amazon, Google" },
    { id: 163, name: "Find K Pairs with Smallest Sums", url: "https://leetcode.com/problems/find-k-pairs-with-smallest-sums/", difficulty: "medium", pattern: "Heap", companies: "Amazon, Google" },
    { id: 164, name: "Longest Increasing Path in a Matrix", url: "https://leetcode.com/problems/longest-increasing-path-in-a-matrix/", difficulty: "hard", pattern: "Graphs / DFS", companies: "Google, Meta" },
    { id: 165, name: "Distinct Subsequences", url: "https://leetcode.com/problems/distinct-subsequences/", difficulty: "hard", pattern: "2D Dynamic Programming", companies: "Amazon, Google" },
    { id: 166, name: "Word Break II", url: "https://leetcode.com/problems/word-break-ii/", difficulty: "hard", pattern: "Backtracking / DP", companies: "Amazon, Meta" },
    { id: 167, name: "Remove Invalid Parentheses", url: "https://leetcode.com/problems/remove-invalid-parentheses/", difficulty: "hard", pattern: "BFS / Backtracking", companies: "Meta, Amazon" },
    { id: 168, name: "Minimum Window Substring", url: "https://leetcode.com/problems/minimum-window-substring/", difficulty: "hard", pattern: "Sliding Window", companies: "Meta, Google, Amazon" },
    { id: 169, name: "Valid Number", url: "https://leetcode.com/problems/valid-number/", difficulty: "hard", pattern: "Math / String", companies: "Meta" },
    { id: 170, name: "Integer to English Words", url: "https://leetcode.com/problems/integer-to-english-words/", difficulty: "hard", pattern: "Math / String", companies: "Meta, Amazon" },
    { id: 171, name: "Design Search Autocomplete System", url: "https://leetcode.com/problems/design-search-autocomplete-system/", difficulty: "hard", pattern: "Tries", companies: "Google, Amazon" },
    { id: 172, name: "String to Integer (atoi)", url: "https://leetcode.com/problems/string-to-integer-atoi/", difficulty: "medium", pattern: "String", companies: "Amazon, Google" },
    { id: 173, name: "Valid Sudoku", url: "https://leetcode.com/problems/valid-sudoku/", difficulty: "medium", pattern: "Arrays & Hashing", companies: "Amazon, Apple" },
    { id: 174, name: "First Missing Positive", url: "https://leetcode.com/problems/first-missing-positive/", difficulty: "hard", pattern: "Arrays & Hashing", companies: "Amazon, Meta" },
    { id: 175, name: "Max Points on a Line", url: "https://leetcode.com/problems/max-points-on-a-line/", difficulty: "hard", pattern: "Math / Geometry", companies: "Google, Apple" },

    // Atlassian Focus — Top Interview Problems
    { id: 176, name: "Flatten Nested List Iterator", url: "https://leetcode.com/problems/flatten-nested-list-iterator/", difficulty: "medium", pattern: "Stack / Design", companies: "Atlassian, Google" },
    { id: 177, name: "Design Hit Counter", url: "https://leetcode.com/problems/design-hit-counter/", difficulty: "medium", pattern: "Design", companies: "Atlassian, Google" },
    { id: 178, name: "Snake Game", url: "https://leetcode.com/problems/design-snake-game/", difficulty: "medium", pattern: "Design", companies: "Atlassian, Google" },
    { id: 179, name: "Time Based Key Value Store", url: "https://leetcode.com/problems/time-based-key-value-store/", difficulty: "medium", pattern: "Binary Search / Design", companies: "Atlassian, Google" },
    { id: 180, name: "Design File System", url: "https://leetcode.com/problems/design-file-system/", difficulty: "medium", pattern: "Tries / Design", companies: "Atlassian, Amazon" },
    { id: 181, name: "Rate Limiter (Sliding Window Log)", url: "https://leetcode.com/problems/logger-rate-limiter/", difficulty: "easy", pattern: "Design", companies: "Atlassian, Google" },
    { id: 182, name: "Minimum Knight Moves", url: "https://leetcode.com/problems/minimum-knight-moves/", difficulty: "medium", pattern: "BFS", companies: "Atlassian, Amazon" },
    { id: 183, name: "Find All Anagrams in a String", url: "https://leetcode.com/problems/find-all-anagrams-in-a-string/", difficulty: "medium", pattern: "Sliding Window", companies: "Atlassian, Amazon" },
    { id: 184, name: "Top K Frequent Words", url: "https://leetcode.com/problems/top-k-frequent-words/", difficulty: "medium", pattern: "Heap / Priority Queue", companies: "Atlassian, Amazon, Google" },
    { id: 185, name: "Implement Queue using Stacks", url: "https://leetcode.com/problems/implement-queue-using-stacks/", difficulty: "easy", pattern: "Stack / Design", companies: "Atlassian, Microsoft" },
    { id: 186, name: "Min Stack", url: "https://leetcode.com/problems/min-stack/", difficulty: "medium", pattern: "Stack / Design", companies: "Atlassian, Amazon" },
    { id: 187, name: "Exclusive Time of Functions", url: "https://leetcode.com/problems/exclusive-time-of-functions/", difficulty: "medium", pattern: "Stack", companies: "Atlassian, Meta" },
    { id: 188, name: "Text Justification", url: "https://leetcode.com/problems/text-justification/", difficulty: "hard", pattern: "String", companies: "Atlassian, Google" },
    { id: 189, name: "Design Tic-Tac-Toe", url: "https://leetcode.com/problems/design-tic-tac-toe/", difficulty: "medium", pattern: "Design", companies: "Atlassian, Meta" },
    { id: 190, name: "Shortest Path in Binary Matrix", url: "https://leetcode.com/problems/shortest-path-in-binary-matrix/", difficulty: "medium", pattern: "BFS", companies: "Atlassian, Meta" },
    { id: 191, name: "All Nodes Distance K in Binary Tree", url: "https://leetcode.com/problems/all-nodes-distance-k-in-binary-tree/", difficulty: "medium", pattern: "Trees / BFS", companies: "Atlassian, Amazon" },
    { id: 192, name: "Number of Provinces", url: "https://leetcode.com/problems/number-of-provinces/", difficulty: "medium", pattern: "Graphs / Union Find", companies: "Atlassian, Amazon" },
    { id: 193, name: "Group Shifted Strings", url: "https://leetcode.com/problems/group-shifted-strings/", difficulty: "medium", pattern: "Arrays & Hashing", companies: "Atlassian, Google" },
    { id: 194, name: "Design Circular Queue", url: "https://leetcode.com/problems/design-circular-queue/", difficulty: "medium", pattern: "Design", companies: "Atlassian, Amazon" },
    { id: 195, name: "Snapshot Array", url: "https://leetcode.com/problems/snapshot-array/", difficulty: "medium", pattern: "Binary Search / Design", companies: "Atlassian, Google" },
];

// ==========================================
// DATA: System Design Questions
// ==========================================
const SYSTEM_DESIGN = [
    {
        title: "Design URL Shortener (TinyURL)",
        desc: "Key-value stores, hashing, collision handling, read-heavy caching. Classic question — asked at almost every company.",
        companies: ["Google", "Amazon", "Meta"],
        links: [
            { text: "ByteByteGo Video", url: "https://www.youtube.com/watch?v=fMZMm_0ZhK4" },
            { text: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer#design-pastebincom-or-bitly" },
        ]
    },
    {
        title: "Design Instagram / Social Feed",
        desc: "Fan-out strategies, news feed ranking, data modeling for read/write-heavy workloads, caching & CDN.",
        companies: ["Meta", "Google", "Amazon"],
        links: [
            { text: "Gaurav Sen Video", url: "https://www.youtube.com/watch?v=QmX2NPkJTKg" },
            { text: "HelloInterview Guide", url: "https://www.hellointerview.com/learn/system-design/answer-keys/instagram" },
        ]
    },
    {
        title: "Design WhatsApp / Chat System",
        desc: "Real-time communication, WebSockets, message ordering, presence indicators, end-to-end encryption.",
        companies: ["Meta", "Google", "Amazon"],
        links: [
            { text: "Gaurav Sen Video", url: "https://www.youtube.com/watch?v=vvhC64hQZMk" },
            { text: "Design Gurus", url: "https://www.designgurus.io/course-play/grokking-the-system-design-interview/doc/638c0b5dac93e7ae59a1af6b" },
        ]
    },
    {
        title: "Design YouTube / Netflix (Video Streaming)",
        desc: "CDN strategy, video transcoding pipeline, adaptive bitrate streaming, recommendation engine.",
        companies: ["Netflix", "Google", "Amazon"],
        links: [
            { text: "ByteByteGo Video", url: "https://www.youtube.com/watch?v=jPKTo1iGQiE" },
            { text: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer" },
        ]
    },
    {
        title: "Design Twitter / X",
        desc: "Timeline generation (fan-out on write vs read), tweet storage, trending topics, search.",
        companies: ["Meta", "Google", "Amazon"],
        links: [
            { text: "Gaurav Sen Video", url: "https://www.youtube.com/watch?v=wYk0xPP_P_8" },
            { text: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer#design-the-twitter-timeline-and-search" },
        ]
    },
    {
        title: "Design Dropbox / Google Drive",
        desc: "File chunking, data synchronization, conflict resolution, storage optimization.",
        companies: ["Google", "Amazon", "Apple"],
        links: [
            { text: "ByteByteGo Video", url: "https://www.youtube.com/watch?v=U0xTu6E2CT8" },
            { text: "HelloInterview Guide", url: "https://www.hellointerview.com/learn/system-design/answer-keys/dropbox" },
        ]
    },
    {
        title: "Design API Rate Limiter",
        desc: "Token bucket / sliding window algorithms, distributed state, API infrastructure.",
        companies: ["Google", "Amazon", "Meta"],
        links: [
            { text: "ByteByteGo Video", url: "https://www.youtube.com/watch?v=FU4WlwfS3G0" },
            { text: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer" },
        ]
    },
    {
        title: "Design Web Crawler",
        desc: "Distributed task scheduling, URL frontier, politeness policies, deduplication.",
        companies: ["Google", "Amazon"],
        links: [
            { text: "ByteByteGo Video", url: "https://www.youtube.com/watch?v=BKZxZwUgL3Y" },
            { text: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer#design-a-web-crawler" },
        ]
    },
    {
        title: "Design Uber / Ride-Sharing",
        desc: "Geospatial indexing, real-time matching, location tracking, pricing algorithms.",
        companies: ["Google", "Amazon"],
        links: [
            { text: "Gaurav Sen Video", url: "https://www.youtube.com/watch?v=umWABit-wbk" },
            { text: "HelloInterview Guide", url: "https://www.hellointerview.com/learn/system-design/answer-keys/uber" },
        ]
    },
    {
        title: "Design Distributed Key-Value Store",
        desc: "CAP theorem, consistent hashing, partitioning, replication, conflict resolution.",
        companies: ["Google", "Amazon", "Apple"],
        links: [
            { text: "ByteByteGo Video", url: "https://www.youtube.com/watch?v=rnZmdmlR-2M" },
            { text: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer" },
        ]
    },
    {
        title: "Design Notification Service",
        desc: "Push notifications, email/SMS, rate limiting, priority queues, delivery guarantees.",
        companies: ["Amazon", "Meta", "Apple"],
        links: [
            { text: "ByteByteGo Video", url: "https://www.youtube.com/watch?v=CUwt9_l0DOg" },
            { text: "HelloInterview Guide", url: "https://www.hellointerview.com/learn/system-design/answer-keys/notification-system" },
        ]
    },
    {
        title: "Design Search Autocomplete",
        desc: "Trie data structure, caching, ranking, personalization, real-time suggestions.",
        companies: ["Google", "Amazon", "Meta"],
        links: [
            { text: "ByteByteGo Video", url: "https://www.youtube.com/watch?v=us0qySiUsGU" },
        ]
    },
    {
        title: "Design a Distributed Message Queue (Kafka)",
        desc: "Topics, partitions, consumer groups, write-ahead logs (WAL), zookeeper/kraft.",
        companies: ["Google", "Amazon"],
        links: [
            { text: "ByteByteGo Video", url: "https://www.youtube.com/watch?v=vJvqnuPEKXc" },
        ]
    },
    {
        title: "Design a Location-Based Service (Yelp)",
        desc: "Geohash, Quadtree, spatial indexing, read-heavy caching architecture.",
        companies: ["Google", "Amazon", "Meta"],
        links: [
            { text: "HelloInterview Guide", url: "https://www.hellointerview.com/learn/system-design/answer-keys/yelp" },
        ]
    },
    {
        title: "Design a Rate Limiter",
        desc: "Token bucket, leaking bucket, fixed window, sliding window log, sliding window counter.",
        companies: ["Amazon", "Google", "Meta"],
        links: [
            { text: "ByteByteGo Video", url: "https://www.youtube.com/watch?v=FU4WlwfS3G0" },
        ]
    },
];

// System Design Concepts
const SD_CONCEPTS = [
    "Load Balancing (Round Robin, Least Connections, IP Hash)",
    "Caching (Redis, Memcached, CDN caching, Cache invalidation strategies)",
    "Database Sharding & Partitioning (Horizontal vs Vertical)",
    "SQL vs NoSQL (When to use which, trade-offs)",
    "CAP Theorem (Consistency, Availability, Partition Tolerance)",
    "Consistent Hashing",
    "Message Queues (Kafka, RabbitMQ, SQS)",
    "Microservices vs Monolith Architecture",
    "API Design (REST, GraphQL, gRPC)",
    "Rate Limiting (Token Bucket, Sliding Window)",
    "CDN (Content Delivery Network)",
    "DNS Resolution",
    "Reverse Proxy vs Forward Proxy",
    "Replication (Master-Slave, Multi-Master)",
    "ACID Properties & Transactions",
    "Indexing (B-Tree, Hash Index, Full-Text)",
    "WebSockets vs HTTP Long Polling vs SSE",
    "OAuth2 & JWT Authentication",
    "Bloom Filters",
    "Pub/Sub Pattern",
    "SOLID Principles",
    "Design Patterns (Singleton, Factory, Observer, Strategy)",
    "Scalability (Vertical vs Horizontal)",
    "Data Encoding (Protocol Buffers, Avro, Thrift)",
];

// ==========================================
// DATA: Behavioral Questions
// ==========================================
const BEHAVIORAL_DATA = [
    {
        category: "Leadership & Ownership",
        tag: "Amazon LP: Ownership",
        questions: [
            "Tell me about a time you took on something outside your responsibilities.",
            "Describe a situation where you had to make a decision without all the information.",
            "Tell me about a project where you had to take full ownership.",
            "Give me an example of when you saw a problem and took the initiative to fix it.",
        ]
    },
    {
        category: "Conflict Resolution",
        tag: "Amazon LP: Earn Trust",
        questions: [
            "Tell me about a time you disagreed with your manager or teammate.",
            "Describe a situation where you had to push back on someone's idea.",
            "How did you handle a situation where two team members had conflicting approaches?",
            "Tell me about a time you received harsh feedback and what you did about it.",
        ]
    },
    {
        category: "Problem Solving Under Pressure",
        tag: "Amazon LP: Deliver Results",
        questions: [
            "Tell me about a time you had to meet a tight deadline.",
            "Describe a situation where a project was failing and you had to turn it around.",
            "Give an example of when you had to prioritize between multiple urgent tasks.",
            "Tell me about the most challenging technical problem you've solved.",
        ]
    },
    {
        category: "Innovation & Simplification",
        tag: "Amazon LP: Invent & Simplify",
        questions: [
            "Tell me about a time you simplified a complex process.",
            "Describe an innovative solution you implemented.",
            "Give me an example of when you automated something.",
            "Tell me about a time you proposed a new approach that improved efficiency.",
        ]
    },
    {
        category: "Customer Focus",
        tag: "Amazon LP: Customer Obsession",
        questions: [
            "Tell me about a time you went above and beyond for a customer/user.",
            "Describe a situation where you had to balance customer needs with business constraints.",
            "Give an example of when you used customer feedback to drive a product decision.",
            "Tell me about a time you anticipated a customer's future need.",
        ]
    },
    {
        category: "Teamwork & Collaboration",
        tag: "Common at All FAANG",
        questions: [
            "Describe your most successful team collaboration.",
            "Tell me about a time you helped a struggling teammate.",
            "How do you handle working with someone whose style is very different from yours?",
            "Give an example of when you had to influence others without authority.",
        ]
    },
    {
        category: "Failure & Learning",
        tag: "Amazon LP: Learn & Be Curious",
        questions: [
            "Tell me about your biggest professional failure.",
            "Describe a time a project you led didn't go as planned.",
            "What's the most important lesson you've learned from a mistake?",
            "Tell me about a time you had to learn a new technology quickly.",
        ]
    },
    {
        category: "Technical Depth",
        tag: "Amazon LP: Dive Deep",
        questions: [
            "Tell me about a complex system you designed or architected.",
            "Describe a time you had to debug a particularly tricky issue.",
            "Walk me through how you'd investigate a production outage.",
            "Tell me about a time you used data to make a technical decision.",
        ]
    },
    {
        category: "Bias for Action",
        tag: "Amazon LP: Bias for Action",
        questions: [
            "Tell me about a time you had to make a decision quickly with incomplete information.",
            "Describe a situation where you took a calculated risk and it failed.",
            "Give me an example of when you didn't have time to get permission and just acted.",
            "Tell me about a time you saw an opportunity to improve something and took immediate action.",
        ]
    },
    {
        category: "Have Backbone; Disagree and Commit",
        tag: "Amazon LP: Disagree & Commit",
        questions: [
            "Tell me about a time you strongly disagreed with your manager's decision.",
            "Describe a situation where you had to champion an unpopular idea.",
            "Give me an example of when you had to commit to a decision you didn't agree with.",
            "Tell me about a time you had to push back on a customer or stakeholder.",
        ]
    },
];

// ==========================================
// APP STATE & STORAGE
// ==========================================
const STORAGE_KEY = "faang_crack_data";
const START_DATE_KEY = "faang_crack_start";

function loadState() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : getDefaultState();
    } catch {
        return getDefaultState();
    }
}

function getDefaultState() {
    return {
        solvedProblems: {},
        roadmapChecks: {},
        sdChecks: {},
        conceptChecks: {},
        behavioralChecks: {},
        stories: [],
        dailyLogs: {},
        streak: 0,
        totalHours: 0,
        confidenceLevel: 0,
    };
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

function getStartDate() {
    let d = localStorage.getItem(START_DATE_KEY);
    if (!d) {
        d = new Date().toISOString().split('T')[0];
        localStorage.setItem(START_DATE_KEY, d);
    }
    return new Date(d);
}

// ==========================================
// NAVIGATION
// ==========================================
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link, .mobile-link');
    const sections = document.querySelectorAll('.section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.dataset.section;

            // Update active nav
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll(`.nav-link[data-section="${targetId}"]`).forEach(l => l.classList.add('active'));

            // Show section
            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');

            // Close mobile menu
            document.getElementById('mobileMenu').classList.remove('open');

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // Mobile menu toggle
    document.getElementById('mobileMenuBtn').addEventListener('click', () => {
        document.getElementById('mobileMenu').classList.toggle('open');
    });
}

// ==========================================
// DASHBOARD
// ==========================================
function updateDashboard() {
    // Days remaining
    const startDate = getStartDate();
    const now = new Date();
    const daysPassed = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, 60 - daysPassed);
    document.getElementById('daysRemaining').textContent = daysRemaining;

    const pct = Math.min(100, Math.round((daysPassed / 60) * 100));
    document.getElementById('daysRing').setAttribute('stroke-dasharray', `${pct}, 100`);

    // Problems solved
    const solved = Object.keys(state.solvedProblems).filter(k => state.solvedProblems[k]).length;
    document.getElementById('problemsSolved').textContent = solved;

    // Topics completed (roadmap checks)
    const topicsCompleted = Object.keys(state.roadmapChecks).filter(k => state.roadmapChecks[k]).length;
    document.getElementById('topicsCompleted').textContent = topicsCompleted;

    // Total hours
    let totalHours = 0;
    Object.values(state.dailyLogs).forEach(log => { totalHours += (log.hours || 0); });
    document.getElementById('totalHours').textContent = totalHours;

    // Progress bars
    const dsaPct = Math.round((solved / DSA_PROBLEMS.length) * 100);
    document.getElementById('dsaProgress').textContent = dsaPct + '%';
    document.getElementById('dsaBar').style.width = dsaPct + '%';

    const sdSolved = Object.keys(state.sdChecks).filter(k => state.sdChecks[k]).length;
    const sdPct = Math.round((sdSolved / SYSTEM_DESIGN.length) * 100);
    document.getElementById('sdProgress').textContent = sdPct + '%';
    document.getElementById('sdBar').style.width = sdPct + '%';

    let behTotal = 0, behDone = 0;
    BEHAVIORAL_DATA.forEach(cat => {
        cat.questions.forEach((_, i) => {
            behTotal++;
            if (state.behavioralChecks[`${cat.category}-${i}`]) behDone++;
        });
    });
    const behPct = behTotal > 0 ? Math.round((behDone / behTotal) * 100) : 0;
    document.getElementById('behProgress').textContent = behPct + '%';
    document.getElementById('behBar').style.width = behPct + '%';

    const conceptsDone = Object.keys(state.conceptChecks).filter(k => state.conceptChecks[k]).length;
    const csPct = Math.round((conceptsDone / SD_CONCEPTS.length) * 100);
    document.getElementById('csProgress').textContent = csPct + '%';
    document.getElementById('csBar').style.width = csPct + '%';

    // Streak
    updateStreak();

    // Tonight's focus
    updateTonightFocus(daysPassed);

    // Heatmap
    renderHeatmap(daysPassed);
}

function updateStreak() {
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    let checkDate = new Date();

    for (let i = 0; i < 60; i++) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (state.dailyLogs[dateStr] && state.dailyLogs[dateStr].problems > 0) {
            streak++;
        } else if (dateStr !== today) {
            break;
        }
        checkDate.setDate(checkDate.getDate() - 1);
    }

    state.streak = streak;
    document.getElementById('streakCount').textContent = streak;
}

function updateTonightFocus(daysPassed) {
    let phase, tasks;

    if (daysPassed < 14) {
        phase = "Phase 1 — Arrays, Strings, Hashing, Two Pointers";
        tasks = [
            "🧠 Warm-up: 1 Easy problem (speed drill)",
            "📚 Learn: " + (daysPassed < 7 ? "Two Pointers / Sliding Window" : "Binary Search / Prefix Sum"),
            "💻 Solve: 2-3 NeetCode 150 problems",
            "📖 CS Fundamentals: " + ["OS Processes", "Memory Management", "Networking Basics", "TCP/IP & HTTP", "DBMS Normalization", "SQL Joins", "Deadlocks"][daysPassed % 7],
        ];
    } else if (daysPassed < 28) {
        phase = "Phase 2 — Linked Lists, Stacks, Trees, Heaps";
        tasks = [
            "🧠 Warm-up: 1 Medium from Phase 1",
            "📚 Learn: " + (daysPassed < 21 ? "Trees & BST Traversals" : "Heaps & Tries"),
            "💻 Solve: 2-3 Tree/LinkedList problems",
            "🎤 Behavioral: Write 2 STAR stories",
        ];
    } else if (daysPassed < 42) {
        phase = "Phase 3 — Graphs, DP, Backtracking";
        tasks = [
            "🧠 Warm-up: 1 Medium (timed, 15 min)",
            "📚 Learn: " + (daysPassed < 35 ? "Dynamic Programming Patterns" : "Graph Algorithms (BFS/DFS/Topological)"),
            "💻 Solve: 1 Medium + 1 Hard problem",
            "🏛️ System Design: Start basics (Scalability, Caching)",
        ];
    } else if (daysPassed < 56) {
        phase = "Phase 4 — System Design + Hard Problems";
        tasks = [
            "🏛️ System Design: Practice 1 design end-to-end",
            "💻 Solve: 1-2 Hard problems",
            "🔁 Revision: Re-solve 2 random previous problems",
            "🎤 Behavioral: Mock round (3 questions, 3 min each)",
        ];
    } else {
        phase = "Phase 5 — FINAL SPRINT 🔥";
        tasks = [
            "🎯 Full Mock Interview",
            "📋 Review & Fix gaps",
            "🔁 Pattern Speed Run (3-4 random Mediums)",
            "🧘 Confidence Building & Visualization",
        ];
    }

    document.getElementById('currentPhase').textContent = phase;
    const tasksList = document.getElementById('tonightTasks');
    tasksList.innerHTML = tasks.map(t => `<li>${t}</li>`).join('');
}

function renderHeatmap(daysPassed) {
    const container = document.getElementById('heatmapContainer');
    container.innerHTML = '';

    for (let i = 0; i < 60; i++) {
        const day = document.createElement('div');
        day.className = 'heatmap-day';

        const date = new Date(getStartDate());
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const log = state.dailyLogs[dateStr];

        let level = 'level-0';
        if (log) {
            const problems = log.problems || 0;
            if (problems >= 5) level = 'level-4';
            else if (problems >= 3) level = 'level-3';
            else if (problems >= 2) level = 'level-2';
            else if (problems >= 1) level = 'level-1';
        }

        day.classList.add(level);
        day.title = `Day ${i + 1} (${dateStr})${log ? ` — ${log.problems || 0} problems, ${log.hours || 0}h` : ' — No activity'}`;

        if (i < daysPassed) {
            day.style.opacity = log ? '1' : '0.5';
        } else if (i === daysPassed) {
            day.style.border = '2px solid var(--accent-secondary)';
        }

        container.appendChild(day);
    }
}

// ==========================================
// DAILY CHECK-IN
// ==========================================
function initCheckin() {
    // Confidence buttons
    document.querySelectorAll('.conf-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.conf-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.confidenceLevel = parseInt(btn.dataset.level);
        });
    });

    // Save button
    document.getElementById('saveCheckin').addEventListener('click', () => {
        const today = new Date().toISOString().split('T')[0];
        const problems = parseInt(document.getElementById('dailyProblems').value) || 0;
        const hours = parseFloat(document.getElementById('dailyHours').value) || 0;
        const notes = document.getElementById('dailyNotes').value;

        state.dailyLogs[today] = {
            problems,
            hours,
            confidence: state.confidenceLevel,
            notes,
            timestamp: Date.now(),
        };

        saveState();
        updateDashboard();
        showToast('Progress saved! Keep grinding! 💪');

        // Reset form
        document.getElementById('dailyProblems').value = 0;
        document.getElementById('dailyHours').value = 0;
        document.getElementById('dailyNotes').value = '';
        document.querySelectorAll('.conf-btn').forEach(b => b.classList.remove('active'));
    });
}

// ==========================================
// ROADMAP CHECKBOXES
// ==========================================
function initRoadmapChecks() {
    document.querySelectorAll('.roadmap-check').forEach(check => {
        const topic = check.dataset.topic;
        check.checked = !!state.roadmapChecks[topic];

        check.addEventListener('change', () => {
            state.roadmapChecks[topic] = check.checked;
            saveState();
            updateDashboard();
        });
    });
}

// ==========================================
// DSA PROBLEMS SECTION
// ==========================================
function renderDSAProblems() {
    const container = document.getElementById('dsaProblems');
    const patterns = [...new Set(DSA_PROBLEMS.map(p => p.pattern))];

    // Populate pattern filter
    const patternFilter = document.getElementById('patternFilter');
    patterns.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        patternFilter.appendChild(opt);
    });

    function render(filter = {}) {
        container.innerHTML = '';
        let solvedCount = 0;
        let totalCount = 0;

        patterns.forEach(pattern => {
            let problems = DSA_PROBLEMS.filter(p => p.pattern === pattern);

            if (filter.difficulty && filter.difficulty !== 'all') {
                problems = problems.filter(p => p.difficulty === filter.difficulty);
            }
            if (filter.status === 'solved') {
                problems = problems.filter(p => state.solvedProblems[p.id]);
            } else if (filter.status === 'unsolved') {
                problems = problems.filter(p => !state.solvedProblems[p.id]);
            }
            if (filter.pattern && filter.pattern !== 'all') {
                if (pattern !== filter.pattern) return;
            }

            if (problems.length === 0) return;

            const patSolved = problems.filter(p => state.solvedProblems[p.id]).length;
            solvedCount += patSolved;
            totalCount += problems.length;

            const group = document.createElement('div');
            group.className = 'pattern-group';

            const header = document.createElement('div');
            header.className = 'pattern-header';
            header.innerHTML = `
                <span class="pattern-title">${pattern}</span>
                <span class="pattern-count">${patSolved}/${problems.length} solved</span>
            `;

            const body = document.createElement('div');
            body.className = 'pattern-problems';

            problems.forEach(p => {
                const row = document.createElement('div');
                row.className = 'problem-row';
                row.dataset.id = p.id;

                const isSolved = !!state.solvedProblems[p.id];

                row.innerHTML = `
                    <input type="checkbox" class="problem-checkbox" data-id="${p.id}" ${isSolved ? 'checked' : ''}>
                    <span class="problem-name"><a href="javascript:void(0)" class="open-modal" data-id="${p.id}">${p.name}</a></span>
                    <span class="problem-difficulty"><span class="diff ${p.difficulty}">${p.difficulty}</span></span>
                    <span class="problem-company">${p.companies.split(',')[0]}</span>
                    <span class="problem-status ${isSolved ? 'status-solved' : 'status-unsolved'}">${isSolved ? '✅ Solved' : '⬜ Todo'}</span>
                `;

                body.appendChild(row);
            });


            header.addEventListener('click', () => {
                body.classList.toggle('open');
            });

            group.appendChild(header);
            group.appendChild(body);
            container.appendChild(group);
        });

        document.getElementById('solvedCount').textContent = Object.keys(state.solvedProblems).filter(k => state.solvedProblems[k]).length;
        document.getElementById('totalCount').textContent = DSA_PROBLEMS.length;
    }

    render();

    // Event delegation for checkboxes
    container.addEventListener('change', (e) => {
        if (e.target.classList.contains('problem-checkbox')) {
            const id = parseInt(e.target.dataset.id);
            state.solvedProblems[id] = e.target.checked;
            saveState();

            // Update the row status
            const row = e.target.closest('.problem-row');
            const statusEl = row.querySelector('.problem-status');
            statusEl.className = `problem-status ${e.target.checked ? 'status-solved' : 'status-unsolved'}`;
            statusEl.textContent = e.target.checked ? '✅ Solved' : '⬜ Todo';

            // Update pattern count
            const group = e.target.closest('.pattern-group');
            const patternTitle = group.querySelector('.pattern-title').textContent;
            const patProblems = DSA_PROBLEMS.filter(p => p.pattern === patternTitle);
            const patSolved = patProblems.filter(p => state.solvedProblems[p.id]).length;
            group.querySelector('.pattern-count').textContent = `${patSolved}/${patProblems.length} solved`;

            document.getElementById('solvedCount').textContent = Object.keys(state.solvedProblems).filter(k => state.solvedProblems[k]).length;
            updateDashboard();
        }
    });

    // Filters
    document.getElementById('difficultyFilter').addEventListener('change', () => {
        render({
            difficulty: document.getElementById('difficultyFilter').value,
            status: document.getElementById('statusFilter').value,
            pattern: document.getElementById('patternFilter').value,
        });
    });
    document.getElementById('statusFilter').addEventListener('change', () => {
        render({
            difficulty: document.getElementById('difficultyFilter').value,
            status: document.getElementById('statusFilter').value,
            pattern: document.getElementById('patternFilter').value,
        });
    });
    document.getElementById('patternFilter').addEventListener('change', () => {
        render({
            difficulty: document.getElementById('difficultyFilter').value,
            status: document.getElementById('statusFilter').value,
            pattern: document.getElementById('patternFilter').value,
        });
    });
}

// ==========================================
// SYSTEM DESIGN SECTION
// ==========================================
function renderSystemDesign() {
    const grid = document.getElementById('sdGrid');
    grid.innerHTML = '';

    SYSTEM_DESIGN.forEach((sd, idx) => {
        const card = document.createElement('div');
        card.className = 'sd-card';

        const companyTags = sd.companies.map(c => {
            const cls = `tag-${c.toLowerCase()}`;
            return `<span class="company-tag ${cls}">${c}</span>`;
        }).join('');

        const links = sd.links.map(l =>
            `<a href="${l.url}" target="_blank" class="sd-link">📺 ${l.text}</a>`
        ).join('');

        card.innerHTML = `
            <div class="sd-card-header">
                <span class="sd-card-title">${sd.title}</span>
                <input type="checkbox" class="sd-card-check" data-idx="${idx}" ${state.sdChecks[idx] ? 'checked' : ''}>
            </div>
            <p class="sd-card-desc">${sd.desc}</p>
            <div class="sd-card-companies">${companyTags}</div>
            <div class="sd-card-links">${links}</div>
        `;

        grid.appendChild(card);
    });

    grid.addEventListener('change', (e) => {
        if (e.target.classList.contains('sd-card-check')) {
            const idx = parseInt(e.target.dataset.idx);
            state.sdChecks[idx] = e.target.checked;
            saveState();
            updateDashboard();
        }
    });

    // Concepts
    const conceptsGrid = document.getElementById('conceptsGrid');
    conceptsGrid.innerHTML = '';
    SD_CONCEPTS.forEach((concept, idx) => {
        const item = document.createElement('div');
        item.className = 'concept-item';
        item.innerHTML = `
            <input type="checkbox" class="concept-check" data-idx="${idx}" ${state.conceptChecks[idx] ? 'checked' : ''}>
            <span>${concept}</span>
        `;
        conceptsGrid.appendChild(item);
    });

    conceptsGrid.addEventListener('change', (e) => {
        if (e.target.classList.contains('concept-check')) {
            const idx = parseInt(e.target.dataset.idx);
            state.conceptChecks[idx] = e.target.checked;
            saveState();
            updateDashboard();
        }
    });
}

// ==========================================
// BEHAVIORAL SECTION
// ==========================================
function renderBehavioral() {
    const grid = document.getElementById('behavioralGrid');
    grid.innerHTML = '';

    BEHAVIORAL_DATA.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'beh-card';

        const questions = cat.questions.map((q, i) => {
            const key = `${cat.category}-${i}`;
            return `
                <li>
                    <input type="checkbox" class="beh-check" data-key="${key}" ${state.behavioralChecks[key] ? 'checked' : ''}>
                    <span>${q}</span>
                </li>
            `;
        }).join('');

        card.innerHTML = `
            <div class="beh-card-header">
                <h4>${cat.category}</h4>
                <span class="beh-card-tag">${cat.tag}</span>
            </div>
            <ul class="beh-questions">${questions}</ul>
        `;

        grid.appendChild(card);
    });

    grid.addEventListener('change', (e) => {
        if (e.target.classList.contains('beh-check')) {
            const key = e.target.dataset.key;
            state.behavioralChecks[key] = e.target.checked;
            saveState();
            updateDashboard();
        }
    });

    // Story Bank
    renderStories();

    document.getElementById('addStoryBtn').addEventListener('click', () => {
        state.stories.push({ title: 'New Story', content: '' });
        saveState();
        renderStories();
    });
}

function renderStories() {
    const bank = document.getElementById('storyBank');
    bank.innerHTML = '';

    state.stories.forEach((story, idx) => {
        const item = document.createElement('div');
        item.className = 'story-item';
        item.innerHTML = `
            <div class="story-header">
                <input type="text" class="story-title-input" value="${story.title}" data-idx="${idx}" placeholder="Story Title">
                <button class="story-delete" data-idx="${idx}">🗑️</button>
            </div>
            <textarea class="story-textarea" data-idx="${idx}" placeholder="Write your STAR story here...&#10;&#10;S (Situation): ...&#10;T (Task): ...&#10;A (Action): ...&#10;R (Result): ...">${story.content}</textarea>
        `;
        bank.appendChild(item);
    });

    // Event listeners for stories
    bank.querySelectorAll('.story-title-input').forEach(input => {
        input.addEventListener('blur', () => {
            const idx = parseInt(input.dataset.idx);
            state.stories[idx].title = input.value;
            saveState();
        });
    });

    bank.querySelectorAll('.story-textarea').forEach(textarea => {
        textarea.addEventListener('blur', () => {
            const idx = parseInt(textarea.dataset.idx);
            state.stories[idx].content = textarea.value;
            saveState();
        });
    });

    bank.querySelectorAll('.story-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.idx);
            state.stories.splice(idx, 1);
            saveState();
            renderStories();
            showToast('Story deleted');
        });
    });
}

// ==========================================
// PROBLEM MODAL & COMPILER
// ==========================================
function initProblemModal() {
    const modal = document.getElementById('problemModal');
    const closeBtn = document.getElementById('modalClose');
    
    // Close modal
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        }
    });

    // Delegate row click to open modal
    document.getElementById('dsaProblems').addEventListener('click', (e) => {
        const row = e.target.closest('.problem-row');
        // Do not open if clicking checkbox
        if (e.target.classList.contains('problem-checkbox')) return;
        
        if (row) {
            const id = parseInt(row.dataset.id);
            openProblemModal(id);
        }
    });

    // Compiler Logic
    const runBtn = document.getElementById('runCode');
    const submitBtn = document.getElementById('submitCode');
    const output = document.getElementById('outputResult');
    
    runBtn.addEventListener('click', () => {
        output.className = 'output-result';
        output.textContent = 'Compiling and running...';
        runBtn.disabled = true;
        
        setTimeout(() => {
            const code = document.getElementById('codeEditor').value.trim();
            if (!code) {
                output.textContent = 'Error: Code cannot be empty.';
                output.className = 'output-result error';
            } else {
                // Mock execution
                output.textContent = `Output: \n[1, 2]\n\nExecution Time: 12ms\nMemory Usage: 41.2 MB`;
                output.className = 'output-result success';
                
                // Set first tab to pass
                const tabs = document.querySelectorAll('.test-tab');
                if (tabs.length > 0) {
                    tabs[0].classList.add('pass');
                }
            }
            runBtn.disabled = false;
        }, 800);
    });

    submitBtn.addEventListener('click', () => {
        output.className = 'output-result';
        output.textContent = 'Running against hidden test cases...';
        submitBtn.disabled = true;
        
        setTimeout(() => {
            output.textContent = `Success!\n\nRuntime: 56 ms, faster than 85.20%\nMemory Usage: 42.1 MB, less than 65.41%\n\nAll 54 test cases passed.`;
            output.className = 'output-result success';
            submitBtn.disabled = false;
            
            // Mark as solved automatically
            const currentId = parseInt(modal.dataset.currentId);
            if (currentId && !state.solvedProblems[currentId]) {
                state.solvedProblems[currentId] = true;
                saveState();
                renderDSAProblems(); // Re-render to update checkbox
                updateDashboard();
                showToast('Problem solved successfully! 🎉');
            }
        }, 1500);
    });
}

function openProblemModal(id) {
    const p = DSA_PROBLEMS.find(x => x.id === id);
    if (!p) return;
    
    const modal = document.getElementById('problemModal');
    modal.dataset.currentId = id;
    
    // Header
    document.getElementById('modalTitle').textContent = `${p.id}. ${p.name}`;
    document.getElementById('modalLeetcodeLink').href = p.url;
    
    // Meta
    document.getElementById('modalMeta').innerHTML = `
        <span class="modal-meta-tag diff ${p.difficulty}">${p.difficulty.toUpperCase()}</span>
        <span class="modal-meta-tag" style="background:#e5e7eb;color:#444">${p.pattern}</span>
        <span class="modal-meta-tag" style="background:rgba(79,70,229,0.1);color:#4f46e5">${p.companies.split(',')[0]}</span>
    `;
    
    // Description (Mock generated based on problem name)
    document.getElementById('modalDescription').innerHTML = `
        <h3>Description</h3>
        <p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.</p>
        <p>You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.</p>
        <p>You can return the answer in any order.</p>
        <br>
        <h3>Example 1:</h3>
        <pre><strong>Input:</strong> nums = [2,7,11,15], target = 9
<strong>Output:</strong> [0,1]
<strong>Explanation:</strong> Because nums[0] + nums[1] == 9, we return [0, 1].</pre>
        <h3>Constraints:</h3>
        <ul>
            <li><code>2 <= nums.length <= 10^4</code></li>
            <li><code>-10^9 <= nums[i] <= 10^9</code></li>
            <li><code>-10^9 <= target <= 10^9</code></li>
        </ul>
    `;
    
    // Hints
    document.getElementById('modalHints').innerHTML = `
        <p>1. A really brute force way would be to search for all possible pairs of numbers but that would be too slow. Again, it's best to try out brute force solutions for just for completeness.</p>
        <p>2. So, if we fix one of the numbers, say <code>x</code>, we have to scan the entire array to find the next number <code>y</code> which is <code>value - x</code> where value is the input parameter. Can we change our array keeping a faster search in mind?</p>
        <p>3. The second train of thought is, without changing the array, can we use additional space somehow? Like maybe a hash map to speed up the search?</p>
    `;
    
    // Code Editor Default Setup
    const defaultCode = `class Solution {
    public int[] solve(int[] nums, int target) {
        // Write your code here
        
    }
}`;
    document.getElementById('codeEditor').value = defaultCode;
    document.getElementById('outputResult').className = 'output-result';
    document.getElementById('outputResult').textContent = 'Click "Run Code" to see output...';
    
    // Test Cases
    const tabsContainer = document.getElementById('testCaseTabs');
    const contentContainer = document.getElementById('testCaseContent');
    
    tabsContainer.innerHTML = `
        <button class="test-tab active" data-idx="0">Case 1</button>
        <button class="test-tab" data-idx="1">Case 2</button>
        <button class="test-tab" data-idx="2">Case 3</button>
    `;
    
    contentContainer.innerHTML = `
        <div>
            <label>Input:</label>
            <pre>nums = [2,7,11,15]
target = 9</pre>
        </div>
        <div>
            <label>Expected Output:</label>
            <pre>[0,1]</pre>
        </div>
    `;
    
    // Show Modal
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

// ==========================================
// TOAST
// ==========================================
function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toastText').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ==========================================
// INITIALIZE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initCheckin();
    initRoadmapChecks();
    renderDSAProblems();
    renderSystemDesign();
    renderBehavioral();
    updateDashboard();
    initProblemModal();

    // If no stories exist, add default ones
    if (state.stories.length === 0) {
        state.stories = [
            { title: "Story 1: Led a critical project", content: "" },
            { title: "Story 2: Resolved a conflict", content: "" },
            { title: "Story 3: Failed and learned", content: "" },
            { title: "Story 4: Simplified a process", content: "" },
            { title: "Story 5: Went above and beyond", content: "" },
        ];
        saveState();
        renderStories();
    }
});
