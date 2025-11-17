import React from "react";
// import '../styles/SalesScreen.css';

function SalesScreen({user, onLogout}) {
    return(
        <div className="sales-screen">
            <h1>Sales Screen</h1>
            <p>Welcome, {user.name}!</p>
            <button onClick={onLogout}>Logout</button>
        </div>
    );
}

export default SalesScreen;