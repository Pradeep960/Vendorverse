import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getRFQs, getVendors, saveQuote, updateRFQ } from '../../services/apiService';
import type { RFQ } from '../../models/RFQ';
import type { Vendor } from '../../models/Vendor';
import type { Quote } from '../../models/Quote';
import Card from '../../components/Card/Card';
import Loader from '../../components/Loader/Loader';
import { FiUploadCloud, FiFile, FiCheckCircle, FiX } from 'react-icons/fi';
import styles from './VendorSubmit.module.scss';

const VendorSubmitPage: React.FC = () => {
    const { rfqId, vendorId } = useParams<{ rfqId: string, vendorId: string }>();

    const [rfq, setRfq] = useState<RFQ | null>(null);
    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [loading, setLoading] = useState(true);

    const [price, setPrice] = useState<number | ''>('');
    const [delivery, setDelivery] = useState<number | ''>('');
    const [notes, setNotes] = useState('');
    const [files, setFiles] = useState<{ name: string; data: string }[]>([]);

    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!rfqId || !vendorId) return;
            const [rfqs, vendors] = await Promise.all([getRFQs(), getVendors()]);
            const targetRfq = rfqs.find(r => r.id === rfqId);
            const targetVendor = vendors.find(v => v.id === vendorId);

            if (targetRfq && targetVendor) {
                setRfq(targetRfq);
                setVendor(targetVendor);
            }
            setLoading(false);
        };
        fetchData();
    }, [rfqId, vendorId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (!fileList) return;

        const newFiles: { name: string; data: string }[] = [];
        Array.from(fileList).forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                newFiles.push({
                    name: file.name,
                    data: event.target?.result as string,
                });
                if (newFiles.length === fileList.length) {
                    setFiles(prev => [...prev, ...newFiles]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const isFormValid = price !== '' && delivery !== '';

    const handleSubmit = async () => {
        if (!isFormValid || !rfq || !vendor) return;

        const newQuote: Quote = {
            id: `q-${Date.now()}`,
            rfqId: rfq.id,
            vendorId: vendor.id,
            price: Number(price),
            deliveryTimeDays: Number(delivery),
            delivery: Number(delivery),
            submittedAt: new Date().toISOString(),
            notes,
            files: files.map(f => f.name), // Optionally save base64 if needed
        };

        await saveQuote(newQuote);

        // Update RFQ status
        if (rfq.status === 'Pending' || rfq.status === 'Sent' as any) {
            rfq.status = 'Responses Received';
            await updateRFQ(rfq);
        }

        setSubmitted(true);
    };

    if (loading) return <Loader />;

    if (!rfq || !vendor) {
        return (
            <div className="container py-5 text-center">
                <h2>Invalid Link</h2>
                <p className="text-secondary">We couldn't find the RFQ or Vendor for this link.</p>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className={`container py-5 ${styles.submitContainer}`}>
                <div style={{ maxWidth: '600px' }} className="mx-auto">
                    <Card className="p-5 text-center border-0 shadow-sm mx-auto">
                        <div className="mb-4 text-success" style={{ fontSize: '4rem' }}><FiCheckCircle /></div>
                        <h2 className="fw-bold mb-3">Quotation Submitted!</h2>
                        <p className="text-secondary mb-4">
                            Thank you, {vendor.name}. Your quotation for <strong>{rfq.title}</strong> has been successfully received by the procurement team.
                        </p>
                        <button className="btn btn-primary px-4" onClick={() => window.close()}>
                            Close Window
                        </button>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className={`container py-5 ${styles.submitContainer}`}>
            <div className="mx-auto" style={{ maxWidth: '800px' }}>
                <div className="mb-4">
                    <h2 className="fw-bold text-dark">Submit Quotation</h2>
                    <p className="text-secondary">Please provide your pricing and delivery details for the requested items.</p>
                </div>

                <Card className="p-4 mb-4 border-0 shadow-sm">
                    <h5 className="fw-bold mb-3 border-bottom pb-2">RFQ Details</h5>
                    <div className="row mb-3">
                        <div className="col-md-3 text-secondary fw-semibold">Title</div>
                        <div className="col-md-9">{rfq.title}</div>
                    </div>
                    <div className="row mb-3">
                        <div className="col-md-3 text-secondary fw-semibold">Description</div>
                        <div className="col-md-9">{rfq.description}</div>
                    </div>
                    <div className="row mb-3">
                        <div className="col-md-3 text-secondary fw-semibold">Quantity Required</div>
                        <div className="col-md-9">{rfq.quantity}</div>
                    </div>
                    {rfq.attachedFile && (
                        <div className="row">
                            <div className="col-md-3 text-secondary fw-semibold">Document</div>
                            <div className="col-md-9">
                                <span className="badge bg-light text-primary border p-2">
                                    <FiFile className="me-2" />
                                    {rfq.attachedFile.name}
                                </span>
                            </div>
                        </div>
                    )}
                </Card>

                <Card className="p-4 border-0 shadow-sm">
                    <h5 className="fw-bold mb-4 border-bottom pb-2">Your Quotation</h5>

                    <div className="mb-3">
                        <label className={styles.formLabel}>Vendor Name</label>
                        <input type="text" className={styles.formInput} value={vendor.name} disabled />
                    </div>

                    <div className="row mb-3">
                        <div className="col-md-6 mb-3 mb-md-0">
                            <label className={styles.formLabel}>Total Price (USD) *</label>
                            <input
                                type="number"
                                className={styles.formInput}
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value) || '')}
                                placeholder="e.g. 50000"
                            />
                        </div>
                        <div className="col-md-6">
                            <label className={styles.formLabel}>Delivery Time (Days) *</label>
                            <input
                                type="number"
                                className={styles.formInput}
                                value={delivery}
                                onChange={(e) => setDelivery(Number(e.target.value) || '')}
                                placeholder="e.g. 14"
                            />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className={styles.formLabel}>Additional Notes</label>
                        <textarea
                            className={styles.formTextarea}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Warranties, shipping details, or other terms..."
                            rows={4}
                        />
                    </div>

                    <div className="mb-4">
                        <label className={styles.formLabel}>Upload Supporting Files (Optional)</label>
                        <div className={styles.fileUploadArea}>
                            <input
                                type="file"
                                multiple
                                className={styles.fileInput}
                                onChange={handleFileChange}
                            />
                            <FiUploadCloud size={32} className="text-primary mb-2" />
                            <p className="mb-0 text-secondary">Click or drag files to upload</p>
                        </div>
                        {files.length > 0 && (
                            <div className="mt-3 d-flex flex-column gap-2">
                                {files.map((file, idx) => (
                                    <div key={idx} className="d-flex justify-content-between align-items-center p-2 rounded bg-light border">
                                        <div className="d-flex align-items-center">
                                            <FiFile className="text-secondary me-2" />
                                            <span className="small fw-medium">{file.name}</span>
                                        </div>
                                        <button className="btn btn-sm btn-link text-danger p-0" onClick={() => removeFile(idx)}>
                                            <FiX />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="d-flex justify-content-end mt-4">
                        <button
                            className="btn btn-primary px-4 py-2"
                            onClick={handleSubmit}
                            disabled={!isFormValid}
                        >
                            Submit Quotation
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default VendorSubmitPage;
