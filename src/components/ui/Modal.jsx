export const Modal = ({open, onClose, title, children, actions}) => {
    if (!open) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                {title && <h3 className="modal-title">{title}</h3>}
                <div className="modal-text">{children}</div>
                <div className="modal-actions">{actions}</div>
            </div>
        </div>
    );
};
