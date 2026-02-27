import React, { useState, useRef, useEffect } from 'react';
import {
    FiSearch, FiMapPin, FiBox, FiHash, FiCalendar,
    FiShield, FiDollarSign, FiRotateCcw, FiCheckCircle,
    FiXCircle, FiEye, FiPackage, FiAward, FiX, FiAlertCircle
} from 'react-icons/fi';
import Loader from '../../components/Loader/Loader';
import { searchVendors } from '../../services/apiService';
import type { Vendor } from '../../models/Vendor';
import { mockVendors } from '../../mock/vendors';
 
 
 
interface SearchForm {
    part: string;
    quantity: string;
    location: string;
    isoCertified: boolean;
    pricingMin: string;
    pricingMax: string;
    year: string;
}
 
const initialForm: SearchForm = {
    part: '',
    quantity: '',
    location: '',
    isoCertified: false,
    pricingMin: '',
    pricingMax: '',
    year: '',
};
 
interface FormErrors {
    part?: string;
    quantity?: string;
    location?: string;
    year?: string;
    pricingMin?: string;
    pricingMax?: string;
    pricingRange?: string;
    [key: string]: unknown;
}
 
const VendorSearch: React.FC = () => {
    const [form, setForm] = useState<SearchForm>(initialForm);
    const [errors, setErrors] = useState<FormErrors>({});
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
 
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 30 }, (_, i) => currentYear - i);
 
//     useEffect(() => {
//         var  results = await searchVendors({ category: form.part, location: form.location });
//     // API call
//     // fetchData();
 
//   }, [])
 
    const validateForm = (): FormErrors => {
        const newErrors: FormErrors = {};
 
        if (!form.part.trim()) newErrors.part = 'Part is required';
        if (!form.quantity.trim()) newErrors.quantity = 'Quantity is required';
        else if (Number(form.quantity) <= 0) newErrors.quantity = 'Must be greater than 0';
 
        if (!form.location.trim()) newErrors.location = 'Location is required';
        if (!form.year) newErrors.year = 'Year is required';
        if (form.pricingMin && form.pricingMax && Number(form.pricingMin) > Number(form.pricingMax)) {
            newErrors.pricingRange = 'Min price cannot exceed Max price';
        }
        if (form.pricingMin && Number(form.pricingMin) < 0) {
            newErrors.pricingMin = 'Min price cannot be negative';
        }
        if (form.pricingMax && Number(form.pricingMax) < 0) {
            newErrors.pricingMax = 'Max price cannot be negative';
        }
        return newErrors;
    };
 
    // Handle changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
        setErrors(prev => {
            const updated = { ...prev };
            delete updated[name];
            if (name === 'pricingMin' || name === 'pricingMax') delete updated.pricingRange;
            return updated;
        });
    };
 
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
            // var  results = await searchVendors({ category: form.part, location: form.location });
            // Client-side filtering for the extra fields
            let filtered = [...mockVendors];
            if (form.isoCertified) {
                filtered = filtered.filter(v => v.isIsoCertified);
            }
            if (form.pricingMin) {
                filtered = filtered.filter(v => (v.pricingMin ?? 0) >= Number(form.pricingMin));
            }
            if (form.pricingMax) {
                filtered = filtered.filter(v => (v.pricingMax ?? Infinity) <= Number(form.pricingMax));
            }
            if (form.year) {
                filtered = filtered.filter(v => (v.yearEstablished ?? 0) <= Number(form.year));
            }
            const qty = Number(form.quantity) || 0;
            if (qty > 0) {
                filtered = filtered.filter(v => (v.availableQuantity ?? 0) >= qty);
            }
            setVendors(filtered.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)));
            setSearched(true);
            handleReset();
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setLoading(false);
        }
    };
 
    const handleReset = () => {
        setForm({ ...initialForm });
        setErrors({});
    };
 
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            setShowModal(false);
        }
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
 
            {/* Bootstrap 5 Modal */}
            {showModal && (
                <div
                    className="modal d-block"
                    tabIndex={-1}
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={handleBackdropClick}
                >
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" ref={modalRef}>
                        <div className="modal-content border-0 shadow-lg" style={{ position: 'relative' }}>
                            {/* Close icon - top right corner */}
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
 
                            {/* Modal Header */}
                            <div className="modal-header border-0 pb-0 pe-5">
                                <h5 className="modal-title fw-bold text-dark">
                                    Vendor Search
                                </h5>
                            </div>
 
                            {/* Modal Body */}
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
                                                        value={form.part}
                                                        onChange={handleChange}
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
                                                        placeholder="e.g. 500"
                                                        min="1"
                                                        value={form.quantity}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                                {errors.quantity && <div className="text-danger small mt-1 d-flex align-items-center"><FiAlertCircle className="me-1" size={12} />{errors.quantity}</div>}
                                            </div>
                                        </div>
                                        <div className="row g-3 mb-3">
                                            {/* Location */}
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
 
                                            {/* Year */}
                                            <div className="col-md-6">
                                                <label htmlFor="year" className="form-label text-secondary small fw-bold mb-1">
                                                    Year Of <span className="text-danger">*</span>
                                                </label>
                                                <div className={`input-group ${errors.year ? 'has-validation' : ''}`}>
                                                    <span className={`input-group-text bg-light border-end-0 ${errors.year ? 'border-danger' : ''}`}><FiCalendar className="text-muted" /></span>
                                                    <select
                                                        id="year" name="year"
                                                        className={`form-select bg-light border-start-0 ${errors.year ? 'is-invalid' : ''}`}
                                                        value={form.year} onChange={handleChange}
                                                    >
                                                        <option value="">Select Year</option>
                                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                                    </select>
                                                </div>
                                                {errors.year && <div className="text-danger small mt-1 d-flex align-items-center"><FiAlertCircle className="me-1" size={12} />{errors.year}</div>}
                                            </div>
                                        </div>
 
                                        {/* Minimum Requirements */}
                                        <hr className="my-3" />
                                        <h6 className="fw-bold text-dark mb-3">
                                            <FiShield className="me-2 text-primary" />Minimum Requirements
                                        </h6>
 
                                        <div className="row g-3">
                                            {/* ISO Certified */}
                                            <div className="col-12">
                                                <div
                                                    className="bg-light rounded-3 p-3 d-flex align-items-center"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => setForm(prev => ({ ...prev, isoCertified: !prev.isoCertified }))}
                                                >
                                                    <div className="form-check form-switch mb-0 d-flex align-items-center" style={{ paddingLeft: '2.5em' }}>
                                                        <input
                                                            className="form-check-input me-3" type="checkbox" role="switch"
                                                            id="isoCertified" name="isoCertified"
                                                            checked={form.isoCertified}
                                                            onChange={handleChange}
                                                            style={{ width: '2.5em', height: '1.3em', cursor: 'pointer' }}
                                                        />
                                                        <label className="form-check-label fw-bold text-dark" htmlFor="isoCertified" style={{ cursor: 'pointer' }}>
                                                            ISO Certified Only
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
 
                                            {/* Pricing Range - side by side */}
                                            <div className="col-md-6">
                                                <label htmlFor="pricingMin" className="form-label text-secondary small fw-bold mb-1">
                                                    Pricing Range (Min)
                                                </label>
                                                <div className={`input-group ${errors.pricingMin || errors.pricingRange ? 'has-validation' : ''}`}>
                                                    <span className={`input-group-text bg-light border-end-0 ${errors.pricingMin || errors.pricingRange ? 'border-danger' : ''}`}><FiDollarSign className="text-muted" /></span>
                                                    <input
                                                        type="number" id="pricingMin" name="pricingMin"
                                                        className={`form-control bg-light border-start-0 ps-0 ${errors.pricingMin || errors.pricingRange ? 'is-invalid' : ''}`}
                                                        placeholder="e.g. 100" min="0"
                                                        value={form.pricingMin} onChange={handleChange}
                                                    />
                                                </div>
                                                {errors.pricingMin && <div className="text-danger small mt-1 d-flex align-items-center"><FiAlertCircle className="me-1" size={12} />{errors.pricingMin}</div>}
                                            </div>
                                            <div className="col-md-6">
                                                <label htmlFor="pricingMax" className="form-label text-secondary small fw-bold mb-1">
                                                    Pricing Range (Max)
                                                </label>
                                                <div className={`input-group ${errors.pricingMax || errors.pricingRange ? 'has-validation' : ''}`}>
                                                    <span className={`input-group-text bg-light border-end-0 ${errors.pricingMax || errors.pricingRange ? 'border-danger' : ''}`}><FiDollarSign className="text-muted" /></span>
                                                    <input
                                                        type="number" id="pricingMax" name="pricingMax"
                                                        className={`form-control bg-light border-start-0 ps-0 ${errors.pricingMax || errors.pricingRange ? 'is-invalid' : ''}`}
                                                        placeholder="e.g. 50000" min="0"
                                                        value={form.pricingMax} onChange={handleChange}
                                                    />
                                                </div>
                                                {errors.pricingMax && <div className="text-danger small mt-1 d-flex align-items-center"><FiAlertCircle className="me-1" size={12} />{errors.pricingMax}</div>}
                                            </div>
                                            {errors.pricingRange && (
                                                <div className="col-12">
                                                    <div className="text-danger small d-flex align-items-center"><FiAlertCircle className="me-1" size={12} />{errors.pricingRange}</div>
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
                    {/* <div className="mb-3 d-flex justify-content-between align-items-center">
                        <span className="text-secondary fw-bold">{vendors.length} vendor{vendors.length !== 1 ? 's' : ''} found</span>
                        <button
                            className="btn btn-outline-primary btn-sm d-flex align-items-center"
                            onClick={() => setShowModal(true)}
                        >
                            <FiSearch className="me-1" /> Refine Search
                        </button>
                    </div> */}
 
                    <div className="row g-4">
                        {vendors.map(vendor => (
                            <div className="col-12 col-md-6 col-lg-4" key={vendor.id}>
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
                                            <h5 className="fw-bold text-dark mb-0">{vendor.name}</h5>
                                            {vendor.isIsoCertified ? (
                                                <span className="badge bg-success bg-opacity-10 text-success d-flex align-items-center gap-1 px-2 py-1">
                                                    <FiCheckCircle size={12} /> ISO Certified
                                                </span>
                                            ) : (
                                                <span className="badge bg-secondary bg-opacity-10 text-secondary d-flex align-items-center gap-1 px-2 py-1">
                                                    <FiXCircle size={12} /> Not Certified
                                                </span>
                                            )}
                                        </div>
 
                                        {/* Details Grid */}
                                        <div className="d-flex flex-column gap-2 small text-secondary mb-3">
                                            <div className="d-flex align-items-center">
                                                <FiMapPin className="me-2 text-primary" style={{ flexShrink: 0 }} />
                                                <span>{vendor.location}</span>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <FiDollarSign className="me-2 text-primary" style={{ flexShrink: 0 }} />
                                                <span>${(vendor.pricingMin ?? 0).toLocaleString()} – ${(vendor.pricingMax ?? 0).toLocaleString()}</span>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <FiPackage className="me-2 text-primary" style={{ flexShrink: 0 }} />
                                                <span>Qty Available: {(vendor.availableQuantity ?? 0).toLocaleString()}</span>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <FiCalendar className="me-2 text-primary" style={{ flexShrink: 0 }} />
                                                <span>Est. {vendor.yearEstablished}</span>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <FiAward className="me-2 text-primary" style={{ flexShrink: 0 }} />
                                                <span>{vendor.certifications.join(', ')}</span>
                                            </div>
                                        </div>
                                    </div>
 
                                    {/* Footer */}
                                    <div className="card-footer bg-transparent border-top p-3 d-flex justify-content-end">
                                        <button className="btn btn-outline-primary btn-sm d-flex align-items-center rounded-pill px-3">
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
 