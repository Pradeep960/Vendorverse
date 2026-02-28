import React, { useEffect, useState } from 'react';
import { FiFile, FiClock } from 'react-icons/fi';
import { getQuotes, getVendors } from '../../services/apiService';
import type { RFQ } from '../../models/RFQ';
import type { Quote } from '../../models/Quote';
import type { Vendor } from '../../models/Vendor';
import Loader from '../Loader/Loader';

interface RFQDetailsModalProps {
    rfq: RFQ;
    onClose: () => void;
}

const RFQDetailsModal: React.FC<RFQDetailsModalProps> = ({ rfq, onClose }) => {
    const [quotes, setQuotes] = useState<(Quote & { vendor?: Vendor })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            const [allQuotes, allVendors] = await Promise.all([getQuotes(), getVendors()]);
            const rfqQuotes = allQuotes.filter(q => q.rfqId === rfq.id);
            const enrichedQuotes = rfqQuotes.map(q => ({
                ...q,
                vendor: allVendors.find(v => v.id === q.vendorId)
            }));
            setQuotes(enrichedQuotes);
            setLoading(false);
        };
        fetchDetails();
    }, [rfq.id]);

    return (
        <>
            <div className="modal-backdrop show" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 1040 }} onClick={onClose} />
            <div className="modal d-block" tabIndex={-1} onClick={onClose}>
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
                    <div className="modal-content" style={{ borderRadius: '16px', overflow: 'hidden', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
                        <div className="modal-header bg-light border-bottom p-4">
                            <div>
                                <h5 className="modal-title fw-bold text-dark mb-1">{rfq.title}</h5>
                                <div className="text-secondary small d-flex gap-3">
                                    <span>Quantity: <strong>{rfq.quantity}</strong></span>
                                    <span>Budget: <strong>${rfq.budget}</strong></span>
                                    <span>Status: <strong className="text-primary">{rfq.status}</strong></span>
                                </div>
                            </div>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>

                        <div className="modal-body p-4 bg-white">
                            {loading ? (
                                <Loader />
                            ) : (
                                <div>
                                    <h6 className="fw-bold mb-3 d-flex align-items-center">
                                        Vendor Responses <span className="badge bg-primary ms-2">{quotes.length}/{rfq.vendorsTargeted.length}</span>
                                    </h6>

                                    {quotes.length === 0 ? (
                                        <div className="text-center py-5 bg-light rounded border">
                                            <FiClock size={40} className="text-secondary mb-3" />
                                            <h5 className="text-secondary">Waiting for vendor responses</h5>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-hover align-middle border">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Vendor Name</th>
                                                        <th>Price (USD)</th>
                                                        <th>Delivery Time (Days)</th>
                                                        <th>Submitted Date</th>
                                                        <th>Attachments</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {quotes.map(q => (
                                                        <tr key={q.id}>
                                                            <td className="fw-bold text-dark">{q.vendor?.name || 'Unknown Vendor'}</td>
                                                            <td className="fw-semibold text-success">${q.price.toLocaleString()}</td>
                                                            <td>{q.deliveryTimeDays}</td>
                                                            <td>{new Date(q.submittedAt).toLocaleDateString()}</td>
                                                            <td>
                                                                {q.files && q.files.length > 0 ? (
                                                                    <div className="d-flex flex-column gap-1">
                                                                        {q.files.map((file, idx) => (
                                                                            <span key={idx} className="badge bg-light text-primary border px-2 py-1">
                                                                                <FiFile className="me-1" /> {file}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-secondary small">None</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer bg-light border-top d-flex justify-content-between">
                            {quotes.length > 1 ? (
                                <button type="button" className="btn btn-outline-primary" onClick={() => window.location.href = `/comparison/${rfq.id}`}>
                                    Compare Quotations
                                </button>
                            ) : <div></div>}
                            <button type="button" className="btn btn-primary px-4" onClick={onClose}>Close</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RFQDetailsModal;
