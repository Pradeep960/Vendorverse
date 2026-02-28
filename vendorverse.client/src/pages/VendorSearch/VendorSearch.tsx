import React, { useState, useRef } from 'react';
import {
    FiSearch, FiMapPin, FiBox, FiHash, 
    FiShield, FiDollarSign, FiRotateCcw, FiCheckCircle,
    FiXCircle, FiEye, FiAward, FiX, FiAlertCircle
} from 'react-icons/fi';
import Loader from '../../components/Loader/Loader';
import type { Vendor } from '../../models/Vendor';
import { sendVendors } from '../../services/apiService';
import { mockVendors } from '../../mock/vendors';

interface SearchForm {
    part: string;
    certifications: string[];
    location: string;
    budget: number;
    quantity: number ;
    // year: number;
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
    // year: 0
};

interface FormErrors {
    part?: string;
    quantity?: string;
    location?: string;
    pricingRange?: string;
    certifications?: string;
    otherCertText?: string;
}

const VendorSearch: React.FC = () => {
    const [form, setForm] = useState<SearchForm>(initialForm);
    const [errors, setErrors] = useState<FormErrors>({});
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showOtherInput, setShowOtherInput] = useState(false);
    const [otherCertInput, setOtherCertInput] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);

    // --- Validation ---
    const validateForm = (): FormErrors => {
        const newErrors: FormErrors = {};
        if (!form.part.trim()) newErrors.part = 'Part is required';
        if (!form.quantity) newErrors.quantity = 'Quantity is required';
        else if (Number(form.quantity) <= 0) newErrors.quantity = 'Must be greater than 0';
        if (!form.location.trim()) newErrors.location = 'Location is required';
        if (form.budget && Number(form.budget) < 0) newErrors.pricingRange = 'Budget cannot be negative';
        return newErrors;
    };

    // --- Form field change ---
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

    // --- Other certification text input (syncs typed value into certifications) ---
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

    // --- Search ---
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setErrors({});
        setShowModal(false);
        setLoading(true);
        setSearched(false);
        try {
            const result = await searchVendorsApi(form);
            let filtered = [...result];
            setVendors(filtered);
            setSearched(true);
            handleReset();
        } catch (error) {
            setSearched(true);
        } finally {
            setLoading(false);
        }
    };

    // --- Reset ---
    const handleReset = () => {
        setForm({ ...initialForm });
        setErrors({});
        setOtherCertInput('');
        setShowOtherInput(false);
    };

    // --- Backdrop click to close modal ---
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            setShowModal(false);
        }
    };

    // --- Helper: is a cert checkbox checked? ---
    const isCertChecked = (cert: string) =>
        cert === 'Other' ? showOtherInput : form.certifications.includes(cert);

    // --- Open vendor website in new tab ---
    const handleViewDetails = (vendor: Vendor) => {
        const url = (vendor as any).url || (vendor as any).website || (vendor as any).vendor_url || '';
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    // --- Helpers to read certifications from different mock shapes ---
    const getVendorCerts = (v: Vendor) => ((v as any).certifications ?? (v as any).certifications_found ?? []) as string[];
    const vendorHasIso = (v: Vendor) => getVendorCerts(v).some(c => c.toLowerCase().includes('iso'));
    const searchVendorsApi = (formdata: SearchForm) => {
        return sendVendors(formdata);
    };
    
    return (
        <div>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold text-dark mb-1">Discover Vendors</h3>
                    <p className="text-secondary mb-0">Search and find the best vendors for your needs.</p>
                </div>
                <button
                    className="btn btn-primary d-flex align-items-center shadow-sm"
                    onClick={() => setShowModal(true)}
                >
                    <FiSearch className="me-2" /> Search Vendors
                </button>
            </div>

            {/* Modal */}
            {showModal && (
                <div
                    className="modal d-block"
                    tabIndex={-1}
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={handleBackdropClick}
                >
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" ref={modalRef}>
                        <div className="modal-content border-0 shadow-lg" style={{ position: 'relative' }}>
                            {/* Close button */}
                            <button
                                type="button"
                                className="btn p-0 d-flex align-items-center justify-content-center"
                                style={{
                                    position: 'absolute', top: '14px', right: '16px', zIndex: 10,
                                    background: 'none', border: 'none',
                                }}
                                onClick={() => setShowModal(false)}
                                aria-label="Close"
                            >
                                <FiX size={20} />
                            </button>

                            {/* Modal Header */}
                            <div className="modal-header border-0 pb-0 pe-5">
                                <h5 className="modal-title fw-bold text-dark">Vendor Search</h5>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSearch}>
                                <div className="modal-body px-4 pt-3 pb-2">
                                    <div className="container-fluid p-0">
                                        {/* Part & Quantity */}
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

                                        {/* Location & Budget */}
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

                                        {/* Certifications */}
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
                                </div>

                                {/* Modal Footer */}
                                <div className="modal-footer border-top px-4 py-3">
                                    <button type="button" className="btn btn-outline-secondary d-flex align-items-center" onClick={handleReset}>
                                        <FiRotateCcw className="me-2" /> Reset
                                    </button>
                                    <button type="submit" className="btn btn-primary d-flex align-items-center shadow-sm">
                                        <FiSearch className="me-2" /> Search
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading */}
            {loading && <Loader />}

            {/* Results */}
            {searched && !loading && (
                <div>
                    <div className="row g-4">
                        {vendors.map(vendor => (
                            <div className="col-12 col-md-6 col-lg-4" key={vendor.rank}>
                                <div
                                    className="card border-0 h-100"
                                    style={{
                                        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                        cursor: 'pointer',
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                                        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.14)';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                                        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
                                    }}
                                >
                                    <div className="card-body p-4">
                                        {/* Vendor Name & ISO Badge */}
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <h5 className="fw-bold text-dark mb-0">{(vendor as any).name || (vendor as any).vendor_name}</h5>
                                            {vendorHasIso(vendor) ? (
                                                <span className="badge bg-success bg-opacity-10 text-success d-flex align-items-center gap-1 px-2 py-1">
                                                    <FiCheckCircle size={12} /> ISO Certified
                                                </span>
                                            ) : (
                                                <span className="badge bg-secondary bg-opacity-10 text-secondary d-flex align-items-center gap-1 px-2 py-1">
                                                    <FiXCircle size={12} /> Not Certified
                                                </span>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="d-flex flex-column gap-2 small text-secondary mb-3">
                                            <div className="d-flex align-items-center">
                                                <FiMapPin className="me-2 text-primary" style={{ flexShrink: 0 }} />
                                                <span>{vendor.location_exact}</span>
                                            </div>
                                            {/* <div className="d-flex align-items-center">
                                                <FiDollarSign className="me-2 text-primary" style={{ flexShrink: 0 }} />
                                                <span>${(vendor. ?? 0).toLocaleString()} – ${(vendor.pricingMax ?? 0).toLocaleString()}</span>
                                            </div> */}
                                            {/* <div className="d-flex align-items-center">
                                                <FiPackage className="me-2 text-primary" style={{ flexShrink: 0 }} />
                                                <span>Qty Available: {(vendor.availableQuantity ?? 0).toLocaleString()}</span>
                                            </div> */}
                                            {/* <div className="d-flex align-items-center">
                                                <FiCalendar className="me-2 text-primary" style={{ flexShrink: 0 }} />
                                                <span>Est. {vendor.yearEstablished}</span>
                                            </div> */}
                                            <div className="d-flex align-items-center">
                                                <FiAward className="me-2 text-primary" style={{ flexShrink: 0 }} />
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                    {getVendorCerts(vendor).length > 0 ? (
                                                        getVendorCerts(vendor).map((c, i) => (
                                                            <span key={i} className="badge bg-light text-dark border">{c}</span>
                                                        ))
                                                    ) : (
                                                        <span className="text-secondary">No certifications listed</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="card-footer bg-transparent border-top p-3 d-flex justify-content-end">
                                        <button
                                            className="btn btn-outline-primary btn-sm d-flex align-items-center rounded-pill px-3"
                                            onClick={() => handleViewDetails(vendor)}
                                            aria-label={`View details for ${vendor.name || vendor.vendor_name || 'vendor'}`}
                                        >
                                            <FiEye className="me-1" /> View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {vendors.length === 0 && (
                            <div className="col-12 text-center py-5 text-secondary">
                                No vendors matching your criteria were found.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Initial State */}
            {!searched && !loading && (
                <div className="text-center py-5">
                    <FiSearch size={48} className="text-muted mb-3" />
                    <p className="text-secondary">Click <strong>"Search Vendors"</strong> to find vendors matching your requirements.</p>
                </div>
            )}
        </div>
    );
};

export default VendorSearch;