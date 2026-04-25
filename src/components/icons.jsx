const Icon = ({children, size = 20, stroke = 1.8, ...props}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={stroke}
         strokeLinecap="round" strokeLinejoin="round" {...props}>
        {children}
    </svg>
);

export const IconYarn = (p) => (
    <Icon {...p}>
        <circle cx="12" cy="12" r="9"/>
        <path d="M5 9c4 0 6 6 14 6"/>
        <path d="M3.5 13c4 0 6-6 14-6"/>
        <path d="M14 21c-1-2-1-4 0-6s1-4 0-6"/>
        <path d="M17.5 4.5l4 4"/>
    </Icon>
);

export const IconCalculator = (p) => (
    <Icon {...p}>
        <rect x="5" y="3" width="14" height="18" rx="3"/>
        <rect x="8" y="6" width="8" height="3" rx="1"/>
        <circle cx="9" cy="13" r="0.7" fill="currentColor"/>
        <circle cx="12" cy="13" r="0.7" fill="currentColor"/>
        <circle cx="15" cy="13" r="0.7" fill="currentColor"/>
        <circle cx="9" cy="17" r="0.7" fill="currentColor"/>
        <circle cx="12" cy="17" r="0.7" fill="currentColor"/>
        <circle cx="15" cy="17" r="0.7" fill="currentColor"/>
    </Icon>
);

export const IconSplit = (p) => (
    <Icon {...p}>
        <path d="M4 6h6l4 12h6"/>
        <path d="M4 18h6l4-12h6"/>
        <path d="M17 3l3 3-3 3"/>
        <path d="M17 15l3 3-3 3"/>
    </Icon>
);

export const IconPattern = (p) => (
    <Icon {...p}>
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
    </Icon>
);

export const IconHome = (p) => (
    <Icon {...p}>
        <path d="M3 11l9-8 9 8"/>
        <path d="M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10"/>
    </Icon>
);

export const IconHeart = (p) => (
    <Icon {...p}>
        <path d="M12 20s-7-4.5-9-9a5 5 0 019-3 5 5 0 019 3c-2 4.5-9 9-9 9z"/>
    </Icon>
);

export const IconBookmark = (p) => (
    <Icon {...p}>
        <path d="M6 3h12v18l-6-4-6 4z"/>
    </Icon>
);

export const IconPlus = (p) => (
    <Icon {...p}>
        <path d="M12 5v14M5 12h14"/>
    </Icon>
);

export const IconMinus = (p) => (
    <Icon {...p}>
        <path d="M5 12h14"/>
    </Icon>
);

export const IconUpload = (p) => (
    <Icon {...p}>
        <path d="M12 16V4M6 10l6-6 6 6"/>
        <path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3"/>
    </Icon>
);

export const IconDownload = (p) => (
    <Icon {...p}>
        <path d="M12 4v12M6 10l6 6 6-6"/>
        <path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3"/>
    </Icon>
);

export const IconSave = (p) => (
    <Icon {...p}>
        <path d="M5 5a2 2 0 012-2h10l4 4v12a2 2 0 01-2 2H7a2 2 0 01-2-2V5z"/>
        <path d="M8 3v5h8V3"/>
        <rect x="8" y="13" width="8" height="6"/>
    </Icon>
);

export const IconTrash = (p) => (
    <Icon {...p}>
        <path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13"/>
    </Icon>
);

export const IconUndo = (p) => (
    <Icon {...p}>
        <path d="M9 14L4 9l5-5"/>
        <path d="M4 9h11a5 5 0 010 10h-3"/>
    </Icon>
);

export const IconRedo = (p) => (
    <Icon {...p}>
        <path d="M15 14l5-5-5-5"/>
        <path d="M20 9H9a5 5 0 000 10h3"/>
    </Icon>
);

export const IconBrush = (p) => (
    <Icon {...p}>
        <path d="M14 4l6 6-9 9-6-6 9-9z"/>
        <path d="M11 7l6 6"/>
        <path d="M5 19l-2 2"/>
    </Icon>
);

export const IconBucket = (p) => (
    <Icon {...p}>
        <path d="M5 11l7-7 7 7-6 6a3 3 0 01-4 0z"/>
        <path d="M5 11l9 9"/>
        <path d="M19 14a2 2 0 100 4 2 2 0 000-4z"/>
    </Icon>
);

export const IconEyedrop = (p) => (
    <Icon {...p}>
        <path d="M14 4l6 6"/>
        <path d="M17 7l-9 9-4 1 1-4 9-9"/>
    </Icon>
);

export const IconMerge = (p) => (
    <Icon {...p}>
        <path d="M6 3v6a4 4 0 004 4h4a4 4 0 014 4v4"/>
        <path d="M6 3l-3 3M6 3l3 3"/>
        <path d="M18 21l3-3M18 21l-3-3"/>
        <circle cx="14" cy="13" r="0"/>
    </Icon>
);

export const IconCrosshair = (p) => (
    <Icon {...p}>
        <circle cx="12" cy="12" r="8"/>
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
        <circle cx="12" cy="12" r="2"/>
    </Icon>
);

export const IconSparkle = (p) => (
    <Icon {...p}>
        <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>
        <path d="M19 14l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/>
    </Icon>
);

export const IconArrowRight = (p) => (
    <Icon {...p}>
        <path d="M5 12h14M13 6l6 6-6 6"/>
    </Icon>
);

export const IconFileExcel = (p) => (
    <Icon {...p}>
        <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/>
        <path d="M14 3v5h5"/>
        <path d="M9 13l3 3 3-3M9 18l3-3 3 3"/>
    </Icon>
);

export const IconFilePdf = (p) => (
    <Icon {...p}>
        <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/>
        <path d="M14 3v5h5"/>
        <path d="M8 14h1a1 1 0 010 2H8v-2zM8 14v3M12 14v3M12 14h1.5M12 16h1M16 14h2M16 14v3M16 16h1.5"/>
    </Icon>
);

export const IconReset = (p) => (
    <Icon {...p}>
        <path d="M3 12a9 9 0 109-9"/>
        <path d="M3 4v5h5"/>
    </Icon>
);

export const IconCheck = (p) => (
    <Icon {...p}>
        <path d="M5 12l5 5L20 7"/>
    </Icon>
);

export const IconRulerLine = (p) => (
    <Icon {...p}>
        <path d="M3 7h18v10H3z"/>
        <path d="M7 7v3M11 7v4M15 7v3M19 7v4"/>
    </Icon>
);

export const IconSelect = (p) => (
    <Icon {...p}>
        <path d="M4 4h4M16 4h4M4 20h4M16 20h4M4 4v4M4 16v4M20 4v4M20 16v4" strokeDasharray="0"/>
        <path d="M10 4h4M10 20h4M4 10v4M20 10v4" strokeDasharray="2 3"/>
    </Icon>
);

export const IconCopy = (p) => (
    <Icon {...p}>
        <rect x="8" y="8" width="13" height="13" rx="2"/>
        <path d="M16 8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2h3"/>
    </Icon>
);

export const IconScissors = (p) => (
    <Icon {...p}>
        <circle cx="6" cy="6" r="3"/>
        <circle cx="6" cy="18" r="3"/>
        <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12"/>
    </Icon>
);

export const IconPaste = (p) => (
    <Icon {...p}>
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
    </Icon>
);

export const IconMove = (p) => (
    <Icon {...p}>
        <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>
    </Icon>
);

export const IconFit = (p) => (
    <Icon {...p}>
        <path d="M3 9V5a2 2 0 0 1 2-2h4M21 9V5a2 2 0 0 0-2-2h-4M3 15v4a2 2 0 0 0 2 2h4M21 15v4a2 2 0 0 1-2 2h-4"/>
    </Icon>
);

export const IconMaximize = (p) => (
    <Icon {...p}>
        <path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4"/>
    </Icon>
);

export const IconMinimize = (p) => (
    <Icon {...p}>
        <path d="M9 4v3a2 2 0 0 1-2 2H4M15 4v3a2 2 0 0 0 2 2h3M9 20v-3a2 2 0 0 0-2-2H4M15 20v-3a2 2 0 0 1 2-2h3"/>
    </Icon>
);export const IconMenu = (p) => (
    <svg width={p.size || 24} height={p.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.stroke || 2} strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
);

export const IconX = (p) => (
    <svg width={p.size || 24} height={p.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.stroke || 2} strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);
