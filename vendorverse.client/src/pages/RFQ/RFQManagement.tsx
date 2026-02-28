import React, { useEffect, useState } from 'react';
import Card from '../../components/Card/Card';
import Loader from '../../components/Loader/Loader';
import { FiPlus, FiEye, FiClock, FiCheckCircle, FiFileText } from 'react-icons/fi';
import { getRFQs } from '../../services/apiService';
import type { RFQ } from '../../models/RFQ';
import RFQCreateModal from '../../components/RFQCreateModal/RFQCreateModal';
import RFQDetailsModal from '../../components/RFQDetailsModal/RFQDetailsModal';

const RFQManagement: React.FC = () => {
    const [rfqs, setRFQs] = useState<RFQ[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [viewingRFQ, setViewingRFQ] = useState<RFQ | null>(null);

    const fetchRFQs = () => {
        setLoading(true);
        getRFQs().then(data => {
            setRFQs(data);
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchRFQs();
    }, []);

    useEffect(() => {
        getRFQs().then(data => {
            setRFQs(data);
            setLoading(false);
        });
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Pending': return <span className="badge bg-warning text-dark rounded-pill px-3 py-2"><FiClock className="me-1" /> Pending</span>;
            case 'Responses Received': return <span className="badge bg-info text-dark rounded-pill px-3 py-2"><FiCheckCircle className="me-1" /> Responses Received</span>;
            case 'Completed': return <span className="badge bg-success rounded-pill px-3 py-2"><FiCheckCircle className="me-1" /> Completed</span>;
            default: return <span className="badge bg-secondary rounded-pill px-3 py-2">{status}</span>;
        }
    };

    const handleViewPDF = (file: { name: string, data: string }) => {
        const base64Content = file.data.split(',')[1];
        const binary = atob(base64Content);
        const array = [];
        for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        const blob = new Blob([new Uint8Array(array)], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    if (loading) return <Loader />;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold text-dark mb-1">RFQ Management</h3>
                    {/* <p className="text-secondary mb-0">Create and monitor your requests for quotation.</p> */}
                </div>
                {/* <button
                    className="btn btn-primary d-flex align-items-center shadow-sm"
                    onClick={() => setShowCreateModal(true)}
                >
                    <FiPlus className="me-2" /> Create RFQ
                </button> */}
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
                                            <span className="text-muted d-block text-uppercase" style={{ fontSize: '10px' }}>Quantity</span>
                                            {rfq.quantity}
                                        </div>
                                        <div>
                                            <span className="text-muted d-block text-uppercase" style={{ fontSize: '10px' }}>Budget</span>
                                            ${rfq.budget}
                                        </div>
                                        <div>
                                            <span className="text-muted d-block text-uppercase" style={{ fontSize: '10px' }}>Created</span>
                                            {new Date(rfq.createdAt).toLocaleDateString()}
                                        </div>
                                        <div>
                                            <span className="text-muted d-block text-uppercase" style={{ fontSize: '10px' }}>Vendors</span>
                                            <span className="badge bg-light text-primary border">{rfq.vendorsTargeted.length} Invited</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="d-flex flex-md-column justify-content-center gap-2">
                                    <button
                                        className="btn btn-outline-primary shadow-sm"
                                        onClick={() => setViewingRFQ(rfq)}
                                    >
                                        <FiEye className="me-2" /> View Details
                                    </button>
                                    {rfq.attachedFile && (
                                        <button
                                            className="btn btn-outline-secondary shadow-sm"
                                            onClick={() => handleViewPDF(rfq.attachedFile!)}
                                        >
                                            <FiFileText className="me-2" /> View PDF
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                ))}
            </div>
            <RFQCreateModal
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={fetchRFQs}
            />
            {viewingRFQ && (
                <RFQDetailsModal
                    rfq={viewingRFQ}
                    onClose={() => setViewingRFQ(null)}
                />
            )}
        </div>
    );
};

export default RFQManagement;
