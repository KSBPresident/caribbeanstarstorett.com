"use client";

import { useState } from "react";

const offers: Record<string, { title: string; guidance: string; prompt: string }> = {
  products: {
    title: "Help us understand your products",
    guidance: "Tell us what kinds of products you plan to sell, whether they are new or used, and how you will prepare and ship orders. Each product will get its own specific category in your seller inventory.",
    prompt: "Product types, new or used condition, brands or ranges, where you can fulfill orders, and anything else buyers should know.",
  },
  services: {
    title: "Describe the service clearly",
    guidance: "Name the services you provide, who they help, where you offer them, and how a customer starts working with you.",
    prompt: "Services offered, customers you serve, areas or countries covered, delivery method, and how customers can get started.",
  },
  businesses: {
    title: "Introduce your business",
    guidance: "Explain what your business does, what customers can find or request, and where you operate. We use this to guide the right public business profile.",
    prompt: "Business type, main products or services, customer audience, service areas, and what makes your business useful to customers.",
  },
  jobs: {
    title: "Tell us about your hiring needs",
    guidance: "Describe the roles you expect to post, where they are based, whether remote work is possible, and how applicants should respond.",
    prompt: "Types of roles, work locations or remote options, experience needed, and your application process.",
  },
  "real-estate": {
    title: "Describe your property listings",
    guidance: "Share the property types and areas you represent, whether listings are for sale or rent, and how interested people can make an inquiry.",
    prompt: "Property types, locations served, sale or rental listings, and how interested customers can ask for details.",
  },
  other: {
    title: "Explain what you want to offer",
    guidance: "Describe your offer and who it is for. We will review it and help identify the best fit for the marketplace.",
    prompt: "What you offer, who it is for, where it is available, and the questions customers are likely to ask.",
  },
};

const categories = [
  ["products", "Products"],
  ["services", "Services"],
  ["businesses", "Business listing"],
  ["jobs", "Jobs"],
  ["real-estate", "Real estate"],
  ["other", "Other"],
] as const;

export function SellerOfferIntake() {
  const [category, setCategory] = useState("products");
  const selected = offers[category];

  return (
    <>
      <label>
        What do you offer?
        <select
          name="category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-describedby="seller-intake-guidance"
          required
        >
          {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <div className="seller-note seller-intake-guidance" id="seller-intake-guidance" aria-live="polite">
        <strong>{selected.title}</strong>
        <p>{selected.guidance}</p>
      </div>
      <label>
        What would you like to sell or offer?
        <textarea
          name="description"
          minLength={30}
          maxLength={2000}
          rows={5}
          placeholder={selected.prompt}
          required
        />
      </label>
    </>
  );
}
