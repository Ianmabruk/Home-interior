import { circularTabService } from './src/services/circularTabService.js';

async function test() {
  try {
    const tabs = await circularTabService.getHomepageCircularTabs();
    console.log('Circular tabs:', Object.keys(tabs).length);
    console.log('Portfolio image:', tabs.portfolio?.imageUrl ? 'YES' : 'NO');
    console.log('Portfolio URL:', tabs.portfolio?.imageUrl);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

test();
