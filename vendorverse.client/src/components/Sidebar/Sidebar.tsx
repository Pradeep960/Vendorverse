import { NavLink } from 'react-router-dom';
import { FiHome, FiSearch, FiUsers, FiFileText, FiList, FiLayout, FiPieChart, FiMenu } from 'react-icons/fi';
import styles from './Sidebar.module.scss';
import React from 'react';

interface SidebarProps {
    collapsed: boolean;
    toggleSidebar: () => void;
}

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <FiHome /> },
    { path: '/vendors', label: 'Vendors', icon: <FiUsers /> },
    { path: '/vendor-search', label: 'Vendor Search', icon: <FiSearch /> },
    { path: '/rfq', label: 'RFQs', icon: <FiFileText /> },
    { path: '/quotes', label: 'Quotes', icon: <FiList /> },
    { path: '/comparison', label: 'Comparison', icon: <FiLayout /> },
    { path: '/scorecard', label: 'Scorecard', icon: <FiPieChart /> },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, toggleSidebar }) => {
    return (
        <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
            <div className={styles.logoArea}>
                <button onClick={toggleSidebar} className={styles.toggleBtn}>
                    <FiMenu />
                </button>
                <span className={styles.logoText}>Vendorverse</span>
            </div>
            <nav className={styles.navMenu}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
                    >
                        {item.icon}
                        <span className={styles.navLabel}>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
