const storeInfoController = require('../controllers/storeInfoController');
const { isWithinTimeRange } = storeInfoController;

// Helper function to create a date with specific time
const createTime = (hours, minutes) => {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

describe('Store Info Controller', () => {
  describe('isWithinTimeRange', () => {
    test('should return true when current time is within range', () => {
      const currentTime = createTime(14, 0); // 2:00 PM
      const openTime = '13:00';
      const closeTime = '15:00';
      expect(isWithinTimeRange(currentTime, openTime, closeTime)).toBe(true);
    });

    test('should return false when current time is before opening', () => {
      const currentTime = createTime(12, 59); // 12:59 PM
      const openTime = '13:00';
      const closeTime = '15:00';
      expect(isWithinTimeRange(currentTime, openTime, closeTime)).toBe(false);
    });

    test('should return false when current time is after closing', () => {
      const currentTime = createTime(15, 1); // 3:01 PM
      const openTime = '13:00';
      const closeTime = '15:00';
      expect(isWithinTimeRange(currentTime, openTime, closeTime)).toBe(false);
    });

    test('should handle overnight hours correctly', () => {
      // Test case for a store open overnight (e.g., 10 PM to 4 AM)
      const currentTime = createTime(23, 30); // 11:30 PM
      const openTime = '22:00';
      const closeTime = '04:00';
      expect(isWithinTimeRange(currentTime, openTime, closeTime)).toBe(true);
    });
  });
});
