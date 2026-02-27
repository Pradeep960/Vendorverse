import React from 'react';
import type { Vendor } from '../../models/Vendor';
import { FiMapPin, FiAward, FiMail, FiPhone } from 'react-icons/fi';
import ScoreBadge from '../ScoreBadge/ScoreBadge';

interface VendorCardProps {
    vendor: Vendor;
}

const VendorCard: React.FC<VendorCardProps> = ({ vendor }) => {
    return (
        <div className="card card-shadow mb-4 p-4 border-0">
            <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                    <h5 className="fw-bold text-dark mb-1">{vendor.name}</h5>
                    <span className="badge bg-light text-primary border">{vendor.category}</span>
                </div>
                {vendor.matchScore && <ScoreBadge score={vendor.matchScore} />}
            </div>

            <p className="text-secondary small mb-4">{vendor.description}</p>

            <div className="row g-3 small text-secondary">
                <div className="col-12 d-flex align-items-center">
                    <FiMapPin className="me-2 text-primary-custom" />
                    {vendor.location}
                </div>
                <div className="col-12 d-flex align-items-center">
                    <FiAward className="me-2 text-primary-custom" />
                    {vendor.certifications.join(', ')}
                </div>
                <div className="col-12 col-md-6 d-flex align-items-center">
                    <FiMail className="me-2 text-primary-custom" />
                    {vendor.contactEmail}
                </div>
                <div className="col-12 col-md-6 d-flex align-items-center">
                    <FiPhone className="me-2 text-primary-custom" />
                    {vendor.phone}
                </div>
            </div>

            <div className="mt-4 pt-3 border-top d-flex justify-content-end">
                <button className="btn btn-outline-primary btn-sm rounded-pill px-4">View Profile</button>
            </div>
        </div>
    );
};

export default VendorCard;
