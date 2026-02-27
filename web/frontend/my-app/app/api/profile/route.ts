import { NextRequest, NextResponse } from "next/server";
import { getUserProfile, createUserProfile, updateUserProfile, deleteUserProfile } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    console.log("[API GET /profile] Request received for userId:", userId);

    if (!userId) {
      console.log("[API GET /profile] ✗ userId missing");
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    console.log("[API GET /profile] Calling getUserProfile...");
    const profile = await getUserProfile(userId);

    if (!profile) {
      console.log("[API GET /profile] ✗ Profile not found");
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    console.log("[API GET /profile] ✓ Profile retrieved:", profile._id);
    return NextResponse.json(profile);
  } catch (error) {
    console.error("[API GET /profile] ✗ Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...profileData } = body;

    console.log("[API POST /profile] Request received for userId:", userId);
    console.log("[API POST /profile] Data:", profileData);

    if (!userId) {
      console.log("[API POST /profile] ✗ userId missing");
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Check if profile already exists
    console.log("[API POST /profile] Checking if profile already exists...");
    const existingProfile = await getUserProfile(userId);
    if (existingProfile) {
      console.log("[API POST /profile] ✗ Profile already exists");
      return NextResponse.json(
        { error: "Profile already exists. Use PUT to update." },
        { status: 409 }
      );
    }

    console.log("[API POST /profile] Creating new profile...");
    const newProfile = await createUserProfile(userId, profileData);

    console.log("[API POST /profile] ✓ Profile created successfully");
    return NextResponse.json(newProfile, { status: 201 });
  } catch (error) {
    console.error("[API POST /profile] ✗ Error:", error);
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...profileData } = body;

    console.log("[API PUT /profile] Request received for userId:", userId);
    console.log("[API PUT /profile] Update data:", profileData);

    if (!userId) {
      console.log("[API PUT /profile] ✗ userId missing");
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    console.log("[API PUT /profile] Updating profile...");
    await updateUserProfile(userId, profileData);

    // Fetch and return updated profile
    console.log("[API PUT /profile] Fetching updated profile...");
    const updatedProfile = await getUserProfile(userId);

    console.log("[API PUT /profile] ✓ Profile updated successfully");
    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("[API PUT /profile] ✗ Error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    console.log("[API DELETE /profile] Request received for userId:", userId);

    if (!userId) {
      console.log("[API DELETE /profile] ✗ userId missing");
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    console.log("[API DELETE /profile] Deleting profile...");
    await deleteUserProfile(userId);

    console.log("[API DELETE /profile] ✓ Profile deleted successfully");
    return NextResponse.json({ message: "Profile deleted successfully" });
  } catch (error) {
    console.error("[API DELETE /profile] ✗ Error:", error);
    return NextResponse.json(
      { error: "Failed to delete profile" },
      { status: 500 }
    );
  }
}
