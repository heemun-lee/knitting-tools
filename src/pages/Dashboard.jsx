import { useTranslation } from 'react-i18next';
import {
    IconCalculator,
    IconSplit,
    IconPattern,
    IconBookmark,
    IconSparkle,
    IconHeart,
    IconArrowRight
} from '../components/icons';

const Dashboard = ({onNav}) => {
    const { t } = useTranslation();
    const tools = [
        {
            id: 'stitch',
            icon: <IconCalculator size={26} stroke={1.6}/>,
            title: t('dashboard.title_stitch'),
            desc: t('dashboard.desc_stitch')
        },
        {
            id: 'shape',
            icon: <IconSplit size={26} stroke={1.6}/>,
            title: t('dashboard.title_shape'),
            desc: t('dashboard.desc_shape')
        },
        {
            id: 'pattern',
            icon: <IconPattern size={26} stroke={1.6}/>,
            title: t('dashboard.title_pattern'),
            desc: t('dashboard.desc_pattern')
        }
    ];

    const stats = [
        {icon: <IconBookmark size={20} stroke={1.8}/>, num: t('dashboard.stat_calc'), label: t('dashboard.stat_calc_desc')},
        {icon: <IconSparkle size={20} stroke={1.8}/>, num: t('dashboard.stat_edit'), label: t('dashboard.stat_edit_desc')},
        {icon: <IconHeart size={20} stroke={1.8}/>, num: t('dashboard.stat_save'), label: t('dashboard.stat_save_desc')}
    ];

    return (
        <div className="page">
            <div className="page-head">
                <div className="page-eyebrow">Dashboard</div>
                <h1 className="page-title">{t('dashboard.main_title')}</h1>
                <p className="page-subtitle">{t('dashboard.main_subtitle')}</p>
            </div>

            <div className="stat-strip">
                {stats.map((s, i) => (
                    <div className="stat" key={i}>
                        <div className="stat-icon">{s.icon}</div>
                        <div>
                            <div className="stat-num">{s.num}</div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="tools-grid">
                {tools.map(t_item => (
                    <button key={t_item.id} className="tool-card" onClick={() => onNav(t_item.id)}>
                        <div className="tool-icon-wrap">{t_item.icon}</div>
                        <h3 className="tool-card-title">{t_item.title}</h3>
                        <p className="tool-card-desc">{t_item.desc}</p>
                        <span className="tool-card-go">
              {t('dashboard.open')} <IconArrowRight size={14} stroke={2.2}/>
            </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;