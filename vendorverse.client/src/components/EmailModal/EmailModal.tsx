import React, { useState } from 'react';
import { FiPaperclip, FiXCircle } from 'react-icons/fi';
import type { RFQ } from '../../models/RFQ';
import type { Vendor } from '../../models/Vendor';
import { sendRFQEmail } from '../../services/emailService';

interface EmailModalProps {
    rfq: RFQ;
    vendors: Vendor[];
    onClose: () => void;
}

const EmailModal: React.FC<EmailModalProps> = ({ rfq, vendors: initialVendors, onClose }) => {
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [subject, setSubject] = useState(rfq.title);
    const [body, setBody] = useState(`Dear Vendor,

Please find attached RFQ document for ${rfq.title}.

Submit your quotation using the tailored link below:`);

    const [selectedVendors, setSelectedVendors] = useState<Vendor[]>(initialVendors);
    const [previewMode, setPreviewMode] = useState(false);

    const handleRemoveVendor = (vendorId: string) => {
        setSelectedVendors(prev => prev.filter(v => v.id !== vendorId));
    };

    const handleSend = async () => {
        if (selectedVendors.length === 0) {
            setErrorMsg('Please select at least one vendor.');
            return;
        }

        setSending(true);
        setErrorMsg('');

        // Prepare the updated RFQ with the new subject/body if needed
        const updatedRFQ = {
            ...rfq,
            title: subject,
            // In a real system, we'd pass the custom body too
        };

        let successCount = 0;
        for (const vendor of selectedVendors) {
            // We pass the custom body here if the service supports it
            // For now, we simulate sending
            const success = await sendRFQEmail(updatedRFQ, vendor);
            if (success) successCount++;
        }

        setSending(false);

        if (successCount === selectedVendors.length) {
            setSent(true);
            setTimeout(() => onClose(), 2000);
        } else if (successCount > 0) {
            setErrorMsg(`Sent successfully to ${successCount} out of ${selectedVendors.length} vendors.`);
            setSent(true);
            setTimeout(() => onClose(), 4000);
        } else {
            setErrorMsg('Failed to send emails. Please check your configuration.');
        }
    };

    return (
        <>
            <div className="modal-backdrop show" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1050 }} />
            <div className="modal d-block" tabIndex={-1} style={{ zIndex: 1060 }}>
                <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content" style={{ borderRadius: '16px', overflow: 'hidden', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                        {sent ? (
                            <div className="modal-body text-center py-5">
                                <div className="mb-3 text-success" style={{ fontSize: '4rem' }}>✓</div>
                                <h4 className="fw-bold text-dark mb-2">RFQ Emails Sent</h4>
                                <p className="text-secondary">{errorMsg ? errorMsg : `Successfully sent to ${selectedVendors.length} vendors.`}</p>
                            </div>
                        ) : errorMsg && !selectedVendors.length ? (
                            <div className="modal-body text-center py-5">
                                <div className="mb-3 text-danger" style={{ fontSize: '4rem' }}>⚠</div>
                                <h4 className="fw-bold text-dark mb-2">Error</h4>
                                <p className="text-secondary mb-4">{errorMsg}</p>
                                <button type="button" className="btn btn-primary" onClick={() => setErrorMsg('')}>Go Back</button>
                            </div>
                        ) : (
                            <>
                                <div className="modal-header bg-light border-bottom px-4">
                                    <h5 className="modal-title fw-bold text-dark">Send RFQ to selected vendors</h5>
                                    <button type="button" className="btn-close" onClick={onClose} disabled={sending} />
                                </div>
                                <div className="modal-body p-0">
                                    <div className="row g-0">
                                        {/* Left Side: Email Preview/Edit */}
                                        <div className="col-lg-7 border-end p-4">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h6 className="fw-bold text-uppercase small text-secondary mb-0">RFQ Email Content</h6>
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        className={`btn btn-sm ${!previewMode ? 'btn-primary' : 'btn-outline-primary'}`}
                                                        onClick={() => setPreviewMode(false)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className={`btn btn-sm ${previewMode ? 'btn-primary' : 'btn-outline-primary'}`}
                                                        onClick={() => setPreviewMode(true)}
                                                    >
                                                        Preview
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label fw-bold small text-dark mb-1">Subject:</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm bg-light fw-medium"
                                                    value={subject}
                                                    onChange={(e) => setSubject(e.target.value)}
                                                    placeholder="Enter subject..."
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label fw-bold small text-dark mb-1">Email Body:</label>
                                                {previewMode ? (
                                                    <div
                                                        className="form-control form-control-sm bg-light overflow-auto"
                                                        style={{ height: '240px', whiteSpace: 'pre-line' }}
                                                        dangerouslySetInnerHTML={{ __html: body.replace(/\n/g, '<br/>') }}
                                                    />
                                                ) : (
                                                    <textarea
                                                        className="form-control form-control-sm bg-light"
                                                        style={{ height: '240px', whiteSpace: 'pre-line' }}
                                                        value={body}
                                                        onChange={(e) => setBody(e.target.value)}
                                                    />
                                                )}
                                            </div>

                                            {rfq.attachedFile && (
                                                <div className="mt-4">
                                                    <label className="form-label fw-bold small text-dark mb-1">Attachments:</label>
                                                    <div className="p-2 border rounded bg-light d-flex align-items-center justify-content-between">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <FiPaperclip className="text-primary" />
                                                            <span className="small text-dark fw-medium">{rfq.attachedFile.name}</span>
                                                            <span className="badge bg-white text-muted border small">PDF</span>
                                                        </div>
                                                        <a
                                                            href={rfq.attachedFile.data}
                                                            download={rfq.attachedFile.name}
                                                            className="btn btn-sm btn-link text-primary text-decoration-none p-0"
                                                        >
                                                            Download
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Side: Selected Vendors */}
                                        <div className="col-lg-5 p-4 bg-light">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h6 className="fw-bold text-uppercase small text-secondary mb-0">Selected Vendors</h6>
                                                <span className="badge bg-primary rounded-pill">{selectedVendors.length}</span>
                                            </div>
                                            <div style={{ maxHeight: '420px', overflowY: 'auto' }} className="pe-2">
                                                {selectedVendors.length === 0 ? (
                                                    <p className="text-center text-muted py-5 small">No vendors selected.</p>
                                                ) : (
                                                    selectedVendors.map(vendor => (
                                                        <div key={vendor.id} className="card border-0 shadow-sm mb-2">
                                                            <div className="card-body p-3">
                                                                <div className="d-flex justify-content-between align-items-start">
                                                                    <div>
                                                                        <div className="fw-bold text-dark small">{vendor.name}</div>
                                                                        <div className="text-muted" style={{ fontSize: '11px' }}>{vendor.category} | {vendor.location}</div>
                                                                        <div className="text-primary mt-1" style={{ fontSize: '11px' }}>{vendor.email}</div>
                                                                    </div>
                                                                    <button
                                                                        className="btn btn-sm text-danger p-0"
                                                                        onClick={() => handleRemoveVendor(vendor.id)}
                                                                        title="Remove Vendor"
                                                                    >
                                                                        <FiXCircle size={14} />
                                                                    </button>
                                                                </div>
                                                                <div className="mt-2 text-primary" style={{ fontSize: '10px' }}>
                                                                    [Simulated Link Ready]
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer bg-light border-top px-4">
                                    <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={onClose} disabled={sending}>Cancel</button>
                                    <button type="button" className="btn btn-primary rounded-pill px-4 d-flex align-items-center" onClick={handleSend} disabled={sending || selectedVendors.length === 0}>
                                        {sending ? (
                                            <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Sending...</>
                                        ) : (
                                            'Send RFQ Email'
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default EmailModal;
