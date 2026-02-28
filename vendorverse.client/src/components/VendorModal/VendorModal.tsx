import React, { useState, useEffect } from 'react';
import { FiPlus, FiSave, FiInfo, FiDollarSign, FiTruck, FiMail, FiPhone, FiGlobe } from 'react-icons/fi';
import styles from './VendorModal.module.scss';
import type { Vendor } from '../../models/Vendor';
import { addVendor, updateVendor } from '../../services/apiService';

interface VendorModalProps {
    show: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingVendor: Vendor | null;
}

const CATEGORY_OPTIONS = [
    'Raw Materials',
    'Hardware',
    'Electronics',
    'Logistics',
    'Packaging',
    'Office Supplies',
    'Industrial Machinery',
    'IT Services',
    'Consulting',
    'Chemicals'
];

const initialVendorState: Omit<Vendor, 'id'> = {
    name: '',
    email: '',
    description: '',
    certifications: [],
    location: '',
    category: CATEGORY_OPTIONS[0],
    phone: '',
    matchScore: 85,
    pricingMin: 100,
    pricingMax: 5000,
    availableQuantity: 1000,
    yearEstablished: new Date().getFullYear() - 10,
    isIsoCertified: false,
};

const VendorModal: React.FC<VendorModalProps> = ({ show, onClose, onSuccess, editingVendor }) => {
    const [formData, setFormData] = useState<Omit<Vendor, 'id'> | Vendor>(initialVendorState);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show) {
            if (editingVendor) {
                setFormData({ ...editingVendor });
            } else {
                setFormData(initialVendorState);
            }
        }
    }, [show, editingVendor]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'number' ? Number(value) : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingVendor) {
                await updateVendor(formData as Vendor);
            } else {
                const newVendor: Vendor = {
                    ...formData,
                    id: `ven-${Date.now()}`
                };
                await addVendor(newVendor);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to save vendor', error);
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    const isFormValid = formData.name.trim() !== '' && formData.email.trim() !== '' && formData.location.trim() !== '';

    return (
        <>
            <div className={`modal-backdrop show ${styles.modalOverlay}`} onClick={onClose} />
            <div className={`modal d-block`} tabIndex={-1} role="dialog" onClick={onClose}>
                <div className={`modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable`} onClick={e => e.stopPropagation()}>
                    <div className={`modal-content ${styles.modalContent}`}>
                        {/* Header */}
                        <div className={`modal-header ${styles.modalHeader}`}>
                            <h5 className={styles.modalTitle}>
                                {editingVendor ? <><FiPlus style={{ transform: 'rotate(45deg)' }} /> Edit Vendor</> : <><FiPlus /> Add New Vendor</>}
                            </h5>
                            <button type="button" className={`btn-close ${styles.closeBtn}`} onClick={onClose} aria-label="Close" />
                        </div>

                        {/* Body */}
                        <div className={`modal-body ${styles.modalBody}`}>
                            <form id="vendor-form" onSubmit={handleSubmit}>
                                {/* Basic Info Section */}
                                <div className="mb-4">
                                    <h6 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3">
                                        <FiInfo className="text-primary" /> Basic Information
                                    </h6>
                                    <div className={styles.formGroup}>
                                        <label>Vendor Name*</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className={styles.formInput}
                                            placeholder="e.g. Acme Manufacturing"
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            className={styles.formTextarea}
                                            placeholder="Tell us about this vendor..."
                                        />
                                    </div>
                                    <div className={styles.gridRow}>
                                        <div className={styles.formGroup}>
                                            <label>Category</label>
                                            <select
                                                name="category"
                                                value={formData.category}
                                                onChange={handleInputChange}
                                                className={styles.formSelect}
                                            >
                                                {CATEGORY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Year Established</label>
                                            <input
                                                type="number"
                                                name="yearEstablished"
                                                value={formData.yearEstablished}
                                                onChange={handleInputChange}
                                                className={styles.formInput}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Contact & Location */}
                                <div className="mb-4">
                                    <h6 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3">
                                        <FiTruck className="text-primary" /> Contact
                                    </h6>
                                    <div className={styles.gridRow}>
                                        <div className={styles.formGroup}>
                                            <label><FiMail size={12} className="me-1" /> Email Address*</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className={styles.formInput}
                                                placeholder="contact@email.com"
                                                required
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label><FiPhone size={12} className="me-1" /> Phone Number</label>
                                            <input
                                                type="text"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className={styles.formInput}
                                                placeholder="+1 (555) 123-4567"
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label><FiGlobe size={12} className="me-1" /> Location*</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            className={styles.formInput}
                                            placeholder="e.g. San Francisco, CA"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Pricing Section
                                <div className="mb-4">
                                    <h6 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3">
                                        <FiDollarSign className="text-primary" /> Commercials
                                    </h6>
                                    <div className={styles.gridRow}>
                                        <div className={styles.formGroup}>
                                            <label>Min Pricing (USD)</label>
                                            <input
                                                type="number"
                                                name="pricingMin"
                                                value={formData.pricingMin}
                                                onChange={handleInputChange}
                                                className={styles.formInput}
                                                min={0}
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Max Pricing (USD)</label>
                                            <input
                                                type="number"
                                                name="pricingMax"
                                                value={formData.pricingMax}
                                                onChange={handleInputChange}
                                                className={styles.formInput}
                                                min={0}
                                            />
                                        </div>
                                    </div>
                                </div> */}
                            </form>
                        </div>

                        {/* Footer */}
                        <div className={styles.modalFooter}>
                            <button type="button" className={styles.btnCancel} onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="vendor-form"
                                className={styles.btnSubmit}
                                disabled={!isFormValid || loading}
                            >
                                {loading ? (
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                                ) : (
                                    editingVendor ? <><FiSave /> Update Vendor</> : <><FiPlus /> Add Vendor</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default VendorModal;
