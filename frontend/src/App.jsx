import React, { useEffect, useState } from "react";
import { Authenticator } from "@aws-amplify/ui-react";
import { configureAmplify } from "./amplify/amplifyConfig";
import Dashboard from "./components/Dashboard";
import Loader from "./components/Loader";
import "./styles/App.css";
import "@aws-amplify/ui-react/styles.css";

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await configureAmplify();
        setReady(true);
      } catch (err) {
        console.error("Amplify config error:", err);
        // Show error instead of infinite loading
        setReady(true);
      }
    }
    init();
  }, []);

  if (!ready) return <Loader />;

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="app-container">
          <h1 className="app-title">🚀 Transaction Monitoring System</h1>
          <p className="welcome-text">Welcome, {user?.username}</p>
          <Dashboard />
          <button className="signout-btn" onClick={signOut}>Sign Out</button>
        </div>
      )}
    </Authenticator>
  );
}

export default App;
