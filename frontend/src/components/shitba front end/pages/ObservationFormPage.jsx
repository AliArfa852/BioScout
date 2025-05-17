import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, SectionContainer, Card, Badge } from "../components/common/UIComponents";

export default function ObservationFormPage({ onSubmit }) {
  const navigate = useNavigate();
  
  const [formStep, setFormStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Define and initialize form state
  const [form, setForm] = useState({
    species_name: "",
    common_name: "",
    date_observed: new Date().toISOString().split("T")[0], // Today's date as default
    location: "",
    notes: "",
    observer: localStorage.getItem("observerName") || "", // Remember previous observer
    image: null,
    image_url: "",
  });

  // Known locations in Islamabad for suggestions
  const locationSuggestions = [
    "Margalla Hills",
    "Rawal Lake",
    "Shakarparian",
    "Pir Sohawa",
    "Daman-e-Koh",
    "Islamabad University Forest Area",
    "Faisal Mosque",
    "Rawal Dam",
    "Saidpur Village",
    "Shah Allah Ditta Caves",
    "Zoo vicinity"
  ];

  // Filter location suggestions based on user input
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  // Handle form field changes
  function handleChange(e) {
    const { name, value, files } = e.target;
    
    if (name === "image" && files.length > 0) {
      // Handle image file upload
      setForm({ 
        ...form, 
        image: files[0], 
        image_url: "" 
      });
      setImagePreview(URL.createObjectURL(files[0]));
    } else if (name === "location") {
      // Handle location field with suggestions
      setForm({ ...form, [name]: value });
      
      // Filter location suggestions
      const filtered = locationSuggestions.filter(loc => 
        loc.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredLocations(filtered);
      setShowLocationSuggestions(value.length > 0 && filtered.length > 0);
    } else if (name === "observer") {
      // Save observer name to localStorage for future use
      localStorage.setItem("observerName", value);
      setForm({ ...form, [name]: value });
    } else {
      // Handle other form fields
      setForm({ ...form, [name]: value });
      
      // Handle image URL changes
      if (name === "image_url") {
        setForm(prev => ({ ...prev, image: null }));
        setImagePreview(value);
      }
    }
  }

  // Select a location from suggestions
  function selectLocation(location) {
    setForm({ ...form, location });
    setShowLocationSuggestions(false);
  }

  // Validate form for each step
  function validateStep(step) {
    switch (step) {
      case 1:
        return form.species_name.trim() && form.common_name.trim();
      case 2:
        return form.date_observed && form.location.trim();
      case 3:
        return true; // Optional notes and observer
      default:
        return true;
    }
  }

  // Handle step navigation
  function handleNextStep() {
    if (validateStep(formStep)) {
      setFormStep(formStep + 1);
    } else {
      setError("Please fill in all required fields.");
    }
  }

  function handlePrevStep() {
    setFormStep(formStep - 1);
    setError(null);
  }

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateStep(1) || !validateStep(2)) {
      setError("Please fill all required fields.");
      setFormStep(1); // Return to first step to fix errors
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const result = await onSubmit(form);
      
      if (result.success) {
        setSuccess(true);
        // Reset form after successful submission
        setForm({
          species_name: "",
          common_name: "",
          date_observed: new Date().toISOString().split("T")[0],
          location: "",
          notes: "",
          observer: localStorage.getItem("observerName") || "",
          image: null,
          image_url: "",
        });
        setImagePreview(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message || "An error occurred while submitting the observation.");
    } finally {
      setSubmitting(false);
    }
  }

  // Handle submission success
  function handleViewObservations() {
    navigate("/observations");
  }

  function handleNewSubmission() {
    setFormStep(1);
    setSuccess(false);
  }

  // Render form based on current step
  function renderFormStep() {
    switch (formStep) {
      case 1:
        return (
          <div className="form-step">
            <h3>Step 1: Species Information</h3>
            
            <div className="form-group">
              <label htmlFor="species_name">Scientific Name* <Badge type="info">Required</Badge></label>
              <input
                id="species_name"
                name="species_name"
                placeholder="e.g. Pinus roxburghii"
                value={form.species_name}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="common_name">Common Name* <Badge type="info">Required</Badge></label>
              <input
                id="common_name"
                name="common_name"
                placeholder="e.g. Chir Pine"
                value={form.common_name}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>
            
            <div className="form-actions">
              <Button 
                onClick={handleNextStep}
                disabled={!validateStep(1)}
              >
                Next: Location & Date
              </Button>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="form-step">
            <h3>Step 2: Location & Date</h3>
            
            <div className="form-group">
              <label htmlFor="date_observed">Date Observed* <Badge type="info">Required</Badge></label>
              <input
                id="date_observed"
                type="date"
                name="date_observed"
                value={form.date_observed}
                onChange={handleChange}
                max={new Date().toISOString().split("T")[0]} // Prevent future dates
                required
                className="form-control"
              />
            </div>
            
            <div className="form-group location-group">
              <label htmlFor="location">Location* <Badge type="info">Required</Badge></label>
              <input
                id="location"
                name="location"
                placeholder="e.g. Margalla Hills"
                value={form.location}
                onChange={handleChange}
                onFocus={() => setShowLocationSuggestions(true)}
                required
                className="form-control"
              />
              
              {showLocationSuggestions && (
                <div className="location-suggestions">
                  {filteredLocations.map((location, index) => (
                    <div 
                      key={index}
                      className="location-suggestion-item"
                      onClick={() => selectLocation(location)}
                    >
                      {location}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="form-actions">
              <Button 
                type="secondary"
                onClick={handlePrevStep}
              >
                Back
              </Button>
              <Button 
                onClick={handleNextStep}
                disabled={!validateStep(2)}
              >
                Next: Additional Details
              </Button>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="form-step">
            <h3>Step 3: Additional Details</h3>
            
            <div className="form-group">
              <label htmlFor="observer">Observer Name</label>
              <input
                id="observer"
                name="observer"
                placeholder="Your Name (Optional)"
                value={form.observer}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                placeholder="Additional observations or details"
                value={form.notes}
                onChange={handleChange}
                rows={4}
                className="form-control"
              />
            </div>
            
            <div className="form-actions">
              <Button 
                type="secondary"
                onClick={handlePrevStep}
              >
                Back
              </Button>
              <Button 
                onClick={handleNextStep}
              >
                Next: Upload Image
              </Button>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="form-step">
            <h3>Step 4: Upload Image (Optional)</h3>
            
            <div className="form-group">
              <label htmlFor="image" className="upload-label">
                <div className="upload-area">
                  <div className="upload-icon">📷</div>
                  <div>Click to browse or drop an image file here</div>
                </div>
              </label>
              <input
                id="image"
                type="file"
                accept="image/*"
                name="image"
                onChange={handleChange}
                style={{ display: "none" }}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="image_url">Or Provide Image URL</label>
              <input
                id="image_url"
                name="image_url"
                placeholder="https://example.com/image.jpg"
                value={form.image_url}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            
            {imagePreview && (
              <div className="image-preview-container">
                <h4>Image Preview</h4>
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="image-preview"
                />
                <Button 
                  type="secondary" 
                  size="small"
                  onClick={() => {
                    setImagePreview(null);
                    setForm({ ...form, image: null, image_url: "" });
                  }}
                >
                  Remove Image
                </Button>
              </div>
            )}
            
            <div className="form-actions">
              <Button 
                type="secondary"
                onClick={handlePrevStep}
              >
                Back
              </Button>
              <Button 
                type="primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Observation"}
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  }

  // Show success screen after form submission
  if (success) {
    return (
      <div className="form-success">
        <div className="success-icon">✓</div>
        <h2>Observation Submitted!</h2>
        <p>Thank you for contributing to BioScout Islamabad's biodiversity database.</p>
        <div className="success-actions">
          <Button onClick={handleViewObservations}>
            View All Observations
          </Button>
          <Button type="secondary" onClick={handleNewSubmission}>
            Submit Another Observation
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="observation-form-page">
      <SectionContainer title="Submit Biodiversity Observation">
        <div className="form-progress">
          {[1, 2, 3, 4].map((step) => (
            <div 
              key={step}
              className={`progress-step ${formStep === step ? 'active' : ''} ${formStep > step ? 'completed' : ''}`}
              onClick={() => formStep > step ? setFormStep(step) : null}
            >
              {formStep > step ? '✓' : step}
            </div>
          ))}
        </div>
        
        {error && (
          <div className="form-error">
            {error}
          </div>
        )}
        
        <form onSubmit={(e) => e.preventDefault()}>
          {renderFormStep()}
        </form>
      </SectionContainer>
    </div>
  );
}