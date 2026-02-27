import React, { useEffect, useState } from 'react';
import Card from '../../components/Card/Card';
import Loader from '../../components/Loader/Loader';
import { FiDownloadCloud, FiFileText } from 'react-icons/fi';
import { getQuotes } from '../../services/apiService';
import type { Quote } from '../../models/Quote';

const QuotesAnalysis: React.FC = () => {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getQuotes().then(data => {
            setQuotes(data);
            setLoading(false);
        });
    }, []);

    if (loading) return <Loader />;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold text-dark">Quotations</h3>
                <button className="btn btn-outline-primary d-flex align-items-center shadow-sm">
                    <FiDownloadCloud className="me-2" /> Export Data
                </button>
            </div>

            <Card className="p-4 mb-5 border-0 bg-primary bg-opacity-10 shadow-none border border-primary border-opacity-25 rounded-3">
                <div className="d-flex align-items-center mb-3">
                    <FiFileText className="text-primary me-2 h4 mb-0" />
                    <h5 className="fw-bold text-primary mb-0">Upload Quotation Document</h5>
                </div>
                <p className="text-secondary small">Upload vendor quotes in PDF or Excel format. Our AI will automatically extract and structure the data for comparison.</p>
                <div className="border border-primary border-dashed p-4 text-center rounded-3 bg-white cursor-pointer hover-bg-light transition-all">
                    <FiDownloadCloud className="text-primary mb-2 h3" />
                    <p className="text-muted fw-bold mb-0">Drag and drop files here or click to browse</p>
                    <small className="text-secondary">PDF, XLSX, CSV up to 10MB</small>
                </div>
            </Card>

            <h5 className="fw-bold text-dark mb-4 mt-5">Extracted Quotations Data</h5>
            <Card className="p-4 border-0">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light text-secondary small text-uppercase fw-bold">
                            <tr>
                                <th>Quote ID</th>
                                <th>RFQ Ref.</th>
                                <th>Vendor</th>
                                <th className="text-end">Price</th>
                                <th className="text-end">Delivery (Days)</th>
                                <th>Submitted</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotes.map(quote => (
                                <tr key={quote.id}>
                                    <td className="fw-bold text-primary">{quote.id}</td>
                                    <td className="text-secondary">{quote.rfqId}</td>
                                    <td className="fw-bold text-dark">{quote.vendorId}</td>
                                    <td className="text-end fw-bold text-success">${quote.price.toLocaleString()}</td>
                                    <td className="text-end text-secondary">{quote.deliveryTimeDays} days</td>
                                    <td className="text-secondary">{new Date(quote.submittedAt).toLocaleDateString()}</td>
                                    <td>
                                        <button className="btn btn-sm btn-outline-primary shadow-sm rounded-pill px-3">Review</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default QuotesAnalysis;
