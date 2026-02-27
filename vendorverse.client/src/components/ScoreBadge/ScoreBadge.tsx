import React from 'react';

interface ScoreBadgeProps {
    score: number;
}

const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score }) => {
    let colorClass = 'bg-success';
    if (score < 70) colorClass = 'bg-danger';
    else if (score < 85) colorClass = 'bg-warning';

    return (
        <div className={`badge ${colorClass} rounded-pill px-3 py-2 fs-6 shadow-sm`}>
            {score}% Match
        </div>
    );
};

export default ScoreBadge;
