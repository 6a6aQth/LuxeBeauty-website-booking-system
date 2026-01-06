// Simple test to verify time-slots functionality
const { timeSlots, generateTimeSlots, getSlotsForDate } = require('./lib/time-slots.ts');

console.log('Time Slots:');
console.log(JSON.stringify(timeSlots, null, 2));

console.log('\nGenerated Time Slots (without weekends):');
console.log(generateTimeSlots(false));

console.log('\nGenerated Time Slots (with weekends):');
console.log(generateTimeSlots(true));

console.log('\nMonday-Thursday slots:');
console.log(getSlotsForDate(new Date('2025-01-06'))); // Monday

console.log('\nFriday slots:');
console.log(getSlotsForDate(new Date('2025-01-10'))); // Friday

console.log('\nSaturday slots:');
console.log(getSlotsForDate(new Date('2025-01-11'))); // Saturday

console.log('\nSunday slots:');
console.log(getSlotsForDate(new Date('2025-01-12'))); // Sunday
