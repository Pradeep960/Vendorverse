import React, { useState } from 'react';
import { FiPaperclip } from 'react-icons/fi';
import type { RFQ } from '../../models/RFQ';
import type { Vendor } from '../../models/Vendor';
import { sendRFQEmail } from '../../services/emailService';

interface EmailModalProps {
    rfq: RFQ;
    vendors: Vendor[];
    onClose: () => void;
}

const EmailModal: React.FC<EmailModalProps> = ({ rfq, vendors, onClose }) => {
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSend = async () => {
        setSending(true);
        setErrorMsg('');

        // Loop and send to each vendor individually using EmailJS
        let successCount = 0;
        for (const vendor of vendors) {
            const success = await sendRFQEmail(rfq, vendor);
            if (success) successCount++;
        }

        setSending(false);

        if (successCount === vendors.length) {
            setSent(true);
            setTimeout(() => onClose(), 2000);
        } else if (successCount > 0) {
            setErrorMsg(`Sent successfully to ${successCount} out of ${vendors.length} vendors. Some failed due to missing/invalid configuration.`);
            setSent(true);
            setTimeout(() => onClose(), 4000);
        } else {
            setErrorMsg('Failed to send emails. Did you set up the EmailJS keys in emailService.ts?');
        }
    };

    return (
        <>
            <div className="modal-backdrop show" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1050 }} />
            <div className="modal d-block" tabIndex={-1} style={{ zIndex: 1060 }}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content" style={{ borderRadius: '16px', overflow: 'hidden', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                        {sent ? (
                            <div className="modal-body text-center py-5">
                                <div className="mb-3 text-success" style={{ fontSize: '4rem' }}>✓</div>
                                <h4 className="fw-bold text-dark mb-2">RFQ Emails Sent</h4>
                                <p className="text-secondary">{errorMsg ? errorMsg : `Successfully sent to ${vendors.length} vendors.`}</p>
                            </div>
                        ) : errorMsg && !sent ? (
                            <div className="modal-body text-center py-5">
                                <div className="mb-3 text-danger" style={{ fontSize: '4rem' }}>⚠</div>
                                <h4 className="fw-bold text-dark mb-2">Email Configuration Error</h4>
                                <p className="text-secondary mb-4">{errorMsg}</p>
                                <button type="button" className="btn btn-primary" onClick={onClose}>Close</button>
                            </div>
                        ) : (
                            <>
                                <div className="modal-header bg-light border-bottom">
                                    <h5 className="modal-title fw-bold text-dark">Send RFQ to selected vendors</h5>
                                    <button type="button" className="btn-close" onClick={onClose} disabled={sending} />
                                </div>
                                <div className="modal-body p-4">
                                    <div className="mb-4">
                                        <p className="fw-bold mb-1">Subject:</p>
                                        <div className="p-2 border rounded bg-light">Request for Quotation (RFQ) - {rfq.title}</div>
                                    </div>
                                    <div className="mb-0">
                                        <p className="fw-bold mb-1">Email Body:</p>
                                        <div className="p-3 border rounded bg-light position-relative" style={{ whiteSpace: 'pre-line', maxHeight: '300px', overflowY: 'auto' }}>
                                            <p>Dear Vendor,</p>
                                            <p>Please find attached RFQ document for <strong>{rfq.title}</strong>.</p>
                                            <p>Submit your quotation using the tailored link below:</p>

                                            <div className="mt-3">
                                                {vendors.map(v => (
                                                    <div key={v.id} className="mb-3 p-2 bg-white border rounded">
                                                        <span className="badge bg-secondary mb-1">For {v.name}</span>
                                                        <br />
                                                        <a href={`/vendor-submit/${rfq.id}/${v.id}`} className="text-primary fw-medium" target="_blank" rel="noreferrer">
                                                            [Simulation Link] /vendor-submit/{rfq.id}/{v.id}
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>

                                            {rfq.attachedFile && (
                                                <div className="mt-4 p-2 bg-white border border-dashed rounded d-flex align-items-center gap-2">
                                                    <FiPaperclip className="text-primary" />
                                                    <span className="small text-secondary">Attachment: <strong>{rfq.attachedFile.name}</strong></span>
                                                    <span className="badge bg-light text-primary border ms-auto">PDF</span>
                                                </div>
                                            )}

                                            <p className="mt-3 mb-0">Best Regards,<br />Vendorverse Procurement Team</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer bg-light border-top">
                                    <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={sending}>Cancel</button>
                                    <button type="button" className="btn btn-primary d-flex align-items-center" onClick={handleSend} disabled={sending}>
                                        {sending ? (
                                            <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Sending...</>
                                        ) : (
                                            'Send Emails'
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
