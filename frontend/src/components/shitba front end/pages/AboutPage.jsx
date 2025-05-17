import React, { useState } from "react";
import { SectionContainer, Card, Button, Badge } from "../components/common/UIComponents";

// Team member data with expanded information
const teamMembers = [
  {
    name: "Shitba",
    id: "i212676",
    image: "S.jpg",
    role: "AI & Data Science Lead",
    bio: "Specializing in machine learning algorithms and biodiversity data analysis, with a passion for conservation technology.",
    interests: ["Machine Learning", "Conservation", "Data Visualization"],
    github: "github.com/shitba",
  },
  {
    name: "Manahil",
    id: "i212668",
    image: "M.jpg",
    role: "Frontend Developer & UX Designer",
    bio: "Creating intuitive user experiences that connect people with nature through technology.",
    interests: ["UX/UI Design", "Web Development", "Environmental Education"],
    github: "github.com/manahil",
  },
  {
    name: "Ali",
    id: "i212669",
    image: "A.jpg",
    role: "Backend Developer & System Architect",
    bio: "Building robust systems that handle biodiversity data efficiently and securely.",
    interests: ["System Architecture", "API Design", "Ecology"],
    github: "github.com/alidev",
  },
];

// Project milestones
const projectMilestones = [
  {
    date: "January 2025",
    title: "Project Inception",
    description: "Initial concept and research for BioScout Islamabad was developed as part of our university capstone project.",
  },
  {
    date: "February 2025",
    title: "Data Collection Begins",
    description: "Started gathering baseline biodiversity data from existing resources and field surveys.",
  },
  {
    date: "March 2025",
    title: "AI Model Development",
    description: "Trained and fine-tuned our species identification models on local Islamabad flora and fauna.",
  },
  {
    date: "April 2025",
    title: "Beta Testing",
    description: "Limited release to university students and local conservation groups for initial feedback.",
  },
  {
    date: "May 16, 2025",
    title: "Public Launch",
    description: "Official launch of BioScout Islamabad to the public with community observation capabilities.",
  },
];

// Partners and supporters
const partners = [
  {
    name: "FAST NUCES University",
    role: "Academic Partner",
    logo: "fast_logo.png",
  },
  {
    name: "Islamabad Wildlife Management Board",
    role: "Conservation Partner",
    logo: "iwmb_logo.png",
  },
  {
    name: "Pakistan Science Foundation",
    role: "Research Supporter",
    logo: "psf_logo.png",
  },
  {
    name: "World Wildlife Fund Pakistan",
    role: "Conservation Advisor",
    logo: "wwf_logo.png",
  },
];

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState("mission");

  return (
    <div className="about-page">
      <div className="about-header">
        <h1>About BioScout Islamabad</h1>
        <p className="about-subtitle">
          Empowering community-driven biodiversity conservation through technology
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="about-tabs">
        <button
          className={`tab-button ${activeTab === "mission" ? "active" : ""}`}
          onClick={() => setActiveTab("mission")}
        >
          Our Mission
        </button>
        <button
          className={`tab-button ${activeTab === "team" ? "active" : ""}`}
          onClick={() => setActiveTab("team")}
        >
          Our Team
        </button>
        <button
          className={`tab-button ${activeTab === "journey" ? "active" : ""}`}
          onClick={() => setActiveTab("journey")}
        >
          Our Journey
        </button>
        <button
          className={`tab-button ${activeTab === "partners" ? "active" : ""}`}
          onClick={() => setActiveTab("partners")}
        >
          Partners
        </button>
        <button
          className={`tab-button ${activeTab === "contact" ? "active" : ""}`}
          onClick={() => setActiveTab("contact")}
        >
          Contact Us
        </button>
      </div>

      {/* Mission Tab */}
      {activeTab === "mission" && (
        <div className="tab-content">
          <SectionContainer className="mission-section">
            <div className="mission-content">
              <h2>Our Mission</h2>
              <p className="mission-statement">
                To empower communities through technology and AI, helping document, 
                understand, and protect the rich biodiversity of Islamabad and surrounding regions.
              </p>
              
              <div className="mission-values">
                <div className="value-item">
                  <div className="value-icon">🌱</div>
                  <h3>Conservation</h3>
                  <p>
                    We believe that understanding biodiversity is the first step toward protecting it. 
                    By creating a comprehensive database of local species, we contribute to more 
                    effective conservation strategies.
                  </p>
                </div>
                
                <div className="value-item">
                  <div className="value-icon">🔬</div>
                  <h3>Education</h3>
                  <p>
                    Our platform serves as an educational tool, helping people identify and 
                    learn about the diverse species that share our urban and natural environments.
                  </p>
                </div>
                
                <div className="value-item">
                  <div className="value-icon">👥</div>
                  <h3>Community</h3>
                  <p>
                    We foster a community of citizen scientists who collaborate to document 
                    biodiversity trends and contribute to environmental stewardship.
                  </p>
                </div>
                
                <div className="value-item">
                  <div className="value-icon">💡</div>
                  <h3>Innovation</h3>
                  <p>
                    We leverage cutting-edge AI and data science to make biodiversity 
                    monitoring more accessible, accurate, and engaging for everyone.
                  </p>
                </div>
              </div>
              
              <div className="mission-impact">
                <h3>Our Impact</h3>
                <p>
                  BioScout Islamabad aims to create a lasting positive impact on both the 
                  environment and the community. By documenting biodiversity patterns, 
                  identifying threatened species, and promoting environmental awareness, 
                  we contribute to a more sustainable future for Islamabad.
                </p>
                <p>
                  The data collected through our platform helps researchers, conservationists, 
                  and policymakers make informed decisions about habitat preservation, urban 
                  planning, and environmental protection initiatives.
                </p>
              </div>
            </div>
          </SectionContainer>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === "team" && (
        <div className="tab-content">
          <SectionContainer className="team-section">
            <h2>Meet Our Team</h2>
            <p className="team-intro">
              We are three passionate students from FAST NUCES Islamabad pursuing Bachelor of 
              Science in Data Science, united by our love for technology and biodiversity conservation.
            </p>
            
            <div className="team-grid">
              {teamMembers.map((member, index) => (
                <Card key={index} className="team-card">
                  <div className="member-image-container">
                    <img
                      src={member.image}
                      alt={`${member.name}'s portrait`}
                      className="member-image"
                    />
                  </div>
                  <div className="member-content">
                    <h3 className="member-name">{member.name}</h3>
                    <p className="member-id">{member.id}</p>
                    <p className="member-role">{member.role}</p>
                    <p className="member-bio">{member.bio}</p>
                    <div className="member-interests">
                      {member.interests.map((interest, i) => (
                        <Badge key={i} type="info">{interest}</Badge>
                      ))}
                    </div>
                    <a 
                      href={`https://${member.github}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="member-github"
                    >
                      GitHub Profile
                    </a>
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="team-quote">
              <blockquote>
                "Our project stands out by combining AI-powered species identification, 
                an interactive community observation hub, and an intelligent Q&A system 
                to empower local biodiversity conservation. With data-driven insights and 
                a user-friendly design, we strive to make environmental stewardship 
                accessible to everyone."
              </blockquote>
            </div>
          </SectionContainer>
        </div>
      )}

      {/* Journey Tab */}
      {activeTab === "journey" && (
        <div className="tab-content">
          <SectionContainer className="journey-section">
            <h2>Our Journey</h2>
            <p className="journey-intro">
              The story of BioScout Islamabad's development from concept to community platform.
            </p>
            
            <div className="timeline">
              {projectMilestones.map((milestone, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <div className="timeline-date">{milestone.date}</div>
                    <h3 className="timeline-title">{milestone.title}</h3>
                    <p className="timeline-description">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="journey-future">
              <h3>Looking Forward</h3>
              <p>
                Our journey doesn't end with the launch. We have ambitious plans for BioScout's future:
              </p>
              <ul className="future-plans">
                <li>
                  <strong>Expanded AI Capabilities</strong> - Enhancing our species identification 
                  models to identify more rare and endemic species.
                </li>
                <li>
                  <strong>Mobile Application</strong> - Developing a dedicated mobile app for 
                  on-the-go species identification and observation submission.
                </li>
                <li>
                  <strong>Educational Programs</strong> - Creating biodiversity curriculum for 
                  schools using our platform and data.
                </li>
                <li>
                  <strong>Conservation Initiatives</strong> - Using our data to identify and 
                  protect threatened habitats and species.
                </li>
              </ul>
            </div>
          </SectionContainer>
        </div>
      )}

      {/* Partners Tab */}
      {activeTab === "partners" && (
        <div className="tab-content">
          <SectionContainer className="partners-section">
            <h2>Our Partners & Supporters</h2>
            <p className="partners-intro">
              BioScout Islamabad is made possible through collaboration with various 
              organizations committed to biodiversity conservation and environmental education.
            </p>
            
            <div className="partners-grid">
              {partners.map((partner, index) => (
                <div key={index} className="partner-card">
                  <div className="partner-logo">
                    <img src={partner.logo} alt={`${partner.name} logo`} />
                  </div>
                  <h3 className="partner-name">{partner.name}</h3>
                  <p className="partner-role">{partner.role}</p>
                </div>
              ))}
            </div>
            
            <div className="support-section">
              <h3>How to Support Our Work</h3>
              <p>
                There are many ways individuals and organizations can contribute to 
                BioScout Islamabad's mission:
              </p>
              <div className="support-options">
                <div className="support-option">
                  <h4>Become a Citizen Scientist</h4>
                  <p>
                    Submit your observations regularly and help build our biodiversity database.
                  </p>
                </div>
                <div className="support-option">
                  <h4>Volunteer</h4>
                  <p>
                    Join our team as a volunteer for field surveys, data validation, or community outreach.
                  </p>
                </div>
                <div className="support-option">
                  <h4>Partnership</h4>
                  <p>
                    Organizations interested in partnering with BioScout can contact us directly.
                  </p>
                </div>
                <div className="support-option">
                  <h4>Funding & Grants</h4>
                  <p>
                    Support our technological development and conservation initiatives through funding.
                  </p>
                </div>
              </div>
            </div>
          </SectionContainer>
        </div>
      )}

      {/* Contact Tab */}
      {activeTab === "contact" && (
        <div className="tab-content">
          <SectionContainer className="contact-section">
            <h2>Contact Us</h2>
            <p className="contact-intro">
              We'd love to hear from you! Whether you have questions, feedback, or want to 
              collaborate, there are several ways to reach the BioScout Islamabad team.
            </p>
            
            <div className="contact-methods">
              <div className="contact-method">
                <div className="contact-icon">📧</div>
                <h3>Email</h3>
                <p>
                  <a href="mailto:contact@bioscout-islamabad.org">
                    contact@bioscout-islamabad.org
                  </a>
                </p>
              </div>
              
              <div className="contact-method">
                <div className="contact-icon">📱</div>
                <h3>Social Media</h3>
                <div className="social-links">
                  <a href="https://twitter.com/bioscoutisb" target="_blank" rel="noopener noreferrer">
                    Twitter
                  </a>
                  <a href="https://instagram.com/bioscoutisb" target="_blank" rel="noopener noreferrer">
                    Instagram
                  </a>
                  <a href="https://facebook.com/bioscoutislamabad" target="_blank" rel="noopener noreferrer">
                    Facebook
                  </a>
                </div>
              </div>
              
              <div className="contact-method">
                <div className="contact-icon">🏢</div>
                <h3>Visit Us</h3>
                <p>
                  FAST NUCES University<br />
                  A.K. Brohi Road, H-11/4<br />
                  Islamabad, Pakistan
                </p>
              </div>
            </div>
            
            <div className="contact-form-container">
              <h3>Send Us a Message</h3>
              <form className="contact-form">
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input type="text" id="name" name="name" required className="form-control" />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input type="email" id="email" name="email" required className="form-control" />
                </div>
                
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <select id="subject" name="subject" className="form-control">
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea 
                    id="message" 
                    name="message" 
                    rows="5" 
                    required 
                    className="form-control"
                  ></textarea>
                </div>
                
                <Button type="primary">Send Message</Button>
              </form>
            </div>
            
            <div className="faq-section">
              <h3>Frequently Asked Questions</h3>
              
              <div className="faq-item">
                <h4>How can I report issues with the platform?</h4>
                <p>
                  Technical issues can be reported via email to support@bioscout-islamabad.org 
                  or through the feedback form in your user account.
                </p>
              </div>
              
              <div className="faq-item">
                <h4>I'm a researcher - can I access your biodiversity data?</h4>
                <p>
                  Yes! We provide access to our verified biodiversity data for academic and 
                  conservation research. Please contact us with details about your project.
                </p>
              </div>
              
              <div className="faq-item">
                <h4>Do you offer educational programs or workshops?</h4>
                <p>
                  We organize periodic biodiversity workshops and training sessions for schools, 
                  universities, and community groups. Contact us for upcoming events.
                </p>
              </div>
            </div>
          </SectionContainer>
        </div>
      )}
    </div>
  );
}