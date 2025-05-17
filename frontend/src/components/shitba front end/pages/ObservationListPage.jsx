import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  SectionContainer,
  LoadingSpinner,
  EmptyState,
  Card,
  Button,
  Badge
} from "../components/common/UIComponents";

export default function ObservationListPage({ observations, isLoading }) {
  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterObserver, setFilterObserver] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Derived unique values for filters
  const uniqueLocations = useMemo(() => {
    if (!observations) return [];
    const locations = [...new Set(observations.map(obs => obs.location))];
    return locations.filter(Boolean).sort();
  }, [observations]);

  const uniqueObservers = useMemo(() => {
    if (!observations) return [];
    const observers = [...new Set(observations.map(obs => obs.observer))];
    return observers.filter(Boolean).sort();
  }, [observations]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterLocation, filterObserver, sortBy, sortDirection]);

  // Apply filters and sorting
  const filteredAndSortedObservations = useMemo(() => {
    if (!observations) return [];
    
    // Step 1: Filter observations
    let result = observations.filter(obs => {
      const matchesSearch = searchTerm === "" || 
        obs.species_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obs.common_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (obs.notes && obs.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesLocation = filterLocation === "" || obs.location === filterLocation;
      const matchesObserver = filterObserver === "" || obs.observer === filterObserver;
      
      return matchesSearch && matchesLocation && matchesObserver;
    });
    
    // Step 2: Sort observations
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "date":
          comparison = new Date(a.date_observed) - new Date(b.date_observed);
          break;
        case "species":
          comparison = a.species_name.localeCompare(b.species_name);
          break;
        case "common":
          comparison = a.common_name.localeCompare(b.common_name);
          break;
        case "location":
          comparison = a.location.localeCompare(b.location);
          break;
        case "observer":
          comparison = (a.observer || "").localeCompare(b.observer || "");
          break;
        default:
          comparison = new Date(a.date_observed) - new Date(b.date_observed);
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });
    
    return result;
  }, [observations, searchTerm, filterLocation, filterObserver, sortBy, sortDirection]);

  // Calculate pagination
  const paginatedObservations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedObservations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedObservations, currentPage, itemsPerPage]);
  
  const totalPages = Math.ceil(filteredAndSortedObservations.length / itemsPerPage);
  
  // Handle page navigation
  function goToPage(page) {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Toggle sort direction when clicking the same sort option
  function handleSortChange(newSortBy) {
    if (newSortBy === sortBy) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortDirection("desc"); // Default to descending for new sort field
    }
  }

  // Clear all filters
  function clearFilters() {
    setSearchTerm("");
    setFilterLocation("");
    setFilterObserver("");
    setSortBy("date");
    setSortDirection("desc");
  }

  // Format date for display
  function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }

  if (isLoading) {
    return <LoadingSpinner size="large" message="Loading observations..." />;
  }

  if (!observations || observations.length === 0) {
    return (
      <EmptyState
        title="No Observations Found"
        message="Be the first to submit a biodiversity observation!"
        icon="🔍"
        action={
          <Link to="/submit">
            <Button type="primary">Submit Observation</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="observations-page">
      <div className="observations-header">
        <h1>Biodiversity Observations</h1>
        <p className="observations-count">
          {filteredAndSortedObservations.length} observation{filteredAndSortedObservations.length !== 1 ? "s" : ""}
          {(searchTerm || filterLocation || filterObserver) && 
            <button className="clear-filters" onClick={clearFilters}>Clear Filters</button>
          }
        </p>
      </div>
      
      {/* Filters and Search */}
      <SectionContainer className="filters-container">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by species name or common name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filters-row">
          <div className="filter-group">
            <label>Location:</label>
            <select 
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="filter-select"
            >
              <option value="">All Locations</option>
              {uniqueLocations.map((location, index) => (
                <option key={index} value={location}>{location}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Observer:</label>
            <select 
              value={filterObserver}
              onChange={(e) => setFilterObserver(e.target.value)}
              className="filter-select"
            >
              <option value="">All Observers</option>
              {uniqueObservers.map((observer, index) => (
                <option key={index} value={observer}>{observer}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Sort By:</label>
            <select 
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="filter-select"
            >
              <option value="date">Date {sortBy === "date" && (sortDirection === "asc" ? "↑" : "↓")}</option>
              <option value="species">Scientific Name {sortBy === "species" && (sortDirection === "asc" ? "↑" : "↓")}</option>
              <option value="common">Common Name {sortBy === "common" && (sortDirection === "asc" ? "↑" : "↓")}</option>
              <option value="location">Location {sortBy === "location" && (sortDirection === "asc" ? "↑" : "↓")}</option>
              <option value="observer">Observer {sortBy === "observer" && (sortDirection === "asc" ? "↑" : "↓")}</option>
            </select>
          </div>
          
          <div className="view-toggle">
            <button 
              className={`view-button ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              aria-label="Grid View"
            >
              <span className="button-icon">▦</span>
            </button>
            <button 
              className={`view-button ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              aria-label="List View"
            >
              <span className="button-icon">≡</span>
            </button>
          </div>
        </div>
      </SectionContainer>
      
      {/* Results */}
      {filteredAndSortedObservations.length === 0 ? (
        <EmptyState
          title="No Matching Observations"
          message="Try adjusting your search filters to see more results."
          icon="🔍"
          action={<Button onClick={clearFilters}>Clear All Filters</Button>}
        />
      ) : (
        <>
          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="observations-grid">
              {paginatedObservations.map((obs) => (
                <Card key={obs.observation_id} className="observation-card">
                  {obs.image_url && (
                    <div className="observation-image">
                      <img src={obs.image_url} alt={obs.common_name} />
                    </div>
                  )}
                  <div className="observation-content">
                    <h3 className="observation-title">{obs.common_name}</h3>
                    <p className="observation-scientific">{obs.species_name}</p>
                    <div className="observation-details">
                      <div className="detail-item">
                        <span className="detail-icon">📅</span>
                        <span>{formatDate(obs.date_observed)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">📍</span>
                        <span>{obs.location}</span>
                      </div>
                      {obs.observer && (
                        <div className="detail-item">
                          <span className="detail-icon">👤</span>
                          <span>{obs.observer}</span>
                        </div>
                      )}
                    </div>
                    {obs.notes && <p className="observation-notes">{obs.notes}</p>}
                  </div>
                </Card>
              ))}
            </div>
          )}
          
          {/* List View */}
          {viewMode === "list" && (
            <div className="observations-list">
              <table className="observations-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSortChange("common")}>
                      Common Name {sortBy === "common" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th onClick={() => handleSortChange("species")}>
                      Scientific Name {sortBy === "species" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th onClick={() => handleSortChange("date")}>
                      Date {sortBy === "date" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th onClick={() => handleSortChange("location")}>
                      Location {sortBy === "location" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th onClick={() => handleSortChange("observer")}>
                      Observer {sortBy === "observer" && (sortDirection === "asc" ? "↑" : "↓")}
                    </th>
                    <th>Image</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedObservations.map((obs) => (
                    <tr key={obs.observation_id}>
                      <td>{obs.common_name}</td>
                      <td><i>{obs.species_name}</i></td>
                      <td>{formatDate(obs.date_observed)}</td>
                      <td>{obs.location}</td>
                      <td>{obs.observer || "Anonymous"}</td>
                      <td>
                        {obs.image_url ? (
                          <div className="table-image">
                            <img src={obs.image_url} alt={obs.common_name} />
                          </div>
                        ) : (
                          "No image"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="page-button" 
                disabled={currentPage === 1}
                onClick={() => goToPage(1)}
              >
                «
              </button>
              <button 
                className="page-button" 
                disabled={currentPage === 1}
                onClick={() => goToPage(currentPage - 1)}
              >
                ‹
              </button>
              
              {/* Page numbers */}
              <div className="page-numbers">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  const middle = Math.min(Math.max(currentPage, 3), totalPages - 2);
                  
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = middle - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => goToPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button 
                className="page-button" 
                disabled={currentPage === totalPages}
                onClick={() => goToPage(currentPage + 1)}
              >
                ›
              </button>
              <button 
                className="page-button" 
                disabled={currentPage === totalPages}
                onClick={() => goToPage(totalPages)}
              >
                »
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}