import {useState, useEffect} from 'react';
import {ToastProvider} from './context/ToastContext';
import {IconMenu, IconX, IconHome, IconCalculator, IconSplit, IconPattern, IconHeart} from './components/icons';
import Dashboard from './pages/Dashboard';
import StitchCalc from './pages/StitchCalc';
import ShapeCalc from './pages/ShapeCalc';
import PatternTool from './pages/PatternTool';
import { useTranslation } from 'react-i18next';

const NAV = [
    {id: 'home', labelKey: 'nav.home', icon: <IconHome size={18} stroke={1.8}/>, section: 'main'},
    {id: 'stitch', labelKey: 'nav.stitch', icon: <IconCalculator size={18} stroke={1.8}/>, section: 'tools'},
    {id: 'shape', labelKey: 'nav.shape', icon: <IconSplit size={18} stroke={1.8}/>, section: 'tools'},
    {id: 'pattern', labelKey: 'nav.pattern', icon: <IconPattern size={18} stroke={1.8}/>, section: 'tools'},
];

const VALID_ROUTES = ['home', 'stitch', 'shape', 'pattern'];

const App = () => {
    const { t, i18n } = useTranslation();
    const [route, setRoute] = useState(() => {
        const h = window.location.hash.replace('#', '');
        return VALID_ROUTES.includes(h) ? h : 'home';
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        window.location.hash = route;
    }, [route]);

    let page;
    if (route === 'home') page = <Dashboard onNav={setRoute}/>;
    else if (route === 'stitch') page = <StitchCalc/>;
    else if (route === 'shape') page = <ShapeCalc/>;
    else if (route === 'pattern') page = <PatternTool/>;

    return (
        <ToastProvider>
            <div className={`app ${isSidebarOpen ? '' : 'sidebar-closed'}`}>
                <aside className="sidebar">
                    <div className="brand">
                        <button className="sidebar-header-toggle" onClick={() => setIsSidebarOpen(false)}>
                            <IconX size={20} stroke={2}/>
                        </button>
                        <div>
                            <div className="brand-name">{t('sidebar.brand_name')}</div>
                            <div className="brand-sub">{t('sidebar.brand_sub')}</div>
                        </div>
                    </div>

                    <div className="nav-section-label">{t('sidebar.main_section')}</div>
                    {NAV.filter(n => n.section === 'main').map(n => (
                        <button key={n.id}
                                className={`nav-item ${route === n.id ? 'active' : ''}`}
                                onClick={() => setRoute(n.id)}>
                            <span className="nav-icon">{n.icon}</span>
                            <span>{t(n.labelKey)}</span>
                        </button>
                    ))}

                    <div className="nav-section-label">{t('sidebar.tools_section')}</div>
                    {NAV.filter(n => n.section === 'tools').map(n => (
                        <button key={n.id}
                                className={`nav-item ${route === n.id ? 'active' : ''}`}
                                onClick={() => setRoute(n.id)}>
                            <span className="nav-icon">{n.icon}</span>
                            <span>{t(n.labelKey)}</span>
                        </button>
                    ))}

                    <div className="sidebar-footer" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '16px', padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span style={{color: 'var(--pink-500)', flexShrink: 0}}>
                                <IconHeart size={14} stroke={2}/>
                            </span>
                            <span>{t('sidebar.footer_msg1')}<br/>{t('sidebar.footer_msg2')}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                            {['ko', 'en', 'ja'].map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => i18n.changeLanguage(lang)}
                                    style={{
                                        background: i18n.resolvedLanguage === lang ? 'var(--gray-200)' : 'transparent',
                                        border: '1px solid var(--gray-300)',
                                        borderRadius: '4px',
                                        padding: '4px 6px',
                                        cursor: 'pointer',
                                        color: 'var(--gray-800)',
                                        fontWeight: i18n.resolvedLanguage === lang ? '600' : '400'
                                    }}
                                >
                                    {t(`lang.${lang}`)}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                <main className="main" key={route}>
                    <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(true)}>
                        <IconMenu size={20} stroke={2}/>
                    </button>
                    {page}
                </main>
            </div>
        </ToastProvider>
    );
};

export default App;