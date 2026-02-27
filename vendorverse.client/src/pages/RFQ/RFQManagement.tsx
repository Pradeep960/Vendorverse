import React, { useEffect, useState } from 'react';
import Card from '../../components/Card/Card';
import Loader from '../../components/Loader/Loader';
import { FiPlus, FiEye, FiClock, FiCheckCircle } from 'react-icons/fi';
import { getRFQs } from '../../services/apiService';
import type { RFQ } from '../../models/RFQ';

const RFQManagement: React.FC = () => {
    const [rfqs, setRFQs] = useState<RFQ[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getRFQs().then(data => {
            setRFQs(data);
            setLoading(false);
        });
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Draft': return <span className="badge bg-secondary rounded-pill px-3 py-2"><FiClock className="me-1" /> Draft</span>;
            case 'Sent': return <span className="badge bg-primary rounded-pill px-3 py-2"><FiCheckCircle className="me-1" /> Sent</span>;
            case 'Closed': return <span className="badge bg-success rounded-pill px-3 py-2"><FiCheckCircle className="me-1" /> Closed</span>;
            default: return null;
        }
    };

    if (loading) return <Loader />;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold text-dark mb-1">RFQ Management</h3>
                    <p className="text-secondary mb-0">Create and monitor your requests for quotation.</p>
                </div>
                <button className="btn btn-primary d-flex align-items-center shadow-sm">
                    <FiPlus className="me-2" /> Create RFQ
                </button>
            </div>

            <div className="row g-4">
                {rfqs.map(rfq => (
                    <div className="col-12" key={rfq.id}>
                        <Card className="p-4 border-0 hover-lift">
                            <div className="d-flex flex-column flex-md-row justify-content-between">
                                <div className="mb-3 mb-md-0">
                                    <div className="d-flex align-items-center mb-2">
                                        <h5 className="fw-bold text-dark mb-0 me-3">{rfq.title}</h5>
                                        {getStatusBadge(rfq.status)}
                                    </div>
                                    <p className="text-secondary mb-3" style={{ maxWidth: '800px' }}>{rfq.description}</p>

                                    <div className="d-flex flex-wrap gap-4 text-secondary small fw-bold">
                                        <div>
                                            <span className="text-muted d-block text-uppercase" style={{ fontSize: '10px' }}>Created</span>
                                            {new Date(rfq.createdAt).toLocaleDateString()}
                                        </div>
                                        <div>
                                            <span className="text-muted d-block text-uppercase" style={{ fontSize: '10px' }}>Deadline</span>
                                            {new Date(rfq.deadline).toLocaleDateString()}
                                        </div>
                                        <div>
                                            <span className="text-muted d-block text-uppercase" style={{ fontSize: '10px' }}>Vendors</span>
                                            <span className="badge bg-light text-primary border">{rfq.vendorsTargeted.length} Invited</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="d-flex flex-md-column justify-content-center gap-2">
                                    <button className="btn btn-outline-primary shadow-sm"><FiEye className="me-2" /> View Details</button>
                                </div>
                            </div>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RFQManagement;
