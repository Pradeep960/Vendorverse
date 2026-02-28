import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Card from '../../components/Card/Card';
import Loader from '../../components/Loader/Loader';
import { getQuotes, getVendors, getRFQs, updateRFQ } from '../../services/apiService';
import type { Quote } from '../../models/Quote';
import type { Vendor } from '../../models/Vendor';
import type { RFQ } from '../../models/RFQ';
import { sendSelectionEmail } from '../../services/emailService';
import { FiCheck, FiAward, FiClock, FiDollarSign } from 'react-icons/fi';

const VendorComparison: React.FC = () => {
    const { rfqId } = useParams<{ rfqId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [rfq, setRfq] = useState<RFQ | null>(null);
    const [loading, setLoading] = useState(true);

    const [showEmailModal, setShowEmailModal] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const [q, v, r] = await Promise.all([getQuotes(), getVendors(), getRFQs()]);
            setVendors(v);

            if (rfqId) {
                const rfqData = r.find(x => x.id === rfqId);
                setRfq(rfqData || null);
                setQuotes(q.filter(quote => quote.rfqId === rfqId));
            } else {
                const vendorIds = searchParams.get('vendors')?.split(',') || [];
                // Mock behavior if just comparing vendors without RFQ
                if (vendorIds.length > 0) {
                    setQuotes(q.filter(quote => vendorIds.includes(quote.vendorId)).slice(0, 3));
                } else {
                    setQuotes(q.slice(0, 3));
                }
            }
            setLoading(false);
        };
        fetchData();
    }, [rfqId, searchParams]);

    if (loading) return <Loader />;

    const getVendorName = (id: string) => vendors.find(v => v.id === id)?.name || id;
    const getVendorScore = (id: string) => vendors.find(v => v.id === id)?.matchScore || 0;

    const minPrice = Math.min(...quotes.map((q) => q.price));
    const minDelivery = Math.min(...quotes.map((q) => q.delivery || q.deliveryTimeDays));
    const maxScore = Math.max(...quotes.map(q => getVendorScore(q.vendorId)));

    const handleSelectVendor = (quote: Quote) => {
        setSelectedQuote(quote);
        setShowEmailModal(true);
    };

    const confirmSelection = async () => {
        setSending(true);
        if (rfq) {
            rfq.status = 'Completed';
            await updateRFQ(rfq);
        }
        setTimeout(() => {
            setSending(false);
            setShowEmailModal(false);
            navigate('/rfq');
        }, 2000);
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold text-dark mb-0">Vendor Comparison {rfq ? `- ${rfq.title}` : ''}</h3>
                {rfq && (
                    <button className="btn btn-outline-secondary" onClick={() => navigate('/rfq')}>
                        Back to RFQs
                    </button>
                )}
            </div>

            {quotes.length === 0 ? (
                <Card className="p-5 text-center shadow-sm">
                    <p className="text-secondary fs-5">Not enough data to compare.</p>
                </Card>
            ) : (
                <Card className="p-4 border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="table-responsive">
                        <table className="table table-bordered align-middle text-center m-0" style={{ minWidth: '800px' }}>
                            <thead className="table-light">
                                <tr>
                                    <th className="text-start w-25">Comparison Criteria</th>
                                    {quotes.map(quote => (
                                        <th key={quote.id} className="w-25 text-primary fw-bold fs-5 p-3">
                                            {getVendorName(quote.vendorId)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="text-start fw-bold text-secondary bg-light">Proposed Price</td>
                                    {quotes.map(quote => (
                                        <td key={quote.id} className={`fs-5 fw-bold ${quote.price === minPrice ? 'text-success bg-success bg-opacity-10 w-25' : 'text-dark'}`}>
                                            ${quote.price.toLocaleString()}
                                            {quote.price === minPrice && <span className="badge bg-success ms-2 rounded-pill"><FiDollarSign className="me-1" />Lowest</span>}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="text-start fw-bold text-secondary bg-light">Delivery Timeline</td>
                                    {quotes.map(quote => {
                                        const delivery = quote.delivery || quote.deliveryTimeDays;
                                        return (
                                            <td key={quote.id} className={`fw-bold ${delivery === minDelivery ? 'text-primary bg-primary bg-opacity-10' : 'text-dark'}`}>
                                                {delivery} Days
                                                {delivery === minDelivery && <span className="badge bg-primary ms-2 rounded-pill"><FiClock className="me-1" />Fastest</span>}
                                            </td>
                                        )
                                    })}
                                </tr>
                                <tr>
                                    <td className="text-start fw-bold text-secondary bg-light">Key Features/Notes</td>
                                    {quotes.map(quote => (
                                        <td key={quote.id} className="text-start p-3 align-top">
                                            {quote.features && quote.features.length > 0 ? (
                                                <ul className="list-unstyled mb-2">
                                                    {quote.features.map((feature, i) => (
                                                        <li key={i} className="mb-1 text-secondary small d-flex align-items-middle">
                                                            <FiCheck className="text-success me-2 mt-1 flex-shrink-0" /> {feature}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : null}
                                            {quote.notes && <p className="small text-secondary mt-2 fst-italic">"{quote.notes}"</p>}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="text-start fw-bold text-secondary bg-light">Overall Rating</td>
                                    {quotes.map(quote => {
                                        const score = getVendorScore(quote.vendorId);
                                        return (
                                            <td key={quote.id} className={score === maxScore ? 'bg-warning bg-opacity-10' : ''}>
                                                <span className={`badge ${score === maxScore ? 'bg-warning text-dark' : 'bg-secondary'} fs-6 px-3 py-2 rounded-pill shadow-sm`}>
                                                    {score}% Match
                                                </span>
                                                {score === maxScore && <div className="text-warning fw-bold mt-2 small"><FiAward /> Best Overall</div>}
                                            </td>
                                        );
                                    })}
                                </tr>
                                <tr>
                                    <td className="text-start fw-bold text-secondary bg-light border-bottom-0">Decision</td>
                                    {quotes.map(quote => (
                                        <td key={quote.id} className="p-3 border-bottom-0">
                                            <button
                                                className="btn btn-primary w-100 rounded-pill shadow-sm hover-lift fw-bold"
                                                onClick={() => handleSelectVendor(quote)}
                                            >
                                                Select Vendor
                                            </button>
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Email Modal Selection Simulation */}
            {showEmailModal && selectedQuote && (
                <>
                    <div className="modal-backdrop show" style={{ backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1050 }} />
                    <div className="modal d-block" tabIndex={-1} style={{ zIndex: 1060 }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content shadow-lg border-0 rounded-4">
                                {sending ? (
                                    <div className="modal-body text-center py-5">
                                        <div className="mb-3 text-success" style={{ fontSize: '4rem' }}><FiCheck /></div>
                                        <h4 className="fw-bold text-dark">Vendor Selected & Email Sent!</h4>
                                        <p className="text-secondary">Redirecting to RFQ management...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="modal-header bg-light border-bottom">
                                            <h5 className="modal-title fw-bold">Confirm Vendor Selection</h5>
                                            <button type="button" className="btn-close" onClick={() => setShowEmailModal(false)} />
                                        </div>
                                        <div className="modal-body">
                                            <p>You are about to select <strong>{getVendorName(selectedQuote.vendorId)}</strong> for this RFQ.</p>
                                            <p className="fw-bold mt-3 mb-1">Simulated Email to Vendor:</p>
                                            <div className="p-3 bg-light border rounded position-relative">
                                                <p className="mb-1"><strong>Subject:</strong> Vendor Selection Confirmation</p>
                                                <hr className="my-2" />
                                                <p className="mb-2">Dear {getVendorName(selectedQuote.vendorId)},</p>
                                                <p className="mb-2">Congratulations! Your quotation for has been selected by our team.</p>
                                                <p className="mb-2">We appreciate your prompt response and competitive offer. Our procurement team will contact you shortly with the next steps regarding the purchase order and delivery schedule.</p>
                                                <p className="mb-0 text-secondary mt-3">Best regards,<br />Vendorverse Procurement Team</p>
                                            </div>
                                        </div>
                                        <div className="modal-footer border-top bg-light">
                                            <button className="btn btn-outline-secondary" onClick={() => setShowEmailModal(false)}>Cancel</button>
                                            <button className="btn btn-primary px-4" onClick={confirmSelection}>
                                                Confirm & Send Email
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default VendorComparison;
