import { useEffect } from 'react'
import AppRouter from './router/AppRouter'
import { PwaInstallPrompt } from './components/PwaInstallPrompt'
import { offlineSyncService } from './services/offline-sync'
import { pushNotificationService } from './services/push-notifications'

function App() {
  useEffect(() => {
    // Initialize PWA services
    const initPwaServices = async () => {
      try {
        // Initialize offline sync
        await offlineSyncService.init();
        
        // Initialize push notifications
        await pushNotificationService.init();
        
        console.log('PWA services initialized');
      } catch (error) {
        console.error('Failed to initialize PWA services:', error);
      }
    };

    initPwaServices();

    // Register service worker update handler
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // New service worker has taken control
        console.log('New service worker activated, reloading page...');
        window.location.reload();
      });
    }
  }, []);

  return (
    <>
      <AppRouter />
      <PwaInstallPrompt />
    </>
  );
}

export default App
