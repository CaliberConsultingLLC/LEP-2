const fakeData = {
  "responses": [
    {
      "userId": "user1",
      "campaignId": "123",
      "ratings": {
        // Trait 1 (0-4): ALL users = Low efficacy, high effort (moderated gaps)
        "0": { "efficacy": 25, "effort": 78 },
        "1": { "efficacy": 22, "effort": 82 },
        "2": { "efficacy": 28, "effort": 75 },
        "3": { "efficacy": 20, "effort": 85 },
        "4": { "efficacy": 30, "effort": 80 },
        // Trait 2 (5-9): ALL users = High efficacy, low effort (moderated gaps)
        "5": { "efficacy": 82, "effort": 25 },
        "6": { "efficacy": 78, "effort": 30 },
        "7": { "efficacy": 85, "effort": 22 },
        "8": { "efficacy": 75, "effort": 28 },
        "9": { "efficacy": 80, "effort": 25 },
        // Trait 3 (10-14): ALL users = Low efficacy, high effort (moderated gaps)
        "10": { "efficacy": 24, "effort": 80 },
        "11": { "efficacy": 27, "effort": 83 },
        "12": { "efficacy": 21, "effort": 82 },
        "13": { "efficacy": 26, "effort": 79 },
        "14": { "efficacy": 23, "effort": 81 }
      }
    },
    {
      "userId": "user2",
      "campaignId": "123",
      "ratings": {
        // Trait 1 (0-4): ALL users = Low efficacy, high effort (moderated gaps)
        "0": { "efficacy": 24, "effort": 79 },
        "1": { "efficacy": 21, "effort": 83 },
        "2": { "efficacy": 27, "effort": 76 },
        "3": { "efficacy": 19, "effort": 84 },
        "4": { "efficacy": 29, "effort": 81 },
        // Trait 2 (5-9): ALL users = High efficacy, low effort (moderated gaps)
        "5": { "efficacy": 81, "effort": 24 },
        "6": { "efficacy": 79, "effort": 29 },
        "7": { "efficacy": 84, "effort": 21 },
        "8": { "efficacy": 76, "effort": 27 },
        "9": { "efficacy": 79, "effort": 24 },
        // Trait 3 (10-14): ALL users = Low efficacy, high effort (moderated gaps)
        "10": { "efficacy": 23, "effort": 81 },
        "11": { "efficacy": 26, "effort": 82 },
        "12": { "efficacy": 20, "effort": 83 },
        "13": { "efficacy": 25, "effort": 80 },
        "14": { "efficacy": 22, "effort": 82 }
      }
    },
    {
      "userId": "user3",
      "campaignId": "123",
      "ratings": {
        // Trait 1 (0-4): ALL users = Low efficacy, high effort (moderated gaps)
        "0": { "efficacy": 26, "effort": 77 },
        "1": { "efficacy": 23, "effort": 81 },
        "2": { "efficacy": 29, "effort": 74 },
        "3": { "efficacy": 21, "effort": 86 },
        "4": { "efficacy": 31, "effort": 79 },
        // Trait 2 (5-9): ALL users = High efficacy, low effort (moderated gaps)
        "5": { "efficacy": 83, "effort": 23 },
        "6": { "efficacy": 80, "effort": 28 },
        "7": { "efficacy": 86, "effort": 20 },
        "8": { "efficacy": 77, "effort": 26 },
        "9": { "efficacy": 81, "effort": 23 },
        // Trait 3 (10-14): ALL users = Low efficacy, high effort (moderated gaps)
        "10": { "efficacy": 25, "effort": 79 },
        "11": { "efficacy": 28, "effort": 81 },
        "12": { "efficacy": 22, "effort": 81 },
        "13": { "efficacy": 27, "effort": 78 },
        "14": { "efficacy": 24, "effort": 80 }
      }
    },
    {
      "userId": "user4",
      "campaignId": "123",
      "ratings": {
        // Trait 1 (0-4): ALL users = Low efficacy, high effort (moderated gaps)
        "0": { "efficacy": 23, "effort": 80 },
        "1": { "efficacy": 20, "effort": 84 },
        "2": { "efficacy": 26, "effort": 77 },
        "3": { "efficacy": 18, "effort": 85 },
        "4": { "efficacy": 28, "effort": 81 },
        // Trait 2 (5-9): ALL users = High efficacy, low effort (moderated gaps)
        "5": { "efficacy": 84, "effort": 22 },
        "6": { "efficacy": 81, "effort": 27 },
        "7": { "efficacy": 87, "effort": 19 },
        "8": { "efficacy": 78, "effort": 25 },
        "9": { "efficacy": 82, "effort": 22 },
        // Trait 3 (10-14): ALL users = Low efficacy, high effort (moderated gaps)
        "10": { "efficacy": 22, "effort": 82 },
        "11": { "efficacy": 25, "effort": 84 },
        "12": { "efficacy": 19, "effort": 82 },
        "13": { "efficacy": 24, "effort": 81 },
        "14": { "efficacy": 21, "effort": 83 }
      }
    },
    {
      "userId": "user5",
      "campaignId": "123",
      "ratings": {
        // Trait 1 (0-4): ALL users = Low efficacy, high effort (moderated gaps)
        "0": { "efficacy": 27, "effort": 76 },
        "1": { "efficacy": 24, "effort": 80 },
        "2": { "efficacy": 30, "effort": 73 },
        "3": { "efficacy": 22, "effort": 84 },
        "4": { "efficacy": 32, "effort": 78 },
        // Trait 2 (5-9): ALL users = High efficacy, low effort (moderated gaps)
        "5": { "efficacy": 85, "effort": 21 },
        "6": { "efficacy": 82, "effort": 26 },
        "7": { "efficacy": 88, "effort": 18 },
        "8": { "efficacy": 79, "effort": 24 },
        "9": { "efficacy": 83, "effort": 21 },
        // Trait 3 (10-14): ALL users = Low efficacy, high effort (moderated gaps)
        "10": { "efficacy": 26, "effort": 78 },
        "11": { "efficacy": 29, "effort": 80 },
        "12": { "efficacy": 23, "effort": 80 },
        "13": { "efficacy": 28, "effort": 77 },
        "14": { "efficacy": 25, "effort": 79 }
      }
    },
    {
      "userId": "user6",
      "campaignId": "123",
      "ratings": {
        // Trait 1 (0-4): ALL users = Low efficacy, high effort (moderated gaps)
        "0": { "efficacy": 22, "effort": 81 },
        "1": { "efficacy": 19, "effort": 85 },
        "2": { "efficacy": 25, "effort": 78 },
        "3": { "efficacy": 17, "effort": 86 },
        "4": { "efficacy": 27, "effort": 82 },
        // Trait 2 (5-9): ALL users = High efficacy, low effort (moderated gaps)
        "5": { "efficacy": 83, "effort": 20 },
        "6": { "efficacy": 80, "effort": 25 },
        "7": { "efficacy": 86, "effort": 17 },
        "8": { "efficacy": 77, "effort": 23 },
        "9": { "efficacy": 81, "effort": 20 },
        // Trait 3 (10-14): ALL users = Low efficacy, high effort (moderated gaps)
        "10": { "efficacy": 21, "effort": 83 },
        "11": { "efficacy": 24, "effort": 85 },
        "12": { "efficacy": 18, "effort": 83 },
        "13": { "efficacy": 23, "effort": 82 },
        "14": { "efficacy": 20, "effort": 84 }
      }
    },
    {
      "userId": "user7",
      "campaignId": "123",
      "ratings": {
        // Trait 1 (0-4): ALL users = Low efficacy, high effort (moderated gaps)
        "0": { "efficacy": 25, "effort": 79 },
        "1": { "efficacy": 22, "effort": 83 },
        "2": { "efficacy": 28, "effort": 76 },
        "3": { "efficacy": 20, "effort": 85 },
        "4": { "efficacy": 30, "effort": 80 },
        // Trait 2 (5-9): ALL users = High efficacy, low effort (moderated gaps)
        "5": { "efficacy": 82, "effort": 24 },
        "6": { "efficacy": 79, "effort": 29 },
        "7": { "efficacy": 85, "effort": 21 },
        "8": { "efficacy": 76, "effort": 27 },
        "9": { "efficacy": 80, "effort": 24 },
        // Trait 3 (10-14): ALL users = Low efficacy, high effort (moderated gaps)
        "10": { "efficacy": 24, "effort": 80 },
        "11": { "efficacy": 27, "effort": 82 },
        "12": { "efficacy": 21, "effort": 82 },
        "13": { "efficacy": 26, "effort": 79 },
        "14": { "efficacy": 23, "effort": 81 }
      }
    }
  ]
};

export default fakeData;