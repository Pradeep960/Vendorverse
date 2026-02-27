import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
    return (
        <div className={`card card-shadow p-4 ${className} mb-4`}>
            {title && <h5 className="card-title fw-bold text-dark mb-4">{title}</h5>}
            <div className="card-body p-0">
                {children}
            </div>
        </div>
    );
};

export default Card;
