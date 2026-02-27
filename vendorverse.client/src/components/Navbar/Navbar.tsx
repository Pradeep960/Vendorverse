import React from 'react';
import { FiSearch, FiBell, FiSettings } from 'react-icons/fi';
import styles from './Navbar.module.scss';

const Navbar: React.FC = () => {
    return (
        <header className={styles.navbar}>
            <div className={styles.searchBar}>
                <FiSearch className={styles.searchIcon} />
                <input type="text" placeholder="Search across documents, vendors, etc..." />
            </div>

            <div className={styles.profileSection}>
                <button className={styles.iconBtn}>
                    <FiBell />
                </button>
                <button className={styles.iconBtn}>
                    <FiSettings />
                </button>
                <div className={styles.avatar}>A</div>
            </div>
        </header>
    );
};

export default Navbar;
