import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { msalApp, loginRequest } from "./services/authConfig";
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
const VendorSubmitPage = lazy(() => import('./pages/VendorSubmit/VendorSubmitPage'));

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Handle the redirect callback first
    msalApp.handleRedirectCallback((error, response) => {
      if (error) {
        console.error("Auth redirect error:", error);
      }
      if (response) {
        setIsAuthenticated(!!msalApp.getAccount());
      }
    });

    // Check if we are already logged in
    const account = msalApp.getAccount();
    if (account) {
      setIsAuthenticated(true);
      setLoading(false);
    } else {
      // Trigger login if no account is found
      msalApp.loginRedirect(loginRequest);
    }
  }, []);

  if (loading && !isAuthenticated) {
    return <Loader />;
  }

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
            <Route path="comparison">
              <Route index element={<VendorComparison />} />
              <Route path=":rfqId" element={<VendorComparison />} />
            </Route>
            <Route path="scorecard" element={<Scorecard />} />
          </Route>
          <Route path="/vendor-submit/:rfqId/:vendorId" element={<VendorSubmitPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
