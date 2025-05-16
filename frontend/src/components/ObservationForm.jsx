import React, { useState } from "react";

export default function ObservationForm({ onSubmit }) {
  const [form, setForm] = useState({
    species_name: "",
    common_name: "",
    date_observed: "",
    location: "",
    notes: "",
    observer: "",
    image: null,
    image_url: "",
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value, files } = e.target;
    if (name === "image" && files.length > 0) {
      setForm({ ...form, image: files[0], image_url: "" });
      setImagePreview(URL.createObjectURL(files[0]));
    } else {
      setForm({ ...form, [name]: value });
      if (name === "image_url") {
        setForm((prev) => ({ ...prev, image: null }));
        setImagePreview(value);
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (
      !form.species_name.trim() ||
      !form.common_name.trim() ||
      !form.date_observed ||
      !form.location.trim()
    ) {
      alert("Please fill all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(form);
      alert("Observation submitted successfully!");
      setForm({
        species_name: "",
        common_name: "",
        date_observed: "",
        location: "",
        notes: "",
        observer: "",
        image: null,
        image_url: "",
      });
      setImagePreview(null);
    } catch (err) {
      alert("Submission failed: " + err.message || err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-label="Submit Biodiversity Observation" style={{ marginBottom: "20px" }}>
      <h2>Submit Observation</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "10px" }}>
        <input
          name="species_name"
          placeholder="Species Name (scientific)"
          value={form.species_name}
          onChange={handleChange}
          required
          disabled={submitting}
        />
        <input
          name="common_name"
          placeholder="Common Name"
          value={form.common_name}
          onChange={handleChange}
          required
          disabled={submitting}
        />
        <input
          type="date"
          name="date_observed"
          value={form.date_observed}
          onChange={handleChange}
          required
          disabled={submitting}
        />
        <input
          name="location"
          placeholder="Location (e.g. Margalla Hills)"
          value={form.location}
          onChange={handleChange}
          required
          disabled={submitting}
        />
        <input
          name="observer"
          placeholder="Observer Name"
          value={form.observer}
          onChange={handleChange}
          disabled={submitting}
        />
        <textarea
          name="notes"
          placeholder="Notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          disabled={submitting}
        />

        <label htmlFor="image-upload" style={{ cursor: "pointer", color: "#3a5a40", fontWeight: "600" }}>
          Upload Image (optional)
        </label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          name="image"
          onChange={handleChange}
          disabled={submitting}
        />

        <input
          name="image_url"
          placeholder="Or provide image URL"
          value={form.image_url}
          onChange={handleChange}
          disabled={submitting}
        />

        {imagePreview && (
          <img
            src={imagePreview}
            alt="Preview"
            style={{ maxWidth: "150px", borderRadius: "8px", marginBottom: "10px" }}
          />
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Observation"}
        </button>
      </form>
    </section>
  );
}
