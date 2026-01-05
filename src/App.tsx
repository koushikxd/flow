import { useState } from 'react';
import { HomePage } from '@/pages/home';
import { SpacePage } from '@/pages/space';
import { AnalyticsPage } from '@/pages/analytics';
import { SettingsPage } from '@/pages/settings';
import { Navbar } from '@/components/navbar';
import './App.css';

type Page = 'home' | 'space' | 'analytics' | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);

  const handleNavigate = (page: string, spaceId?: string) => {
    if (page === 'space' && spaceId) {
      setSelectedSpaceId(spaceId);
      setCurrentPage('space');
    } else {
      setCurrentPage(page as Page);
    }
  };

  return (
    <div className="dark h-full flex flex-col">
      <main className="flex-1 overflow-auto pb-20">
        {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentPage === 'space' && selectedSpaceId && (
          <SpacePage spaceId={selectedSpaceId} onNavigate={handleNavigate} />
        )}
        {currentPage === 'analytics' && <AnalyticsPage onNavigate={handleNavigate} />}
        {currentPage === 'settings' && <SettingsPage onNavigate={handleNavigate} />}
      </main>
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
    </div>
  );
}

export default App;
