"use client";

import { useState } from "react";

const contactPhone = process.env.NEXT_PUBLIC_CONTACT_PHONE || "";
const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [values, setValues] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
    role: "Buyer",
  });

  return (
    <main className="section">
      <h1 className="sectionHeading">Contact</h1>
      <p className="sectionIntro">
        Reach our acquisition team for private purchases, luxury consignments, or bespoke seller support.
      </p>

      <div className="contact-grid">
        <div className="contact-card">
          <p className="feature-title">VEX Auto - Private Acquisitions</p>
          <p className="feature-copy" style={{ margin: "1.25rem 0" }}>
            Our concierge team handles every introduction with discretion and real-time support.
          </p>
          <p className="feature-copy">
            <strong>Phone:</strong>{" "}
            {contactPhone ? (
              <a href={`tel:${contactPhone.replace(/\D/g, "")}`} className="navLink">
                {contactPhone}
              </a>
            ) : (
              "Not configured"
            )}
          </p>
          <p className="feature-copy">
            <strong>Email:</strong>{" "}
            {contactEmail ? (
              <a href={`mailto:${contactEmail}`} className="navLink">
                {contactEmail}
              </a>
            ) : (
              "Not configured"
            )}
          </p>
          <p className="feature-copy">Hours: Mon-Sat 9AM-7PM MST</p>
        </div>

        <div className="contact-card">
          <div className="filter-field">
            <label className="field-label">Name</label>
            <input
              className="input"
              value={values.name}
              onChange={(event) => setValues({ ...values, name: event.target.value })}
              placeholder="Your name"
            />
          </div>
          <div className="filter-field">
            <label className="field-label">Phone</label>
            <input
              className="input"
              value={values.phone}
              onChange={(event) => setValues({ ...values, phone: event.target.value })}
              placeholder="Phone number"
            />
          </div>
          <div className="filter-field">
            <label className="field-label">Email</label>
            <input
              className="input"
              value={values.email}
              onChange={(event) => setValues({ ...values, email: event.target.value })}
              placeholder="Email address"
            />
          </div>
          <div className="filter-field">
            <label className="field-label">Message</label>
            <textarea
              className="textarea"
              value={values.message}
              onChange={(event) => setValues({ ...values, message: event.target.value })}
              placeholder="Tell us about your vehicle or acquisition goals"
            />
          </div>
          <div className="filter-field">
            <label className="field-label">I am a</label>
            <div className="radio-group">
              {[
                { label: "Buyer", value: "Buyer" },
                { label: "Seller", value: "Seller" },
              ].map((option) => (
                <label key={option.value} className="radio-option">
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={values.role === option.value}
                    onChange={() => setValues({ ...values, role: option.value })}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
          <button type="button" className="btn btnPrimary" onClick={() => setSubmitted(true)}>
            Submit inquiry
          </button>
          {submitted ? (
            <div className="success-banner">
              Thank you - your message has been submitted. Our team will follow up shortly.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
