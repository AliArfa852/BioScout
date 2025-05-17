import React, { useState, useEffect, useRef } from "react";
import { SectionContainer, Button, Card, Badge, LoadingSpinner } from "../components/common/UIComponents";

export default function ImageClassifierPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [classificationType, setClassificationType] = useState("plant");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recentClassifications, setRecentClassifications] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Load recent classifications from localStorage
  useEffect(() => {
    const savedClassifications = localStorage.getItem("bioscoutRecentClassifications");
    if (savedClassifications) {
      setRecentClassifications(JSON.parse(savedClassifications));
    }
  }, []);
  
  // Save classifications to localStorage when they change
  useEffect(() => {
    localStorage.setItem("bioscoutRecentClassifications", JSON.stringify(recentClassifications));
  }, [recentClassifications]);
  
  // Clean up camera resources when component unmounts
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Handle file selection and create image preview
  const handleFileChange = (e) => {
    setResult(null);
    setError(null);
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processSelectedFile(file);
    }
  };
  
  // Process the selected file
  const processSelectedFile = (file) => {
    if (!file) return;
    
    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/heic'];
    if (!validImageTypes.includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, WEBP, HEIC)");
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10MB");
      return;
    }
    
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // Handle classification type change
  const handleClassificationChange = (e) => {
    setClassificationType(e.target.value);
    setResult(null);
    setError(null);
  };

  // Handle drag and drop functionality
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // Handle camera functionality
  const startCamera = async () => {
    setCameraActive(true);
    setResult(null);
    setError(null);
    setPreviewUrl(null);
    setSelectedFile(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Failed to access camera. Please check permissions.");
      setCameraActive(false);
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) {
        setError("Failed to capture image. Please try again.");
        return;
      }
      
      // Create file from blob
      const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(blob));
      
      // Stop camera
      stopCamera();
    }, "image/jpeg", 0.9);
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  // Handle form submission to backend for classification
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedFile) {
      setError("Please select an image to classify.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("classification_type", classificationType);

    try {
      const response = await fetch("http://localhost:5000/api/classify-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to classify image.");
      }

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setResult(null);
      } else {
        setResult(data);
        
        // Add to recent classifications
        const newClassification = {
          id: Date.now(),
          previewUrl: previewUrl,
          species_name: data.species_name,
          common_name: data.common_name || "Unknown",
          confidence: data.confidence,
          classification_type: classificationType,
          timestamp: new Date().toISOString()
        };
        
        setRecentClassifications(prev => [newClassification, ...prev.slice(0, 4)]); // Keep most recent 5
      }
    } catch (err) {
      console.error("Classification error:", err);
      setError(err.message || "An error occurred while classifying the image.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle submitting the classification as an observation
  const handleSubmitAsObservation = () => {
    if (!result || !result.species_name) return;
    
    // Navigate to submit observation page with pre-filled data
    const params = new URLSearchParams({
      species_name: result.species_name,
      common_name: result.common_name || "",
      image_url: previewUrl || ""
    });
    
    window.location.href = `/submit?${params.toString()}`;
  };

  // Format confidence score for display
  const formatConfidence = (confidence) => {
    if (confidence === undefined || confidence === null) return "N/A";
    return (confidence * 100).toFixed(1) + "%";
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="classifier-page">
      <div className="classifier-header">
        <h1>AI Species Identifier</h1>
        <p className="classifier-subtitle">
          Upload an image or take a photo to identify plants and animals in Islamabad
        </p>
      </div>
      
      <div className="classifier-container">
        <SectionContainer className="upload-section">
          <form onSubmit={handleSubmit} onDragEnter={handleDrag}>
            {/* Classification Type Selection */}
            <div className="classification-types">
              <h3>What are you trying to identify?</h3>
              <div className="radio-group">
                <label className={`radio-button ${classificationType === "plant" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="classification_type"
                    value="plant"
                    checked={classificationType === "plant"}
                    onChange={handleClassificationChange}
                  />
                  <span className="radio-icon">🌿</span>
                  <span className="radio-label">Plant</span>
                </label>
                
                <label className={`radio-button ${classificationType === "animal" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="classification_type"
                    value="animal"
                    checked={classificationType === "animal"}
                    onChange={handleClassificationChange}
                  />
                  <span className="radio-icon">🦋</span>
                  <span className="radio-label">Animal</span>
                </label>
                
                <label className={`radio-button ${classificationType === "fungi" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="classification_type"
                    value="fungi"
                    checked={classificationType === "fungi"}
                    onChange={handleClassificationChange}
                  />
                  <span className="radio-icon">🍄</span>
                  <span className="radio-label">Fungi</span>
                </label>
              </div>
            </div>
            
            {/* Image Upload Area */}
            {!cameraActive && (
              <div 
                className={`upload-area ${dragActive ? "active" : ""}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                
                <div className="upload-content">
                  <div className="upload-icon">📷</div>
                  <h3>{dragActive ? "Drop image here" : "Drag and drop an image"}</h3>
                  <p>or</p>
                  <div className="upload-buttons">
                    <Button 
                      type="secondary" 
                      onClick={() => fileInputRef.current.click()}
                    >
                      Browse Files
                    </Button>
                    <Button 
                      type="secondary" 
                      onClick={startCamera}
                    >
                      Take Photo
                    </Button>
                  </div>
                  <p className="upload-hint">
                    For best results, use a clear, well-lit photo focused on a single species
                  </p>
                </div>
              </div>
            )}
            
            {/* Camera Capture UI */}
            {cameraActive && (
              <div className="camera-container">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="camera-preview"
                />
                
                <div className="camera-controls">
                  <Button 
                    onClick={takePhoto}
                    type="primary"
                  >
                    Capture Photo
                  </Button>
                  <Button 
                    onClick={stopCamera}
                    type="secondary"
                  >
                    Cancel
                  </Button>
                </div>
                
                <canvas ref={canvasRef} style={{ display: "none" }} />
              </div>
            )}
            
            {/* Error Message */}
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            {/* Image Preview */}
            {previewUrl && !cameraActive && (
              <div className="preview-container">
                <h3>Selected Image</h3>
                <div className="image-preview">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="preview-image"
                  />
                  <div className="preview-actions">
                    <Button 
                      type="secondary" 
                      size="small"
                      onClick={() => {
                        setPreviewUrl(null);
                        setSelectedFile(null);
                        setResult(null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
                
                <div className="classify-button-container">
                  <Button 
                    type="primary" 
                    onClick={handleSubmit}
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? <LoadingSpinner size="small" /> : "Identify Species"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </SectionContainer>
        
        {/* Classification Result */}
        {result && (
          <SectionContainer className="result-section">
            <div className="result-header">
              <h2>Identification Result</h2>
              <Badge type="success">AI Classification</Badge>
            </div>
            
            <div className="result-content">
              <div className="result-image">
                <img src={previewUrl} alt="Classified Species" />
              </div>
              
              <div className="result-details">
                <div className="result-item">
                  <h3>{result.common_name || "Unknown Common Name"}</h3>
                  <p className="scientific-name">{result.species_name || "Unknown Species"}</p>
                </div>
                
                <div className="result-item">
                  <div className="confidence-meter">
                    <div className="confidence-label">
                      <span>Confidence</span>
                      <span className="confidence-value">{formatConfidence(result.confidence)}</span>
                    </div>
                    <div className="confidence-bar-container">
                      <div 
                        className="confidence-bar" 
                        style={{ 
                          width: `${Math.min((result.confidence || 0) * 100, 100)}%`,
                          backgroundColor: 
                            (result.confidence || 0) > 0.8 ? "#2e7d32" : 
                            (result.confidence || 0) > 0.6 ? "#689f38" :
                            (result.confidence || 0) > 0.4 ? "#fbc02d" : "#f57c00"
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {result.explanation && (
                  <div className="result-item">
                    <h4>Classification Notes</h4>
                    <p className="result-explanation">{result.explanation}</p>
                  </div>
                )}
                
                <div className="result-actions">
                  <Button 
                    type="primary"
                    onClick={handleSubmitAsObservation}
                  >
                    Submit as Observation
                  </Button>
                  <Button 
                    type="secondary"
                    onClick={() => {
                      setPreviewUrl(null);
                      setSelectedFile(null);
                      setResult(null);
                    }}
                  >
                    Identify Another
                  </Button>
                </div>
              </div>
            </div>
          </SectionContainer>
        )}
      </div>
      
      {/* Recent Classifications */}
      {recentClassifications.length > 0 && (
        <SectionContainer className="recent-classifications">
          <h3>Recent Identifications</h3>
          <div className="recent-grid">
            {recentClassifications.map((item) => (
              <Card key={item.id} className="recent-classification-card">
                <div className="recent-image">
                  <img src={item.previewUrl} alt={item.species_name || "Species"} />
                  <div className="recent-type">
                    <Badge type={
                      item.classification_type === "plant" ? "success" :
                      item.classification_type === "animal" ? "info" : "warning"
                    }>
                      {item.classification_type.charAt(0).toUpperCase() + item.classification_type.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div className="recent-details">
                  <h4>{item.common_name || "Unknown"}</h4>
                  <p className="recent-scientific">{item.species_name || "Unknown species"}</p>
                  <div className="recent-confidence">
                    <span>Confidence: {formatConfidence(item.confidence)}</span>
                  </div>
                  <div className="recent-timestamp">
                    {formatTimestamp(item.timestamp)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </SectionContainer>
      )}
      
      {/* Classification Guidelines */}
      <SectionContainer className="guidelines-section">
        <h3>Guidelines for Best Results</h3>
        <div className="guidelines-grid">
          <div className="guideline-card">
            <div className="guideline-icon">📸</div>
            <h4>Clear, Close-Up Photos</h4>
            <p>Take clear, well-lit photos where the species fills most of the frame.</p>
          </div>
          
          <div className="guideline-card">
            <div className="guideline-icon">🔎</div>
            <h4>Focus on Key Features</h4>
            <p>For plants, include leaves, flowers, and stems. For animals, capture distinctive features.</p>
          </div>
          
          <div className="guideline-card">
            <div className="guideline-icon">🌤️</div>
            <h4>Good Lighting</h4>
            <p>Natural daylight provides the best results. Avoid harsh shadows or overexposure.</p>
          </div>
          
          <div className="guideline-card">
            <div className="guideline-icon">⚠️</div>
            <h4>Limitations</h4>
            <p>Our AI works best with species native to Islamabad. Accuracy may vary for non-native species.</p>
          </div>
        </div>
      </SectionContainer>
    </div>
  );
}