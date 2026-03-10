import React, { useEffect, useState } from 'react';
import Card from '../../components/Card/Card';
import Loader from '../../components/Loader/Loader';
import { FiUsers, FiFileText, FiList, FiStar } from 'react-icons/fi';
import { getVendors, getRFQs, getQuotes } from '../../services/apiService';
import type { Vendor } from '../../models/Vendor';
import type { RFQ } from '../../models/RFQ';
import type { Quote } from '../../models/Quote';

const Dashboard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [rfqs, setRFQs] = useState<RFQ[]>([]);
    const [quotes, setQuotes] = useState<Quote[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [v, r, q] = await Promise.all([getVendors(), getRFQs(), getQuotes()]);
                setVendors(v);
                setRFQs(r);
                setQuotes(q);
            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <Loader />;

    return (
        <div>
            <h3 className="fw-bold mb-4 text-dark">Dashboard Overview</h3>

            <div className="row g-4 mb-4">
                {[
                    { title: 'Total Vendors', value: vendors.length, icon: <FiUsers className="text-primary-custom" size={28} />, bg: 'bg-primary bg-opacity-10' },
                    { title: 'Active RFQs', value: rfqs.filter(r => r.status !== 'Closed').length, icon: <FiFileText className="text-success" size={28} />, bg: 'bg-success bg-opacity-10' },
                    { title: 'Quotes Received', value: quotes.length, icon: <FiList className="text-warning" size={28} />, bg: 'bg-warning bg-opacity-10' },
                    // { title: 'Top Vendor Score', value: '96%', icon: <FiStar className="text-danger" size={28} />, bg: 'bg-danger bg-opacity-10' }
                ].map((stat, idx) => (
                    <div className="col-12 col-md-6 col-lg-3" key={idx}>
                        <Card className="h-100">
                            <div className="d-flex align-items-center p-3">
                                <div className={`p-3 rounded-circle me-3 ${stat.bg}`}>
                                    {stat.icon}
                                </div>
                                <div>
                                    <h6 className="text-secondary mb-1">{stat.title}</h6>
                                    <h3 className="fw-bold text-dark mb-0">{stat.value}</h3>
                                </div>
                            </div>
                        </Card>
                    </div>
                ))}
            </div>

            <div className="row g-4">
                <div className="col-12 col-lg-8">
                    <Card title="Recent RFQ Activity" className="h-100 p-4">
                        <div className="table-responsive mt-3">
                            <table className="table table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Title</th>
                                        <th>Status</th>
                                        <th>Deadline</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rfqs.slice(0, 5).map(rfq => (
                                        <tr key={rfq.id}>
                                            <td className="fw-bold text-dark">{rfq.title}</td>
                                            <td>
                                                <span className={`badge ${rfq.status === 'Closed' ? 'bg-secondary' : 'bg-success'} rounded-pill px-3`}>
                                                    {rfq.status}
                                                </span>
                                            </td>
                                            <td className="text-secondary">{new Date(rfq.deadline).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
                <div className="col-12 col-lg-4">
                    <Card title="Platform Actions" className="h-100 p-4">
                        <div className="d-grid gap-3 mt-3">
                            <button className="btn btn-primary d-flex align-items-center justify-content-center py-2">
                                <FiFileText className="me-2" /> Create New RFQ
                            </button>
                            <button className="btn btn-outline-primary d-flex align-items-center justify-content-center py-2">
                                <FiUsers className="me-2" /> Add New Vendor
                            </button>
                            <button className="btn btn-outline-secondary d-flex align-items-center justify-content-center py-2">
                                <FiList className="me-2" /> Compare Quotes
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
