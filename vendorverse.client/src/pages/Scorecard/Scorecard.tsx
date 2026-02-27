import React, { useEffect, useState } from 'react';
import Card from '../../components/Card/Card';
import Loader from '../../components/Loader/Loader';
import { getVendorScores } from '../../services/apiService';
import type { VendorScore } from '../../models/Score';
import { FiTrendingUp, FiAward, FiDollarSign, FiTool } from 'react-icons/fi';

const ProgressBar = ({ label, score, icon }: { label: string, score: number, icon: React.ReactNode }) => {
    let color = 'bg-success';
    if (score < 70) color = 'bg-danger';
    else if (score < 85) color = 'bg-warning';

    return (
        <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary small fw-bold d-flex align-items-center">
                    <span className="me-2 text-primary">{icon}</span> {label}
                </span>
                <span className="fw-bold text-dark">{score}/100</span>
            </div>
            <div className="progress" style={{ height: '8px' }}>
                <div className={`progress-bar ${color}`} role="progressbar" style={{ width: `${score}%` }} aria-valuenow={score} aria-valuemin={0} aria-valuemax={100}></div>
            </div>
        </div>
    );
};

const Scorecard: React.FC = () => {
    const [scores, setScores] = useState<VendorScore[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getVendorScores().then(data => {
            setScores(data.sort((a, b) => b.overallScore - a.overallScore));
            setLoading(false);
        });
    }, []);

    if (loading) return <Loader />;

    return (
        <div>
            <h3 className="fw-bold text-dark mb-4">Vendor Performance Scorecard</h3>

            <div className="row g-4">
                {scores.map(score => (
                    <div className="col-12 col-xl-6" key={score.vendorId}>
                        <Card className="p-4 border-0 hover-lift h-100">
                            <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-4">
                                <div>
                                    <h5 className="fw-bold text-dark mb-1 d-flex align-items-center">
                                        {score.vendorName}
                                        {score.overallScore > 90 && <FiAward className="text-warning ms-2 shadow-sm rounded-circle p-1 bg-warning bg-opacity-10 fs-4" title="Top Performer" />}
                                    </h5>
                                    <span className="badge bg-light text-secondary border rounded-pill px-3 shadow-sm">{score.totalProjects} Completed Projects</span>
                                </div>
                                <div className="text-end">
                                    <div className="fs-1 fw-bold text-primary">{score.overallScore}</div>
                                    <small className="text-secondary fw-bold text-uppercase" style={{ fontSize: '10px' }}>Overall Rating</small>
                                </div>
                            </div>

                            <div className="row g-4">
                                <div className="col-12 col-md-6">
                                    <ProgressBar label="Reliability" score={score.reliabilityScore} icon={<FiTrendingUp />} />
                                    <ProgressBar label="Quality of Work" score={score.qualityScore} icon={<FiAward />} />
                                </div>
                                <div className="col-12 col-md-6">
                                    <ProgressBar label="Pricing" score={score.priceScore} icon={<FiDollarSign />} />
                                    <ProgressBar label="Technical Ability" score={Math.round((score.reliabilityScore + score.qualityScore) / 2)} icon={<FiTool />} />
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-top text-end">
                                <button className="btn btn-outline-primary shadow-sm rounded-pill px-4 hover-lift">View Detailed Report</button>
                            </div>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Scorecard;
