import React, { useState } from 'react';
import { FiFileText, FiSend, FiEye, FiPlus, FiTrash2 } from 'react-icons/fi';
import { generateRFQPdf } from '../../utils/generateRFQPdf';
import type { RFQFormData, RFQItem } from '../../utils/generateRFQPdf';
import type { Vendor } from '../../models/Vendor';
import styles from './RequestQuoteModal.module.scss';

interface RequestQuoteModalProps {
    show: boolean;
    onClose: () => void;
    selectedVendors: Vendor[];
}

const MINIMUM_REQUIREMENTS_OPTIONS = [
    'ISO 9001',
    'ISO 14001',
    'ISO 27001',
    'SOC 2 Type II',
    'CE Marking',
    'UL Listed',
    'RoHS Compliant',
    'REACH Compliant',
];

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 30 }, (_, i) => currentYear - i);

const createEmptyItem = (): RFQItem => ({ part: '', quantity: 1 });

const emptyForm: RFQFormData = {
    items: [createEmptyItem()],
    location: '',
    minimumRequirements: [],
    isoCertified: false,
    pricingMin: 0,
    pricingMax: 0,
    yearOfManufacturing: currentYear,
};

const RequestQuoteModal: React.FC<RequestQuoteModalProps> = ({ show, onClose, selectedVendors }) => {
    const [formData, setFormData] = useState<RFQFormData>({ ...emptyForm, items: [createEmptyItem()] });
    const [sent, setSent] = useState(false);

    if (!show) return null;

    const updateField = <K extends keyof RFQFormData>(key: K, value: RFQFormData[K]) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    // ─── Item CRUD ───
    const updateItem = (index: number, field: keyof RFQItem, value: string | number) => {
        setFormData(prev => {
            const newItems = [...prev.items];
            newItems[index] = { ...newItems[index], [field]: value };
            return { ...prev, items: newItems };
        });
    };

    const addItem = () => {
        setFormData(prev => ({ ...prev, items: [...prev.items, createEmptyItem()] }));
    };

    const removeItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }));
    };

    const toggleRequirement = (req: string) => {
        setFormData(prev => {
            const exists = prev.minimumRequirements.includes(req);
            return {
                ...prev,
                minimumRequirements: exists
                    ? prev.minimumRequirements.filter(r => r !== req)
                    : [...prev.minimumRequirements, req],
            };
        });
    };

    const itemsValid = formData.items.length > 0 && formData.items.every(i => i.part.trim() !== '' && i.quantity > 0);
    const isFormValid = itemsValid && formData.location.trim() !== '';

    const handlePreview = () => {
        const vendorNames = selectedVendors.map(v => v.name);
        generateRFQPdf(formData, vendorNames.length > 0 ? vendorNames : undefined);
    };

    const handleSend = () => {
        setSent(true);
        setTimeout(() => {
            setSent(false);
            setFormData({ ...emptyForm, items: [createEmptyItem()] });
            onClose();
        }, 1800);
    };

    const handleClose = () => {
        setFormData({ ...emptyForm, items: [createEmptyItem()] });
        setSent(false);
        onClose();
    };

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
                    <div className={`modal-content ${styles.modalContent}`}>
                        {/* Header */}
                        <div className={`modal-header ${styles.modalHeader}`}>
                            <div className="d-flex align-items-center gap-2">
                                <FiFileText size={20} />
                                <h5 className={`modal-title ${styles.modalTitle}`}>Request for Quote</h5>
                            </div>
                            <button
                                type="button"
                                className={`btn-close ${styles.closeBtn}`}
                                onClick={handleClose}
                            />
                        </div>

                        {/* Body */}
                        <div className={`modal-body ${styles.modalBody}`}>
                            {sent ? (
                                <div className="text-center py-5">
                                    <div className="mb-3" style={{ fontSize: '3rem' }}>✅</div>
                                    <h5 className="fw-bold text-dark">Quote Request Sent!</h5>
                                    <p className="text-secondary">
                                        Sent to {selectedVendors.length} vendor{selectedVendors.length !== 1 ? 's' : ''} successfully.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={e => e.preventDefault()}>
                                    {/* ─── Items Section ─── */}
                                    <div className={styles.formGroup}>
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <label className="mb-0">Parts / Items *</label>
                                            <button
                                                type="button"
                                                className={styles.addItemBtn}
                                                onClick={addItem}
                                            >
                                                <FiPlus size={14} /> Add Item
                                            </button>
                                        </div>

                                        <div className={styles.itemsList}>
                                            {formData.items.map((item, idx) => (
                                                <div key={idx} className={styles.itemBox}>
                                                    <div className={styles.itemNumber}>{idx + 1}</div>
                                                    <div className={styles.itemFields}>
                                                        <input
                                                            type="text"
                                                            className={styles.formInput}
                                                            placeholder="Part / Item name"
                                                            value={item.part}
                                                            onChange={e => updateItem(idx, 'part', e.target.value)}
                                                        />
                                                        <input
                                                            type="number"
                                                            className={`${styles.formInput} ${styles.qtyInput}`}
                                                            placeholder="Qty"
                                                            min={1}
                                                            value={item.quantity}
                                                            onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                    {formData.items.length > 1 && (
                                                        <button
                                                            type="button"
                                                            className={styles.removeItemBtn}
                                                            onClick={() => removeItem(idx)}
                                                            title="Remove item"
                                                        >
                                                            <FiTrash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Location */}
                                    <div className={styles.formGroup}>
                                        <label>Delivery Location *</label>
                                        <input
                                            type="text"
                                            className={styles.formInput}
                                            placeholder="e.g. New York, USA"
                                            value={formData.location}
                                            onChange={e => updateField('location', e.target.value)}
                                        />
                                    </div>

                                    {/* Minimum Requirements */}
                                    <div className={styles.formGroup}>
                                        <label>Minimum Requirements</label>
                                        <div className={styles.checkboxGroup}>
                                            {MINIMUM_REQUIREMENTS_OPTIONS.map(req => {
                                                const checked = formData.minimumRequirements.includes(req);
                                                return (
                                                    <label
                                                        key={req}
                                                        className={`${styles.checkboxLabel} ${checked ? styles.checkboxLabelChecked : ''}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => toggleRequirement(req)}
                                                        />
                                                        {req}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* ISO Certified */}
                                    <div className={styles.formGroup}>
                                        <label
                                            className={`${styles.checkboxLabel} ${formData.isoCertified ? styles.checkboxLabelChecked : ''}`}
                                            style={{ display: 'inline-flex' }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.isoCertified}
                                                onChange={e => updateField('isoCertified', e.target.checked)}
                                            />
                                            ISO Certified Required
                                        </label>
                                    </div>

                                    {/* Pricing Range */}
                                    <div className={styles.formGroup}>
                                        <label>Pricing Range (USD)</label>
                                        <div className={styles.rangeRow}>
                                            <input
                                                type="number"
                                                className={styles.formInput}
                                                placeholder="Min"
                                                min={0}
                                                value={formData.pricingMin || ''}
                                                onChange={e => updateField('pricingMin', parseInt(e.target.value) || 0)}
                                            />
                                            <span className={styles.rangeSeparator}>to</span>
                                            <input
                                                type="number"
                                                className={styles.formInput}
                                                placeholder="Max"
                                                min={0}
                                                value={formData.pricingMax || ''}
                                                onChange={e => updateField('pricingMax', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>

                                    {/* Year of Manufacturing */}
                                    <div className={styles.formGroup}>
                                        <label>Year of Manufacturing</label>
                                        <select
                                            className={styles.formSelect}
                                            value={formData.yearOfManufacturing}
                                            onChange={e => updateField('yearOfManufacturing', parseInt(e.target.value))}
                                        >
                                            {yearOptions.map(yr => (
                                                <option key={yr} value={yr}>{yr}</option>
                                            ))}
                                        </select>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Footer */}
                        {!sent && (
                            <div className={`modal-footer ${styles.modalFooter}`}>
                                {selectedVendors.length > 0 && (
                                    <span className={styles.vendorInfo}>
                                        <strong>{selectedVendors.length}</strong> vendor{selectedVendors.length !== 1 ? 's' : ''} selected
                                    </span>
                                )}

                                <button
                                    type="button"
                                    className={`${styles.footerBtn} ${styles.previewBtn}`}
                                    onClick={handlePreview}
                                    disabled={!isFormValid}
                                    title="Preview PDF"
                                >
                                    <FiEye /> Preview
                                </button>

                                <button
                                    type="button"
                                    className={`${styles.footerBtn} ${styles.sendBtn}`}
                                    onClick={handleSend}
                                    disabled={!isFormValid || selectedVendors.length === 0}
                                    title={selectedVendors.length === 0 ? 'Select vendors first' : 'Send to selected vendors'}
                                >
                                    <FiSend /> Send to Selected Vendors
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
