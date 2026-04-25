import { useState, useEffect } from 'react';
import { ToastProvider } from './components/shared';
import { IconYarn, IconHome, IconCalculator, IconSplit, IconPattern, IconHeart } from './components/icons';
import Dashboard from './pages/Dashboard';
import StitchCalc from './pages/StitchCalc';
import ShapeCalc from './pages/ShapeCalc';
import PatternTool from './pages/PatternTool';

const NAV = [
  { id: 'home',    label: '대시보드',  icon: <IconHome size={18} stroke={1.8} />,       section: 'main' },
  { id: 'stitch',  label: '코 계산기', icon: <IconCalculator size={18} stroke={1.8} />,  section: 'tools' },
  { id: 'shape',   label: '줄임·늘림', icon: <IconSplit size={18} stroke={1.8} />,        section: 'tools' },
  { id: 'pattern', label: '사진→도안', icon: <IconPattern size={18} stroke={1.8} />,      section: 'tools' },
];

const VALID_ROUTES = ['home', 'stitch', 'shape', 'pattern'];

const App = () => {
  const [route, setRoute] = useState(() => {
    const h = window.location.hash.replace('#', '');
    return VALID_ROUTES.includes(h) ? h : 'home';
  });

  useEffect(() => { window.location.hash = route; }, [route]);

  let page;
  if (route === 'home')         page = <Dashboard onNav={setRoute} />;
  else if (route === 'stitch')  page = <StitchCalc />;
  else if (route === 'shape')   page = <ShapeCalc />;
  else if (route === 'pattern') page = <PatternTool />;

  return (
    <ToastProvider>
      <div className="app">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">
              <IconYarn size={22} stroke={1.6} />
            </div>
            <div>
              <div className="brand-name">Knitting Tools</div>
              <div className="brand-sub">뜨개질 도구함</div>
            </div>
          </div>

          <div className="nav-section-label">메인</div>
          {NAV.filter(n => n.section === 'main').map(n => (
            <button key={n.id}
                    className={`nav-item ${route === n.id ? 'active' : ''}`}
                    onClick={() => setRoute(n.id)}>
              <span className="nav-icon">{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}

          <div className="nav-section-label">도구</div>
          {NAV.filter(n => n.section === 'tools').map(n => (
            <button key={n.id}
                    className={`nav-item ${route === n.id ? 'active' : ''}`}
                    onClick={() => setRoute(n.id)}>
              <span className="nav-icon">{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}

          <div className="sidebar-footer">
            <span style={{ color: 'var(--pink-500)', flexShrink: 0 }}>
              <IconHeart size={14} stroke={2} />
            </span>
            <span>한 코 한 코, 차분히<br/>오늘의 뜨개를 응원해요</span>
          </div>
        </aside>

        <main className="main" key={route}>
          {page}
        </main>
      </div>
    </ToastProvider>
  );
};

export default App;