import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiMapPin } from 'react-icons/fi';
import VendorCard from '../../components/VendorCard/VendorCard';
import Loader from '../../components/Loader/Loader';
import { searchVendors } from '../../services/apiService';
import type { Vendor } from '../../models/Vendor';

const VendorSearch: React.FC = () => {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchCategory, setSearchCategory] = useState('');
    const [searchLocation, setSearchLocation] = useState('');

    const handleSearch = async () => {
        setLoading(true);
        try {
            const results = await searchVendors({ category: searchCategory, location: searchLocation });
            setVendors(results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)));
        } catch (error) {
            console.error('Failed to search vendors', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleSearch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div>
            <h3 className="fw-bold mb-4 text-dark">Discover Vendors</h3>

            <div className="card card-shadow p-4 mb-4 border-0">
                <div className="row g-3">
                    <div className="col-md-4">
                        <label className="form-label text-secondary small fw-bold">Category</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light border-end-0"><FiSearch className="text-muted" /></span>
                            <input
                                type="text"
                                className="form-control bg-light border-start-0 ps-0"
                                placeholder="e.g. Software, Hardware..."
                                value={searchCategory}
                                onChange={e => setSearchCategory(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-md-4">
                        <label className="form-label text-secondary small fw-bold">Location</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light border-end-0"><FiMapPin className="text-muted" /></span>
                            <input
                                type="text"
                                className="form-control bg-light border-start-0 ps-0"
                                placeholder="e.g. New York, London..."
                                value={searchLocation}
                                onChange={e => setSearchLocation(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-md-4 d-flex align-items-end gap-2">
                        <button className="btn btn-primary d-flex align-items-center flex-grow-1 justify-content-center" onClick={handleSearch}>
                            <FiSearch className="me-2" /> Search
                        </button>
                        <button className="btn btn-outline-secondary d-flex align-items-center" title="More Filters">
                            <FiFilter />
                        </button>
                    </div>
                </div>
            </div>

            <div className="mb-3 d-flex justify-content-between align-items-center">
                <span className="text-secondary fw-bold">{vendors.length} vendors found</span>
                <select className="form-select form-select-sm w-auto bg-light border-0 shadow-sm text-secondary">
                    <option>Sort by Match Score</option>
                    <option>Sort by Name A-Z</option>
                </select>
            </div>

            {loading ? (
                <Loader />
            ) : (
                <div className="row g-4 mt-2">
                    {vendors.map(vendor => (
                        <div className="col-md-6 col-lg-4" key={vendor.id}>
                            <VendorCard vendor={vendor} />
                        </div>
                    ))}
                    {vendors.length === 0 && (
                        <div className="col-12 text-center py-5 text-secondary">
                            No vendors matching your criteria were found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
export default VendorSearch;
