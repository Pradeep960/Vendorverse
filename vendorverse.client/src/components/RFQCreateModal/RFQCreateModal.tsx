import React, { useState, useEffect } from 'react';
import { FiX, FiUploadCloud, FiFile } from 'react-icons/fi';
import { getVendors, saveRFQ } from '../../services/apiService';
import type { Vendor } from '../../models/Vendor';
import type { RFQ } from '../../models/RFQ';
import styles from './RFQCreateModal.module.scss';
import EmailModal from '../EmailModal/EmailModal';

interface RFQCreateModalProps {
    show: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const RFQCreateModal: React.FC<RFQCreateModalProps> = ({ show, onClose, onSuccess }) => {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [quantity, setQuantity] = useState<number | ''>('');
    const [budget, setBudget] = useState<number | ''>('');
    const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
    const [fileData, setFileData] = useState<{ name: string; data: string } | null>(null);
    const [loadingVendors, setLoadingVendors] = useState(true);

    const [showEmailModal, setShowEmailModal] = useState(false);
    const [createdRFQ, setCreatedRFQ] = useState<RFQ | null>(null);

    useEffect(() => {
        if (show) {
            getVendors().then(data => {
                setVendors(data);
                setLoadingVendors(false);
            });
        }
    }, [show]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFileData({
                    name: file.name,
                    data: event.target?.result as string, // base64
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleVendor = (id: string) => {
        setSelectedVendors(prev =>
            prev.includes(id) ? prev.filter(vId => vId !== id) : [...prev, id]
        );
    };

    const isFormValid = !!(
        title.trim() &&
        description.trim() &&
        (quantity !== '' && Number(quantity) > 0) &&
        (budget !== '' && Number(budget) > 0) &&
        selectedVendors.length > 0 &&
        fileData !== null
    );

    useEffect(() => {
        if (show) {
            console.log("RFQCreateModal Validation Check:", {
                title: !!title.trim(),
                description: !!description.trim(),
                quantity: quantity !== '' && Number(quantity) > 0,
                budget: budget !== '' && Number(budget) > 0,
                vendors: selectedVendors.length > 0,
                file: !!fileData
            });
        }
    }, [show, title, description, quantity, budget, selectedVendors, fileData]);

    const handleSubmit = async () => {
        if (!isFormValid) return;

        const rfqId = `rfq-${Date.now()}`;
        const newRFQ: RFQ = {
            id: rfqId,
            title,
            description,
            quantity: Number(quantity),
            budget: Number(budget),
            attachedFile: fileData!,
            status: 'Pending',
            createdAt: new Date().toISOString(),
            vendorsTargeted: selectedVendors,
        };

        await saveRFQ(newRFQ);
        setCreatedRFQ(newRFQ);
        setShowEmailModal(true);
    };

    const handleEmailSent = () => {
        setShowEmailModal(false);
        onSuccess();
        onClose();
        // Reset form
        setTitle('');
        setDescription('');
        setQuantity('');
        setBudget('');
        setSelectedVendors([]);
        setFileData(null);
    };

    if (!show) return null;

    if (showEmailModal && createdRFQ) {
        return (
            <EmailModal
                rfq={createdRFQ}
                vendors={vendors.filter(v => createdRFQ.vendorsTargeted.includes(v.id))}
                onClose={handleEmailSent}
            />
        );
    }

    return (
        <>
            <div className={`modal-backdrop show ${styles.modalOverlay}`} onClick={onClose} />
            <div className={`modal d-block`} tabIndex={-1} onClick={onClose}>
                <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
                    <div className={`modal-content ${styles.modalContent}`}>
                        <div className={`modal-header ${styles.modalHeader}`}>
                            <h5 className={`modal-title ${styles.modalTitle}`}>Create RFQ</h5>
                            <button type="button" className={`btn-close ${styles.closeBtn}`} onClick={onClose} />
                        </div>
                        <div className={`modal-body ${styles.modalBody}`}>
                            <div className="mb-3">
                                <label className={styles.formLabel}>RFQ Title *</label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter title"
                                />
                            </div>
                            <div className="mb-3">
                                <label className={styles.formLabel}>Product Details *</label>
                                <textarea
                                    className={styles.formTextarea}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Enter details"
                                    rows={3}
                                />
                            </div>
                            <div className="row mb-3">
                                <div className="col-md-6 mb-3 mb-md-0">
                                    <label className={styles.formLabel}>Quantity *</label>
                                    <input
                                        type="number"
                                        className={styles.formInput}
                                        value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value) || '')}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className={styles.formLabel}>Budget ($) *</label>
                                    <input
                                        type="number"
                                        className={styles.formInput}
                                        value={budget}
                                        onChange={(e) => setBudget(Number(e.target.value) || '')}
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className={styles.formLabel}>Upload PDF Document *</label>
                                {!fileData ? (
                                    <div className={styles.fileUploadArea}>
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            className={styles.fileInput}
                                            onChange={handleFileChange}
                                        />
                                        <FiUploadCloud size={32} className="text-primary mb-2" />
                                        <p className="mb-0 text-secondary">Click or drag file to upload PDF</p>
                                    </div>
                                ) : (
                                    <div className="d-flex align-items-center justify-content-between p-3 rounded" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                        <div className="d-flex align-items-center">
                                            <FiFile className="text-primary me-2" size={20} />
                                            <span className="fw-medium text-dark">{fileData.name}</span>
                                        </div>
                                        <button className="btn btn-sm btn-outline-danger" onClick={() => setFileData(null)}>
                                            <FiX />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="mb-2">
                                <label className={styles.formLabel}>Select Vendors *</label>
                                {loadingVendors ? (
                                    <p>Loading vendors...</p>
                                ) : (
                                    <div className={styles.vendorList}>
                                        {vendors.map(vendor => (
                                            <div
                                                key={vendor.id}
                                                className={`${styles.vendorItem} ${selectedVendors.includes(vendor.id) ? styles.selected : ''}`}
                                                onClick={() => toggleVendor(vendor.id)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedVendors.includes(vendor.id)}
                                                    onChange={() => { }}
                                                    className="me-2"
                                                />
                                                <div>
                                                    <span className="fw-bold d-block">{vendor.name}</span>
                                                    <span className="text-secondary small">{vendor.category} - {vendor.email}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className={`modal-footer ${styles.modalFooter}`}>
                            <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
                            <button
                                type="button"
                                className={`btn btn-primary ${styles.submitBtn}`}
                                onClick={handleSubmit}
                                disabled={!isFormValid}
                            >
                                Continue to Send Email
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RFQCreateModal;
