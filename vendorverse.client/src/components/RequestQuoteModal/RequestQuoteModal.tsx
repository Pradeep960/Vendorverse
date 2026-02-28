import React, { useState } from 'react';
import {
    FiSend, FiMapPin, FiBox, FiHash,
    FiDollarSign, FiShield, FiAlertCircle, FiAward
} from 'react-icons/fi';
import type { Vendor } from '../../models/Vendor';
import type { RFQ } from '../../models/RFQ';
import { saveRFQ } from '../../services/apiService';
import EmailModal from '../EmailModal/EmailModal';
import styles from './RequestQuoteModal.module.scss';

interface RequestQuoteModalProps {
    show: boolean;
    onClose: () => void;
    selectedVendors: Vendor[];
}

// Using the same form structure as VendorSearch.tsx
interface SearchForm {
    part: string;
    certifications: string[];
    location: string;
    budget: number;
    quantity: number;
}

const CERTIFICATION_OPTIONS = [
    'ISO 9001',
    'ISO 14001',
    'ISO 27001',
    'AS9100',
    'IATF 16949',
    'SOC 2 Type II',
    'FSC Certified',
    'Other',
];

const initialForm: SearchForm = {
    part: '',
    certifications: [],
    location: '',
    budget: 0,
    quantity: 0,
};

interface FormErrors {
    part?: string;
    quantity?: string;
    location?: string;
    pricingRange?: string;
    certifications?: string;
    otherCertText?: string;
}

const RequestQuoteModal: React.FC<RequestQuoteModalProps> = ({ show, onClose, selectedVendors }) => {
    const [form, setForm] = useState<SearchForm>(initialForm);
    const [errors, setErrors] = useState<FormErrors>({});
    const [sent, setSent] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [createdRFQ, setCreatedRFQ] = useState<RFQ | null>(null);
    const [showOtherInput, setShowOtherInput] = useState(false);
    const [otherCertInput, setOtherCertInput] = useState('');

    // This remains early return so we don't render anything if neither modal is shown
    if (!show && !showEmailModal) return null;

    // --- Validation (same as VendorSearch.tsx) ---
    const validateForm = (): FormErrors => {
        const newErrors: FormErrors = {};
        if (!form.part.trim()) newErrors.part = 'Part is required';
        if (!form.quantity) newErrors.quantity = 'Quantity is required';
        else if (Number(form.quantity) <= 0) newErrors.quantity = 'Must be greater than 0';
        if (!form.location.trim()) newErrors.location = 'Location is required';
        if (form.budget && Number(form.budget) < 0) newErrors.pricingRange = 'Budget cannot be negative';
        return newErrors;
    };

    // --- Form field change (same as VendorSearch.tsx) ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const parsedValue = (name === 'budget' || name === 'quantity') ? Number(value) : value;
        setForm(prev => ({ ...prev, [name]: parsedValue }));
        setErrors(prev => {
            const updated = { ...prev };
            delete updated[name as keyof FormErrors];
            if (name === 'budget') delete updated.pricingRange;
            return updated;
        });
    };

    // --- Certification change (same as VendorSearch.tsx) ---
    const handleCertificationChange = (cert: string) => {
        if (cert === 'Other') {
            if (showOtherInput) {
                const customVal = otherCertInput.trim();
                if (customVal) {
                    setForm(prev => ({
                        ...prev,
                        certifications: prev.certifications.filter(c => c !== customVal),
                    }));
                }
                setOtherCertInput('');
                setShowOtherInput(false);
            } else {
                setShowOtherInput(true);
            }
        } else {
            setForm(prev => {
                const certs = prev.certifications.includes(cert)
                    ? prev.certifications.filter(c => c !== cert)
                    : [...prev.certifications, cert];
                return { ...prev, certifications: certs };
            });
        }
    };

    // --- Other certification text input (same as VendorSearch.tsx) ---
    const handleOtherCertInputChange = (value: string) => {
        const prevVal = otherCertInput.trim();
        const newVal = value.trim();
        setOtherCertInput(value);

        setForm(prev => {
            let certs = prevVal
                ? prev.certifications.filter(c => c !== prevVal)
                : [...prev.certifications];
            if (newVal && !certs.includes(newVal)) {
                certs = [...certs, newVal];
            }
            return { ...prev, certifications: certs };
        });
    };

    // --- Helper: is a cert checkbox checked? ---
    const isCertChecked = (cert: string) =>
        cert === 'Other' ? showOtherInput : form.certifications.includes(cert);

    const itemsValid = form.part.trim() !== '' && form.quantity > 0;
    const isFormValid = itemsValid && form.location.trim() !== '';

    // Helper to get vendor name safely
    const getVendorName = (v: Vendor) => (v as any).name || (v as any).vendor_name || '';
    const getVendorId = (v: Vendor) => (v as any).id || '';

    const handleSend = async () => {
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        
        const title = `RFQ for ${form.part}`;
        const description = `Location: ${form.location}\nMin Reqs: ${form.certifications.join(', ')}\nISO: ${form.certifications.some(c => c.toLowerCase().includes('iso')) ? 'Yes' : 'No'}`;
        const quantity = form.quantity;
        const budget = form.budget || 0;

        const newRFQ: RFQ = {
            id: `rfq-${Date.now()}`,
            title,
            description,
            quantity,
            budget,
            status: 'Pending',
            createdAt: new Date().toISOString(),
            vendorsTargeted: selectedVendors.map(v => getVendorId(v)),
        };

        await saveRFQ(newRFQ);
        setCreatedRFQ(newRFQ);
        setShowEmailModal(true);
    };

    const handleEmailSent = () => {
        setShowEmailModal(false);
        setForm({ ...initialForm });
        onClose();
    };

    const handleClose = () => {
        setForm({ ...initialForm });
        setErrors({});
        setSent(false);
        setOtherCertInput('');
        setShowOtherInput(false);
        onClose();
    };

    if (showEmailModal && createdRFQ) {
        return (
            <EmailModal
                rfq={createdRFQ}
                vendors={selectedVendors}
                onClose={handleEmailSent}
            />
        );
    }

    // Needed right before return so the actual form hides if the parent 'show' is false but we were still capturing it (shouldn't happen with the logic above)
    if (!show) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`modal-backdrop show ${styles.modalOverlay}`}
                onClick={handleClose}
            />

            {/* Modal */}
            <div
                className="modal d-block"
                tabIndex={-1}
                role="dialog"
                onClick={handleClose}
            >
                <div
                    className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
                    onClick={e => e.stopPropagation()}
                >
                    <div className={`modal-content border-0 shadow-lg`} style={{ position: 'relative' }}>
                        {/* Close button */}
                        <button
                            type="button"
                            className="btn p-0 d-flex align-items-center justify-content-center"
                            style={{
                                position: 'absolute', top: '14px', right: '16px', zIndex: 10,
                                background: 'none', border: 'none',
                            }}
                            onClick={handleClose}
                            aria-label="Close"
                        >
                            <FiAward size={20} className="text-muted" />
                        </button>

                        {/* Header - Matching VendorSearch style */}
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title fw-bold text-dark">Request for Quote</h5>
                        </div>

                        {/* Body */}
                        <div className="modal-body px-4 pt-3 pb-2">
                            {sent ? (
                                <div className="text-center py-5">
                                    <div className="mb-3" style={{ fontSize: '3rem' }}>✅</div>
                                    <h5 className="fw-bold text-dark">Quote Request Sent!</h5>
                                    <p className="text-secondary">
                                        Sent to {selectedVendors.length} vendor{selectedVendors.length !== 1 ? 's' : ''} successfully.
                                    </p>
                                </div>
                            ) : (
                                <div className="container-fluid p-0">
                                    {/* Part & Quantity - Same as VendorSearch.tsx */}
                                    <div className="row g-3 mb-3">
                                        <div className="col-md-6">
                                            <label htmlFor="part" className="form-label text-secondary small fw-bold mb-1">
                                                Part <span className="text-danger">*</span>
                                            </label>
                                            <div className={`input-group ${errors.part ? 'has-validation' : ''}`}>
                                                <span className={`input-group-text bg-light border-end-0 ${errors.part ? 'border-danger' : ''}`}><FiBox className="text-muted" /></span>
                                                <input
                                                    type="text" id="part" name="part"
                                                    className={`form-control bg-light border-start-0 ps-0 ${errors.part ? 'is-invalid' : ''}`}
                                                    placeholder="e.g. Bearings, PCB..."
                                                    value={form.part} onChange={handleChange}
                                                />
                                            </div>
                                            {errors.part && <div className="text-danger small mt-1 d-flex align-items-center"><FiAlertCircle className="me-1" size={12} />{errors.part}</div>}
                                        </div>
                                        <div className="col-md-6">
                                            <label htmlFor="quantity" className="form-label text-secondary small fw-bold mb-1">
                                                Quantity <span className="text-danger">*</span>
                                            </label>
                                            <div className={`input-group ${errors.quantity ? 'has-validation' : ''}`}>
                                                <span className={`input-group-text bg-light border-end-0 ${errors.quantity ? 'border-danger' : ''}`}><FiHash className="text-muted" /></span>
                                                <input
                                                    type="number" id="quantity" name="quantity"
                                                    className={`form-control bg-light border-start-0 ps-0 ${errors.quantity ? 'is-invalid' : ''}`}
                                                    placeholder="e.g. 500" min="1"
                                                    value={form.quantity} onChange={handleChange}
                                                />
                                            </div>
                                            {errors.quantity && <div className="text-danger small mt-1 d-flex align-items-center"><FiAlertCircle className="me-1" size={12} />{errors.quantity}</div>}
                                        </div>
                                    </div>

                                    {/* Location & Budget - Same as VendorSearch.tsx */}
                                    <div className="row g-3 mb-3">
                                        <div className="col-md-6">
                                            <label htmlFor="location" className="form-label text-secondary small fw-bold mb-1">
                                                Location <span className="text-danger">*</span>
                                            </label>
                                            <div className={`input-group ${errors.location ? 'has-validation' : ''}`}>
                                                <span className={`input-group-text bg-light border-end-0 ${errors.location ? 'border-danger' : ''}`}><FiMapPin className="text-muted" /></span>
                                                <input
                                                    type="text" id="location" name="location"
                                                    className={`form-control bg-light border-start-0 ps-0 ${errors.location ? 'is-invalid' : ''}`}
                                                    placeholder="e.g. New York, London..."
                                                    value={form.location} onChange={handleChange}
                                                />
                                            </div>
                                            {errors.location && <div className="text-danger small mt-1 d-flex align-items-center"><FiAlertCircle className="me-1" size={12} />{errors.location}</div>}
                                        </div>

                                        <div className="col-md-6">
                                            <label htmlFor="budget" className="form-label text-secondary small fw-bold mb-1">Budget</label>
                                            <div className={`input-group ${errors.pricingRange ? 'has-validation' : ''}`}>
                                                <span className={`input-group-text bg-light border-end-0 ${errors.pricingRange ? 'border-danger' : ''}`}><FiDollarSign className="text-muted" /></span>
                                                <input
                                                    type="number" id="budget" name="budget"
                                                    className={`form-control bg-light border-start-0 ps-0 ${errors.pricingRange ? 'is-invalid' : ''}`}
                                                    placeholder="e.g. 100" min="0"
                                                    value={form.budget} onChange={handleChange}
                                                />
                                            </div>
                                            {errors.pricingRange && <div className="text-danger small mt-1 d-flex align-items-center"><FiAlertCircle className="me-1" size={12} />{errors.pricingRange}</div>}
                                        </div>
                                    </div>

                                    {/* Certifications - Same as VendorSearch.tsx */}
                                    <hr className="my-3" />
                                    <h6 className="fw-bold text-dark mb-3">
                                        <FiShield className="me-2 text-primary" />Certified By
                                    </h6>

                                    <div className="row g-2">
                                        {CERTIFICATION_OPTIONS.map(cert => (
                                            <div className="col-md-6" key={cert}>
                                                <label
                                                    className={`bg-light rounded-3 p-2 px-3 d-flex align-items-center ${
                                                        isCertChecked(cert) ? 'border border-primary' : 'border border-transparent'
                                                    }`}
                                                    style={{ cursor: 'pointer', transition: 'border-color 0.2s ease' }}
                                                >
                                                    <input
                                                        className="form-check-input me-2"
                                                        type="checkbox"
                                                        id={`cert-${cert.replace(/\s+/g, '-')}`}
                                                        checked={isCertChecked(cert)}
                                                        onChange={() => handleCertificationChange(cert)}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                    <span className="text-dark small">{cert}</span>
                                                </label>
                                            </div>
                                        ))}

                                        {/* Other certification text input */}
                                        {showOtherInput && (
                                            <div className="col-12 mt-2">
                                                <div className="input-group">
                                                    <span className="input-group-text bg-light border-end-0">
                                                        <FiAward className="text-muted" />
                                                    </span>
                                                    <input
                                                        type="text"
                                                        id="otherCertInput"
                                                        className="form-control bg-light border-start-0 ps-0"
                                                        placeholder="Enter certification name..."
                                                        value={otherCertInput}
                                                        onChange={(e) => handleOtherCertInputChange(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer - Matching VendorSearch style, only Send button */}
                        {!sent && (
                            <div className="modal-footer border-top px-4 py-3">
                                {selectedVendors.length > 0 && (
                                    <span className="text-secondary small me-auto">
                                        <strong>{selectedVendors.length}</strong> vendor{selectedVendors.length !== 1 ? 's' : ''} selected
                                    </span>
                                )}

                                <button
                                    type="button"
                                    className="btn btn-primary d-flex align-items-center shadow-sm"
                                    onClick={handleSend}
                                    disabled={!isFormValid || selectedVendors.length === 0}
                                    title={selectedVendors.length === 0 ? 'Select vendors first' : 'Send to selected vendors'}
                                >
                                    <FiSend className="me-2" /> Send to Selected Vendors
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default RequestQuoteModal;
