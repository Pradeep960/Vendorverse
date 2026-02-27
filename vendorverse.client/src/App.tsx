import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Loader from './components/Loader/Loader';
import './styles/global.scss';

// Lazy loaded pages
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Vendors = lazy(() => import('./pages/Vendors/Vendors'));
const VendorSearch = lazy(() => import('./pages/VendorSearch/VendorSearch'));
const RFQManagement = lazy(() => import('./pages/RFQ/RFQManagement'));
const QuotesAnalysis = lazy(() => import('./pages/Quotes/QuotesAnalysis'));
const VendorComparison = lazy(() => import('./pages/Comparison/VendorComparison'));
const Scorecard = lazy(() => import('./pages/Scorecard/Scorecard'));

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="vendors" element={<Vendors />} />
            <Route path="vendor-search" element={<VendorSearch />} />
            <Route path="rfq" element={<RFQManagement />} />
            <Route path="quotes" element={<QuotesAnalysis />} />
            <Route path="comparison" element={<VendorComparison />} />
            <Route path="scorecard" element={<Scorecard />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
