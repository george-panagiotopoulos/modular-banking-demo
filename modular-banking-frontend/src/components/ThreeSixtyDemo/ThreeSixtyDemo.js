import React, { useState, useEffect, useRef } from 'react';
import MobileApp from '../MobileApp/MobileApp';
import APIViewer from '../APIViewer';
import EventStream from '../EventStream';
import './ThreeSixtyDemo.css';

// Custom APIViewer that syncs with Mobile App
const DepositsAPIViewer = ({ onApiCall }) => {
  // This is a custom wrapper for the APIViewer component that preselects the "deposits" service
  // and notifies parent component when an API call is made
  
  const handleApiCall = (apiCallData) => {
    // This function will be called when an API call is made
    console.log('API call detected in DepositsAPIViewer wrapper:', apiCallData);
    if (onApiCall) {
      onApiCall(apiCallData);
    }
  };
  
  return (
    <div className="deposits-api-viewer">
      <h3 className="section-title">
        <span className="section-icon">🔧</span>
        Deposits APIs
      </h3>
      <div className="deposits-api-viewer-content">
        <APIViewer initialService="deposits" onApiCall={handleApiCall} />
      </div>
    </div>
  );
};

// Full EventStream that shows all components
const FullEventStream = () => {
  return (
    <div className="full-event-stream">
      <h3 className="section-title">
        <span className="section-icon">🚀</span>
        Event Streams - All Components
      </h3>
      <div className="full-event-stream-content">
        <EventStream />
      </div>
    </div>
  );
};

const ThreeSixtyDemo = () => {
  const [loading, setLoading] = useState(true);
  const [apiCallTimestamp, setApiCallTimestamp] = useState(null);
  const [syncedPartyId, setSyncedPartyId] = useState('2517636814'); // Default party ID
  const mobileAppRef = useRef(null);

  // Simulate a loading state for a smoother experience
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle API calls from the Deposits API Viewer
  const handleApiCall = (apiCallData) => {
    console.log('API call in ThreeSixtyDemo:', apiCallData);
    console.log('API call partyId:', apiCallData.partyId);
    
    // Update timestamp to trigger effects
    setApiCallTimestamp(Date.now());
    
    // If the API call has partyId, use it to refresh MobileApp
    if (apiCallData.partyId) {
      console.log(`API call includes partyId: ${apiCallData.partyId}`);
      
      // Store the new partyId in state
      setSyncedPartyId(apiCallData.partyId);
      
      // If the API call is related to accounts or transactions, refresh the mobile app
      if (mobileAppRef.current) {
        console.log('Refreshing Mobile App data with new partyId...');
        
        // Set the partyId and refresh
        if (mobileAppRef.current.setPartyId) {
          mobileAppRef.current.setPartyId(apiCallData.partyId);
        }
        
        if (mobileAppRef.current.loadInitialData) {
          setTimeout(() => {
            mobileAppRef.current.loadInitialData();
          }, 100); // Short delay to ensure partyId is set
        }
      }
    } else {
      // If no partyId in API call, just refresh with current partyId
      console.log('No partyId in API call, refreshing with current ID');
      if (mobileAppRef.current && mobileAppRef.current.loadInitialData) {
        mobileAppRef.current.loadInitialData();
      }
    }
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="threesixty-loading">
      <div className="spinner"></div>
      <p>Loading 360° Technical/Functional Demo View...</p>
    </div>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="threesixty-demo-container" data-testid="threesixty-demo-container">
      <div className="threesixty-demo-header">
        <h2>
          <span className="header-icon">🔄</span>
          360° Technical/Functional Demo View
        </h2>
        <p className="header-description">
          Complete integrated view combining customer experience with technical API access and real-time event monitoring
        </p>
        <div className="party-id-display">
          Current Party ID: <strong>{syncedPartyId}</strong>
        </div>
      </div>

      <div className="threesixty-demo-content">
        {/* Row 1: Two columns layout */}
        <div className="threesixty-top-row">
          {/* Left Column - Mobile App */}
          <div className="threesixty-left-column">
            <div className="threesixty-mobile-container">
              <h3 className="section-title">
                <span className="section-icon">📱</span>
                Mobile Banking
              </h3>
              <div className="mobile-app-scroll-container">
                <MobileApp 
                  ref={mobileAppRef} 
                  key={`mobile-app-${apiCallTimestamp}-${syncedPartyId}`} 
                  initialPartyId={syncedPartyId}
                />
              </div>
            </div>
          </div>

          {/* Right Column - APIs */}
          <div className="threesixty-right-column">
            <div className="threesixty-apis-container">
              <DepositsAPIViewer onApiCall={handleApiCall} />
            </div>
          </div>
        </div>

        {/* Row 2: Full width Event Stream */}
        <div className="threesixty-bottom-row">
          <FullEventStream />
        </div>
      </div>
    </div>
  );
};

export default ThreeSixtyDemo; 