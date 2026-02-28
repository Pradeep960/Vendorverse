import React, { useEffect, useState } from 'react';
import Card from '../../components/Card/Card';
import Loader from '../../components/Loader/Loader';
import { FiPlus, FiEye, FiClock, FiCheckCircle, FiTrash2 } from 'react-icons/fi';
import { getStoredRFQs, deleteRFQ } from '../../services/rfqService';
import { mockRFQs } from '../../mock/rfqs';
import type { RFQ } from '../../models/RFQ';

const RFQManagement: React.FC = () => {
    const [rfqs, setRFQs] = useState<RFQ[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load RFQs from localStorage and combine with mock RFQs
        const storedRFQs = getStoredRFQs();
        
        // Get mock RFQ IDs to avoid duplicates
        const mockIds = new Set(mockRFQs.map(r => r.id));
        
        // Filter out any stored RFQs that have the same ID as mock ones
        const newRFQs = storedRFQs.filter(r => !mockIds.has(r.id));
        
        // Combine: new RFQs first, then mock RFQs
        const combinedRFQs = [...newRFQs, ...mockRFQs];
        
        setRFQs(combinedRFQs);
        setLoading(false);
    }, []);

    const handleDelete = (id: string) => {
        // Only delete from localStorage (don't delete mock RFQs)
        const rfq = rfqs.find(r => r.id === id);
        if (rfq && !rfq.id.startsWith('rfq-')) {
            // It's a stored RFQ (not from mock), delete from localStorage
            deleteRFQ(id);
        }
        // Refresh the list
        const storedRFQs = getStoredRFQs();
        const mockIds = new Set(mockRFQs.map(r => r.id));
        const newRFQs = storedRFQs.filter(r => !mockIds.has(r.id));
        const combinedRFQs = [...newRFQs, ...mockRFQs];
        setRFQs(combinedRFQs);
    };

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
                <div>
                    <span className="badge bg-light text-dark border me-2">
                        {rfqs.length} Request{rfqs.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {rfqs.length === 0 ? (
                <div className="text-center py-5">
                    <FiPlus size={48} className="text-muted mb-3" />
                    <p className="text-secondary">
                        No RFQs yet. Create a quote request from the Vendor Search page.
                    </p>
                </div>
            ) : (
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
                                                <span className="badge bg-light text-primary border">
                                                    {rfq.vendorsTargeted.length} Invited
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="d-flex flex-md-column justify-content-center gap-2">
                                        <button className="btn btn-outline-primary shadow-sm">
                                            <FiEye className="me-2" /> View Details
                                        </button>
                                        <button 
                                            className="btn btn-outline-danger shadow-sm"
                                            onClick={() => handleDelete(rfq.id)}
                                        >
                                            <FiTrash2 className="me-2" /> Delete
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RFQManagement;
