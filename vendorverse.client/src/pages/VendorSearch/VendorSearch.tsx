import React, { useState, useRef } from 'react';
import {
    FiSearch, FiMapPin, FiPackage, FiShield,
    FiExternalLink, FiMail, FiPhone,
    FiAlertCircle, FiAward, FiTrendingUp, FiDollarSign,
    FiRefreshCw, FiSend, FiX, FiCheck, FiPlus
} from 'react-icons/fi';
import Loader from '../../components/Loader/Loader';
import RequestQuoteModal from '../../components/RequestQuoteModal/RequestQuoteModal';
import { searchVendorsPost } from '../../services/vendorService';
import type { VendorSearchResult, VendorSearchItem } from '../../models/VendorSearchResult';

interface SearchForm {
    part: string;
    quantity: string;
    location: string;
    budget: string;
    isoCertified: boolean;
}

const initialForm: SearchForm = {
    part: '',
    quantity: '',
    location: '',
    budget: '',
    isoCertified: false,
};

const VendorSearch: React.FC = () => {
    const [form, setForm] = useState<SearchForm>(initialForm);
    const [searchResult, setSearchResult] = useState<VendorSearchResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<VendorSearchItem | null>(null);
    const [selectedVendors, setSelectedVendors] = useState<VendorSearchItem[]>([]);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    
    const modalRef = useRef<HTMLDivElement>(null);

    const validateForm = (): Record<string, string> => {
        const errors: Record<string, string> = {};
        if (!form.part.trim()) errors.part = 'Part is required';
        if (!form.quantity.trim()) errors.quantity = 'Quantity is required';
        else if (Number(form.quantity) <= 0) errors.quantity = 'Must be greater than 0';
        if (!form.location.trim()) errors.location = 'Location is required';
        return errors;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            console.log('Validation errors:', errors);
            return;
        }

        setLoading(true);
        setSearched(false);
        setSearchResult(null);
        setSelectedVendors([]);
        
        try {
            const result = await searchVendorsPost({
                part: form.part,
                certifications: form.isoCertified ? ['ISO 9001'] : [],
                location: form.location,
                budget: Number(form.budget) || 0,
                quantity: Number(form.quantity) || 0
            });
            
            setSearchResult(result);
            setSearched(true);
            setShowModal(false);
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setForm({ ...initialForm });
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            setShowModal(false);
        }
    };

    const toggleVendorSelection = (vendor: VendorSearchItem) => {
        setSelectedVendors(prev => {
            const isSelected = prev.some(v => v.rank === vendor.rank);
            if (isSelected) {
                return prev.filter(v => v.rank !== vendor.rank);
            }
            return [...prev, vendor];
        });
    };

    const handleRequestQuote = () => {
        setShowQuoteModal(true);
    };

    const getScoreColor = (score: number): string => {
        if (score >= 90) return '#10b981';
        if (score >= 80) return '#3b82f6';
        if (score >= 70) return '#f59e0b';
        return '#ef4444';
    };

    const getScoreLabel = (score: number): string => {
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Very Good';
        if (score >= 70) return 'Good';
        return 'Fair';
    };

    const VendorDetailModal: React.FC<{ vendor: VendorSearchItem; onClose: () => void }> = ({ vendor, onClose }) => (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
            <div className="modal-dialog modal-lg modal-dialog-centered" onClick={e => e.stopPropagation()}>
                <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header border-0 pb-0">
                        <h5 className="modal-title fw-bold">{vendor.vendor_name}</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <div className="row g-4">
                            <div className="col-md-8">
                                <h6 className="fw-bold text-primary mb-3">Vendor Information</h6>
                                <p className="text-secondary">{vendor.description}</p>
                                
                                <div className="mb-3">
                                    <small className="text-muted fw-bold text-uppercase">Location</small>
                                    <div className="d-flex align-items-center mt-1">
                                        <FiMapPin className="me-2 text-primary" />
                                        {vendor.location_exact}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <small className="text-muted fw-bold text-uppercase">Website</small>
                                    <div className="d-flex align-items-center mt-1">
                                        <FiExternalLink className="me-2 text-primary" />
                                        <a href={vendor.url} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                                            {vendor.url}
                                        </a>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <small className="text-muted fw-bold text-uppercase">Certifications</small>
                                    <div className="d-flex flex-wrap gap-2 mt-1">
                                        {vendor.all_certifications.map((cert, i) => (
                                            <span key={i} className="badge bg-primary bg-opacity-10 text-primary">
                                                <FiAward className="me-1" />{cert}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="col-md-4">
                                <div className="bg-light rounded-3 p-3 mb-3">
                                    <h6 className="fw-bold mb-3">Scores</h6>
                                    <div className="mb-2">
                                        <div className="d-flex justify-content-between small">
                                            <span>Final Score</span>
                                            <span className="fw-bold" style={{ color: getScoreColor(vendor.final_score) }}>
                                                {vendor.final_score}
                                            </span>
                                        </div>
                                        <div className="progress" style={{ height: '6px' }}>
                                            <div className="progress-bar" style={{ width: `${vendor.final_score}%`, backgroundColor: getScoreColor(vendor.final_score) }}></div>
                                        </div>
                                    </div>
                                    <div className="mb-2">
                                        <div className="d-flex justify-content-between small">
                                            <span>Relevance</span>
                                            <span className="fw-bold">{vendor.relevance_score}</span>
                                        </div>
                                        <div className="progress" style={{ height: '6px' }}>
                                            <div className="progress-bar" style={{ width: `${vendor.relevance_score}%`, backgroundColor: '#3b82f6' }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="d-flex justify-content-between small">
                                            <span>Compliance</span>
                                            <span className="fw-bold">{vendor.compliance.compliance_score}</span>
                                        </div>
                                        <div className="progress" style={{ height: '6px' }}>
                                            <div className="progress-bar" style={{ width: `${vendor.compliance.compliance_score}%`, backgroundColor: '#10b981' }}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-light rounded-3 p-3">
                                    <h6 className="fw-bold mb-3">Contact</h6>
                                    <div className="d-flex align-items-center mb-2">
                                        <FiMail className="me-2 text-primary" size={14} />
                                        <small className="text-truncate">{vendor.contact_email}</small>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <FiPhone className="me-2 text-primary" size={14} />
                                        <small>{vendor.contact_phone}</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-outline-secondary" onClick={onClose}>Close</button>
                        <button className="btn btn-primary">
                            <FiMail className="me-2" /> Contact Vendor
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold text-dark mb-1">Discover Vendors</h3>
                    <p className="text-secondary mb-0">Search and find the best vendors for your needs.</p>
                </div>
                <div className="d-flex gap-2">
                    {selectedVendors.length > 0 && (
                        <button
                            className="btn btn-success d-flex align-items-center shadow-sm"
                            onClick={handleRequestQuote}
                        >
                            <FiSend className="me-2" /> Request Quote ({selectedVendors.length})
                        </button>
                    )}
                    <button
                        className="btn btn-primary d-flex align-items-center shadow-sm"
                        onClick={() => setShowModal(true)}
                    >
                        <FiSearch className="me-2" /> Search Vendors
                    </button>
                </div>
            </div>

            {/* Search Modal */}
            {showModal && (
                <div
                    className="modal d-block"
                    tabIndex={-1}
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={handleBackdropClick}
                >
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" ref={modalRef}>
                        <div className="modal-content border-0 shadow-lg" style={{ position: 'relative' }}>
                            <button
                                type="button"
                                className="btn p-0 d-flex align-items-center justify-content-center"
                                style={{
                                    position: 'absolute',
                                    top: '14px',
                                    right: '16px',
                                    zIndex: 10,
                                    background: 'none',
                                    border: 'none',
                                }}
                                onClick={() => setShowModal(false)}
                                aria-label="Close"
                            >
                                <FiX size={20} />
                            </button>

                            <div className="modal-header border-0 pb-0 pe-5">
                                <h5 className="modal-title fw-bold text-dark">Vendor Search</h5>
                            </div>

                            <form onSubmit={handleSearch}>
                                <div className="modal-body px-4 pt-3 pb-2">
                                    <div className="container-fluid p-0">
                                        <div className="row g-3 mb-3">
                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-bold mb-1">
                                                    Part <span className="text-danger">*</span>
                                                </label>
                                                <div className="input-group">
                                                    <span className="input-group-text bg-light border-end-0">
                                                        <FiPackage className="text-muted" />
                                                    </span>
                                                    <input
                                                        type="text"
                                                        id="part"
                                                        name="part"
                                                        className="form-control bg-light border-start-0 ps-0"
                                                        placeholder="e.g. laptop, bearings..."
                                                        value={form.part}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-bold mb-1">
                                                    Quantity <span className="text-danger">*</span>
                                                </label>
                                                <div className="input-group">
                                                    <span className="input-group-text bg-light border-end-0">
                                                        <FiPackage className="text-muted" />
                                                    </span>
                                                    <input
                                                        type="number"
                                                        id="quantity"
                                                        name="quantity"
                                                        className="form-control bg-light border-start-0 ps-0"
                                                        placeholder="e.g. 100"
                                                        min="1"
                                                        value={form.quantity}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row g-3 mb-3">
                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-bold mb-1">
                                                    Location <span className="text-danger">*</span>
                                                </label>
                                                <div className="input-group">
                                                    <span className="input-group-text bg-light border-end-0">
                                                        <FiMapPin className="text-muted" />
                                                    </span>
                                                    <input
                                                        type="text"
                                                        id="location"
                                                        name="location"
                                                        className="form-control bg-light border-start-0 ps-0"
                                                        placeholder="e.g. India, USA..."
                                                        value={form.location}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label text-secondary small fw-bold mb-1">
                                                    Budget
                                                </label>
                                                <div className="input-group">
                                                    <span className="input-group-text bg-light border-end-0">
                                                        <FiDollarSign className="text-muted" />
                                                    </span>
                                                    <input
                                                        type="number"
                                                        id="budget"
                                                        name="budget"
                                                        className="form-control bg-light border-start-0 ps-0"
                                                        placeholder="e.g. 50000"
                                                        value={form.budget}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <hr className="my-3" />

                                        <div className="col-12">
                                            <div
                                                className="bg-light rounded-3 p-3 d-flex align-items-center"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => setForm(prev => ({ ...prev, isoCertified: !prev.isoCertified }))}
                                            >
                                                <div className="form-check form-switch mb-0 d-flex align-items-center" style={{ paddingLeft: '2.5em' }}>
                                                    <input
                                                        className="form-check-input me-3"
                                                        type="checkbox"
                                                        role="switch"
                                                        id="isoCertified"
                                                        name="isoCertified"
                                                        checked={form.isoCertified}
                                                        onChange={handleChange}
                                                        style={{ width: '2.5em', height: '1.3em', cursor: 'pointer' }}
                                                    />
                                                    <label className="form-check-label fw-bold text-dark" htmlFor="isoCertified" style={{ cursor: 'pointer' }}>
                                                        <FiShield className="me-2 text-primary" />
                                                        ISO Certified Only
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer border-top px-4 py-3">
                                    <button type="button" className="btn btn-outline-secondary d-flex align-items-center" onClick={handleReset}>
                                        <FiRefreshCw className="me-2" /> Reset
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
            {searched && !loading && searchResult && (
                <div>
                    {/* Search Summary */}
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-body">
                            <div className="row g-3">
                                <div className="col-md-3">
                                    <div className="text-center">
                                        <h4 className="fw-bold text-primary mb-0">{searchResult.vendors.length}</h4>
                                        <small className="text-secondary">Vendors Found</small>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="text-center">
                                        <h4 className="fw-bold text-success mb-0">{searchResult.total_raw_results}</h4>
                                        <small className="text-secondary">Total Results</small>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="text-center">
                                        <h4 className="fw-bold text-warning mb-0">{selectedVendors.length}</h4>
                                        <small className="text-secondary">Selected</small>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="text-center">
                                        <h4 className="fw-bold text-info mb-0">{searchResult.queries_generated.length}</h4>
                                        <small className="text-secondary">Queries</small>
                                    </div>
                                </div>
                            </div>
                            {searchResult.procurement_note && (
                                <div className="mt-3 pt-3 border-top">
                                    <small className="text-secondary">
                                        <FiAlertCircle className="me-1" />
                                        {searchResult.procurement_note}
                                    </small>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Vendor Cards */}
                    <div className="row g-4">
                        {searchResult.vendors.map((vendor) => {
                            const isSelected = selectedVendors.some(v => v.rank === vendor.rank);
                            return (
                                <div className="col-12 col-md-6 col-lg-4" key={vendor.rank}>
                                    <div
                                        className={`card border-0 h-100 ${isSelected ? 'border-success border-2' : ''}`}
                                        style={{
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                                            transition: 'all 0.3s ease',
                                            cursor: 'pointer',
                                        }}
                                        onMouseEnter={e => {
                                            if (!isSelected) {
                                                (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)';
                                                (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.15)';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (!isSelected) {
                                                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                                                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                                            }
                                        }}
                                    >
                                        <div className="card-body p-4">
                                            {/* Rank & Name */}
                                            <div className="d-flex justify-content-between align-items-start mb-3">
                                                <div className="d-flex align-items-center">
                                                    <div
                                                        className="rounded-circle d-flex align-items-center justify-content-center me-2"
                                                        style={{
                                                            width: '28px',
                                                            height: '28px',
                                                            backgroundColor: vendor.rank <= 3 ? '#10b981' : '#e5e7eb',
                                                            color: vendor.rank <= 3 ? 'white' : '#6b7280',
                                                            fontSize: '12px',
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        {vendor.rank}
                                                    </div>
                                                    <h5 className="fw-bold text-dark mb-0" style={{ fontSize: '1rem' }}>
                                                        {vendor.vendor_name}
                                                    </h5>
                                                </div>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span
                                                        className="badge rounded-pill px-2 py-1"
                                                        style={{
                                                            backgroundColor: `${getScoreColor(vendor.final_score)}20`,
                                                            color: getScoreColor(vendor.final_score),
                                                            fontSize: '11px'
                                                        }}
                                                    >
                                                        {getScoreLabel(vendor.final_score)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Selection checkbox */}
                                            <div className="form-check mb-3">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id={`vendor-${vendor.rank}`}
                                                    checked={isSelected}
                                                    onChange={() => toggleVendorSelection(vendor)}
                                                />
                                                <label className="form-check-label text-secondary small" htmlFor={`vendor-${vendor.rank}`}>
                                                    Select for quote request
                                                </label>
                                            </div>

                                            {/* Snippet */}
                                            <p className="text-secondary small mb-3" style={{ lineHeight: '1.5' }}>
                                                {vendor.snippet}
                                            </p>

                                            {/* Score Bars */}
                                            <div className="mb-3">
                                                <div className="d-flex justify-content-between small mb-1">
                                                    <span className="text-muted">Final Score</span>
                                                    <span className="fw-bold" style={{ color: getScoreColor(vendor.final_score) }}>
                                                        {vendor.final_score}/100
                                                    </span>
                                                </div>
                                                <div className="progress" style={{ height: '6px', borderRadius: '3px' }}>
                                                    <div
                                                        className="progress-bar"
                                                        style={{
                                                            width: `${vendor.final_score}%`,
                                                            backgroundColor: getScoreColor(vendor.final_score)
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {/* Key Details */}
                                            <div className="d-flex flex-column gap-2 small">
                                                <div className="d-flex align-items-center">
                                                    <FiMapPin className="me-2 text-primary" style={{ flexShrink: 0 }} />
                                                    <span className="text-truncate">{vendor.location_exact}</span>
                                                </div>
                                                <div className="d-flex align-items-center">
                                                    <FiTrendingUp className="me-2 text-success" style={{ flexShrink: 0 }} />
                                                    <span>{vendor.relevance_score} Relevance</span>
                                                </div>
                                                <div className="d-flex align-items-center">
                                                    <FiShield className="me-2 text-info" style={{ flexShrink: 0 }} />
                                                    <span>{vendor.compliance.compliance_score} Compliance</span>
                                                </div>
                                            </div>

                                            {/* Certifications */}
                                            <div className="mt-3 pt-3 border-top">
                                                <div className="d-flex flex-wrap gap-1">
                                                    {vendor.all_certifications.slice(0, 3).map((cert, i) => (
                                                        <span
                                                            key={i}
                                                            className="badge bg-light text-dark border"
                                                            style={{ fontSize: '10px' }}
                                                        >
                                                            {cert}
                                                        </span>
                                                    ))}
                                                    {vendor.all_certifications.length > 3 && (
                                                        <span className="badge bg-light text-muted" style={{ fontSize: '10px' }}>
                                                            +{vendor.all_certifications.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="card-footer bg-transparent border-top p-3 d-flex justify-content-between">
                                            <button
                                                className="btn btn-outline-primary btn-sm d-flex align-items-center px-3"
                                                onClick={() => setSelectedVendor(vendor)}
                                            >
                                                <FiSearch className="me-1" size={14} /> View Details
                                            </button>
                                            <button
                                                className={`btn btn-sm d-flex align-items-center px-3 ${isSelected ? 'btn-success' : 'btn-outline-success'}`}
                                                onClick={() => toggleVendorSelection(vendor)}
                                            >
                                                {isSelected ? '✓' : '+'} {isSelected ? 'Selected' : 'Select'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {searchResult.vendors.length === 0 && (
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
                    <p className="text-secondary">
                        Click <strong>"Search Vendors"</strong> to find vendors matching your requirements.
                    </p>
                    <p className="text-muted small">
                        Try: Part: "laptop", Quantity: "100", Location: "india"
                    </p>
                </div>
            )}

            {/* Vendor Detail Modal */}
            {selectedVendor && (
                <VendorDetailModal vendor={selectedVendor} onClose={() => setSelectedVendor(null)} />
            )}

            {/* Quote Request Modal - using shared component */}
            {showQuoteModal && (
                <RequestQuoteModal 
                    show={showQuoteModal} 
                    onClose={() => setShowQuoteModal(false)} 
                    selectedVendors={selectedVendors}
                />
            )}
        </div>
    );
};

export default VendorSearch;
