const fakeData = {
  "responses": [
    {
      "userId": "user1",
      "campaignId": "123",
      "ratings": {
        "0": { "efficacy": 17, "effort": 83 },
        "1": { "efficacy": 94, "effort": 12 },
        "2": { "efficacy": 63, "effort": 47 },
        "3": { "efficacy": 80, "effort": 91 },
        "4": { "efficacy": 72, "effort": 90 },
        "5": { "efficacy": 90, "effort": 66 },
        "6": { "efficacy": 85, "effort": 34 },
        "7": { "efficacy": 51, "effort": 98 },
        "8": { "efficacy": 26, "effort": 73 },
        "9": { "efficacy": 99, "effort": 19 },
        "10": { "efficacy": 43, "effort": 87 },
        "11": { "efficacy": 68, "effort": 56 },
        "12": { "efficacy": 14, "effort": 92 },
        "13": { "efficacy": 77, "effort": 41 },
        "14": { "efficacy": 32, "effort": 65 }
      }
    },
    {
      "userId": "user2",
      "campaignId": "123",
      "ratings": {
        "0": { "efficacy": 88, "effort": 29 },
        "1": { "efficacy": 23, "effort": 95 },
        "2": { "efficacy": 61, "effort": 53 },
        "3": { "efficacy": 80, "effort": 78 },
        "4": { "efficacy": 96, "effort": 90 },
        "5": { "efficacy": 90, "effort": 82 },
        "6": { "efficacy": 12, "effort": 67 },
        "7": { "efficacy": 79, "effort": 38 },
        "8": { "efficacy": 54, "effort": 91 },
        "9": { "efficacy": 27, "effort": 63 },
        "10": { "efficacy": 81, "effort": 46 },
        "11": { "efficacy": 39, "effort": 88 },
        "12": { "efficacy": 66, "effort": 22 },
        "13": { "efficacy": 15, "effort": 74 },
        "14": { "efficacy": 92, "effort": 37 }
      }
    },
    {
      "userId": "user3",
      "campaignId": "123",
      "ratings": {
        "0": { "efficacy": 41, "effort": 68 },
        "1": { "efficacy": 76, "effort": 33 },
        "2": { "efficacy": 19, "effort": 87 },
        "3": { "efficacy": 93, "effort": 80 },
        "4": { "efficacy": 90, "effort": 90 },
        "5": { "efficacy": 90, "effort": 49 },
        "6": { "efficacy": 67, "effort": 94 },
        "7": { "efficacy": 35, "effort": 16 },
        "8": { "efficacy": 82, "effort": 62 },
        "9": { "efficacy": 13, "effort": 85 },
        "10": { "efficacy": 97, "effort": 28 },
        "11": { "efficacy": 52, "effort": 73 },
        "12": { "efficacy": 29, "effort": 96 },
        "13": { "efficacy": 84, "effort": 44 },
        "14": { "efficacy": 60, "effort": 19 }
      }
    },
    {
      "userId": "user4",
      "campaignId": "123",
      "ratings": {
        "0": { "efficacy": 72, "effort": 51 },
        "1": { "efficacy": 28, "effort": 89 },
        "2": { "efficacy": 95, "effort": 13 },
        "3": { "efficacy": 80, "effort": 64 },
        "4": { "efficacy": 83, "effort": 90 },
        "5": { "efficacy": 90, "effort": 92 },
        "6": { "efficacy": 31, "effort": 75 },
        "7": { "efficacy": 88, "effort": 22 },
        "8": { "efficacy": 64, "effort": 58 },
        "9": { "efficacy": 42, "effort": 96 },
        "10": { "efficacy": 77, "effort": 31 },
        "11": { "efficacy": 25, "effort": 69 },
        "12": { "efficacy": 91, "effort": 47 },
        "13": { "efficacy": 53, "effort": 83 },
        "14": { "efficacy": 6, "effort": 1 }
      }
    },
    {
      "userId": "user5",
      "campaignId": "123",
      "ratings": {
        "0": { "efficacy": 34, "effort": 93 },
        "1": { "efficacy": 81, "effort": 27 },
        "2": { "efficacy": 56, "effort": 62 },
        "3": { "efficacy": 99, "effort": 80 },
        "4": { "efficacy": 90, "effort": 88 },
        "5": { "efficacy": 67, "effort": 15 },
        "6": { "efficacy": 46, "effort": 79 },
        "7": { "efficacy": 13, "effort": 54 },
        "8": { "efficacy": 90, "effort": 36 },
        "9": { "efficacy": 75, "effort": 68 },
        "10": { "efficacy": 29, "effort": 94 },
        "11": { "efficacy": 82, "effort": 23 },
        "12": { "efficacy": 37, "effort": 86 },
        "13": { "efficacy": 61, "effort": 59 },
        "14": { "efficacy": 4, "effort": 1 }
      }
    },
    {
      "userId": "user6",
      "campaignId": "123",
      "ratings": {
        "0": { "efficacy": 65, "effort": 18 },
        "1": { "efficacy": 39, "effort": 84 },
        "2": { "efficacy": 92, "effort": 46 },
        "3": { "efficacy": 80, "effort": 73 },
        "4": { "efficacy": 90, "effort": 90 },
        "5": { "efficacy": 11, "effort": 97 },
        "6": { "efficacy": 86, "effort": 31 },
        "7": { "efficacy": 58, "effort": 89 },
        "8": { "efficacy": 23, "effort": 64 },
        "9": { "efficacy": 47, "effort": 81 },
        "10": { "efficacy": 93, "effort": 35 },
        "11": { "efficacy": 69, "effort": 77 },
        "12": { "efficacy": 16, "effort": 95 },
        "13": { "efficacy": 80, "effort": 42 },
        "14": { "efficacy": 6, "effort": 1 }
      }
    },
    {
      "userId": "user7",
      "campaignId": "123",
      "ratings": {
        "0": { "efficacy": 19, "effort": 76 },
        "1": { "efficacy": 87, "effort": 33 },
        "2": { "efficacy": 62, "effort": 91 },
        "3": { "efficacy": 44, "effort": 58 },
        "4": { "efficacy": 96, "effort": 90 },
        "5": { "efficacy": 31, "effort": 85 },
        "6": { "efficacy": 78, "effort": 49 },
        "7": { "efficacy": 25, "effort": 93 },
        "8": { "efficacy": 59, "effort": 17 },
        "9": { "efficacy": 83, "effort": 66 },
        "10": { "efficacy": 36, "effort": 79 },
        "11": { "efficacy": 71, "effort": 45 },
        "12": { "efficacy": 98, "effort": 38 },
        "13": { "efficacy": 52, "effort": 88 },
        "14": { "efficacy": 6, "effort": 1 }
      }
    }
  ]
};

export default fakeData;