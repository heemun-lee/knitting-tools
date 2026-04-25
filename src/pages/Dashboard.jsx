import { IconCalculator, IconSplit, IconPattern, IconBookmark, IconSparkle, IconHeart, IconArrowRight } from '../components/icons';

const Dashboard = ({ onNav }) => {
  const tools = [
    { id: 'stitch', icon: <IconCalculator size={26} stroke={1.6} />, title: '코 계산기', desc: '게이지를 입력하면 원하는 너비·길이에 필요한 코수와 단수를 즉시 계산해드려요.' },
    { id: 'shape',  icon: <IconSplit size={26} stroke={1.6} />, title: '줄임·늘림 분배기', desc: '시작 코수와 마지막 코수를 입력하면 균등하게 분배된 단수별 가이드를 알려드려요.' },
    { id: 'pattern', icon: <IconPattern size={26} stroke={1.6} />, title: '사진 → 도안 변환', desc: '사진을 픽셀 도안으로 바꾸고, 색상을 편집·합치고, 트래커로 작업 위치를 표시할 수 있어요.' }
  ];

  const stats = [
    { icon: <IconBookmark size={20} stroke={1.8} />, num: '계산 즉시', label: '게이지 기반 자동 계산' },
    { icon: <IconSparkle size={20} stroke={1.8} />, num: '색상 편집', label: '도안 색을 자유롭게' },
    { icon: <IconHeart size={20} stroke={1.8} />, num: '저장 가능', label: '브라우저에 안전하게' }
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-eyebrow">Dashboard</div>
        <h1 className="page-title">오늘도 한 코 한 코, 천천히</h1>
        <p className="page-subtitle">뜨개질에 필요한 계산과 도안 작업을 한 곳에서. 도구를 골라 시작해보세요.</p>
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
        {tools.map(t => (
          <button key={t.id} className="tool-card" onClick={() => onNav(t.id)}>
            <div className="tool-icon-wrap">{t.icon}</div>
            <h3 className="tool-card-title">{t.title}</h3>
            <p className="tool-card-desc">{t.desc}</p>
            <span className="tool-card-go">
              열기 <IconArrowRight size={14} stroke={2.2} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;