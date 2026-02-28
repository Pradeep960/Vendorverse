import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card/Card';
import Loader from '../../components/Loader/Loader';
import RequestQuoteModal from '../../components/RequestQuoteModal/RequestQuoteModal';
import VendorModal from '../../components/VendorModal/VendorModal';
import { FiPlus, FiTrash2, FiBarChart2, FiX, FiFileText, FiSearch, FiEdit2 } from 'react-icons/fi';
import { getVendors, deleteVendors } from '../../services/apiService';
import type { Vendor } from '../../models/Vendor';
import styles from './Vendors.module.scss';

const Vendors: React.FC = () => {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [showVendorModal, setShowVendorModal] = useState(false);
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const fetchVendors = useCallback(() => {
        setLoading(true);
        getVendors().then(data => {
            setVendors(data);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        fetchVendors();
    }, [fetchVendors]);

    // Toggle a single vendor selection
    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    // Select / deselect all (operates on filtered list)
    const toggleSelectAll = useCallback(() => {
        setSelectedIds(prev => {
            const filteredIds = vendors.filter(v => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                return v.name.toLowerCase().includes(q) ||
                    v.category.toLowerCase().includes(q) ||
                    v.location.toLowerCase().includes(q) ||
                    v.email.toLowerCase().includes(q);
            }).map(v => v.id);
            if (prev.size === filteredIds.length) {
                return new Set();
            }
            return new Set(filteredIds);
        });
    }, [vendors, searchQuery]);

    // Clear selection
    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    // Delete selected vendors
    const handleDeleteSelected = useCallback(async () => {
        if (window.confirm(`Are you sure you want to delete ${selectedIds.size} vendor(s)?`)) {
            await deleteVendors(Array.from(selectedIds));
            setSelectedIds(new Set());
            fetchVendors();
        }
    }, [selectedIds, fetchVendors]);

    // Compare selected vendors — navigate to comparison page
    const compareSelected = useCallback(() => {
        const ids = Array.from(selectedIds).join(',');
        navigate(`/comparison?vendors=${ids}`);
    }, [selectedIds, navigate]);

    // Edit selected vendor
    const handleEditVendor = useCallback(() => {
        if (selectedIds.size === 1) {
            const id = Array.from(selectedIds)[0];
            const vendor = vendors.find(v => v.id === id);
            if (vendor) {
                setEditingVendor(vendor);
                setShowVendorModal(true);
            }
        }
    }, [selectedIds, vendors]);

    const handleAddVendor = () => {
        setEditingVendor(null);
        setShowVendorModal(true);
    };

    // Filter vendors based on search query
    const filteredVendors = useMemo(() => {
        if (!searchQuery.trim()) return vendors;
        const q = searchQuery.toLowerCase();
        return vendors.filter(v =>
            v.name.toLowerCase().includes(q) ||
            v.category.toLowerCase().includes(q) ||
            v.location.toLowerCase().includes(q) ||
            v.email.toLowerCase().includes(q)
        );
    }, [vendors, searchQuery]);

    if (loading) return <Loader />;

    const allSelected = filteredVendors.length > 0 && selectedIds.size === filteredVendors.length;
    const someSelected = selectedIds.size > 0 && selectedIds.size < filteredVendors.length;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold text-dark">Vendor Management</h3>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-outline-primary d-flex align-items-center"
                        onClick={() => setShowQuoteModal(true)}
                        disabled={selectedIds.size === 0}
                        title={selectedIds.size === 0 ? "Select vendors from the list first" : "Request quotes from selected vendors"}
                    >
                        <FiFileText className="me-2" /> Request Quote
                    </button>
                    <button
                        className="btn btn-primary d-flex align-items-center"
                        onClick={handleAddVendor}
                    >
                        <FiPlus className="me-2" /> Add Vendor
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <Card className="p-3 mb-3">
                <div className={styles.searchWrapper}>
                    <FiSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search vendors by name, category, location, or email..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            className={styles.searchClear}
                            onClick={() => setSearchQuery('')}
                            title="Clear search"
                        >
                            <FiX />
                        </button>
                    )}
                </div>
            </Card>

            <Card className="p-4">
                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th className={styles.checkboxCell}>
                                    <input
                                        type="checkbox"
                                        className={styles.customCheckbox}
                                        checked={allSelected}
                                        ref={el => {
                                            if (el) el.indeterminate = someSelected;
                                        }}
                                        onChange={toggleSelectAll}
                                        title="Select all vendors"
                                    />
                                </th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Location</th>
                                <th>Contact</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVendors.map(vendor => {
                                const isSelected = selectedIds.has(vendor.id);
                                return (
                                    <tr
                                        key={vendor.id}
                                        className={`${styles.clickableRow} ${isSelected ? styles.selectedRow : ''}`}
                                        onClick={() => toggleSelect(vendor.id)}
                                    >
                                        <td className={styles.checkboxCell} onClick={e => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                className={styles.customCheckbox}
                                                checked={isSelected}
                                                onChange={() => toggleSelect(vendor.id)}
                                            />
                                        </td>
                                        <td className="fw-bold text-dark">{vendor.name}</td>
                                        <td><span className="badge bg-light text-primary border">{vendor.category}</span></td>
                                        <td className="text-secondary">{vendor.location}</td>
                                        <td className="text-secondary">
                                            <div>{vendor.email}</div>
                                            <small>{vendor.phone}</small>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredVendors.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-4 text-secondary">
                                        {searchQuery ? `No vendors match "${searchQuery}"` : 'No vendors found.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Floating Action Bar */}
            {selectedIds.size > 0 && (
                <div className={styles.actionBarWrapper}>
                    <div className={styles.actionBar}>
                        <span className={styles.selectedCount}>
                            {selectedIds.size} vendor{selectedIds.size > 1 ? 's' : ''} selected
                        </span>

                        <button
                            className={`${styles.actionBtn} ${styles.editBtn}`}
                            onClick={handleEditVendor}
                            disabled={selectedIds.size !== 1}
                            title={selectedIds.size !== 1 ? 'Select exactly 1 vendor to edit' : 'Edit selected vendor'}
                        >
                            <FiEdit2 /> Edit
                        </button>

                        {selectedIds.size >= 2 && (
                            <button
                                className={`${styles.actionBtn} ${styles.compareBtn}`}
                                onClick={compareSelected}
                                title="Compare selected vendors"
                            >
                                <FiBarChart2 /> Compare
                            </button>
                        )}

                        <button
                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                            onClick={handleDeleteSelected}
                        >
                            <FiTrash2 /> Delete
                        </button>

                        <button
                            className={`${styles.actionBtn} ${styles.clearBtn}`}
                            onClick={clearSelection}
                        >
                            <FiX /> Clear
                        </button>
                    </div>
                </div>
            )}

            {/* Request Quote Modal */}
            <RequestQuoteModal
                show={showQuoteModal}
                onClose={() => setShowQuoteModal(false)}
                selectedVendors={vendors.filter(v => selectedIds.has(v.id))}
            />

            {/* Vendor Add/Edit Modal */}
            <VendorModal
                show={showVendorModal}
                editingVendor={editingVendor}
                onClose={() => setShowVendorModal(false)}
                onSuccess={fetchVendors}
            />
        </div>
    );
};

export default Vendors;
