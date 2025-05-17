import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/common/UIComponents";

export default function NotFoundPage() {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <div className="not-found-icon">🍃</div>
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>
          Looks like you've ventured into unexplored territory! 
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="not-found-actions">
          <Link to="/">
            <Button type="primary">Back to Home</Button>
          </Link>
          <Link to="/map">
            <Button type="secondary">Explore Map</Button>
          </Link>
        </div>
        <div className="not-found-biodiversity-fact">
          <h3>Did You Know?</h3>
          <p>
            The Margalla Hills in Islamabad are home to over 600 plant species, 
            more than 250 bird species, and diverse wildlife including leopards and pangolins.
          </p>
        </div>
      </div>
    </div>
  );
}