const fakeData = {
  "responses": [
    {
      "userId": "user1",
      "campaignId": "123",
      "ratings": {
        // Trait 1 (0-4): ALL users = Low efficacy, high effort
        "0": { "efficacy": 12, "effort": 94 },
        "1": { "efficacy": 8, "effort": 97 },
        "2": { "efficacy": 15, "effort": 92 },
        "3": { "efficacy": 6, "effort": 99 },
        "4": { "efficacy": 18, "effort": 96 },
        // Trait 2 (5-9): ALL users = High efficacy, low effort
        "5": { "efficacy": 96, "effort": 8 },
        "6": { "efficacy": 94, "effort": 12 },
        "7": { "efficacy": 98, "effort": 5 },
        "8": { "efficacy": 92, "effort": 15 },
        "9": { "efficacy": 97, "effort": 9 },
        // Trait 3 (10-14): ALL users = Low efficacy, high effort
        "10": { "efficacy": 9, "effort": 95 },
        "11": { "efficacy": 14, "effort": 98 },
        "12": { "efficacy": 7, "effort": 97 },
        "13": { "efficacy": 11, "effort": 96 },
        "14": { "efficacy": 13, "effort": 94 }
      }
    },
    {
      "userId": "user2",
      "campaignId": "123",
      "ratings": {
        // Trait 1 (0-4): ALL users = Low efficacy, high effort
        "0": { "efficacy": 11, "effort": 95 },
        "1": { "efficacy": 7, "effort": 98 },
        "2": { "efficacy": 14, "effort": 93 },
        "3": { "efficacy": 9, "effort": 97 },
        "4": { "efficacy": 13, "effort": 96 },
        // Trait 2 (5-9): ALL users = High efficacy, low effort
        "5": { "efficacy": 95, "effort": 9 },
        "6": { "efficacy": 97, "effort": 6 },
        "7": { "efficacy": 99, "effort": 4 },
        "8": { "efficacy": 94, "effort": 11 },
        "9": { "efficacy": 96, "effort": 8 },
        // Trait 3 (10-14): ALL users = Low efficacy, high effort
        "10": { "efficacy": 8, "effort": 97 },
        "11": { "efficacy": 12, "effort": 94 },
        "12": { "efficacy": 6, "effort": 99 },
        "13": { "efficacy": 10, "effort": 96 },
        "14": { "efficacy": 9, "effort": 95 }
      }
    },
    {
      "userId": "user3",
      "campaignId": "123",
      "ratings": {
        // Trait 1 (0-4): ALL users = Low efficacy, high effort
        "0": { "efficacy": 10, "effort": 96 },
        "1": { "efficacy": 6, "effort": 99 },
        "2": { "efficacy": 13, "effort": 94 },
        "3": { "efficacy": 8, "effort": 98 },
        "4": { "efficacy": 12, "effort": 95 },
        // Trait 2 (5-9): ALL users = High efficacy, low effort
        "5": { "efficacy": 97, "effort": 7 },
        "6": { "efficacy": 95, "effort": 9 },
        "7": { "efficacy": 98, "effort": 5 },
        "8": { "efficacy": 96, "effort": 8 },
        "9": { "efficacy": 99, "effort": 4 },
        // Trait 3 (10-14): ALL users = Low efficacy, high effort
        "10": { "efficacy": 7, "effort": 98 },
        "11": { "efficacy": 11, "effort": 95 },
        "12": { "efficacy": 5, "effort": 99 },
        "13": { "efficacy": 9, "effort": 97 },
        "14": { "efficacy": 8, "effort": 96 }
      }
    },
    {
      "userId": "user4",
      "campaignId": "123",
      "ratings": {
        // Trait 1 (0-4): ALL users = Low efficacy, high effort
        "0": { "efficacy": 9, "effort": 97 },
        "1": { "efficacy": 5, "effort": 99 },
        "2": { "efficacy": 12, "effort": 93 },
        "3": { "efficacy": 7, "effort": 98 },
        "4": { "efficacy": 11, "effort": 96 },
        // Trait 2 (5-9): ALL users = High efficacy, low effort
        "5": { "efficacy": 98, "effort": 6 },
        "6": { "efficacy": 96, "effort": 8 },
        "7": { "efficacy": 99, "effort": 4 },
        "8": { "efficacy": 97, "effort": 7 },
        "9": { "efficacy": 95, "effort": 9 },
        // Trait 3 (10-14): ALL users = Low efficacy, high effort
        "10": { "efficacy": 6, "effort": 99 },
        "11": { "efficacy": 10, "effort": 96 },
        "12": { "efficacy": 4, "effort": 98 },
        "13": { "efficacy": 8, "effort": 97 },
        "14": { "efficacy": 7, "effort": 98 }
      }
    },
    {
      "userId": "user5",
      "campaignId": "123",
      "ratings": {
        // Trait 1 (0-4): ALL users = Low efficacy, high effort
        "0": { "efficacy": 8, "effort": 98 },
        "1": { "efficacy": 4, "effort": 99 },
        "2": { "efficacy": 11, "effort": 95 },
        "3": { "efficacy": 6, "effort": 97 },
        "4": { "efficacy": 10, "effort": 96 },
        // Trait 2 (5-9): ALL users = High efficacy, low effort
        "5": { "efficacy": 99, "effort": 5 },
        "6": { "efficacy": 97, "effort": 7 },
        "7": { "efficacy": 98, "effort": 6 },
        "8": { "efficacy": 96, "effort": 8 },
        "9": { "efficacy": 95, "effort": 10 },
        // Trait 3 (10-14): ALL users = Low efficacy, high effort
        "10": { "efficacy": 5, "effort": 99 },
        "11": { "efficacy": 9, "effort": 97 },
        "12": { "efficacy": 3, "effort": 98 },
        "13": { "efficacy": 7, "effort": 98 },
        "14": { "efficacy": 6, "effort": 97 }
      }
    },
    {
      "userId": "user6",
      "campaignId": "123",
      "ratings": {
        // Trait 1 (0-4): ALL users = Low efficacy, high effort
        "0": { "efficacy": 7, "effort": 99 },
        "1": { "efficacy": 3, "effort": 98 },
        "2": { "efficacy": 10, "effort": 96 },
        "3": { "efficacy": 5, "effort": 97 },
        "4": { "efficacy": 9, "effort": 95 },
        // Trait 2 (5-9): ALL users = High efficacy, low effort
        "5": { "efficacy": 97, "effort": 6 },
        "6": { "efficacy": 99, "effort": 4 },
        "7": { "efficacy": 96, "effort": 8 },
        "8": { "efficacy": 98, "effort": 5 },
        "9": { "efficacy": 95, "effort": 9 },
        // Trait 3 (10-14): ALL users = Low efficacy, high effort
        "10": { "efficacy": 4, "effort": 99 },
        "11": { "efficacy": 8, "effort": 98 },
        "12": { "efficacy": 2, "effort": 97 },
        "13": { "efficacy": 6, "effort": 99 },
        "14": { "efficacy": 5, "effort": 96 }
      }
    },
    {
      "userId": "user7",
      "campaignId": "123",
      "ratings": {
        // Trait 1 (0-4): ALL users = Low efficacy, high effort
        "0": { "efficacy": 6, "effort": 98 },
        "1": { "efficacy": 2, "effort": 99 },
        "2": { "efficacy": 9, "effort": 97 },
        "3": { "efficacy": 4, "effort": 96 },
        "4": { "efficacy": 8, "effort": 95 },
        // Trait 2 (5-9): ALL users = High efficacy, low effort
        "5": { "efficacy": 96, "effort": 7 },
        "6": { "efficacy": 98, "effort": 5 },
        "7": { "efficacy": 97, "effort": 6 },
        "8": { "efficacy": 99, "effort": 4 },
        "9": { "efficacy": 95, "effort": 8 },
        // Trait 3 (10-14): ALL users = Low efficacy, high effort
        "10": { "efficacy": 3, "effort": 99 },
        "11": { "efficacy": 7, "effort": 98 },
        "12": { "efficacy": 1, "effort": 97 },
        "13": { "efficacy": 5, "effort": 99 },
        "14": { "efficacy": 4, "effort": 96 }
      }
    }
  ]
};

export default fakeData;