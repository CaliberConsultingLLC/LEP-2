const fakeData = {
  "responses": [
    {
      "userId": "user1",
      "campaignId": "123",
      "ratings": {
        // Trait 1 (0-4): Mixed patterns for variety
        "0": { "efficacy": 25, "effort": 78 }, // Low eff, high effort
        "1": { "efficacy": 68, "effort": 72 }, // Both medium-high, balanced
        "2": { "efficacy": 88, "effort": 45 }, // High eff, low effort
        "3": { "efficacy": 20, "effort": 85 }, // Low eff, high effort
        "4": { "efficacy": 55, "effort": 58 }, // Both medium, balanced
        // Trait 2 (5-9): Mixed patterns for variety
        "5": { "efficacy": 82, "effort": 25 }, // High eff, low effort
        "6": { "efficacy": 45, "effort": 82 }, // Low eff, high effort
        "7": { "efficacy": 75, "effort": 78 }, // Both high, balanced
        "8": { "efficacy": 35, "effort": 38 }, // Both low, balanced
        "9": { "efficacy": 90, "effort": 55 }, // Very high eff, medium effort
        // Trait 3 (10-14): Mixed patterns for variety
        "10": { "efficacy": 24, "effort": 80 }, // Low eff, high effort
        "11": { "efficacy": 62, "effort": 65 }, // Both medium-high, balanced
        "12": { "efficacy": 85, "effort": 30 }, // High eff, low effort
        "13": { "efficacy": 42, "effort": 75 }, // Medium eff, high effort
        "14": { "efficacy": 72, "effort": 48 }  // High eff, medium effort
      }
    },
    {
      "userId": "user2",
      "campaignId": "123",
      "ratings": {
        // Trait 1 (0-4): Mixed patterns for variety
        "0": { "efficacy": 28, "effort": 76 }, // Low eff, high effort
        "1": { "efficacy": 70, "effort": 68 }, // Both high, balanced
        "2": { "efficacy": 85, "effort": 42 }, // High eff, low effort
        "3": { "efficacy": 18, "effort": 87 }, // Low eff, high effort
        "4": { "efficacy": 52, "effort": 55 }, // Both medium, balanced
        // Trait 2 (5-9): Mixed patterns for variety
        "5": { "efficacy": 80, "effort": 28 }, // High eff, low effort
        "6": { "efficacy": 42, "effort": 80 }, // Low eff, high effort
        "7": { "efficacy": 78, "effort": 75 }, // Both high, balanced
        "8": { "efficacy": 38, "effort": 35 }, // Both low, balanced
        "9": { "efficacy": 88, "effort": 52 }, // Very high eff, medium effort
        // Trait 3 (10-14): Mixed patterns for variety
        "10": { "efficacy": 26, "effort": 79 }, // Low eff, high effort
        "11": { "efficacy": 65, "effort": 62 }, // Both medium-high, balanced
        "12": { "efficacy": 83, "effort": 32 }, // High eff, low effort
        "13": { "efficacy": 40, "effort": 73 }, // Medium eff, high effort
        "14": { "efficacy": 74, "effort": 50 }  // High eff, medium effort
      }
    },
    {
      "userId": "user3",
      "campaignId": "123",
      "ratings": {
        // Trait 1 (0-4): Mixed patterns for variety
        "0": { "efficacy": 30, "effort": 74 }, // Low eff, high effort
        "1": { "efficacy": 66, "effort": 70 }, // Both medium-high, balanced
        "2": { "efficacy": 87, "effort": 40 }, // High eff, low effort
        "3": { "efficacy": 19, "effort": 88 }, // Low eff, high effort
        "4": { "efficacy": 58, "effort": 60 }, // Both medium-high, balanced
        // Trait 2 (5-9): Mixed patterns for variety
        "5": { "efficacy": 84, "effort": 26 }, // High eff, low effort
        "6": { "efficacy": 44, "effort": 78 }, // Low eff, high effort
        "7": { "efficacy": 76, "effort": 72 }, // Both high, balanced
        "8": { "efficacy": 36, "effort": 40 }, // Both low-medium, balanced
        "9": { "efficacy": 89, "effort": 48 }, // Very high eff, medium effort
        // Trait 3 (10-14): Mixed patterns for variety
        "10": { "efficacy": 27, "effort": 77 }, // Low eff, high effort
        "11": { "efficacy": 64, "effort": 68 }, // Both medium-high, balanced
        "12": { "efficacy": 81, "effort": 35 }, // High eff, low effort
        "13": { "efficacy": 43, "effort": 71 }, // Medium eff, high effort
        "14": { "efficacy": 73, "effort": 52 }  // High eff, medium effort
      }
    },
    {
      "userId": "user4",
      "campaignId": "123",
      "ratings": {
        // Trait 1 (0-4): Mixed patterns for variety
        "0": { "efficacy": 29, "effort": 75 }, // Low eff, high effort
        "1": { "efficacy": 71, "effort": 66 }, // Both high, slight gap
        "2": { "efficacy": 86, "effort": 38 }, // High eff, low effort
        "3": { "efficacy": 17, "effort": 89 }, // Low eff, high effort
        "4": { "efficacy": 54, "effort": 57 }, // Both medium, balanced
        // Trait 2 (5-9): Mixed patterns for variety
        "5": { "efficacy": 81, "effort": 27 }, // High eff, low effort
        "6": { "efficacy": 46, "effort": 79 }, // Low eff, high effort
        "7": { "efficacy": 79, "effort": 74 }, // Both high, balanced
        "8": { "efficacy": 37, "effort": 42 }, // Both low-medium, balanced
        "9": { "efficacy": 91, "effort": 50 }, // Very high eff, medium effort
        // Trait 3 (10-14): Mixed patterns for variety
        "10": { "efficacy": 25, "effort": 78 }, // Low eff, high effort
        "11": { "efficacy": 63, "effort": 64 }, // Both medium-high, balanced
        "12": { "efficacy": 82, "effort": 33 }, // High eff, low effort
        "13": { "efficacy": 41, "effort": 72 }, // Medium eff, high effort
        "14": { "efficacy": 75, "effort": 54 }  // High eff, medium effort
      }
    },
    {
      "userId": "user5",
      "campaignId": "123",
      "ratings": {
        // Trait 1 (0-4): Mixed patterns for variety
        "0": { "efficacy": 31, "effort": 73 }, // Low eff, high effort
        "1": { "efficacy": 69, "effort": 71 }, // Both high, balanced
        "2": { "efficacy": 88, "effort": 43 }, // High eff, low effort
        "3": { "efficacy": 16, "effort": 90 }, // Low eff, high effort
        "4": { "efficacy": 56, "effort": 59 }, // Both medium-high, balanced
        // Trait 2 (5-9): Mixed patterns for variety
        "5": { "efficacy": 83, "effort": 29 }, // High eff, low effort
        "6": { "efficacy": 48, "effort": 77 }, // Low eff, high effort
        "7": { "efficacy": 77, "effort": 73 }, // Both high, balanced
        "8": { "efficacy": 39, "effort": 44 }, // Both low-medium, balanced
        "9": { "efficacy": 92, "effort": 53 }, // Very high eff, medium effort
        // Trait 3 (10-14): Mixed patterns for variety
        "10": { "efficacy": 28, "effort": 76 }, // Low eff, high effort
        "11": { "efficacy": 61, "effort": 63 }, // Both medium-high, balanced
        "12": { "efficacy": 80, "effort": 36 }, // High eff, low effort
        "13": { "efficacy": 45, "effort": 70 }, // Medium eff, high effort
        "14": { "efficacy": 76, "effort": 56 }  // High eff, medium effort
      }
    },
    {
      "userId": "user6",
      "campaignId": "123",
      "ratings": {
        // Trait 1 (0-4): Mixed patterns for variety
        "0": { "efficacy": 32, "effort": 72 }, // Low eff, high effort
        "1": { "efficacy": 67, "effort": 69 }, // Both medium-high, balanced
        "2": { "efficacy": 90, "effort": 41 }, // High eff, low effort
        "3": { "efficacy": 15, "effort": 91 }, // Low eff, high effort
        "4": { "efficacy": 57, "effort": 61 }, // Both medium-high, balanced
        // Trait 2 (5-9): Mixed patterns for variety
        "5": { "efficacy": 86, "effort": 31 }, // High eff, low effort
        "6": { "efficacy": 47, "effort": 76 }, // Low eff, high effort
        "7": { "efficacy": 74, "effort": 70 }, // Both high, balanced
        "8": { "efficacy": 40, "effort": 46 }, // Both low-medium, balanced
        "9": { "efficacy": 93, "effort": 51 }, // Very high eff, medium effort
        // Trait 3 (10-14): Mixed patterns for variety
        "10": { "efficacy": 29, "effort": 75 }, // Low eff, high effort
        "11": { "efficacy": 60, "effort": 65 }, // Both medium-high, balanced
        "12": { "efficacy": 79, "effort": 37 }, // High eff, low effort
        "13": { "efficacy": 44, "effort": 69 }, // Medium eff, high effort
        "14": { "efficacy": 78, "effort": 58 }  // High eff, medium effort
      }
    },
    {
      "userId": "user7",
      "campaignId": "123",
      "ratings": {
        // Trait 1 (0-4): Mixed patterns for variety
        "0": { "efficacy": 33, "effort": 71 }, // Low eff, high effort
        "1": { "efficacy": 65, "effort": 67 }, // Both medium-high, balanced
        "2": { "efficacy": 89, "effort": 39 }, // High eff, low effort
        "3": { "efficacy": 14, "effort": 92 }, // Low eff, high effort
        "4": { "efficacy": 59, "effort": 62 }, // Both medium-high, balanced
        // Trait 2 (5-9): Mixed patterns for variety
        "5": { "efficacy": 87, "effort": 30 }, // High eff, low effort
        "6": { "efficacy": 49, "effort": 75 }, // Low eff, high effort
        "7": { "efficacy": 72, "effort": 69 }, // Both high, balanced
        "8": { "efficacy": 41, "effort": 47 }, // Both low-medium, balanced
        "9": { "efficacy": 94, "effort": 49 }, // Very high eff, medium effort
        // Trait 3 (10-14): Mixed patterns for variety
        "10": { "efficacy": 30, "effort": 74 }, // Low eff, high effort
        "11": { "efficacy": 62, "effort": 66 }, // Both medium-high, balanced
        "12": { "efficacy": 78, "effort": 38 }, // High eff, low effort
        "13": { "efficacy": 46, "effort": 68 }, // Medium eff, high effort
        "14": { "efficacy": 77, "effort": 60 }  // High eff, medium effort
      }
    },
    // Campaign 124 - Second survey showing growth
    {
      "userId": "user1",
      "campaignId": "124",
      "ratings": {
        // Trait 1 (0-4): Showing improvement
        "0": { "efficacy": 35, "effort": 75 }, // Improved eff, slightly lower effort
        "1": { "efficacy": 72, "effort": 70 }, // Both improved, balanced
        "2": { "efficacy": 90, "effort": 50 }, // High eff maintained, effort increased
        "3": { "efficacy": 30, "effort": 82 }, // Improved eff, effort maintained
        "4": { "efficacy": 62, "effort": 60 }, // Both improved
        // Trait 2 (5-9): Showing improvement
        "5": { "efficacy": 85, "effort": 35 }, // High eff maintained, effort increased
        "6": { "efficacy": 52, "effort": 78 }, // Improved eff, effort maintained
        "7": { "efficacy": 80, "effort": 80 }, // Both improved
        "8": { "efficacy": 42, "effort": 45 }, // Both improved
        "9": { "efficacy": 92, "effort": 60 }, // Very high eff maintained, effort increased
        // Trait 3 (10-14): Showing improvement
        "10": { "efficacy": 32, "effort": 77 }, // Improved eff, effort slightly lower
        "11": { "efficacy": 68, "effort": 68 }, // Both improved
        "12": { "efficacy": 88, "effort": 38 }, // High eff maintained, effort increased
        "13": { "efficacy": 50, "effort": 72 }, // Improved eff, effort maintained
        "14": { "efficacy": 78, "effort": 55 }  // Both improved
      }
    },
    {
      "userId": "user2",
      "campaignId": "124",
      "ratings": {
        "0": { "efficacy": 38, "effort": 73 },
        "1": { "efficacy": 75, "effort": 70 },
        "2": { "efficacy": 88, "effort": 48 },
        "3": { "efficacy": 25, "effort": 84 },
        "4": { "efficacy": 58, "effort": 58 },
        "5": { "efficacy": 83, "effort": 35 },
        "6": { "efficacy": 50, "effort": 77 },
        "7": { "efficacy": 82, "effort": 78 },
        "8": { "efficacy": 45, "effort": 42 },
        "9": { "efficacy": 90, "effort": 58 },
        "10": { "efficacy": 34, "effort": 76 },
        "11": { "efficacy": 70, "effort": 65 },
        "12": { "efficacy": 86, "effort": 40 },
        "13": { "efficacy": 48, "effort": 70 },
        "14": { "efficacy": 80, "effort": 55 }
      }
    },
    {
      "userId": "user3",
      "campaignId": "124",
      "ratings": {
        "0": { "efficacy": 40, "effort": 71 },
        "1": { "efficacy": 70, "effort": 72 },
        "2": { "efficacy": 90, "effort": 46 },
        "3": { "efficacy": 28, "effort": 85 },
        "4": { "efficacy": 65, "effort": 63 },
        "5": { "efficacy": 87, "effort": 33 },
        "6": { "efficacy": 52, "effort": 75 },
        "7": { "efficacy": 80, "effort": 75 },
        "8": { "efficacy": 43, "effort": 47 },
        "9": { "efficacy": 91, "effort": 55 },
        "10": { "efficacy": 35, "effort": 74 },
        "11": { "efficacy": 69, "effort": 70 },
        "12": { "efficacy": 84, "effort": 42 },
        "13": { "efficacy": 50, "effort": 68 },
        "14": { "efficacy": 79, "effort": 58 }
      }
    },
    {
      "userId": "user4",
      "campaignId": "124",
      "ratings": {
        "0": { "efficacy": 37, "effort": 72 },
        "1": { "efficacy": 75, "effort": 68 },
        "2": { "efficacy": 89, "effort": 45 },
        "3": { "efficacy": 26, "effort": 86 },
        "4": { "efficacy": 60, "effort": 60 },
        "5": { "efficacy": 84, "effort": 34 },
        "6": { "efficacy": 54, "effort": 76 },
        "7": { "efficacy": 82, "effort": 77 },
        "8": { "efficacy": 44, "effort": 48 },
        "9": { "efficacy": 93, "effort": 57 },
        "10": { "efficacy": 33, "effort": 75 },
        "11": { "efficacy": 68, "effort": 67 },
        "12": { "efficacy": 85, "effort": 40 },
        "13": { "efficacy": 48, "effort": 69 },
        "14": { "efficacy": 81, "effort": 60 }
      }
    },
    {
      "userId": "user5",
      "campaignId": "124",
      "ratings": {
        "0": { "efficacy": 39, "effort": 70 },
        "1": { "efficacy": 73, "effort": 73 },
        "2": { "efficacy": 91, "effort": 50 },
        "3": { "efficacy": 24, "effort": 87 },
        "4": { "efficacy": 63, "effort": 62 },
        "5": { "efficacy": 86, "effort": 36 },
        "6": { "efficacy": 55, "effort": 74 },
        "7": { "efficacy": 81, "effort": 76 },
        "8": { "efficacy": 46, "effort": 50 },
        "9": { "efficacy": 94, "effort": 60 },
        "10": { "efficacy": 36, "effort": 73 },
        "11": { "efficacy": 67, "effort": 66 },
        "12": { "efficacy": 83, "effort": 43 },
        "13": { "efficacy": 52, "effort": 67 },
        "14": { "efficacy": 82, "effort": 62 }
      }
    },
    {
      "userId": "user6",
      "campaignId": "124",
      "ratings": {
        "0": { "efficacy": 41, "effort": 69 },
        "1": { "efficacy": 71, "effort": 71 },
        "2": { "efficacy": 92, "effort": 48 },
        "3": { "efficacy": 23, "effort": 88 },
        "4": { "efficacy": 64, "effort": 64 },
        "5": { "efficacy": 88, "effort": 38 },
        "6": { "efficacy": 54, "effort": 73 },
        "7": { "efficacy": 78, "effort": 73 },
        "8": { "efficacy": 47, "effort": 52 },
        "9": { "efficacy": 95, "effort": 58 },
        "10": { "efficacy": 37, "effort": 72 },
        "11": { "efficacy": 66, "effort": 68 },
        "12": { "efficacy": 82, "effort": 44 },
        "13": { "efficacy": 51, "effort": 66 },
        "14": { "efficacy": 84, "effort": 65 }
      }
    },
    {
      "userId": "user7",
      "campaignId": "124",
      "ratings": {
        "0": { "efficacy": 42, "effort": 68 },
        "1": { "efficacy": 69, "effort": 69 },
        "2": { "efficacy": 93, "effort": 46 },
        "3": { "efficacy": 22, "effort": 89 },
        "4": { "efficacy": 66, "effort": 65 },
        "5": { "efficacy": 89, "effort": 37 },
        "6": { "efficacy": 56, "effort": 72 },
        "7": { "efficacy": 76, "effort": 72 },
        "8": { "efficacy": 48, "effort": 54 },
        "9": { "efficacy": 96, "effort": 56 },
        "10": { "efficacy": 38, "effort": 71 },
        "11": { "efficacy": 68, "effort": 69 },
        "12": { "efficacy": 81, "effort": 45 },
        "13": { "efficacy": 53, "effort": 65 },
        "14": { "efficacy": 85, "effort": 66 }
      }
    },
    // Campaign 125 - Third survey showing continued growth
    {
      "userId": "user1",
      "campaignId": "125",
      "ratings": {
        // Trait 1 (0-4): Continued improvement
        "0": { "efficacy": 45, "effort": 72 },
        "1": { "efficacy": 78, "effort": 68 },
        "2": { "efficacy": 92, "effort": 55 },
        "3": { "efficacy": 40, "effort": 80 },
        "4": { "efficacy": 68, "effort": 62 },
        // Trait 2 (5-9): Continued improvement
        "5": { "efficacy": 88, "effort": 42 },
        "6": { "efficacy": 60, "effort": 75 },
        "7": { "efficacy": 85, "effort": 82 },
        "8": { "efficacy": 50, "effort": 50 },
        "9": { "efficacy": 94, "effort": 65 },
        // Trait 3 (10-14): Continued improvement
        "10": { "efficacy": 42, "effort": 74 },
        "11": { "efficacy": 74, "effort": 70 },
        "12": { "efficacy": 90, "effort": 45 },
        "13": { "efficacy": 58, "effort": 70 },
        "14": { "efficacy": 82, "effort": 60 }
      }
    },
    {
      "userId": "user2",
      "campaignId": "125",
      "ratings": {
        "0": { "efficacy": 48, "effort": 70 },
        "1": { "efficacy": 80, "effort": 68 },
        "2": { "efficacy": 90, "effort": 52 },
        "3": { "efficacy": 35, "effort": 82 },
        "4": { "efficacy": 65, "effort": 60 },
        "5": { "efficacy": 86, "effort": 42 },
        "6": { "efficacy": 58, "effort": 74 },
        "7": { "efficacy": 85, "effort": 80 },
        "8": { "efficacy": 52, "effort": 48 },
        "9": { "efficacy": 92, "effort": 63 },
        "10": { "efficacy": 44, "effort": 73 },
        "11": { "efficacy": 75, "effort": 68 },
        "12": { "efficacy": 88, "effort": 47 },
        "13": { "efficacy": 56, "effort": 68 },
        "14": { "efficacy": 84, "effort": 58 }
      }
    },
    {
      "userId": "user3",
      "campaignId": "125",
      "ratings": {
        "0": { "efficacy": 50, "effort": 68 },
        "1": { "efficacy": 78, "effort": 70 },
        "2": { "efficacy": 93, "effort": 50 },
        "3": { "efficacy": 38, "effort": 83 },
        "4": { "efficacy": 70, "effort": 65 },
        "5": { "efficacy": 89, "effort": 40 },
        "6": { "efficacy": 60, "effort": 72 },
        "7": { "efficacy": 83, "effort": 78 },
        "8": { "efficacy": 55, "effort": 52 },
        "9": { "efficacy": 93, "effort": 60 },
        "10": { "efficacy": 46, "effort": 71 },
        "11": { "efficacy": 73, "effort": 72 },
        "12": { "efficacy": 87, "effort": 48 },
        "13": { "efficacy": 58, "effort": 66 },
        "14": { "efficacy": 83, "effort": 62 }
      }
    },
    {
      "userId": "user4",
      "campaignId": "125",
      "ratings": {
        "0": { "efficacy": 47, "effort": 69 },
        "1": { "efficacy": 82, "effort": 66 },
        "2": { "efficacy": 91, "effort": 50 },
        "3": { "efficacy": 36, "effort": 84 },
        "4": { "efficacy": 68, "effort": 62 },
        "5": { "efficacy": 87, "effort": 41 },
        "6": { "efficacy": 62, "effort": 73 },
        "7": { "efficacy": 86, "effort": 79 },
        "8": { "efficacy": 54, "effort": 52 },
        "9": { "efficacy": 95, "effort": 62 },
        "10": { "efficacy": 43, "effort": 72 },
        "11": { "efficacy": 74, "effort": 69 },
        "12": { "efficacy": 89, "effort": 46 },
        "13": { "efficacy": 57, "effort": 67 },
        "14": { "efficacy": 85, "effort": 63 }
      }
    },
    {
      "userId": "user5",
      "campaignId": "125",
      "ratings": {
        "0": { "efficacy": 52, "effort": 67 },
        "1": { "efficacy": 80, "effort": 72 },
        "2": { "efficacy": 94, "effort": 52 },
        "3": { "efficacy": 40, "effort": 85 },
        "4": { "efficacy": 72, "effort": 66 },
        "5": { "efficacy": 90, "effort": 43 },
        "6": { "efficacy": 64, "effort": 71 },
        "7": { "efficacy": 84, "effort": 79 },
        "8": { "efficacy": 58, "effort": 55 },
        "9": { "efficacy": 96, "effort": 65 },
        "10": { "efficacy": 48, "effort": 70 },
        "11": { "efficacy": 76, "effort": 70 },
        "12": { "efficacy": 88, "effort": 50 },
        "13": { "efficacy": 60, "effort": 65 },
        "14": { "efficacy": 86, "effort": 65 }
      }
    },
    {
      "userId": "user6",
      "campaignId": "125",
      "ratings": {
        "0": { "efficacy": 54, "effort": 65 },
        "1": { "efficacy": 79, "effort": 73 },
        "2": { "efficacy": 95, "effort": 50 },
        "3": { "efficacy": 42, "effort": 86 },
        "4": { "efficacy": 74, "effort": 68 },
        "5": { "efficacy": 91, "effort": 45 },
        "6": { "efficacy": 66, "effort": 70 },
        "7": { "efficacy": 82, "effort": 76 },
        "8": { "efficacy": 60, "effort": 58 },
        "9": { "efficacy": 97, "effort": 63 },
        "10": { "efficacy": 50, "effort": 69 },
        "11": { "efficacy": 77, "effort": 71 },
        "12": { "efficacy": 87, "effort": 52 },
        "13": { "efficacy": 62, "effort": 64 },
        "14": { "efficacy": 88, "effort": 68 }
      }
    },
    {
      "userId": "user7",
      "campaignId": "125",
      "ratings": {
        "0": { "efficacy": 56, "effort": 63 },
        "1": { "efficacy": 77, "effort": 71 },
        "2": { "efficacy": 96, "effort": 48 },
        "3": { "efficacy": 44, "effort": 87 },
        "4": { "efficacy": 76, "effort": 70 },
        "5": { "efficacy": 92, "effort": 44 },
        "6": { "efficacy": 68, "effort": 69 },
        "7": { "efficacy": 80, "effort": 74 },
        "8": { "efficacy": 62, "effort": 60 },
        "9": { "efficacy": 98, "effort": 61 },
        "10": { "efficacy": 52, "effort": 68 },
        "11": { "efficacy": 78, "effort": 72 },
        "12": { "efficacy": 86, "effort": 54 },
        "13": { "efficacy": 64, "effort": 63 },
        "14": { "efficacy": 90, "effort": 70 }
      }
    }
  ],
  "actionItems": {
    "campaign_123": {
      "userId": "user1",
      "items": {
        "clarity": {
          "trait": "Communication",
          "actions": [
            { "text": "Use the one-sentence test before important communications", "createdAt": "2024-01-15", "status": "active" },
            { "text": "Create templates for common communication scenarios", "createdAt": "2024-01-21", "status": "active" },
            { "text": "Ask for feedback on message clarity after each major announcement", "createdAt": "2024-01-27", "status": "pending" }
          ]
        },
        "quality": {
          "trait": "Decision-Making & Judgment",
          "actions": [
            { "text": "List pros and cons for significant decisions", "createdAt": "2024-01-15", "status": "active" },
            { "text": "Seek input from 2-3 trusted advisors on important choices", "createdAt": "2024-01-20", "status": "active" },
            { "text": "Use decision frameworks (SWOT, cost-benefit analysis) for complex decisions", "createdAt": "2024-01-25", "status": "pending" }
          ]
        },
        "prioritization": {
          "trait": "Execution & Follow-Through",
          "actions": [
            { "text": "Start each day by identifying top 3 priorities", "createdAt": "2024-01-15", "status": "active" },
            { "text": "Use Eisenhower Matrix to distinguish urgent from important", "createdAt": "2024-01-22", "status": "active" },
            { "text": "Say 'no' to requests that don't align with priorities", "createdAt": "2024-01-28", "status": "pending" }
          ]
        }
      }
    },
    "campaign_124": {
      "userId": "user1",
      "items": {
        "clarity": {
          "trait": "Communication",
          "actions": [
            { "text": "Measure and track communication clarity metrics", "createdAt": "2024-04-15", "status": "active" },
            { "text": "Expand communication templates to cover more scenarios", "createdAt": "2024-04-21", "status": "active" },
            { "text": "Train team members on clear communication techniques", "createdAt": "2024-04-27", "status": "pending" }
          ]
        },
        "quality": {
          "trait": "Decision-Making & Judgment",
          "actions": [
            { "text": "Review past decisions to identify patterns in judgment", "createdAt": "2024-04-15", "status": "active" },
            { "text": "Build decision-making frameworks for common scenarios", "createdAt": "2024-04-20", "status": "active" },
            { "text": "Consider both short-term and long-term implications before deciding", "createdAt": "2024-04-25", "status": "pending" }
          ]
        },
        "prioritization": {
          "trait": "Execution & Follow-Through",
          "actions": [
            { "text": "Regularly review and adjust priorities based on changing context", "createdAt": "2024-04-15", "status": "active" },
            { "text": "Communicate priorities clearly to your team", "createdAt": "2024-04-22", "status": "active" },
            { "text": "Delegate or defer lower-priority tasks", "createdAt": "2024-04-28", "status": "pending" }
          ]
        }
      }
    },
    "campaign_125": {
      "userId": "user1",
      "items": {
        "clarity": {
          "trait": "Communication",
          "actions": [
            { "text": "Achieve 95% clarity score in communication assessments", "createdAt": "2024-07-15", "status": "active" },
            { "text": "Develop communication clarity certification program", "createdAt": "2024-07-21", "status": "active" },
            { "text": "Share communication best practices across organization", "createdAt": "2024-07-27", "status": "pending" }
          ]
        },
        "quality": {
          "trait": "Decision-Making & Judgment",
          "actions": [
            { "text": "Develop expertise in areas where you make frequent decisions", "createdAt": "2024-07-15", "status": "active" },
            { "text": "Test decisions with small pilots when possible", "createdAt": "2024-07-20", "status": "active" },
            { "text": "Build a track record of sound decision-making", "createdAt": "2024-07-25", "status": "pending" }
          ]
        },
        "prioritization": {
          "trait": "Execution & Follow-Through",
          "actions": [
            { "text": "Build a culture that values focus over busyness", "createdAt": "2024-07-15", "status": "active" },
            { "text": "Create systems that make priorities visible and reviewable", "createdAt": "2024-07-22", "status": "active" },
            { "text": "Develop your team's ability to prioritize effectively", "createdAt": "2024-07-28", "status": "pending" }
          ]
        }
      }
    }
  }
};

export default fakeData;