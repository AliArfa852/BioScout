import React from "react";

const teamMembers = [
  {
    name: "Shitba",
    id: "i212676",
    image: "S.jpg",
  },
  {
    name: "Manahil",
    id: "i212668",
    image: "M.jpg", 
  },
  {
    name: "Ali",
    id: "i212669",
    image: "A.jpg",
  },
];

export default function AboutUs() {
  return (
    <section
      aria-label="About Us"
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "20px",
        backgroundColor: "#f5f9f5",
        borderRadius: "12px",
        boxShadow: "0 6px 12px rgba(0,0,0,0.1)",
        color: "#2E7D32",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "30px" }}>
        About Us
      </h2>

      <p style={{ fontSize: "1.1rem", lineHeight: "1.6", textAlign: "center", maxWidth: "700px", margin: "0 auto 40px" }}>
        We are three passionate students from FAST NUCES Islamabad pursuing Bachelor of Science in Data Science.
        Our goal with <strong>BioScout Islamabad</strong> is to empower communities through technology and AI, helping protect the rich biodiversity of Islamabad and surrounding regions.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "30px",
          flexWrap: "wrap",
        }}
      >
        {teamMembers.map(({ name, id, image }) => (
          <div
            key={id}
            style={{
              backgroundColor: "#e7f1e7",
              borderRadius: "10px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              padding: "20px",
              maxWidth: "200px",
              textAlign: "center",
              transition: "transform 0.3s ease",
              cursor: "default",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <img
              src={image}
              alt={`${name}'s portrait`}
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                objectFit: "cover",
                marginBottom: "15px",
                boxShadow: "0 3px 7px rgba(0,0,0,0.15)",
              }}
            />
            <h3 style={{ margin: "0 0 5px" }}>{name}</h3>
            <p style={{ margin: 0, color: "#496D49", fontWeight: "600" }}>{id}</p>
          </div>
        ))}
      </div>

      <section
        style={{
          marginTop: "50px",
          backgroundColor: "#d0e8d0",
          padding: "25px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(46, 125, 50, 0.2)",
          color: "#1b5e20",
          fontWeight: "600",
          fontSize: "1.1rem",
          maxWidth: "700px",
          marginLeft: "auto",
          marginRight: "auto",
          textAlign: "center",
        }}
      >
        <p>
          Our project stands out by combining AI-powered species identification, an interactive community observation hub, and an intelligent Q&A system to empower local biodiversity conservation. With data-driven insights and a user-friendly design, we strive to make environmental stewardship accessible to everyone.
        </p>
      </section>
    </section>
  );
}
