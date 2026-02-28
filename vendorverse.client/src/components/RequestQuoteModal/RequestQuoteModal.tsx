import React, { useState } from 'react';
import { FiFileText, FiSend, FiEye, FiPlus, FiTrash2, FiMail, FiCheck } from 'react-icons/fi';
import { generateRFQPdf, generateRFQPdfBlob } from '../../utils/generateRFQPdf';
import type { RFQFormData, RFQItem } from '../../utils/generateRFQPdf';
import type { Vendor } from '../../models/Vendor';
import type { VendorSearchItem } from '../../models/VendorSearchResult';
import { sendQuoteNotificationEmail, sendBulkVendorNotification, getEmailRecipient } from '../../services/emailService';
import { addRFQ } from '../../services/rfqService';
import type { RFQ } from '../../models/RFQ';
import styles from './RequestQuoteModal.module.scss';

// Support both Vendor types
type VendorType = Vendor | VendorSearchItem;

interface RequestQuoteModalProps {
    show: boolean;
    onClose: () => void;
    selectedVendors: VendorType[];
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

// Helper to get vendor name from either type
const getVendorName = (vendor: VendorType): string => {
    return (vendor as VendorSearchItem).vendor_name || (vendor as Vendor).name || '';
};

// Helper to get vendor id from either type
const getVendorId = (vendor: VendorType): string => {
    return (vendor as VendorSearchItem).vendor_name || (vendor as Vendor).id || '';
};

const RequestQuoteModal: React.FC<RequestQuoteModalProps> = ({ show, onClose, selectedVendors }) => {
    const [formData, setFormData] = useState<RFQFormData>({ ...emptyForm, items: [createEmptyItem()] });
    const [sent, setSent] = useState(false);
    const [sending, setSending] = useState(false);
    const [emailSentTo, setEmailSentTo] = useState('');

    if (!show) return null;

    const updateField = <K extends keyof RFQFormData>(key: K, value: RFQFormData[K]) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

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
        const vendorNames = selectedVendors.map(v => getVendorName(v));
        generateRFQPdf(formData, vendorNames.length > 0 ? vendorNames : undefined);
    };

    const handleSend = async () => {
        setSending(true);
        
        const vendorNames = selectedVendors.map(v => getVendorName(v));
        
        const newRFQ: RFQ = {
            id: `rfq-${Date.now()}`,
            title: formData.items.map(i => i.part).join(', '),
            description: `${formData.items.length} item(s) - Qty: ${formData.items.reduce((sum, i) => sum + i.quantity, 0)}`,
            status: 'Sent',
            createdAt: new Date().toISOString(),
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            vendorsTargeted: vendorNames
        };

        // Generate PDF blob for attachment
        const pdfBlob = generateRFQPdfBlob(formData, vendorNames.length > 0 ? vendorNames : undefined);
        
        // Get the email recipient
        const recipientEmail = getEmailRecipient();
        setEmailSentTo(recipientEmail);

        try {
            // Send email with PDF attachment to kartheek.m@pravaltech.com
            await sendQuoteNotificationEmail(newRFQ, pdfBlob);
            console.log('✅ Email with PDF attachment sent to:', recipientEmail);
            
            // Also notify vendors
            if (selectedVendors.length > 0) {
                await sendBulkVendorNotification(newRFQ, vendorNames, pdfBlob);
                console.log(`✅ Vendor notifications sent to ${selectedVendors.length} vendors`);
            }
            
            // Save RFQ to localStorage
            addRFQ(newRFQ);
            console.log('✅ RFQ saved to localStorage:', newRFQ.id);
            
        } catch (error) {
            console.error('Failed to send email notification:', error);
        }

        setSending(false);
        setSent(true);
        
        setTimeout(() => {
            setSent(false);
            setFormData({ ...emptyForm, items: [createEmptyItem()] });
            onClose();
        }, 2500);
    };

    const handleClose = () => {
        setFormData({ ...emptyForm, items: [createEmptyItem()] });
        setSent(false);
        setSending(false);
        onClose();
    };

    return (
        <>
            <div className={`modal-backdrop show ${styles.modalOverlay}`} onClick={handleClose} />
            <div className="modal d-block" tabIndex={-1} role="dialog" onClick={handleClose}>
                <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
                    <div className={`modal-content ${styles.modalContent}`}>
                        <div className={`modal-header ${styles.modalHeader}`}>
                            <div className="d-flex align-items-center gap-2">
                                <FiFileText size={20} />
                                <h5 className={`modal-title ${styles.modalTitle}`}>Request for Quote</h5>
                            </div>
                            <button type="button" className={`btn-close ${styles.closeBtn}`} onClick={handleClose} />
                        </div>

                        <div className={`modal-body ${styles.modalBody}`}>
                            {sent || sending ? (
                                <div className="text-center py-5">
                                    {sending ? (
                                        <>
                                            <div className="spinner-border text-primary mb-3" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                            <h5 className="fw-bold text-dark">Sending Quote...</h5>
                                            <p className="text-secondary">
                                                Generating PDF and sending email notification.
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="mb-3" style={{ fontSize: '3rem' }}>✅</div>
                                            <h5 className="fw-bold text-dark">Quote Request Sent!</h5>
                                            <p className="text-secondary">
                                                Sent to {selectedVendors.length} vendor{selectedVendors.length !== 1 ? 's' : ''} successfully.
                                            </p>
                                            <div className="mt-3 p-3 bg-success bg-opacity-10 rounded">
                                                <FiMail className="me-2 text-success" />
                                                <small className="text-success fw-bold">
                                                    Email with PDF attachment sent to {emailSentTo}
                                                </small>
                                            </div>
                                            <div className="mt-2 p-2 bg-primary bg-opacity-10 rounded">
                                                <FiCheck className="me-2 text-primary" />
                                                <small className="text-primary fw-bold">
                                                    PDF Quote Request attached
                                                </small>
                                            </div>
                                            <div className="mt-2 p-2 bg-info bg-opacity-10 rounded">
                                                <small className="text-info fw-bold">
                                                    RFQ saved to localStorage
                                                </small>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <form onSubmit={e => e.preventDefault()}>
                                    <div className={styles.formGroup}>
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <label className="mb-0">Parts / Items *</label>
                                            <button type="button" className={styles.addItemBtn} onClick={addItem}>
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
                                                        <button type="button" className={styles.removeItemBtn} onClick={() => removeItem(idx)} title="Remove item">
                                                            <FiTrash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

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

                                    <div className={styles.formGroup}>
                                        <label>Minimum Requirements</label>
                                        <div className={styles.checkboxGroup}>
                                            {MINIMUM_REQUIREMENTS_OPTIONS.map(req => {
                                                const checked = formData.minimumRequirements.includes(req);
                                                return (
                                                    <label key={req} className={`${styles.checkboxLabel} ${checked ? styles.checkboxLabelChecked : ''}`}>
                                                        <input type="checkbox" checked={checked} onChange={() => toggleRequirement(req)} />
                                                        {req}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={`${styles.checkboxLabel} ${formData.isoCertified ? styles.checkboxLabelChecked : ''}`} style={{ display: 'inline-flex' }}>
                                            <input type="checkbox" checked={formData.isoCertified} onChange={e => updateField('isoCertified', e.target.checked)} />
                                            ISO Certified Required
                                        </label>
                                    </div>

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

                                    <div className={styles.formGroup}>
                                        <label>Year of Manufacturing</label>
                                        <select
                                            className={styles.formSelect}
                                            value={formData.yearOfManufacturing}
                                            onChange={e => updateField('yearOfManufacturing', parseInt(e.target.value))}
                                        >
                                            {yearOptions.map(yr => (<option key={yr} value={yr}>{yr}</option>))}
                                        </select>
                                    </div>
                                </form>
                            )}
                        </div>

                        {!sent && !sending && (
                            <div className={`modal-footer ${styles.modalFooter}`}>
                                {selectedVendors.length > 0 && (
                                    <span className={styles.vendorInfo}>
                                        <strong>{selectedVendors.length}</strong> vendor{selectedVendors.length !== 1 ? 's' : ''} selected
                                    </span>
                                )}
                                <button type="button" className={`${styles.footerBtn} ${styles.previewBtn}`} onClick={handlePreview} disabled={!isFormValid} title="Preview PDF">
                                    <FiEye /> Preview
                                </button>
                                <button type="button" className={`${styles.footerBtn} ${styles.sendBtn}`} onClick={handleSend} disabled={!isFormValid || selectedVendors.length === 0} title={selectedVendors.length === 0 ? 'Select vendors first' : 'Send to selected vendors'}>
                                    <FiSend /> Send with PDF
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
