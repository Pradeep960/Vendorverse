import React, { useEffect, useState } from 'react';
import Card from '../../components/Card/Card';
import Loader from '../../components/Loader/Loader';
import { getQuotes, getVendors } from '../../services/apiService';
import type { Quote } from '../../models/Quote';
import type { Vendor } from '../../models/Vendor';
import { FiCheck, FiAward } from 'react-icons/fi';

const VendorComparison: React.FC = () => {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getQuotes(), getVendors()]).then(([q, v]) => {
            setQuotes(q.slice(0, 3)); // For comparison view
            setVendors(v);
            setLoading(false);
        });
    }, []);

    if (loading) return <Loader />;

    const getVendorName = (id: string) => vendors.find(v => v.id === id)?.name || id;

    const getBestPrice = () => Math.min(...quotes.map((q) => q.price));

    return (
        <div>
            <h3 className="fw-bold text-dark mb-4">Vendor Comparison</h3>

            <Card className="p-4 border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-bordered align-middle text-center m-0" style={{ minWidth: '800px' }}>
                        <thead className="table-light">
                            <tr>
                                <th className="text-start w-25">Comparison Criteria</th>
                                {quotes.map(quote => (
                                    <th key={quote.id} className="w-25 text-primary fw-bold fs-5 p-3">
                                        {getVendorName(quote.vendorId)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="text-start fw-bold text-secondary bg-light">Proposed Price</td>
                                {quotes.map(quote => (
                                    <td key={quote.id} className={`fs-5 fw-bold ${quote.price === getBestPrice() ? 'text-success bg-success bg-opacity-10 w-25' : 'text-dark'}`}>
                                        ${quote.price.toLocaleString()}
                                        {quote.price === getBestPrice() && <span className="badge bg-success ms-2 rounded-pill"><FiAward className="me-1" />Best</span>}
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="text-start fw-bold text-secondary bg-light">Delivery Timeline</td>
                                {quotes.map(quote => (
                                    <td key={quote.id} className="text-dark fw-bold">{quote.deliveryTimeDays} Days</td>
                                ))}
                            </tr>
                            <tr>
                                <td className="text-start fw-bold text-secondary bg-light">Key Features Included</td>
                                {quotes.map(quote => (
                                    <td key={quote.id} className="text-start p-3 align-top">
                                        <ul className="list-unstyled mb-0">
                                            {quote.features.map((feature, i) => (
                                                <li key={i} className="mb-2 text-secondary small d-flex align-items-middle">
                                                    <FiCheck className="text-success me-2 mt-1 flex-shrink-0" /> {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                <td className="text-start fw-bold text-secondary bg-light">Overall Rating</td>
                                {quotes.map(quote => {
                                    const vendor = vendors.find(v => v.id === quote.vendorId);
                                    return (
                                        <td key={quote.id}>
                                            <span className="badge bg-primary fs-6 px-3 py-2 rounded-pill shadow-sm">
                                                {vendor?.matchScore || 0}% Match
                                            </span>
                                        </td>
                                    );
                                })}
                            </tr>
                            <tr>
                                <td className="text-start fw-bold text-secondary bg-light border-bottom-0">Decision</td>
                                {quotes.map(quote => (
                                    <td key={quote.id} className="p-3 border-bottom-0">
                                        <button className="btn btn-outline-primary w-100 rounded-pill shadow-sm hover-lift fw-bold">Select Vendor</button>
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default VendorComparison;
