"use client";

import { useState, useEffect } from "react";

export interface UserProfile {
  _id?: string;
  userId: string;
  age: number;
  gender: "male" | "female" | "other";
  height: number; // in cm
  weight: number; // in kg
  familyHistory: string;
  smokingStatus: "never" | "former" | "current";
  alcoholUse: "never" | "occasional" | "moderate" | "heavy";
  existingConditions: string[];
  bmi: number; // Weight / (Height_m)^2
  geneticRiskScore: number; // 0 or 1 (binary) based on family history
  ageRiskMultiplier: number; // 1 + Age/100
  createdAt: string;
  updatedAt: string;
}

export function useProfileData(userId?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load profile from MongoDB
  useEffect(() => {
    if (!userId) {
      console.log("[ProfileHook] No userId provided, skipping profile load");
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        console.log("[ProfileHook] fetchProfile() started for userId:", userId);
        setLoading(true);
        
        console.log("[ProfileHook] Calling /api/profile with userId:", userId);
        const response = await fetch(`/api/profile?userId=${userId}`);

        console.log("[ProfileHook] API response status:", response.status);

        if (response.status === 404) {
          console.log("[ProfileHook] Profile not found (404) - First time user");
          setProfile(null);
          setError(null);
        } else if (response.ok) {
          const data = await response.json();
          console.log("[ProfileHook] ✓ Profile loaded successfully:", data);
          setProfile(data);
          setError(null);
        } else {
          const errorData = await response.json();
          console.error("[ProfileHook] ✗ API error:", errorData);
          setError(errorData.error || "Failed to load profile");
          setProfile(null);
        }
      } catch (err) {
        console.error("[ProfileHook] ✗ Fetch error:", err);
        setError("Failed to load profile");
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  // Save profile to MongoDB (auto-detects create vs update)
  const saveProfile = async (profileData: UserProfile): Promise<boolean> => {
    console.log("[ProfileHook] saveProfile() called");
    console.log("[ProfileHook] userId:", userId);
    console.log("[ProfileHook] profileData:", profileData);

    if (!userId) {
      console.error("[ProfileHook] ✗ User ID is required");
      setError("User ID is required");
      return false;
    }

    try {
      setLoading(true);
      const requestBody = { userId, ...profileData };
      const isUpdate = profile !== null;
      const method = isUpdate ? "PUT" : "POST";
      console.log(`[ProfileHook] Sending ${method} request to /api/profile`);
      console.log("[ProfileHook] Request body:", requestBody);

      const response = await fetch("/api/profile", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("[ProfileHook] Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("[ProfileHook] ✓ Profile saved successfully:", data);
        setProfile(data);
        setError(null);
        return true;
      } else {
        const errorData = await response.json();
        console.error("[ProfileHook] ✗ API error response:", errorData);
        setError(errorData.error || "Failed to save profile");
        return false;
      }
    } catch (err) {
      console.error("[ProfileHook] ✗ Network/parsing error:", err);
      setError("Failed to save profile");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Create new profile
  const createProfile = async (
    data: Omit<UserProfile, "userId" | "_id" | "createdAt" | "updatedAt">
  ): Promise<boolean> => {
    console.log("[ProfileHook] createProfile() called");
    console.log("[ProfileHook] userId:", userId);
    console.log("[ProfileHook] Profile data to create:", data);

    if (!userId) {
      console.error("[ProfileHook] ✗ User ID is required");
      setError("User ID is required");
      return false;
    }

    const newProfile: UserProfile = {
      userId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log("[ProfileHook] Calling saveProfile with full data:", newProfile);
    return saveProfile(newProfile);
  };

  // Update existing profile
  const updateProfile = async (
    data: Partial<Omit<UserProfile, "userId" | "createdAt">>
  ): Promise<boolean> => {
    if (!userId) {
      setError("User ID is required");
      return false;
    }

    if (!profile) {
      setError("No existing profile to update");
      return false;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...data }),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setProfile(updatedData);
        setError(null);
        console.log("✓ Profile updated in MongoDB:", updatedData);
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update profile");
        return false;
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError("Failed to update profile");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Check if profile exists
  const hasProfile = (): boolean => {
    return profile !== null;
  };

  // Clear profile
  const clearProfile = async (): Promise<boolean> => {
    if (!userId) {
      setError("User ID is required");
      return false;
    }

    try {
      const response = await fetch(`/api/profile?userId=${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProfile(null);
        setError(null);
        console.log("✓ Profile deleted from MongoDB");
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete profile");
        return false;
      }
    } catch (err) {
      console.error("Failed to delete profile:", err);
      setError("Failed to delete profile");
      return false;
    }
  };

  return {
    profile,
    loading,
    error,
    saveProfile,
    createProfile,
    updateProfile,
    hasProfile,
    clearProfile,
  };
}
