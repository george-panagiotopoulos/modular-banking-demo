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
  const [syncedPartyId, setSyncedPartyId] = useState('2517636814'); // Default party ID
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mobileAppRef = useRef(null);
  const refreshTimerRef = useRef(null);

  // Simulate a loading state for a smoother experience
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Cleanup function for timers
  useEffect(() => {
    return () => {
      // Clear any pending timers when component unmounts
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  // Handle API calls from the Deposits API Viewer
  const handleApiCall = (apiCallData) => {
    console.log('API call in ThreeSixtyDemo:', apiCallData);
    
    // Prevent multiple API calls from causing rapid refreshes
    if (isRefreshing) {
      console.log('Already refreshing, ignoring new API call');
      return;
    }
    
    setIsRefreshing(true);
    
    try {
      // If the API call has partyId, use it to refresh MobileApp
      if (apiCallData.partyId) {
        console.log(`API call includes partyId: ${apiCallData.partyId}`);
        
        // Store the new partyId in state
        setSyncedPartyId(apiCallData.partyId);
        
        // If the API call is related to accounts or transactions, refresh the mobile app
        if (mobileAppRef.current) {
          console.log('Refreshing Mobile App data with new partyId...');
          
          // Set the partyId and refresh
          try {
            if (mobileAppRef.current.setPartyId) {
              mobileAppRef.current.setPartyId(apiCallData.partyId);
            }
            
            if (mobileAppRef.current.loadInitialData) {
              // Use a ref for the timer to enable cleanup
              refreshTimerRef.current = setTimeout(() => {
                try {
                  mobileAppRef.current.loadInitialData();
                } catch (err) {
                  console.error('Error refreshing Mobile App:', err);
                } finally {
                  setIsRefreshing(false);
                }
              }, 300); // Longer delay for stability
            } else {
              setIsRefreshing(false);
            }
          } catch (err) {
            console.error('Error in Mobile App refresh:', err);
            setIsRefreshing(false);
          }
        } else {
          setIsRefreshing(false);
        }
      } else {
        // If no partyId in API call, just refresh with current partyId
        console.log('No partyId in API call, refreshing with current ID');
        if (mobileAppRef.current && mobileAppRef.current.loadInitialData) {
          try {
            mobileAppRef.current.loadInitialData();
          } catch (err) {
            console.error('Error refreshing Mobile App:', err);
          }
        }
        setIsRefreshing(false);
      }
    } catch (err) {
      console.error('Error handling API call:', err);
      setIsRefreshing(false);
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
          {isRefreshing && <span className="refresh-indicator"> (refreshing...)</span>}
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