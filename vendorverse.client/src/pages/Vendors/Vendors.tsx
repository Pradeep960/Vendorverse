import React, { useEffect, useState } from 'react';
import Card from '../../components/Card/Card';
import Loader from '../../components/Loader/Loader';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { getVendors } from '../../services/apiService';
import type { Vendor } from '../../models/Vendor';

const Vendors: React.FC = () => {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getVendors().then(data => {
            setVendors(data);
            setLoading(false);
        });
    }, []);

    if (loading) return <Loader />;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold text-dark">Vendor Management</h3>
                <button className="btn btn-primary d-flex align-items-center">
                    <FiPlus className="me-2" /> Add Vendor
                </button>
            </div>

            <Card className="p-4">
                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Location</th>
                                <th>Contact</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendors.map(vendor => (
                                <tr key={vendor.id}>
                                    <td className="fw-bold text-dark">{vendor.name}</td>
                                    <td><span className="badge bg-light text-primary border">{vendor.category}</span></td>
                                    <td className="text-secondary">{vendor.location}</td>
                                    <td className="text-secondary">
                                        <div>{vendor.contactEmail}</div>
                                        <small>{vendor.phone}</small>
                                    </td>
                                    <td className="text-end">
                                        <button className="btn btn-sm btn-outline-primary me-2 shadow-sm rounded-circle"><FiEdit2 /></button>
                                        <button className="btn btn-sm btn-outline-danger shadow-sm rounded-circle"><FiTrash2 /></button>
                                    </td>
                                </tr>
                            ))}
                            {vendors.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-4 text-secondary">No vendors found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default Vendors;
