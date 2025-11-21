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
    }
  ]
};

export default fakeData;